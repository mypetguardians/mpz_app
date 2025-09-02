from ninja import Router
from ninja.errors import HttpError
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from centers.models import Center, AdoptionContractTemplate
from centers.schemas.inbound import (
    ProcedureSettingsCreateIn,
    ProcedureSettingsUpdateIn,
)
from centers.schemas.outbound import (
    ProcedureSettingsOut,
    ErrorOut
)
from api.security import jwt_auth

router = Router(tags=["Procedure Settings"])

def _build_procedure_settings_response(center, contract_templates):
    """프로시저 설정 응답 데이터를 구성합니다."""
    return ProcedureSettingsOut(
        has_monitoring=center.has_monitoring,
        monitoring_period_months=center.monitoring_period_months,
        monitoring_interval_days=center.monitoring_interval_days,
        monitoring_description=center.monitoring_description,
        adoption_guidelines=center.adoption_guidelines,
        adoption_procedure=center.adoption_procedure,
        contract_templates=[
            {
                "id": str(template.id),
                "center_id": str(template.center.id),
                "title": template.title,
                "description": template.description,
                "content": template.content,
                "is_active": template.is_active,
                "created_at": template.created_at.isoformat(),
                "updated_at": template.updated_at.isoformat(),
            }
            for template in contract_templates
        ]
    )

@router.get(
    "/",
    summary="[R] 센터 프로시저 설정 조회",
    description="센터 관리자가 자신의 센터 프로시저 설정을 조회합니다.",
    response={
        200: ProcedureSettingsOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def get_procedure_settings(request: HttpRequest):
    """센터 프로시저 설정을 조회합니다."""
    try:
        @sync_to_async
        def get_settings():
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
            
            # 계약서 템플릿들 조회
            contract_templates = AdoptionContractTemplate.objects.filter(
                center=user_center
            ).order_by('-created_at')
            
            # 응답 데이터 변환
            return _build_procedure_settings_response(user_center, contract_templates)
        
        return await get_settings()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"프로시저 설정 조회 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/",
    summary="[C] 센터 프로시저 설정 생성",
    description="센터 관리자가 프로시저 설정을 생성합니다.",
    response={
        201: ProcedureSettingsOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def create_procedure_settings(request: HttpRequest, data: ProcedureSettingsCreateIn):
    """센터 프로시저 설정을 생성합니다."""
    try:
        @sync_to_async
        def create_settings():
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
            
            # 업데이트할 데이터 준비
            update_data = {}
            if data.has_monitoring is not None:
                update_data["has_monitoring"] = data.has_monitoring
            if data.monitoring_period_months is not None:
                update_data["monitoring_period_months"] = data.monitoring_period_months
            if data.monitoring_interval_days is not None:
                update_data["monitoring_interval_days"] = data.monitoring_interval_days
            if data.monitoring_description is not None:
                update_data["monitoring_description"] = data.monitoring_description
            if data.adoption_guidelines is not None:
                update_data["adoption_guidelines"] = data.adoption_guidelines
            if data.adoption_procedure is not None:
                update_data["adoption_procedure"] = data.adoption_procedure
            
            # 센터 정보 업데이트
            for field, value in update_data.items():
                setattr(user_center, field, value)
            user_center.save()
            
            # 업데이트된 센터 정보 조회
            updated_center = Center.objects.get(id=user_center.id)
            
            # 계약서 템플릿들 조회
            contract_templates = AdoptionContractTemplate.objects.filter(
                center=updated_center
            ).order_by('-created_at')
            
            # 응답 데이터 변환
            return _build_procedure_settings_response(updated_center, contract_templates)
        
        result = await create_settings()
        return 201, result
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"프로시저 설정 생성 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/",
    summary="[U] 센터 프로시저 설정 수정",
    description="센터 관리자가 프로시저 설정을 수정합니다.",
    response={
        200: ProcedureSettingsOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def update_procedure_settings(request: HttpRequest, data: ProcedureSettingsUpdateIn):
    """센터 프로시저 설정을 수정합니다."""
    try:
        @sync_to_async
        def update_settings():
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
            
            # 업데이트할 데이터만 필터링하여 업데이트
            update_fields = {
                'has_monitoring': data.has_monitoring,
                'monitoring_period_months': data.monitoring_period_months,
                'monitoring_interval_days': data.monitoring_interval_days,
                'monitoring_description': data.monitoring_description,
                'adoption_guidelines': data.adoption_guidelines,
                'adoption_procedure': data.adoption_procedure
            }
            
            # None이 아닌 값만 업데이트
            update_data = {k: v for k, v in update_fields.items() if v is not None}
            
            # 센터 정보 업데이트
            Center.objects.filter(id=user_center.id).update(**update_data)
            
            # 업데이트된 센터 정보 조회
            updated_center = Center.objects.get(id=user_center.id)
            
            # 계약서 템플릿들 조회
            contract_templates = AdoptionContractTemplate.objects.filter(
                center=updated_center
            ).order_by('-created_at')
            
            # 응답 데이터 변환
            return _build_procedure_settings_response(updated_center, contract_templates)
        
        return await update_settings()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"프로시저 설정 수정 중 오류가 발생했습니다: {str(e)}")
