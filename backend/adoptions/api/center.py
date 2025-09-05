from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from django.utils import timezone
from asgiref.sync import sync_to_async
from typing import List
from datetime import timedelta

from adoptions.schemas.center_inbound import UpdateAdoptionStatusIn, SendContractIn, CenterAdoptionFilterIn
from ninja import Query
from adoptions.schemas.center_outbound import (
    CenterAdoptionOut, SendContractOut,
    MonitoringStatusOut
)
from adoptions.models import Adoption, AdoptionContract
from adoptions.utils import (
    get_user_center, build_center_adoption_response, 
    validate_status_transition, validate_center_permissions
)
from centers.models import AdoptionContractTemplate
from api.security import jwt_auth

router = Router(tags=["Center_Adoption"])



@router.get(
    "/center-admin",
    summary="[R] 센터 입양 신청 목록 조회",
    description="센터 관리자가 자신의 센터에 들어온 입양 신청들을 조회합니다",
    response={200: List[CenterAdoptionOut], 400: dict, 401: dict, 403: dict, 500: dict},
    auth=jwt_auth,
)
@paginate
async def get_center_adoptions(request, filters: CenterAdoptionFilterIn = Query(CenterAdoptionFilterIn())):
    try:
        current_user = request.auth
        
        # 센터 관리자 권한 확인
        if not await validate_center_permissions(current_user):
            raise HttpError(403, "센터 관리자만 접근할 수 있습니다")
        
        # 사용자의 센터 정보 조회
        center = await get_user_center(current_user)
        
        @sync_to_async
        def get_center_adoptions_list():
            # 기본 쿼리셋 생성
            queryset = Adoption.objects.select_related('animal', 'user').filter(
                animal__center=center
            )
            
            # 입양 상태 필터 적용
            if filters.status and filters.status.strip():
                queryset = queryset.filter(status=filters.status.strip())
            
            # 동물 ID 필터 적용
            if filters.animal_id and filters.animal_id.strip():
                queryset = queryset.filter(animal_id=filters.animal_id.strip())
            
            # 임시보호 여부 필터 적용
            if filters.is_temporary_protection is not None:
                queryset = queryset.filter(is_temporary_protection=filters.is_temporary_protection)
            
            return list(queryset.order_by('-created_at'))
        
        # 입양 신청 목록 조회
        adoptions_list = await get_center_adoptions_list()
        
        # 응답 데이터 변환
        adoptions_response = []
        for adoption in adoptions_list:
            adoption_data = await build_center_adoption_response(adoption, center)
            adoptions_response.append(adoption_data)
        
        return adoptions_response
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get center adoptions error: {e}")
        raise HttpError(500, "입양 신청 목록 조회 중 오류가 발생했습니다")

