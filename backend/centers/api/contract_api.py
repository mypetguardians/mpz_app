from ninja import Router
from ninja.errors import HttpError
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from typing import List
from centers.models import Center, AdoptionContractTemplate
from centers.schemas.inbound import (
    ContractTemplateCreateIn,
    ContractTemplateUpdateIn,
)
from centers.schemas.outbound import (
    ContractTemplateOut,
    SuccessOut,
    ErrorOut
)
from api.security import jwt_auth

router = Router(tags=["Contract Template"])

@router.get(
    "/",
    summary="[R] 계약서 템플릿 목록 조회",
    description="센터 관리자가 자신의 센터 계약서 템플릿 목록을 조회합니다.",
    response={
        200: List[ContractTemplateOut],
        401: ErrorOut,
        403: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def get_contract_templates(request: HttpRequest):
    """계약서 템플릿 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_templates():
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
            
            # 해당 센터의 모든 템플릿 조회
            templates = AdoptionContractTemplate.objects.filter(center=user_center).order_by('-created_at')
            
            # 응답 데이터 변환
            return [
                ContractTemplateOut(
                    id=str(template.id),
                    center_id=str(template.center.id),
                    title=template.title,
                    description=template.description,
                    content=template.content,
                    is_active=template.is_active,
                    created_at=template.created_at.isoformat(),
                    updated_at=template.updated_at.isoformat(),
                )
                for template in templates
            ]
        
        return await get_templates()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"계약서 템플릿 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/center/{center_id}",
    summary="[R] 특정 센터의 계약서 템플릿 목록 조회",
    description="center_id를 받아서 해당 센터의 계약서 템플릿 목록을 조회합니다. 인증이 필요하지 않은 공개 API입니다.",
    response={
        200: List[ContractTemplateOut],
        400: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
)
async def get_contract_templates_by_center(request: HttpRequest, center_id: str):
    """특정 센터의 계약서 템플릿 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_center_templates():
            # center_id로 센터 조회
            try:
                center = Center.objects.get(id=center_id)
            except Center.DoesNotExist:
                raise HttpError(404, "센터를 찾을 수 없습니다")
            
            # 해당 센터의 모든 계약서 템플릿 조회 (활성화된 것만)
            templates = AdoptionContractTemplate.objects.filter(
                center=center, 
                is_active=True
            ).order_by('-created_at')
            
            # 응답 데이터 변환
            return [
                ContractTemplateOut(
                    id=str(template.id),
                    center_id=str(template.center.id),
                    title=template.title,
                    description=template.description,
                    content=template.content,
                    is_active=template.is_active,
                    created_at=template.created_at.isoformat(),
                    updated_at=template.updated_at.isoformat(),
                )
                for template in templates
            ]
        
        return await get_center_templates()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"특정 센터의 계약서 템플릿 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{template_id}",
    summary="[R] 계약서 템플릿 상세 조회",
    description="센터 관리자가 특정 계약서 템플릿을 상세 조회합니다.",
    response={
        200: ContractTemplateOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def get_contract_template(request: HttpRequest, template_id: str):
    """계약서 템플릿을 상세 조회합니다."""
    try:
        @sync_to_async
        def get_template():
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
            
            # 템플릿이 존재하고 사용자의 센터에 속하는지 확인
            try:
                template = AdoptionContractTemplate.objects.get(
                    id=template_id,
                    center=user_center
                )
            except AdoptionContractTemplate.DoesNotExist:
                raise HttpError(404, "템플릿을 찾을 수 없습니다")
            
            # 응답 데이터 변환
            return ContractTemplateOut(
                id=str(template.id),
                center_id=str(template.center.id),
                title=template.title,
                description=template.description,
                content=template.content,
                is_active=template.is_active,
                created_at=template.created_at.isoformat(),
                updated_at=template.updated_at.isoformat(),
            )
        
        return await get_template()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"계약서 템플릿 상세 조회 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/",
    summary="[C] 계약서 템플릿 생성",
    description="센터 관리자가 계약서 템플릿을 생성합니다.",
    response={
        201: ContractTemplateOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth
)
async def create_contract_template(request: HttpRequest, data: ContractTemplateCreateIn):
    """계약서 템플릿을 생성합니다."""
    try:
        @sync_to_async
        def create_template():
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
            
            # 계약서 템플릿 데이터 생성
            template_data = {
                "center": user_center,
                "title": data.title,
                "description": data.description,
                "content": data.content,
                "is_active": data.is_active if data.is_active is not None else True,
            }
            
            # DB에 템플릿 생성
            template = AdoptionContractTemplate.objects.create(**template_data)
            
            # 응답 데이터 변환
            return ContractTemplateOut(
                id=str(template.id),
                center_id=str(template.center.id),
                title=template.title,
                description=template.description,
                content=template.content,
                is_active=template.is_active,
                created_at=template.created_at.isoformat(),
                updated_at=template.updated_at.isoformat(),
            )
        
        result = await create_template()
        return 201, result
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"계약서 템플릿 생성 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/{template_id}",
    summary="[U] 계약서 템플릿 수정",
    description="센터 관리자가 계약서 템플릿을 수정합니다.",
    response={
        200: ContractTemplateOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth
)
async def update_contract_template(request: HttpRequest, template_id: str, data: ContractTemplateUpdateIn):
    """계약서 템플릿을 수정합니다."""
    try:
        @sync_to_async
        def update_template():
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
            
            # 템플릿이 존재하고 사용자의 센터에 속하는지 확인
            try:
                template = AdoptionContractTemplate.objects.get(
                    id=template_id,
                    center=user_center
                )
            except AdoptionContractTemplate.DoesNotExist:
                raise HttpError(404, "템플릿을 찾을 수 없습니다")
            
            # 업데이트할 데이터 준비
            update_data = {}
            if data.title is not None:
                update_data["title"] = data.title
            if data.description is not None:
                update_data["description"] = data.description
            if data.content is not None:
                update_data["content"] = data.content
            if data.is_active is not None:
                update_data["is_active"] = data.is_active
            
            # 템플릿 업데이트
            for field, value in update_data.items():
                setattr(template, field, value)
            template.save()
            
            # 응답 데이터 변환
            return ContractTemplateOut(
                id=str(template.id),
                center_id=str(template.center.id),
                title=template.title,
                description=template.description,
                content=template.content,
                is_active=template.is_active,
                created_at=template.created_at.isoformat(),
                updated_at=template.updated_at.isoformat(),
            )
        
        return await update_template()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"계약서 템플릿 수정 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/{template_id}",
    summary="[D] 계약서 템플릿 삭제",
    description="센터 관리자가 계약서 템플릿을 삭제합니다.",
    response={
        200: SuccessOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth
)
async def delete_contract_template(request: HttpRequest, template_id: str):
    """계약서 템플릿을 삭제합니다."""
    try:
        @sync_to_async
        def delete_template():
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
            
            # 템플릿이 존재하고 사용자의 센터에 속하는지 확인
            try:
                template = AdoptionContractTemplate.objects.get(
                    id=template_id,
                    center=user_center
                )
            except AdoptionContractTemplate.DoesNotExist:
                raise HttpError(404, "템플릿을 찾을 수 없습니다")
            
            # 템플릿 삭제
            template.delete()
            
            return SuccessOut(message="계약서 템플릿이 성공적으로 삭제되었습니다")
        
        return await delete_template()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"계약서 템플릿 삭제 중 오류가 발생했습니다: {str(e)}")
