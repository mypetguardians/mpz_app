from ninja import Router
from django.shortcuts import redirect
from django.conf import settings
import httpx
import uuid
from asgiref.sync import sync_to_async
from ninja.errors import HttpError
from user.models import Jwt, User
from user import utils
from django.http import HttpResponseRedirect

router = Router(tags=["Kakao_API"])

CLIENT_ID = settings.KAKAO_SOCIAL_LOGIN_CLIENT_ID
REDIRECT_URI = settings.KAKAO_SOCIAL_LOGIN_REDIRECT_URI
CLIENT_SECRET = settings.KAKAO_SOCIAL_LOGIN_CLIENT_SECRET

# 카카오 OAuth 설정
KAKAO_CONFIG = {
    "authorization_endpoint": "https://kauth.kakao.com/oauth/authorize",
    "token_endpoint": "https://kauth.kakao.com/oauth/token",
    "user_info_endpoint": "https://kapi.kakao.com/v2/user/me",
    "scope": "",  # 기본 동의 항목만 사용 (필수 항목만)
}


def generate_state() -> str:
    """상태값 생성 (CSRF 보호)"""
    return str(uuid.uuid4()).replace("-", "")


@router.get(
    "/debug",
    summary="카카오 로그인 디버그 정보",
    description="카카오 로그인 설정 정보를 확인합니다.",
)
async def kakao_debug(request):
    """카카오 로그인 디버그 정보"""
    return {
        "CLIENT_ID": CLIENT_ID,
        "REDIRECT_URI": REDIRECT_URI,
        "CLIENT_SECRET": CLIENT_SECRET[:10] + "..." if CLIENT_SECRET else "None",
        "FRONTEND_URL": settings.FRONTEND_URL,
        "KAKAO_CONFIG": KAKAO_CONFIG,
    }


@router.get(
    "/login",
    summary="카카오 로그인 페이지로 이동",
    description="카카오 로그인 페이지로 이동",
)
async def kakao_login(request):
    # 동적 state 토큰 생성 (CSRF 방지)
    state = generate_state()
    
    # 프론트엔드와 동일한 URL 생성 로직
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": KAKAO_CONFIG["scope"],
        "state": state,
    }
    
    # URL 파라미터 구성
    param_string = "&".join([f"{k}={v}" for k, v in params.items()])
    kakao_auth_url = f"{KAKAO_CONFIG['authorization_endpoint']}?{param_string}"
    
    return redirect(kakao_auth_url)


