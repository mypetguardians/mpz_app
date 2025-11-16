from ninja import Router
from ninja.errors import HttpError
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from typing import List
from centers.models import Center, AdoptionConsent, PresetConsent
from centers.schemas.inbound import (
    ConsentCreateIn,
    ConsentUpdateIn,
)
from centers.schemas.outbound import (
    ConsentOut,
    SuccessOut,
    ErrorOut
)
from api.security import jwt_auth

router = Router(tags=["Consent"])

@router.get(
    "/",
    summary="[R] 동의서 목록 조회",
    description="센터 관리자가 자신의 센터 동의서 목록을 조회합니다.",
    response={
        200: List[ConsentOut],
        401: ErrorOut,
        403: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def get_consents(request: HttpRequest):
    """동의서 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_consents_list():
            # JWT 토큰에서 사용자 정보 추출
            if not hasattr(request, 'auth') or not request.auth:
                raise HttpError(401, "인증이 필요합니다")
            
            # 현재 사용자 (jwt_auth에서 이미 User 객체를 반환함)
            current_user = request.auth
            
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
            
            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")
            
            # 해당 센터의 동의서 + 공용 프리셋 동의서 함께 조회
            center_consents = AdoptionConsent.objects.filter(center=user_center).order_by('-created_at')
            preset_consents = PresetConsent.objects.filter(is_active=True).order_by('-created_at')
            
            # 응답 데이터 변환
            center_payload = [
                ConsentOut(
                    id=str(consent.id),
                    center_id=str(consent.center.id),
                    title=consent.title,
                    description=consent.description,
                    content=consent.content,
                    is_active=consent.is_active,
                    created_at=consent.created_at.isoformat(),
                    updated_at=consent.updated_at.isoformat(),
                )
                for consent in center_consents
            ]
            preset_payload = [
                ConsentOut(
                    id=str(consent.id),
                    center_id="",  # 공용
                    title=consent.title,
                    description=consent.description,
                    content=consent.content,
                    is_active=consent.is_active,
                    created_at=consent.created_at.isoformat(),
                    updated_at=consent.updated_at.isoformat(),
                )
                for consent in preset_consents
            ]
            return center_payload + preset_payload
        
        return await get_consents_list()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동의서 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/center/{center_id}",
    summary="[R] 특정 센터의 동의서 목록 조회",
    description="center_id를 받아서 해당 센터의 동의서 목록을 조회합니다. 인증이 필요하지 않은 공개 API입니다.",
    response={
        200: List[ConsentOut],
        400: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
)
async def get_consents_by_center(request: HttpRequest, center_id: str):
    """특정 센터의 동의서 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_center_consents_list():
            # center_id로 센터 조회
            try:
                center = Center.objects.get(id=center_id)
            except Center.DoesNotExist:
                raise HttpError(404, "센터를 찾을 수 없습니다")
            
            # 해당 센터의 모든 동의서 조회 (활성화된 것만)
            consents = AdoptionConsent.objects.filter(
                center=center, 
                is_active=True
            ).order_by('-created_at')
            
            # 응답 데이터 변환
            return [
                ConsentOut(
                    id=str(consent.id),
                    center_id=str(consent.center.id),
                    title=consent.title,
                    description=consent.description,
                    content=consent.content,
                    is_active=consent.is_active,
                    created_at=consent.created_at.isoformat(),
                    updated_at=consent.updated_at.isoformat(),
                )
                for consent in consents
            ]
        
        return await get_center_consents_list()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"특정 센터의 동의서 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{consent_id}",
    summary="[R] 동의서 상세 조회",
    description="센터 관리자가 특정 동의서의 상세 정보를 조회합니다.",
    response={
        200: ConsentOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def get_consent(request: HttpRequest, consent_id: str):
    """동의서 상세 정보를 조회합니다."""
    try:
        @sync_to_async
        def get_consent_detail():
            # JWT 토큰에서 사용자 정보 추출
            if not hasattr(request, 'auth') or not request.auth:
                raise HttpError(401, "인증이 필요합니다")
            
            # 현재 사용자 (jwt_auth에서 이미 User 객체를 반환함)
            current_user = request.auth
            
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
            
            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")
            
            # 해당 센터의 동의서 조회
            try:
                consent = AdoptionConsent.objects.get(id=consent_id, center=user_center)
            except AdoptionConsent.DoesNotExist:
                raise HttpError(404, "동의서를 찾을 수 없습니다")
            
            # 응답 데이터 변환
            return ConsentOut(
                id=str(consent.id),
                center_id=str(consent.center.id),
                title=consent.title,
                description=consent.description,
                content=consent.content,
                is_active=consent.is_active,
                created_at=consent.created_at.isoformat(),
                updated_at=consent.updated_at.isoformat(),
            )
        
        return await get_consent_detail()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동의서 상세 조회 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/",
    summary="[C] 동의서 생성",
    description="센터 관리자가 새 동의서를 생성합니다.",
    response={
        200: ConsentOut,
        201: ConsentOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def create_consent(request: HttpRequest, data: ConsentCreateIn):
    """새 동의서를 생성합니다."""
    try:
        @sync_to_async
        def create_consent_template():
            # JWT 토큰에서 사용자 정보 추출
            if not hasattr(request, 'auth') or not request.auth:
                raise HttpError(401, "인증이 필요합니다")
            
            # 현재 사용자 (jwt_auth에서 이미 User 객체를 반환함)
            current_user = request.auth
            
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
            
            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")
            
            # 새 동의서 생성
            consent = AdoptionConsent.objects.create(
                center=user_center,
                title=data.title,
                description=data.description,
                content=data.content,
                is_active=data.is_active
            )
            
            # 응답 데이터 변환
            return ConsentOut(
                id=str(consent.id),
                center_id=str(consent.center.id),
                title=consent.title,
                description=consent.description,
                content=consent.content,
                is_active=consent.is_active,
                created_at=consent.created_at.isoformat(),
                updated_at=consent.updated_at.isoformat(),
            )
        
        return await create_consent_template()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동의서 생성 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/{consent_id}",
    summary="[U] 동의서 수정",
    description="센터 관리자가 동의서를 수정합니다.",
    response={
        200: ConsentOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def update_consent(request: HttpRequest, consent_id: str, data: ConsentUpdateIn):
    """동의서를 수정합니다."""
    try:
        @sync_to_async
        def update_consent_template():
            # JWT 토큰에서 사용자 정보 추출
            if not hasattr(request, 'auth') or not request.auth:
                raise HttpError(401, "인증이 필요합니다")
            
            # 현재 사용자 (jwt_auth에서 이미 User 객체를 반환함)
            current_user = request.auth
            
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
            
            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")
            
            # 해당 센터의 동의서 조회
            try:
                consent = AdoptionConsent.objects.get(id=consent_id, center=user_center)
            except AdoptionConsent.DoesNotExist:
                raise HttpError(404, "동의서를 찾을 수 없습니다")
            
            # 업데이트할 데이터만 필터링하여 업데이트
            update_fields = {
                'title': data.title,
                'description': data.description,
                'content': data.content,
                'is_active': data.is_active
            }
            
            # None이 아닌 값만 업데이트
            update_data = {k: v for k, v in update_fields.items() if v is not None}
            
            # 동의서 정보 업데이트
            AdoptionConsent.objects.filter(id=consent.id).update(**update_data)
            
            # 업데이트된 동의서 정보 조회
            updated_consent = AdoptionConsent.objects.get(id=consent.id)
            
            # 응답 데이터 변환
            return ConsentOut(
                id=str(updated_consent.id),
                center_id=str(updated_consent.center.id),
                title=updated_consent.title,
                description=updated_consent.description,
                content=updated_consent.content,
                is_active=updated_consent.is_active,
                created_at=updated_consent.created_at.isoformat(),
                updated_at=updated_consent.updated_at.isoformat(),
            )
        
        return await update_consent_template()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동의서 수정 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/{consent_id}",
    summary="[D] 동의서 삭제",
    description="센터 관리자가 동의서를 삭제합니다.",
    response={
        200: SuccessOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def delete_consent(request: HttpRequest, consent_id: str):
    """동의서를 삭제합니다."""
    try:
        @sync_to_async
        def delete_consent_template():
            # JWT 토큰에서 사용자 정보 추출
            if not hasattr(request, 'auth') or not request.auth:
                raise HttpError(401, "인증이 필요합니다")
            
            # 현재 사용자 (jwt_auth에서 이미 User 객체를 반환함)
            current_user = request.auth
            
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
            
            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")
            
            # 해당 센터의 동의서 조회
            try:
                consent = AdoptionConsent.objects.get(id=consent_id, center=user_center)
            except AdoptionConsent.DoesNotExist:
                raise HttpError(404, "동의서를 찾을 수 없습니다")
            
            # 동의서 삭제
            consent.delete()
            
            return SuccessOut(message="동의서가 성공적으로 삭제되었습니다")
        
        return await delete_consent_template()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동의서 삭제 중 오류가 발생했습니다: {str(e)}")
