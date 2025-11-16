from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from django.utils import timezone
from asgiref.sync import sync_to_async
from typing import List
from datetime import timedelta

from adoptions.schemas.center_inbound import (
    UpdateAdoptionStatusIn,
    UpdateAdoptionMemoIn,
    CenterWithdrawIn,
    SendContractIn,
    CenterAdoptionFilterIn,
)
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
from centers.models import AdoptionContractTemplate, AdoptionConsent
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
            
            # 입양 상태 필터 적용 (Adoption.status 기준)
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

@router.get(
    "/center-admin/{adoption_id}",
    summary="[R] 개별 입양 신청 조회",
    description="센터 관리자가 특정 입양 신청을 조회합니다",
    response={200: CenterAdoptionOut, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def get_center_adoption(request, adoption_id: str):
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
        
        # 응답 데이터 변환
        adoption_response = await build_center_adoption_response(adoption, center)
        
        return adoption_response
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get center adoption error: {e}")
        raise HttpError(500, "입양 신청 조회 중 오류가 발생했습니다")

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
        
        # 모니터링으로 변경하는 경우에도 센터 설정이 없어도 허용
        # (프론트에서 기간만 수집하며, 센터 설정 없이도 자유 모니터링 허용 정책)
        
        # 업데이트할 데이터 준비
        update_fields = {
            "status": data.status,
            "center_notes": data.center_notes,
            "user_memo": data.user_memo,
            "updated_at": timezone.now()
        }
        
        # 상태별 특별 처리
        if data.status == "미팅" and data.meeting_scheduled_at:
            update_fields["meeting_scheduled_at"] = data.meeting_scheduled_at
        
        if data.status == "입양완료":
            update_fields["adoption_completed_at"] = timezone.now()
        
        if data.status == "모니터링":
            # 모니터링 시작일만 기록 (체크 주기/다음 일정은 설정하지 않음)
            update_fields["monitoring_started_at"] = timezone.now()
        
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


@router.put(
    "/center-admin/{adoption_id}/memo",
    summary="[U] 입양 신청 메모 업데이트",
    description="상태 변경 없이 center_notes / user_memo를 업데이트합니다",
    response={200: CenterAdoptionOut, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def update_adoption_memo(request, adoption_id: str, data: UpdateAdoptionMemoIn):
    try:
        current_user = request.auth
        # 권한 확인
        if not await validate_center_permissions(current_user):
            raise HttpError(403, "센터 관리자만 접근할 수 있습니다")
        # 센터 조회
        center = await get_user_center(current_user)
        # 입양 신청 소유 확인
        try:
            adoption = await Adoption.objects.select_related('animal', 'user').aget(
                id=adoption_id,
                animal__center=center
            )
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")

        update_fields = {"updated_at": timezone.now()}
        if data.center_notes is not None:
            update_fields["center_notes"] = data.center_notes
        if data.user_memo is not None:
            update_fields["user_memo"] = data.user_memo

        if len(update_fields.keys()) == 1:
            # 메모 필드가 아무것도 전달되지 않은 경우
            raise HttpError(400, "업데이트할 메모가 없습니다")

        await Adoption.objects.filter(id=adoption_id).aupdate(**update_fields)
        updated = await Adoption.objects.select_related('animal', 'user').aget(id=adoption_id)
        return await build_center_adoption_response(updated, center)

    except HttpError:
        raise
    except Exception as e:
        print(f"Update adoption memo error: {e}")
        raise HttpError(500, "입양 신청 메모 업데이트 중 오류가 발생했습니다")


@router.put(
    "/center-admin/{adoption_id}/withdraw",
    summary="[U] (센터) 입양 신청 철회 처리",
    description="센터 관리자가 입양 신청을 철회(취소) 처리합니다. reason을 center_notes로 저장합니다.",
    response={200: CenterAdoptionOut, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def center_withdraw_adoption(request, adoption_id: str, data: CenterWithdrawIn):
    try:
        current_user = request.auth
        # 권한 확인
        if not await validate_center_permissions(current_user):
            raise HttpError(403, "센터 관리자만 접근할 수 있습니다")
        # 센터 조회
        center = await get_user_center(current_user)
        # 입양 신청 소유 확인
        try:
            adoption = await Adoption.objects.select_related('animal', 'user').aget(
                id=adoption_id,
                animal__center=center
            )
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")

        # 상태 전이 허용 검증
        if not validate_status_transition(adoption.status, "취소"):
            raise HttpError(400, f"{adoption.status}에서 취소로 변경할 수 없습니다")

        update_fields = {
            "status": "취소",
            "updated_at": timezone.now(),
        }
        if data.reason:
            update_fields["center_notes"] = data.reason

        await Adoption.objects.filter(id=adoption_id).aupdate(**update_fields)
        updated = await Adoption.objects.select_related('animal', 'user').aget(id=adoption_id)
        return await build_center_adoption_response(updated, center)
    except HttpError:
        raise
    except Exception as e:
        print(f"Center withdraw adoption error: {e}")
        raise HttpError(500, "입양 신청 철회 처리 중 오류가 발생했습니다")

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
        
        # 입양 신청 확인 (상태 무관하게 조회 후 필요 시 상태 전환)
        try:
            adoption = await Adoption.objects.select_related('animal', 'user').aget(
                id=adoption_id,
                animal__center=center,
            )
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 상태가 '계약서작성'이 아니면 자동 전환
        if adoption.status != "계약서작성":
            # 상태 전이 허용 여부 검증을 느슨하게 하거나, 최소 '미팅' 이상에서만 전환 허용
            # 필요 시 validate_status_transition 사용 가능
            await Adoption.objects.filter(id=adoption_id).aupdate(
                status="계약서작성",
                updated_at=timezone.now()
            )
        
        # 계약서 템플릿 조회
        template = None
        provided_template_id = (data.template_id or "").strip() if data.template_id is not None else ""
        if not provided_template_id:
            # 템플릿 미지정 시: 센터의 활성 템플릿이 1개뿐이면 자동 선택
            active_qs = AdoptionContractTemplate.objects.filter(center=center, is_active=True)
            active_count = await active_qs.acount()
            if active_count == 0:
                # 기본 계약서 템플릿 자동 생성
                template = await AdoptionContractTemplate.objects.acreate(
                    center=center,
                    title="기본 입양 계약서",
                    description="센터 기본 계약서 템플릿",
                    content=(
                        "입양 계약서\n\n"
                        "1. 입양인은 반려동물의 평생 보호 의무를 성실히 이행합니다.\n"
                        "2. 입양인은 동물보호법 및 관련 법규를 준수합니다.\n"
                        "3. 입양인은 센터의 모니터링 및 관리 요청에 협조합니다.\n"
                        "4. 기타 세부 사항은 센터의 내부 방침에 따릅니다.\n"
                    ),
                    is_active=True,
                )
                active_count = 1
            if active_count > 1:
                raise HttpError(400, "계약서 템플릿을 선택해주세요")
            if template is None:
                template = await active_qs.order_by("-created_at").afirst()
        else:
            # 지정된 템플릿 ID로 조회 + 소유 센터 일치 검증
            try:
                template = await AdoptionContractTemplate.objects.aget(id=provided_template_id, center=center)
            except AdoptionContractTemplate.DoesNotExist:
                raise HttpError(404, "계약서 템플릿을 찾을 수 없습니다")
        
        # 템플릿 센터 일치 검증 (선택: 템플릿이 해당 센터 소유인지)
        # if template.center_id != center.id:
        #     raise HttpError(403, "해당 센터의 템플릿이 아니에요.")
        
        # 계약서 내용 생성 (템플릿 + 커스텀 내용)
        contract_content = data.custom_content or template.content
        
        # 계약서 생성
        # 동의서(Consent) 가져오기: 없으면 기본 동의서 자동 생성
        consent = await AdoptionConsent.objects.filter(center=center, is_active=True).order_by("-created_at").afirst()
        if consent is None:
            consent = await AdoptionConsent.objects.acreate(
                center=center,
                title="기본 입양 동의서",
                description="센터 기본 입양 동의서",
                content=(
                    "입양 유의사항\n\n"
                    "- 반려동물의 건강, 안전에 유의해주세요.\n"
                    "- 주소/연락처 변경 시 센터에 즉시 알려주세요.\n"
                    "- 문제 발생 시 즉시 센터에 연락해주세요.\n"
                ),
                is_active=True,
            )
        consent_content = data.custom_content or template.content
        guidelines_content = getattr(center, 'adoption_guidelines', '') or consent.content

        contract = await AdoptionContract.objects.acreate(
            adoption=adoption,
            template=template,
            contract_content=contract_content,
            guidelines_content=guidelines_content,
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
        
        # 모니터링 기간 정보만 반환
        monitoring_status = MonitoringStatusOut(
            monitoring_started_at=adoption.monitoring_started_at.isoformat() if adoption.monitoring_started_at else None,
            monitoring_end_date=None,  # 종료일 계산/저장은 현재 정책상 미설정
        )
        
        return monitoring_status
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get monitoring status error: {e}")
        raise HttpError(500, "모니터링 상태 조회 중 오류가 발생했습니다")