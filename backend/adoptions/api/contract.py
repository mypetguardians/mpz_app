from ninja import Router
from ninja.errors import HttpError
from django.utils import timezone
from datetime import timedelta
from asgiref.sync import sync_to_async
from adoptions.schemas.inbound import ContractSignIn
from adoptions.schemas.outbound import ContractSignOut
from adoptions.models import AdoptionContract
from user.models import User
from adoptions.models import Adoption
from api.security import jwt_auth

router = Router(tags=["Contract"])


@router.post(
    "/contract/sign",
    summary="[C] 계약서 서명 (사용자용)",
    description="계약서에 사용자 서명을 추가합니다",
    response={200: ContractSignOut, 401: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def sign_contract(request, data: ContractSignIn):
    try:
        current_user = request.auth
        
        # 일반사용자 권한 확인
        if current_user.user_type != User.UserTypeChoice.normal:
            raise HttpError(403, "일반사용자만 계약서 서명이 가능합니다")
        
        # 계약서 조회 및 권한 확인
        contract = await (
            AdoptionContract.objects.select_related(
                "adoption__animal__center"
            )
            .filter(
                id=data.contract_id,
                adoption__user_id=current_user.id,
                status="대기중"
            )
            .order_by("-created_at")
            .afirst()
        )
        if not contract:
            raise HttpError(404, "서명 가능한 계약서를 찾을 수 없습니다")
        
        # 계약서에 사용자 서명 저장
        await AdoptionContract.objects.filter(id=data.contract_id).aupdate(
            user_signature_url=data.signature_data,  # Base64 서명 데이터
            user_signed_at=timezone.now(),
            status="사용자서명완료",
        )
        
        # (변경) 입양 상태는 즉시 변경하지 않음. 센터가 확인 후 '입양완료'로 변경.

        # 동물 상태도 즉시 변경하지 않음
        
        # 사용자에게 서명 접수 알림 전송
        try:
            from notifications.utils import send_adoption_update_notification
            await send_adoption_update_notification(
                user_id=str(current_user.id),
                adoption_status="계약서작성",
                animal_name=contract.adoption.animal.name,
                adoption_id=str(contract.adoption.id)
            )
        except Exception as e:
            # 알림 전송 실패는 로그만 남기고 API 응답에는 영향 주지 않음
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"계약 서명 접수 알림 전송 실패: {e}")
        
        # 센터 관리자들에게 사용자 서명 완료 알림 전송
        try:
            from notifications.utils import create_notification_for_center_users
            await create_notification_for_center_users(
                center_id=str(contract.adoption.animal.center.id),
                notification_type='adoption',
                message=f"{current_user.nickname}님이 {contract.adoption.animal.name} 계약 서명을 완료했습니다. 확인 후 상태를 '입양완료'로 변경하세요.",
                action_url=f"/adoptions/{contract.adoption.id}",
                metadata={
                    'adoption_id': str(contract.adoption.id),
                    'animal_id': str(contract.adoption.animal.id),
                    'user_id': str(current_user.id),
                    'center_id': str(contract.adoption.animal.center.id)
                },
                priority='high'
            )
        except Exception as e:
            # 알림 전송 실패는 로그만 남기고 API 응답에는 영향 주지 않음
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"센터 관리자 서명 완료 알림 전송 실패: {e}")
        
        return ContractSignOut(
            message="계약서 서명이 완료되었습니다. 센터 확인 후 입양이 완료됩니다.",
            adoption_status="계약서작성",
        )
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Sign contract error: {e}")
        raise HttpError(500, "계약서 서명 중 오류가 발생했습니다")
