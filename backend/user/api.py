from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from user.schemas.outbound import UserMeOut, SuccessOut, UserRefreshTokenOut, UserLoginOut
from user.schemas.inbound import UserSignupIn, UserLoginIn, RefreshTokenIn, UserUpdateIn
from user.models import Jwt, User
from user import utils
from django.conf import settings
from api.exceptions import CustomAuthorizationError
from django.http import JsonResponse, HttpResponseRedirect
from api.security import jwt_auth
from urllib.parse import unquote

User = get_user_model()
router = Router(tags=["Users"])


@router.post(
    "/signup",
    summary="[C] 회원가입",
    description="회원가입을 진행합니다.",
    response={
        200: UserMeOut,
    },
)
async def signup(request, data: UserSignupIn):
    # 필수 필드 검증
    if not data.username or not data.password:
        raise HttpError(400, "아이디와 비밀번호는 필수입니다.")
    
    # 이용약관 동의 검증
    if not data.terms_of_service:
        raise HttpError(400, "이용약관에 동의해주세요.")
    
    if not data.privacy_policy_agreement:
        raise HttpError(400, "개인정보 수집 및 이용 동의에 동의해주세요.")

    # 아이디 중복 체크
    if await sync_to_async(User.objects.filter(username=data.username).exists)():
        raise HttpError(400, "이미 사용중인 아이디입니다.")

    try:
        # 새 사용자 생성
        from django.utils import timezone
        user = await sync_to_async(User.objects.create_user)(
            username=data.username,
            password=data.password,
            email=data.email or f"{data.username}@example.com",
            nickname=data.nickname or data.username,
            user_type=User.UserTypeChoice.normal,  # 기본값은 일반사용자
            terms_of_service=data.terms_of_service,
            privacy_policy_agreement=data.privacy_policy_agreement,
            terms_agreed_at=timezone.now() if data.terms_of_service and data.privacy_policy_agreement else None,
        )

        # 생성된 사용자 정보 반환
        created_user = await sync_to_async(User.objects.get)(id=user.id)
        return UserMeOut.from_user(created_user)
        
    except Exception as e:
        raise HttpError(
            400, "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        )


@router.post(
    "/login",
    summary="[C] 로그인",
    description="로그인을 진행합니다.",
    response={
        200: UserLoginOut,
    },
)
async def login(request, data: UserLoginIn):
    # 필수 필드 검증
    if not data.username or not data.password:
        raise HttpError(400, "아이디와 비밀번호는 필수입니다.")

    try:
        # 사용자 조회
        user = await sync_to_async(User.objects.get)(username=data.username)
    except User.DoesNotExist:
        raise HttpError(400, "해당 아이디로 등록된 사용자가 없습니다.")

    # 비밀번호 검증
    if not await sync_to_async(user.check_password)(data.password):
        raise HttpError(400, "비밀번호가 일치하지 않습니다.")

    # 기존 JWT 토큰 삭제 (보안 강화)
    await sync_to_async(Jwt.objects.filter(user_id=user.id).delete)()

    # 새로운 JWT 토큰 생성
    access, access_exp = utils.get_access_token({"user_id": user.id})
    refresh, refresh_exp = utils.get_refresh_token()

    # JWT 토큰 저장
    await sync_to_async(Jwt.objects.create)(
        user_id=user.id,
        access=access,
        refresh=refresh,
    )

    redirect_candidate = (
        getattr(data, "redirect", None)
        or getattr(data, "redirect_path", None)
        or getattr(data, "next", None)
        or request.GET.get("redirect")
        or request.GET.get("redirect_path")
        or request.GET.get("next")
        or request.GET.get("redirect_uri")
    )

    redirect_path = None
    if redirect_candidate:
        redirect_path = unquote(str(redirect_candidate)).strip()
        if not redirect_path:
            redirect_path = "/"

    redirect_url = None
    if redirect_path:
        if redirect_path.startswith(("http://", "https://")):
            redirect_url = redirect_path
        else:
            if not redirect_path.startswith("/"):
                redirect_path = f"/{redirect_path}"
            redirect_url = f"{settings.FRONTEND_URL}{redirect_path}"

    if redirect_url:
        response = HttpResponseRedirect(redirect_url)
        return utils.set_cookie_jwt(
            response, access, refresh, access_exp, refresh_exp, request=request
        )

    # 응답 생성 (프론트엔드와 일치하는 구조)
    response = JsonResponse({"status": user.status})

    # 로컬 환경에서는 토큰도 함께 반환
    if settings.DJANGO_ENV_NAME == "local":
        response = JsonResponse(
            {
                "status": user.status,
                "access_token": access,
                "refresh_token": refresh,
            }
        )

    return utils.set_cookie_jwt(response, access, refresh, access_exp, refresh_exp, request=request)


@router.post(
    "/logout",
    summary="[C] 로그아웃",
    description="로그아웃을 진행합니다.",
    response={
        200: SuccessOut,
    },
)
async def logout(request):
    import logging
    logger = logging.getLogger(__name__)

    # 인증 없이 수동 JWT 파싱 — 토큰이 만료/무효해도 로그아웃은 항상 성공해야 함
    token = request.COOKIES.get("access")
    if token:
        try:
            import jwt as pyjwt
            decoded = pyjwt.decode(
                token,
                settings.JWT_SIGNING_KEY,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            user_id = decoded.get("sub") or decoded.get("user_id")
            if user_id:
                await sync_to_async(Jwt.objects.filter(user_id=user_id).delete)()
        except Exception as e:
            logger.warning(f"로그아웃 시 토큰 처리 실패 (무시): {e}")

    response = JsonResponse({"detail": "로그아웃 되었습니다."})

    domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
    secure = getattr(settings, 'SESSION_COOKIE_SECURE', True)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    is_safari = 'Safari' in user_agent and 'Chrome' not in user_agent
    samesite = 'Lax' if is_safari else getattr(settings, 'SESSION_COOKIE_SAMESITE', 'None')

    # 쿠키 삭제: max_age=0으로 즉시 만료 (Django 5에서 expires+max_age 동시 사용 금지)
    for cookie_name in ("access", "refresh", "reset"):
        httponly = cookie_name != "access"
        response.set_cookie(
            key=cookie_name,
            value="",
            max_age=0,
            domain=domain,
            path="/",
            secure=secure,
            samesite=samesite,
            httponly=httponly,
        )

    return response


@router.post(
    "/refresh-token",
    summary="[C] 토큰 갱신",
    description="만료된 Access Token을 갱신합니다.",
    response={
        200: UserRefreshTokenOut,
    },
)
async def refresh_token(request, data: RefreshTokenIn = None):
    try:
        # 쿠키 또는 body에서 refresh token 읽기
        token = request.COOKIES.get("refresh") or (data.refresh_token if data else None)
        if not token:
            raise HttpError(400, "리프레시 토큰이 필요합니다")

        # Refresh Token 유효성 검증
        await utils.validate_refresh_token(token)

        # Refresh Token을 통해 DB에서 JWT Entry를 가져옴
        jwt_entry = await sync_to_async(Jwt.objects.select_related("user").get)(
            refresh=token
        )

        user = jwt_entry.user
        if not user:
            raise HttpError(400, "유효하지 않은 사용자입니다")

        # 새로운 Access Token 및 Refresh Token 생성
        access, access_exp = utils.get_access_token({"user_id": user.id})
        refresh, refresh_exp = utils.get_refresh_token()

        # 기존 JWT 토큰 업데이트
        await sync_to_async(Jwt.objects.update_or_create)(
            user_id=user.id,
            defaults={"access": access, "refresh": refresh},
        )

        # 응답 생성
        response = JsonResponse({"status": user.status})

        # 로컬 환경에서는 토큰도 함께 반환
        if settings.DJANGO_ENV_NAME == "local":
            response = JsonResponse(
                {
                    "status": user.status,
                    "access_token": access,
                    "refresh_token": refresh,
                }
            )

        return utils.set_cookie_jwt(response, access, refresh, access_exp, refresh_exp, request=request)

    except CustomAuthorizationError as e:
        raise HttpError(400, str(e))
    except Exception as e:
        raise HttpError(500, "토큰 갱신 중 오류가 발생했습니다.")


@router.get(
    "/me",
    summary="[C] 내 정보 조회",
    description="내 정보를 조회합니다.",
    response={200: UserMeOut},
    auth=jwt_auth,
)
async def get_me(request):
    try:
        # 사용자 정보 조회 (불필요한 region, district__region 제거)
        user = await sync_to_async(User.objects.get)(id=request.auth.id)
        
        # 스키마에 맞는 응답 반환
        return UserMeOut.from_user(user)
        
    except User.DoesNotExist:
        raise HttpError(404, "사용자를 찾을 수 없습니다.")
    except Exception as e:
        raise HttpError(500, "사용자 정보 조회 중 오류가 발생했습니다.")
    
@router.patch(
    "/me",
    summary="[C] 내 정보 수정",
    description="내 정보를 수정합니다.",
    response={200: UserMeOut},
    auth=jwt_auth,
)
async def update_me(request, data: UserUpdateIn):
    user = request.auth
    try:
        data_dict = data.model_dump(exclude_none=True)

        update_data = {}
        for key, value in data_dict.items():
            if value is not None and value != "":
                if key == "nickname" and len(value.strip()) == 0:
                    continue
                update_data[key] = value

        if update_data:
            await sync_to_async(User.objects.filter(id=user.id).update)(**update_data)

        updated_user = await sync_to_async(User.objects.get)(id=user.id)
        return UserMeOut.from_user(updated_user)

    except User.DoesNotExist:
        raise HttpError(404, "사용자를 찾을 수 없습니다.")
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("User update error")
        raise HttpError(500, "사용자 정보 수정 중 오류가 발생했습니다.")


@router.delete(
    "/deleteaccount",
    summary="[C] 계정 탈퇴",
    description="현재 로그인한 사용자의 계정을 비식별화하고 5년 보관 후 완전 삭제 예약 (개인정보보호법 + 전자상거래법 제6조)",
    response={200: SuccessOut},
    auth=jwt_auth,
)
async def delete_account(request):
    """회원 탈퇴 — 비식별화 + 보관 의무 5년 + 카카오 unlink + JWT 무효화

    절차 (claude.plan.md 탈퇴 설계 기준):
    1) 진행 중 입양/주문 차단 (status='신청'/'미팅'/'계약서작성')
    2) 카카오 unlink (실패해도 진행)
    3) 개인정보 비식별화 (이름/이메일/전화번호/사진/주소/생년월일/카카오ID)
    4) status=탈퇴유저, is_active=False, deleted_at=now, data_retention_until=now+5년
    5) Jwt 테이블 row 삭제 (모든 활성 토큰 즉시 무효화)
    6) 응답 + 쿠키 삭제 (호출 측에서 처리)

    주문(orders) 테이블은 5년 보관 의무로 삭제하지 않고 user FK는 그대로. 5년 후 배치 잡이
    `data_retention_until <= now()` 조건으로 일괄 완전 삭제.
    """
    import logging
    from datetime import timedelta

    logger = logging.getLogger(__name__)
    user = request.auth

    # 1) 진행 중 입양 차단
    from adoptions.models import Adoption
    in_progress_adoption = await Adoption.objects.filter(
        user_id=user.id,
        status__in=['신청', '미팅', '계약서작성'],
    ).aexists()
    if in_progress_adoption:
        raise HttpError(
            400,
            "진행 중인 입양 신청이 있어 탈퇴할 수 없습니다. 입양 완료 또는 취소 후 다시 시도해주세요.",
        )

    try:
        # 2) 카카오 unlink (실패해도 진행)
        if user.kakao_id:
            try:
                await _kakao_unlink(user.kakao_id)
            except Exception as e:
                logger.warning(f"카카오 unlink 실패 (탈퇴는 진행): {e}")

        # 3-5) 비식별화 + 상태 전환 + Jwt 삭제 (단일 트랜잭션)
        @sync_to_async
        def _withdraw_user_sync(user_id: str):
            from django.db import transaction
            from django.utils import timezone

            with transaction.atomic():
                target = User.objects.select_for_update().get(id=user_id)
                now = timezone.now()

                target.username = f"withdrawn_{target.id}"  # username unique 제약 회피
                target.email = None
                target.name = None
                target.nickname = "탈퇴회원"
                target.phone_number = None
                target.image = None
                target.birth = None
                target.address = None
                target.address_is_public = False
                target.is_phone_verified = False
                target.kakao_id = None  # unique 제약 + 재로그인 시 새 계정 생성 유도
                target.status = User.UserStatusChoice.withdraw
                target.is_active = False  # Django 기본 인증 차단
                target.deleted_at = now
                target.data_retention_until = now + timedelta(days=365 * 5)
                target.save(update_fields=[
                    'username', 'email', 'name', 'nickname', 'phone_number',
                    'image', 'birth', 'address', 'address_is_public',
                    'is_phone_verified', 'kakao_id', 'status', 'is_active',
                    'deleted_at', 'data_retention_until',
                ])

                # 모든 활성 JWT 무효화 (CASCADE로 자동 삭제되지만 명시 처리)
                Jwt.objects.filter(user_id=user_id).delete()

        await _withdraw_user_sync(user.id)
        logger.info(f"회원 탈퇴 완료: user_id={user.id}")

    except User.DoesNotExist:
        raise HttpError(404, "사용자를 찾을 수 없습니다.")
    except Exception:
        logger.exception("계정 탈퇴 처리 중 오류")
        raise HttpError(500, "계정 탈퇴 처리 중 오류가 발생했습니다.")

    # 6) 응답 + 쿠키 삭제 (logout과 동일 도메인/secure 정책)
    response = JsonResponse({"detail": "탈퇴 처리가 완료되었습니다. 5년 후 개인정보가 완전 삭제됩니다."})
    domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
    secure = getattr(settings, 'SESSION_COOKIE_SECURE', True)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    is_safari = 'Safari' in user_agent and 'Chrome' not in user_agent
    samesite = 'Lax' if is_safari else getattr(settings, 'SESSION_COOKIE_SAMESITE', 'None')
    for cookie_name in ("access", "refresh", "reset"):
        response.set_cookie(
            key=cookie_name,
            value="",
            max_age=0,
            domain=domain,
            path="/",
            secure=secure,
            samesite=samesite,
            httponly=cookie_name != "access",
        )
    return response


async def _kakao_unlink(kakao_id: str) -> None:
    """카카오 연동 해제 — Admin Key 또는 access token 필요. 여기서는 Admin Key 사용."""
    import httpx

    admin_key = getattr(settings, 'KAKAO_ADMIN_KEY', None) or config(
        "KAKAO_ADMIN_KEY", default=""
    )
    if not admin_key:
        raise RuntimeError("KAKAO_ADMIN_KEY env 미설정")

    async with httpx.AsyncClient(timeout=5.0) as client:
        res = await client.post(
            "https://kapi.kakao.com/v1/user/unlink",
            headers={
                "Authorization": f"KakaoAK {admin_key}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"target_id_type": "user_id", "target_id": str(kakao_id)},
        )
        if res.status_code != 200:
            raise RuntimeError(f"카카오 unlink 응답 비정상: {res.status_code} {res.text}")