import logging
import random
import string

from ninja import Router
from ninja.errors import HttpError
from django.utils import timezone

from adoptions.schemas.inbound import SendPhoneVerificationIn, VerifyPhoneCodeIn
from adoptions.schemas.outbound import PhoneVerificationOut
from user.models import User, PhoneVerificationToken
from api.security import jwt_auth
from sms.client import send_sms

logger = logging.getLogger(__name__)
router = Router(tags=["Phone_Verification"])


def generate_verification_token() -> str:
    """6자리 랜덤 토큰 생성"""
    return ''.join(random.choices(string.digits, k=6))


@router.post(
    "/phone/send-verification",
    summary="[C] 전화번호 인증코드 발송",
    description="전화번호 인증코드를 발송합니다",
    response={200: PhoneVerificationOut, 401: dict, 403: dict, 429: dict, 500: dict},
    auth=jwt_auth,
)
async def send_phone_verification(request, data: SendPhoneVerificationIn):
    try:
        current_user = request.auth

        # 일반사용자 권한 확인
        if current_user.user_type != User.UserTypeChoice.normal:
            raise HttpError(403, "일반사용자만 전화번호 인증이 가능합니다")

        # 1분 내에 발송된 인증번호가 있는지 확인 (스팸 방지)
        one_minute_ago = timezone.now() - timezone.timedelta(minutes=1)
        recent_tokens = await PhoneVerificationToken.objects.filter(
            user_id=current_user.id,
            created_at__gt=one_minute_ago
        ).acount()

        if recent_tokens > 0:
            raise HttpError(429, "1분 후에 다시 시도해주세요")

        # 6자리 랜덤 토큰 생성
        verification_token = generate_verification_token()
        expires_at = timezone.now() + timezone.timedelta(minutes=5)

        # 토큰 저장
        await PhoneVerificationToken.objects.acreate(
            user_id=current_user.id,
            phone_number=data.phone_number,
            token=verification_token,
            expires_at=expires_at,
        )

        # 알리고 SMS 발송
        await send_sms(
            receiver=data.phone_number,
            message=f"[마펫쯔] 인증번호: {verification_token}",
        )

        return {
            "success": True,
            "message": "인증번호가 발송되었습니다. 5분 내에 입력해주세요.",
        }

    except HttpError:
        raise
    except Exception:
        logger.exception("인증번호 발송 중 오류")
        raise HttpError(500, "인증번호 발송 중 오류가 발생했습니다")


@router.post(
    "/phone/verify",
    summary="[C] 전화번호 인증코드 확인",
    description="전화번호 인증코드를 확인합니다",
    response={200: PhoneVerificationOut, 400: dict, 401: dict, 500: dict},
    auth=jwt_auth,
)
async def verify_phone_code(request, data: VerifyPhoneCodeIn):
    try:
        current_user = request.auth

        # 유효한 토큰 조회
        valid_tokens = await PhoneVerificationToken.objects.filter(
            user_id=current_user.id,
            phone_number=data.phone_number,
            token=data.verification_code,
            is_used=False,
            expires_at__gt=timezone.now()
        ).acount()

        if valid_tokens == 0:
            raise HttpError(400, "인증번호가 일치하지 않거나 만료되었습니다")

        # 토큰을 사용됨으로 표시
        await PhoneVerificationToken.objects.filter(
            user_id=current_user.id,
            phone_number=data.phone_number,
            token=data.verification_code
        ).aupdate(is_used=True)

        # 사용자의 전화번호 인증 상태 업데이트
        await User.objects.filter(id=current_user.id).aupdate(
            phone_number=data.phone_number,
            is_phone_verified=True,
            phone_verified_at=timezone.now(),
        )

        return {
            "success": True,
            "message": "전화번호 인증이 완료되었습니다.",
            "is_verified": True,
        }

    except HttpError:
        raise
    except Exception:
        logger.exception("전화번호 인증 중 오류")
        raise HttpError(500, "전화번호 인증 중 오류가 발생했습니다")
