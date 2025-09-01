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
from django.http import JsonResponse
from api.security import jwt_auth

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

    return utils.set_cookie_jwt(response, access, refresh, access_exp, refresh_exp)


@router.post(
    "/logout",
    summary="[C] 로그아웃",
    description="로그아웃을 진행합니다.",
    response={
        200: SuccessOut,
    },
    auth=jwt_auth,
)
async def logout(request):
    user = request.auth
    
    # 사용자의 모든 JWT 토큰 삭제
    await sync_to_async(Jwt.objects.filter(user_id=user.id).delete)()
    
    return {"detail": "로그아웃 되었습니다."}


@router.post(
    "/refresh-token",
    summary="[C] 토큰 갱신",
    description="만료된 Access Token을 갱신합니다.",
    response={
        200: UserRefreshTokenOut,
    },
)
async def refresh_token(request, data: RefreshTokenIn):
    try:
        # Refresh Token 유효성 검증
        await utils.validate_refresh_token(data.refresh_token)

        # Refresh Token을 통해 DB에서 JWT Entry를 가져옴
        jwt_entry = await sync_to_async(Jwt.objects.select_related("user").get)(
            refresh=data.refresh_token
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

        return utils.set_cookie_jwt(response, access, refresh, access_exp, refresh_exp)

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
        # 사용자 정보 업데이트
        import logging
        logger = logging.getLogger(__name__)
        
        # Pydantic 모델을 딕셔너리로 변환
        try:
            data_dict = data.model_dump(exclude_none=True)
        except AttributeError:
            # 이전 버전의 pydantic이면 dict() 사용
            data_dict = data.dict(exclude_none=True)
        
        logger.info(f"Updating user {user.id} with data: {data_dict}")
        
        # 빈 값들을 필터링해서 업데이트
        update_data = {k: v for k, v in data_dict.items() if v is not None and v != ""}
        logger.info(f"Filtered update data: {update_data}")
        
        if update_data:
            # sync_to_async를 사용하여 업데이트
            await sync_to_async(User.objects.filter(id=user.id).update)(**update_data)
        
        # 업데이트된 사용자 정보 반환
        updated_user = await sync_to_async(User.objects.get)(id=user.id)
        return UserMeOut.from_user(updated_user)
        
    except User.DoesNotExist:
        raise HttpError(404, "사용자를 찾을 수 없습니다.")
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        error_detail = f"User update error: {str(e)}\nTraceback: {traceback.format_exc()}"
        logger.error(error_detail)
        print(error_detail)  # 콘솔에도 출력
        raise HttpError(500, f"사용자 정보 수정 중 오류가 발생했습니다: {str(e)}")