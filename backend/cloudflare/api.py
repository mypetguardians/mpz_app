from ninja import Router, File, Form
from ninja.errors import HttpError
from ninja.files import UploadedFile
from django.http import HttpRequest
from django.utils import timezone
import uuid
import os
from .services import R2Client
from .schemas import FileUploadIn, FileUploadOut, FileDeleteIn, FileDeleteOut, FileInfoOut
from api.security import jwt_auth

router = Router(tags=["Cloudflare R2"])

IMAGE_MIME_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

def _ext_from(filename: str | None, content_type: str | None) -> str:
    ext = ""
    if filename:
        ext = os.path.splitext(filename)[1]
    if not ext and content_type in IMAGE_MIME_EXT:
        ext = IMAGE_MIME_EXT[content_type]
    return ext or ".bin"

@router.post(
    "/upload",
    summary="[C] 파일 업로드 (Base64 JSON)",
    description="Base64(또는 dataURL)로 전달된 파일을 R2에 업로드합니다.",
    response={200: FileUploadOut, 400: FileUploadOut, 500: FileUploadOut},
    auth=jwt_auth,
)
async def upload_file(request: HttpRequest, data: FileUploadIn):
    """
    FileUploadIn 가정:
      - file: str (Base64 or dataURL)
      - filename: str
      - content_type: str
      - folder: str
    """
    try:
        if not data.file:
            return FileUploadOut(success=False, message="file이 비어있습니다.")

        r2 = R2Client()
        content_type = (data.content_type or "application/octet-stream").lower().strip()
        folder = (data.folder or "uploads").strip("/ ")
        ext = _ext_from(data.filename, content_type)
        key = f"{folder}/{uuid.uuid4()}{ext}"

        # services에서 str→bytes 변환 처리
        r2.upload_file(key=key, data=data.file, content_type=content_type)

        url = f"{r2.public_base_url}/{key}"
        return FileUploadOut(
            success=True,
            message="파일 업로드가 완료되었습니다.",
            file_url=url,
            file_key=key,
            uploaded_at=timezone.now(),
        )
    except ValueError as e:
        return FileUploadOut(success=False, message=f"R2 설정 오류: {e}")
    except Exception as e:
        return FileUploadOut(success=False, message=f"파일 업로드 중 오류가 발생했습니다: {e}")

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
        r2 = R2Client()
        folder = (folder or "uploads").strip("/ ")
        ext = os.path.splitext(file.name or "")[1] or _ext_from(None, file.content_type)
        key = f"{folder}/{uuid.uuid4()}{ext}"
        ct = file.content_type or "application/octet-stream"

        r2.upload_file(key=key, data=file.read(), content_type=ct)
        url = f"{r2.public_base_url}/{key}"

        return {
            "success": True,
            "message": "파일 업로드가 완료되었습니다.",
            "file_url": url,
            "file_key": key,
            "uploaded_at": timezone.now(),
        }
    except ValueError as e:
        return {"success": False, "message": f"R2 설정 오류: {e}"}
    except Exception as e:
        return {"success": False, "message": f"파일 업로드 중 오류가 발생했습니다: {e}"}

@router.delete(
    "/delete",
    summary="[D] 파일 삭제",
    description="Cloudflare R2에서 파일을 삭제합니다.",
    response={200: FileDeleteOut, 400: FileDeleteOut, 500: FileDeleteOut},
    auth=jwt_auth,
)
async def delete_file(request: HttpRequest, data: FileDeleteIn):
    try:
        r2 = R2Client()
        r2.delete_file(data.file_key)
        return FileDeleteOut(
            success=True,
            message="파일 삭제가 완료되었습니다.",
            deleted_at=timezone.now(),
        )
    except ValueError as e:
        return FileDeleteOut(success=False, message=f"R2 설정 오류: {e}")
    except Exception as e:
        return FileDeleteOut(success=False, message=f"파일 삭제 중 오류: {e}")

@router.get(
    "/info/{file_key}",
    summary="[R] 파일 정보 조회",
    description="R2 객체 메타데이터 조회",
    response={200: FileInfoOut, 400: dict, 500: dict},
    auth=jwt_auth,
)
async def get_file_info(request: HttpRequest, file_key: str):
    try:
        r2 = R2Client()
        try:
            head = r2.client.head_object(Bucket=r2.bucket, Key=file_key)
            url = f"{r2.public_base_url}/{file_key}"
            lm = head.get("LastModified")
            return FileInfoOut(
                file_key=file_key,
                file_url=url,
                content_type=head.get("ContentType", "application/octet-stream"),
                size=head.get("ContentLength"),
                uploaded_at=timezone.now() if not lm else lm,
            )
        except r2.client.exceptions.NoSuchKey:
            raise HttpError(404, "파일을 찾을 수 없습니다.")
    except ValueError as e:
        raise HttpError(500, f"R2 설정 오류: {e}")
    except Exception as e:
        raise HttpError(500, f"파일 정보 조회 중 오류: {e}")
