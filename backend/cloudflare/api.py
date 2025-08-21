from ninja import Router
from ninja.errors import HttpError
from django.http import HttpRequest
from django.utils import timezone
import uuid
import os
from .services import R2Client
from .schemas import FileUploadIn, FileUploadOut, FileDeleteIn, FileDeleteOut, FileInfoOut
from api.security import jwt_auth

router = Router(tags=["Cloudflare R2"])


@router.post(
    "/upload",
    summary="[C] 파일 업로드",
    description="Cloudflare R2에 파일을 업로드합니다.",
    response={
        200: FileUploadOut,
        400: FileUploadOut,
        500: FileUploadOut,
    },
    auth=jwt_auth,
)
async def upload_file(request: HttpRequest, data: FileUploadIn):
    """파일을 Cloudflare R2에 업로드합니다."""
    try:
        # R2 클라이언트 초기화
        r2_client = R2Client()
        
        # 고유한 파일 키 생성 (중복 방지)
        file_extension = os.path.splitext(data.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_key = f"{data.folder}/{unique_filename}"
        
        # 파일 업로드
        r2_client.upload_file(
            key=file_key,
            data=data.file,
            content_type=data.content_type
        )
        
        # 공개 URL 생성
        file_url = f"{r2_client.public_base_url}/{file_key}"
        
        return FileUploadOut(
            success=True,
            message="파일 업로드가 완료되었습니다.",
            file_url=file_url,
            file_key=file_key,
            uploaded_at=timezone.now()
        )
        
    except ValueError as e:
        # 환경변수 누락
        return FileUploadOut(
            success=False,
            message=f"R2 설정 오류: {str(e)}"
        )
    except Exception as e:
        # 기타 오류
        return FileUploadOut(
            success=False,
            message=f"파일 업로드 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete(
    "/delete",
    summary="[D] 파일 삭제",
    description="Cloudflare R2에서 파일을 삭제합니다.",
    response={
        200: FileDeleteOut,
        400: FileDeleteOut,
        500: FileDeleteOut,
    },
    auth=jwt_auth,
)
async def delete_file(request: HttpRequest, data: FileDeleteIn):
    """Cloudflare R2에서 파일을 삭제합니다."""
    try:
        # R2 클라이언트 초기화
        r2_client = R2Client()
        
        # 파일 삭제
        r2_client.delete_file(data.file_key)
        
        return FileDeleteOut(
            success=True,
            message="파일 삭제가 완료되었습니다.",
            deleted_at=timezone.now()
        )
        
    except ValueError as e:
        # 환경변수 누락
        return FileDeleteOut(
            success=False,
            message=f"R2 설정 오류: {str(e)}"
        )
    except Exception as e:
        # 기타 오류
        return FileDeleteOut(
            success=False,
            message=f"파일 삭제 중 오류가 발생했습니다: {str(e)}"
        )


@router.get(
    "/info/{file_key}",
    summary="[R] 파일 정보 조회",
    description="Cloudflare R2에 업로드된 파일의 정보를 조회합니다.",
    response={
        200: FileInfoOut,
        400: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def get_file_info(request: HttpRequest, file_key: str):
    """업로드된 파일의 정보를 조회합니다."""
    try:
        # R2 클라이언트 초기화
        r2_client = R2Client()
        
        # 파일 정보 조회 (메타데이터만)
        try:
            response = r2_client.client.head_object(
                Bucket=r2_client.bucket,
                Key=file_key
            )
            
            # 공개 URL 생성
            file_url = f"{r2_client.public_base_url}/{file_key}"
            
            return FileInfoOut(
                file_key=file_key,
                file_url=file_url,
                content_type=response.get('ContentType', 'application/octet-stream'),
                size=response.get('ContentLength'),
                uploaded_at=timezone.now()  # R2에서는 업로드 시간을 직접 제공하지 않음
            )
            
        except r2_client.client.exceptions.NoSuchKey:
            raise HttpError(404, "파일을 찾을 수 없습니다.")
            
    except ValueError as e:
        # 환경변수 누락
        raise HttpError(500, f"R2 설정 오류: {str(e)}")
    except Exception as e:
        # 기타 오류
        raise HttpError(500, f"파일 정보 조회 중 오류가 발생했습니다: {str(e)}")
