from ninja import Router, File, Form
from ninja.errors import HttpError
from ninja.files import UploadedFile
from django.http import HttpRequest
from django.utils import timezone
import uuid
import io
import os
from PIL import Image as PILImage, ImageOps
from .services import StorageClient, _decode_base64_maybe_dataurl
from .schemas import FileUploadIn, FileUploadOut, FileDeleteIn, FileDeleteOut, FileInfoOut
from api.security import jwt_auth

router = Router(tags=["Storage"])

IMAGE_MIME_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

# 폴더별 최대 이미지 크기 (px)
MAX_IMAGE_SIZE = {
    "profiles": 512,
    "centers": 1080,
    "animals": 1080,
    "banners": 1080,
}
DEFAULT_MAX_SIZE = 1080


def _ext_from(filename: str | None, content_type: str | None) -> str:
    ext = ""
    if filename:
        ext = os.path.splitext(filename)[1]
    if not ext and content_type in IMAGE_MIME_EXT:
        ext = IMAGE_MIME_EXT[content_type]
    return ext or ".bin"


def _resize_image(data: bytes, content_type: str, folder: str) -> tuple[bytes, str]:
    """이미지를 폴더별 최대 크기로 리사이징. GIF는 스킵."""
    if content_type not in IMAGE_MIME_EXT or content_type == "image/gif":
        return data, content_type

    max_size = MAX_IMAGE_SIZE.get(folder, DEFAULT_MAX_SIZE)

    try:
        img = PILImage.open(io.BytesIO(data))

        # EXIF orientation 적용 (모바일 카메라 회전 보정)
        img = ImageOps.exif_transpose(img)

        w, h = img.size

        # 최대 크기 이하면 EXIF만 보정해서 반환
        if w <= max_size and h <= max_size:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=90, optimize=True)
            return buf.getvalue(), "image/jpeg"

        # 비율 유지하며 리사이징
        img.thumbnail((max_size, max_size), PILImage.LANCZOS)

        # RGBA → RGB 변환 (JPEG 저장용)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        return buf.getvalue(), "image/jpeg"
    except Exception:
        # 리사이징 실패 시 원본 반환
        return data, content_type


@router.post(
    "/upload",
    summary="[C] 파일 업로드 (Base64 JSON)",
    description="Base64(또는 dataURL)로 전달된 파일을 업로드합니다.",
    auth=jwt_auth,
)
def upload_file(request: HttpRequest, data: FileUploadIn):
    try:
        if not data.file:
            return {"success": False, "message": "file이 비어있습니다."}

        storage = StorageClient()
        content_type = (data.content_type or "application/octet-stream").lower().strip()
        folder = (data.folder or "uploads").strip("/ ")

        # base64 → bytes 변환 후 리사이징
        raw_bytes = _decode_base64_maybe_dataurl(data.file)
        resized_bytes, content_type = _resize_image(raw_bytes, content_type, folder)

        ext = _ext_from(data.filename, content_type)
        key = f"{folder}/{uuid.uuid4()}{ext}"

        storage.upload_file(key=key, data=resized_bytes, content_type=content_type)

        url = f"{storage.public_base_url}/{key}"
        return {
            "success": True,
            "message": "파일 업로드가 완료되었습니다.",
            "file_url": url,
            "file_key": key,
            "uploaded_at": timezone.now(),
        }
    except ValueError as e:
        return {"success": False, "message": f"Storage 설정 오류: {e}"}
    except Exception as e:
        return {"success": False, "message": f"파일 업로드 중 오류가 발생했습니다: {e}"}

@router.post(
    "/upload-multipart",
    summary="[C] 파일 업로드 (multipart 권장)",
    description="multipart/form-data(파일 바이너리)로 업로드합니다.",
    auth=jwt_auth,
)
def upload_multipart(
    request: HttpRequest,
    file: UploadedFile = File(...),
    folder: str = Form("uploads"),
):
    try:
        storage = StorageClient()
        folder = (folder or "uploads").strip("/ ")
        ct = file.content_type or "application/octet-stream"

        # 리사이징
        raw_bytes = file.read()
        resized_bytes, ct = _resize_image(raw_bytes, ct, folder)

        ext = os.path.splitext(file.name or "")[1] or _ext_from(None, ct)
        key = f"{folder}/{uuid.uuid4()}{ext}"

        storage.upload_file(key=key, data=resized_bytes, content_type=ct)
        url = f"{storage.public_base_url}/{key}"

        return {
            "success": True,
            "message": "파일 업로드가 완료되었습니다.",
            "file_url": url,
            "file_key": key,
            "uploaded_at": timezone.now(),
        }
    except ValueError as e:
        return {"success": False, "message": f"Storage 설정 오류: {e}"}
    except Exception as e:
        return {"success": False, "message": f"파일 업로드 중 오류가 발생했습니다: {e}"}

@router.delete(
    "/delete",
    summary="[D] 파일 삭제",
    description="파일을 삭제합니다.",
    auth=jwt_auth,
)
def delete_file(request: HttpRequest, data: FileDeleteIn):
    try:
        storage = StorageClient()
        storage.delete_file(data.file_key)
        return {
            "success": True,
            "message": "파일 삭제가 완료되었습니다.",
            "deleted_at": timezone.now(),
        }
    except ValueError as e:
        return {"success": False, "message": f"Storage 설정 오류: {e}"}
    except Exception as e:
        return {"success": False, "message": f"파일 삭제 중 오류: {e}"}

@router.get(
    "/info/{file_key}",
    summary="[R] 파일 정보 조회",
    description="객체 메타데이터 조회",
    auth=jwt_auth,
)
def get_file_info(request: HttpRequest, file_key: str):
    try:
        storage = StorageClient()
        try:
            head = storage.client.head_object(Bucket=storage.bucket, Key=file_key)
            url = f"{storage.public_base_url}/{file_key}"
            lm = head.get("LastModified")
            return {
                "file_key": file_key,
                "file_url": url,
                "content_type": head.get("ContentType", "application/octet-stream"),
                "size": head.get("ContentLength"),
                "uploaded_at": timezone.now() if not lm else lm,
            }
        except storage.client.exceptions.NoSuchKey:
            raise HttpError(404, "파일을 찾을 수 없습니다.")
    except ValueError as e:
        raise HttpError(500, f"Storage 설정 오류: {e}")
    except Exception as e:
        raise HttpError(500, f"파일 정보 조회 중 오류: {e}")
