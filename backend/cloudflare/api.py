# routers/r2.py
from ninja import Router
from ninja.errors import HttpError
from django.http import HttpRequest
from django.utils import timezone
import uuid
import os
import base64
from .services import R2Client
from .schemas import FileUploadIn, FileUploadOut, FileDeleteIn, FileDeleteOut, FileInfoOut
from api.security import jwt_auth

router = Router(tags=["Cloudflare R2"])

# --- 유틸 ---

IMAGE_MIME_WHITELIST = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

def _ext_from_filename_or_ct(filename: str | None, content_type: str | None) -> str:
    ext = ""
    if filename:
        ext = os.path.splitext(filename)[1]
    if not ext and content_type in IMAGE_MIME_WHITELIST:
        ext = IMAGE_MIME_WHITELIST[content_type]
    # fallback
    return ext or ".bin"

def _decode_base64_maybe_dataurl(b64_or_dataurl: str) -> bytes:
    """
    'data:image/png;base64,....' 또는 'iVBORw0K...' 모두 지원
    """
    s = b64_or_dataurl
    if "," in s and s.lstrip().startswith("data:"):
        # data URL prefix 제거
        s = s.split(",", 1)[1]
    # 줄바꿈/공백 제거
    s = "".join(s.split())
    try:
        return base64.b64decode(s, validate=True)
    except Exception:
        # padding 문제 등 있을 수 있음 -> normalize 후 재시도
        missing = (-len(s)) % 4
        if missing:
            s = s + ("=" * missing)
        return base64.b64decode(s)

# --- 라우트 ---

@router.post(
    "/upload",
    summary="[C] 파일 업로드",
    description="Cloudflare R2에 파일을 업로드합니다. data.file(Base64) → bytes 변환 후 저장.",
    response={200: FileUploadOut, 400: FileUploadOut, 500: FileUploadOut},
    auth=jwt_auth,
)
async def upload_file(request: HttpRequest, data: FileUploadIn):
    """
    FileUploadIn 스키마는 아래 필드를 가진다고 가정:
      - file: str (Base64 또는 dataURL)
      - filename: str
      - content_type: str (예: image/png)
      - folder: str (예: 'uploads')
    """
    try:
        r2_client = R2Client()

        # content_type 검증/정리
        content_type = (data.content_type or "").lower().strip()
        if not content_type:
            return FileUploadOut(success=False, message="content_type이 비어있습니다.")

        # 확장자 결정
        file_extension = _ext_from_filename_or_ct(data.filename, content_type)

        # 파일 키 생성
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        folder = (data.folder or "uploads").strip("/ ")
        file_key = f"{folder}/{unique_filename}"

        # ✅ Base64 → bytes
        file_bytes = _decode_base64_maybe_dataurl(data.file)
        if not file_bytes:
            return FileUploadOut(success=False, message="파일 디코딩 실패(빈 바이트).")

        # 사이즈 간단 체크 (옵션)
        if len(file_bytes) == 0:
            return FileUploadOut(success=False, message="빈 파일입니다.")

        # ✅ 바이너리 그대로 업로드 (문자열 변환 금지)
        r2_client.upload_file(
            key=file_key,
            data=file_bytes,
            content_type=content_type,
        )

        # 공개 URL
        file_url = f"{r2_client.public_base_url}/{file_key}"

        return FileUploadOut(
            success=True,
            message="파일 업로드가 완료되었습니다.",
            file_url=file_url,
            file_key=file_key,
            uploaded_at=timezone.now(),
        )

    except ValueError as e:
        return FileUploadOut(success=False, message=f"R2 설정 오류: {str(e)}")
    except Exception as e:
        return FileUploadOut(success=False, message=f"파일 업로드 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/delete",
    summary="[D] 파일 삭제",
    description="Cloudflare R2에서 파일을 삭제합니다.",
    response={200: FileDeleteOut, 400: FileDeleteOut, 500: FileDeleteOut},
    auth=jwt_auth,
)
async def delete_file(request: HttpRequest, data: FileDeleteIn):
    try:
        r2_client = R2Client()
        r2_client.delete_file(data.file_key)

        return FileDeleteOut(
            success=True,
            message="파일 삭제가 완료되었습니다.",
            deleted_at=timezone.now(),
        )

    except ValueError as e:
        return FileDeleteOut(success=False, message=f"R2 설정 오류: {str(e)}")
    except Exception as e:
        return FileDeleteOut(success=False, message=f"파일 삭제 중 오류: {str(e)}")


@router.get(
    "/info/{file_key}",
    summary="[R] 파일 정보 조회",
    description="Cloudflare R2에 업로드된 파일의 정보를 조회합니다.",
    response={200: FileInfoOut, 400: dict, 500: dict},
    auth=jwt_auth,
)
async def get_file_info(request: HttpRequest, file_key: str):
    try:
        r2_client = R2Client()
        try:
            head = r2_client.client.head_object(
                Bucket=r2_client.bucket,
                Key=file_key,
            )
            file_url = f"{r2_client.public_base_url}/{file_key}"
            # R2가 LastModified를 돌려줄 수 있음 (boto3 dict 형식)
            lm = head.get("LastModified")
            # 사이즈/타입
            return FileInfoOut(
                file_key=file_key,
                file_url=file_url,
                content_type=head.get("ContentType", "application/octet-stream"),
                size=head.get("ContentLength"),
                uploaded_at=timezone.now() if not lm else lm,
            )
        except r2_client.client.exceptions.NoSuchKey:
            raise HttpError(404, "파일을 찾을 수 없습니다.")
    except ValueError as e:
        raise HttpError(500, f"R2 설정 오류: {str(e)}")
    except Exception as e:
        raise HttpError(500, f"파일 정보 조회 중 오류: {str(e)}")