@router.get(
    "/login/callback",
    summary="카카오 로그인 콜백",
    description="카카오 로그인 콜백",
)
async def kakao_login_callback(request, code: str, state: str, redirect_uri: str = None):
    """카카오 로그인 콜백 처리"""
    print(f"카카오 로그인 콜백 시작 - code: {code[:10]}..., state: {state}, redirect_uri: {redirect_uri}")

    @sync_to_async
    def set_unusable_password(user):
        user.set_unusable_password()
        user.save()

    # 액세스 토큰 받기 (프론트엔드와 동일한 로직)
    try:
        # redirect_uri를 동적으로 결정 (프론트엔드에서 전달받거나 기본값 사용)
        # 프론트엔드에서 전달된 redirect_uri가 있으면 사용, 없으면 기본값 사용
        if redirect_uri:
            # URL 디코딩 처리
            from urllib.parse import unquote
            actual_redirect_uri = unquote(redirect_uri)
        else:
            actual_redirect_uri = REDIRECT_URI
            
        print(f"프론트엔드에서 전달된 redirect_uri: {redirect_uri}")
        print(f"디코딩된 redirect_uri: {actual_redirect_uri}")
        print(f"설정된 REDIRECT_URI: {REDIRECT_URI}")
            
        print(f"사용할 redirect_uri: {actual_redirect_uri}")
        print(f"설정된 CLIENT_ID: {CLIENT_ID}")
        print(f"설정된 CLIENT_SECRET: {CLIENT_SECRET[:10]}...")
        
        # redirect_uri 검증
        if not actual_redirect_uri:
            raise HttpError(400, "redirect_uri가 설정되지 않았습니다.")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            token_request = await client.post(
                KAKAO_CONFIG["token_endpoint"],
                data={
                    "grant_type": "authorization_code",
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "redirect_uri": actual_redirect_uri,
                    "code": code,
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            )
            print(f"카카오 토큰 요청 응답: {token_request.status_code}")
            print(f"카카오 토큰 요청 응답 내용: {token_request.text}")
            
            if token_request.status_code != 200:
                error_text = token_request.text
                print(f"카카오 토큰 교환 실패 - 상태코드: {token_request.status_code}, 내용: {error_text}")
                raise HttpError(
                    503, f"카카오 토큰 교환 실패: {token_request.status_code} - {error_text}"
                )
            token_json = token_request.json()
            if "error" in token_json:
                raise HttpError(
                    503,
                    f"카카오 인증 오류: {token_json.get('error_description', '알 수 없는 오류')}",
                )

        # 사용자 정보 가져오기 (프론트엔드와 동일한 엔드포인트)
        headers = {"Authorization": f"Bearer {token_json.get('access_token')}"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            profile_request = await client.get(
                KAKAO_CONFIG["user_info_endpoint"], headers=headers
            )
            if profile_request.status_code != 200:
                raise HttpError(
                    503, f"카카오 사용자 정보 조회 실패: {profile_request.status_code}"
                )
            profile_data = profile_request.json()
    except httpx.ConnectError as e:
        print(f"카카오 서버 연결 오류: {e}")
        raise HttpError(503, "카카오 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.")
    except httpx.TimeoutException as e:
        print(f"카카오 서버 타임아웃 오류: {e}")
        raise HttpError(
            503, "카카오 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
        )
    except Exception as e:
        print(f"카카오 로그인 처리 중 예상치 못한 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HttpError(503, f"카카오 로그인 처리 중 오류가 발생했습니다: {str(e)}")

    # 응답 데이터 검증 (프론트엔드와 동일한 구조)
    if not profile_data or "id" not in profile_data:
        raise HttpError(
            503,
            "카카오 서버에서 유효한 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.",
        )

    # 프론트엔드와 동일한 사용자 정보 구조
    kakao_user_id = str(profile_data.get("id", ""))
    kakao_account = profile_data.get("kakao_account", {})
    kakao_user_email = kakao_account.get("email", "")
    kakao_user_name = kakao_account.get("profile", {}).get("nickname", "카카오 사용자")
    kakao_user_image = kakao_account.get("profile", {}).get("profile_image_url", "")
    
    # 카카오 계정 정보가 없는 경우 기본값 설정
    if not kakao_user_email:
        kakao_user_email = f"kakao_{kakao_user_id}@kakao.com"

    if not kakao_user_id:
        raise HttpError(
            503,
            "카카오 사용자 정보를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.",
        )

    # 카카오 ID로 사용자 찾기 또는 생성
    try:
        user = await User.objects.aget(kakao_id=kakao_user_id)
        # 기존 사용자인 경우
        created = False
    except User.DoesNotExist:
        # 새 사용자인 경우 (프론트엔드와 동일한 필드명 사용)
        unique_username = f"kakao_{kakao_user_id}"
        user = await User.objects.acreate(
            username=unique_username,
            kakao_id=kakao_user_id,
            email=kakao_user_email,
            nickname=kakao_user_name,
            image=kakao_user_image if kakao_user_image else "",
            is_phone_verified=False,  # 카카오 로그인은 전화번호 인증이 필요할 수 있음
        )
        await set_unusable_password(user)
        created = True

    # 실제 JWT 토큰 생성
    try:
        access, access_exp = utils.get_access_token({"user_id": user.id})
        refresh, refresh_exp = utils.get_refresh_token()
    except Exception as e:
        print(f"JWT 토큰 생성 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HttpError(503, f"JWT 토큰 생성 중 오류가 발생했습니다: {str(e)}")

    @sync_to_async
    def update_jwt(user_id, access, refresh):
        jwt_update = Jwt.objects.update_or_create(
            user_id=user_id,
            defaults={"access": access, "refresh": refresh},
        )
        return jwt_update

    await update_jwt(user.id, access, refresh)

    # 상태에 따른 리다이렉트 URL 설정
    redirect_path = "/"

    # JWT 토큰을 쿠키에 설정하고 홈으로 리다이렉트
    try:
        redirect_url = f"{settings.FRONTEND_URL}{redirect_path}"
        response = HttpResponseRedirect(redirect_url)
        response = utils.set_cookie_jwt(response, access, refresh, access_exp, refresh_exp)
        return response
    except Exception as e:
        print(f"쿠키 설정 및 리다이렉트 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HttpError(503, f"쿠키 설정 중 오류가 발생했습니다: {str(e)}")