@router.put(
    "/center-admin/{adoption_id}/status",
    summary="[U] 입양 신청 상태 변경",
    description="센터 관리자가 입양 신청의 상태를 단계별로 변경합니다",
    response={200: CenterAdoptionOut, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def update_adoption_status(request, adoption_id: str, data: UpdateAdoptionStatusIn):
    try:
        current_user = request.auth
        
        # 센터 관리자 권한 확인
        if not await validate_center_permissions(current_user):
            raise HttpError(403, "센터 관리자만 접근할 수 있습니다")
        
        # 사용자의 센터 정보 조회
        center = await get_user_center(current_user)
        
        # 입양 신청이 존재하고 내 센터의 것인지 확인
        try:
            adoption = await Adoption.objects.select_related('animal', 'user').aget(
                id=adoption_id,
                animal__center=center
            )
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 상태 변경 유효성 검사
        if not validate_status_transition(adoption.status, data.status):
            raise HttpError(400, f"{adoption.status}에서 {data.status}로 변경할 수 없습니다")
        
        # 모니터링으로 변경하는 경우 센터에서 모니터링을 설정했는지 확인
        if data.status == "모니터링" and not getattr(center, 'has_monitoring', False):
            raise HttpError(400, "모니터링을 설정하지 않았어요.")
        
        # 업데이트할 데이터 준비
        update_fields = {
            "status": data.status,
            "center_notes": data.center_notes,
            "updated_at": timezone.now()
        }
        
        # 상태별 특별 처리
        if data.status == "미팅" and data.meeting_scheduled_at:
            update_fields["meeting_scheduled_at"] = data.meeting_scheduled_at
        
        if data.status == "입양완료":
            update_fields["adoption_completed_at"] = timezone.now()
        
        if data.status == "모니터링":
            # 모니터링 초기화 (TODO: 실제 모니터링 초기화 로직 구현 필요)
            update_fields["monitoring_started_at"] = timezone.now()
            # 모니터링 체크 일정 설정 (예: 30일마다)
            update_fields["monitoring_next_check_at"] = timezone.now() + timedelta(days=30)
        
        # DB 업데이트
        await Adoption.objects.filter(id=adoption_id).aupdate(**update_fields)
        
        # 동물의 입양 상태도 함께 업데이트
        animal = adoption.animal
        if data.status == "신청":
            # 입양 신청이 들어오면 동물의 입양 상태를 "입양진행중"으로 변경
            if animal.adoption_status == "입양가능":
                animal.adoption_status = "입양진행중"
                await sync_to_async(animal.save)()
        elif data.status == "입양완료":
            # 입양 완료 시 동물의 입양 상태를 "입양완료"로 변경
            animal.adoption_status = "입양완료"
            await sync_to_async(animal.save)()
        elif data.status == "취소":
            # 입양 신청이 취소되면 동물의 입양 상태를 "입양가능"으로 되돌림
            if animal.adoption_status == "입양진행중":
                animal.adoption_status = "입양가능"
                await sync_to_async(animal.save)()
        
        # 업데이트된 입양 신청 조회 및 응답 생성
        updated_adoption = await Adoption.objects.select_related('animal', 'user').aget(id=adoption_id)
        
        # 입양 신청자에게 상태 업데이트 알림 전송
        try:
            from notifications.utils import send_adoption_update_notification
            await send_adoption_update_notification(
                user_id=str(updated_adoption.user.id),
                adoption_status=data.status,
                animal_name=updated_adoption.animal.name,
                adoption_id=str(updated_adoption.id)
            )
        except Exception as e:
            # 알림 전송 실패는 로그만 남기고 API 응답에는 영향 주지 않음
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"입양 상태 업데이트 알림 전송 실패: {e}")
        
        return await build_center_adoption_response(updated_adoption, center)
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Update adoption status error: {e}")
        raise HttpError(500, "입양 신청 상태 변경 중 오류가 발생했습니다")

@router.post(
    "/center-admin/{adoption_id}/send-contract",
    summary="[C] 계약서 전송",
    description="센터 관리자가 입양자에게 계약서를 전송합니다",
    response={200: SendContractOut, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def send_contract(request, adoption_id: str, data: SendContractIn):
    try:
        current_user = request.auth
        
        # 센터 관리자 권한 확인
        if not await validate_center_permissions(current_user):
            raise HttpError(403, "센터 관리자만 접근할 수 있습니다")
        
        # 사용자의 센터 정보 조회
        center = await get_user_center(current_user)
        
        # 입양 신청 확인 (계약서작성 상태여야 함)
        try:
            adoption = await Adoption.objects.select_related('animal').aget(
                id=adoption_id,
                animal__center=center,
                status="계약서작성"
            )
        except Adoption.DoesNotExist:
            raise HttpError(404, "계약서 작성 단계의 입양 신청을 찾을 수 없습니다")
        
        # 계약서 템플릿 조회
        try:
            template = await AdoptionContractTemplate.objects.aget(id=data.template_id)
        except AdoptionContractTemplate.DoesNotExist:
            raise HttpError(404, "계약서 템플릿을 찾을 수 없습니다")
        
        # 계약서 내용 생성 (템플릿 + 커스텀 내용)
        contract_content = data.custom_content or template.content
        
        # 계약서 생성
        contract = await AdoptionContract.objects.acreate(
            adoption=adoption,
            template=template,
            contract_content=contract_content,
            guidelines_content=getattr(center, 'adoption_guidelines', ''),
            status="대기중"
        )
        
        # 입양 신청에 계약서 전송 시간 기록
        await Adoption.objects.filter(id=adoption_id).aupdate(
            contract_sent_at=timezone.now(),
            center_notes=data.center_notes,
            updated_at=timezone.now()
        )
        
        # 입양 신청자에게 계약서 전송 알림 전송
        try:
            from notifications.utils import send_adoption_update_notification
            await send_adoption_update_notification(
                user_id=str(adoption.user.id),
                adoption_status="계약서작성",
                animal_name=adoption.animal.name,
                adoption_id=str(adoption.id)
            )
        except Exception as e:
            # 알림 전송 실패는 로그만 남기고 API 응답에는 영향 주지 않음
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"계약서 전송 알림 전송 실패: {e}")
        
        return SendContractOut(
            message="계약서가 성공적으로 전송되었습니다",
            contract_id=str(contract.id)
        )
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Send contract error: {e}")
        raise HttpError(500, "계약서 전송 중 오류가 발생했습니다")

@router.get(
    "/center-admin/{adoption_id}/monitoring-status",
    summary="[R] 입양 모니터링 상태 조회",
    description="특정 입양의 모니터링 진행 상황과 히스토리를 조회합니다",
    response={200: MonitoringStatusOut, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def get_monitoring_status(request, adoption_id: str):
    try:
        current_user = request.auth
        
        # 센터 관리자 권한 확인
        if not await validate_center_permissions(current_user):
            raise HttpError(403, "센터 관리자만 접근할 수 있습니다")
        
        # 사용자의 센터 정보 조회
        center = await get_user_center(current_user)
        
        # 입양 신청이 존재하고 내 센터의 것인지 확인
        try:
            adoption = await Adoption.objects.select_related('animal').aget(
                id=adoption_id,
                animal__center=center
            )
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 모니터링 상태 조회 (TODO: 실제 모니터링 상태 조회 로직 구현 필요)
        # 현재는 기본 정보만 반환
        monitoring_status = MonitoringStatusOut(
            adoption_id=str(adoption.id),
            status=adoption.status,
            monitoring_status="진행중" if adoption.status == "모니터링" else None,
            monitoring_started_at=adoption.monitoring_started_at.isoformat() if adoption.monitoring_started_at else None,
            monitoring_end_date=None,  # TODO: 모니터링 종료일 계산
            next_check_date=adoption.monitoring_next_check_at.isoformat() if adoption.monitoring_next_check_at else None,
            days_until_next_deadline=None,  # TODO: 다음 체크까지 남은 일수 계산
            days_until_monitoring_end=None,  # TODO: 모니터링 종료까지 남은 일수 계산
            completed_checks=0,  # TODO: 완료된 체크 수 계산
            total_checks=0,  # TODO: 전체 체크 수 계산
            total_monitoring_posts=0,  # TODO: 모니터링 포스트 수 계산
            monitoring_progress={"percentage": 0, "description": "모니터링 진행률"},
            center_config={
                "monitoring_period_months": getattr(center, 'monitoring_period_months', 6),
                "monitoring_interval_days": getattr(center, 'monitoring_interval_days', 30)
            },
            recent_checks=[]  # TODO: 최근 체크 히스토리 조회
        )
        
        return monitoring_status
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get monitoring status error: {e}")
        raise HttpError(500, "모니터링 상태 조회 중 오류가 발생했습니다")