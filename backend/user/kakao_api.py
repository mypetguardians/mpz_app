from ninja import Router, Schema
from django.shortcuts import redirect
from django.conf import settings
import httpx
import uuid
from asgiref.sync import sync_to_async
from ninja.errors import HttpError
from user.models import Jwt, User
from user import utils
from django.http import HttpResponseRedirect, JsonResponse
from typing import Dict, Tuple

router = Router(tags=["Kakao_API"])

CLIENT_ID = settings.KAKAO_SOCIAL_LOGIN_CLIENT_ID
REDIRECT_URI = settings.NEXT_PUBLIC_KAKAO_REDIRECT_URI
CLIENT_SECRET = settings.KAKAO_SOCIAL_LOGIN_CLIENT_SECRET

# 카카오 OAuth 설정
KAKAO_CONFIG = {
    "authorization_endpoint": "https://kauth.kakao.com/oauth/authorize",
    "token_endpoint": "https://kauth.kakao.com/oauth/token",
    "user_info_endpoint": "https://kapi.kakao.com/v2/user/me",
    "scope": "",  # 기본 동의 항목만 사용 (필수 항목만)
}


class KakaoNativeLoginIn(Schema):
    access_token: str


@sync_to_async
def set_unusable_password(user):
    user.set_unusable_password()
    user.save()


@sync_to_async
def update_jwt_entry(user_id: int, access: str, refresh: str):
    return Jwt.objects.update_or_create(
        user_id=user_id,
        defaults={"access": access, "refresh": refresh},
    )


async def fetch_kakao_profile(access_token: str) -> Dict:
    if not access_token:
        raise HttpError(400, "카카오 액세스 토큰이 필요합니다.")

    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            profile_request = await client.get(
                KAKAO_CONFIG["user_info_endpoint"], headers=headers
            )
    except httpx.ConnectError as e:
        print(f"카카오 서버 연결 오류: {e}")
        raise HttpError(503, "카카오 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.")
    except httpx.TimeoutException as e:
        print(f"카카오 서버 타임아웃 오류: {e}")
        raise HttpError(
            503, "카카오 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
        )

    if profile_request.status_code != 200:
        raise HttpError(
            503, f"카카오 사용자 정보 조회 실패: {profile_request.status_code}"
        )

    return profile_request.json()


def parse_kakao_profile(profile_data: Dict) -> Dict[str, str]:
    if not profile_data or "id" not in profile_data:
        raise HttpError(
            503,
            "카카오 서버에서 유효한 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.",
        )

    kakao_user_id = str(profile_data.get("id", ""))
    kakao_account = profile_data.get("kakao_account", {})
    kakao_user_email = kakao_account.get("email", "")
    kakao_user_name = kakao_account.get("profile", {}).get("nickname", "카카오 사용자")
    kakao_user_image = kakao_account.get("profile", {}).get("profile_image_url", "")

    if not kakao_user_email:
        kakao_user_email = f"kakao_{kakao_user_id}@kakao.com"

    if not kakao_user_id:
        raise HttpError(
            503,
            "카카오 사용자 정보를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.",
        )

    return {
        "id": kakao_user_id,
        "email": kakao_user_email,
        "name": kakao_user_name,
        "image": kakao_user_image if kakao_user_image else "",
    }


async def get_or_create_kakao_user(profile: Dict[str, str]) -> Tuple[User, bool]:
    try:
        user = await User.objects.aget(kakao_id=profile["id"])
        created = False
    except User.DoesNotExist:
        unique_username = f"kakao_{profile['id']}"
        user = await User.objects.acreate(
            username=unique_username,
            kakao_id=profile["id"],
            email=profile["email"],
            nickname=profile["name"],
            image=profile["image"],
            is_phone_verified=False,
        )
        await set_unusable_password(user)
        created = True

    return user, created


async def issue_tokens_for_user(user: User):
    access, access_exp = utils.get_access_token({"user_id": user.id})
    refresh, refresh_exp = utils.get_refresh_token()
    await update_jwt_entry(user.id, access, refresh)
    return access, refresh, access_exp, refresh_exp


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

    try:
        if redirect_uri:
            from urllib.parse import unquote
            actual_redirect_uri = unquote(redirect_uri)
        else:
            actual_redirect_uri = REDIRECT_URI
            
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

        profile_data = await fetch_kakao_profile(token_json.get("access_token"))
        profile_info = parse_kakao_profile(profile_data)
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

    try:
        user, created = await get_or_create_kakao_user(profile_info)
        access, refresh, access_exp, refresh_exp = await issue_tokens_for_user(user)
    except Exception as e:
        print(f"JWT 토큰 생성 또는 사용자 처리 중 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HttpError(503, f"카카오 로그인 처리 중 오류가 발생했습니다: {str(e)}")

    # 상태에 따른 리다이렉트 URL 설정
    from urllib.parse import unquote

    # state에서 frontend URL 추출 (로컬 개발 지원)
    frontend_base = settings.FRONTEND_URL
    if state and "_frontend_" in state:
        try:
            encoded_url = state.split("_frontend_", 1)[1]
            decoded_url = unquote(encoded_url)
            # localhost 또는 설정된 FRONTEND_URL만 허용
            allowed_origins = [
                settings.FRONTEND_URL,
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
            ]
            if decoded_url in allowed_origins:
                frontend_base = decoded_url
                print(f"state에서 frontend URL 추출: {frontend_base}")
        except Exception as e:
            print(f"state에서 frontend URL 파싱 실패: {e}")

    redirect_candidate = (
        request.GET.get("redirect")
        or request.GET.get("redirect_path")
        or request.GET.get("next")
        or request.GET.get("redirect_uri")
    )

    if redirect_candidate:
        redirect_path = unquote(redirect_candidate)
    else:
        redirect_path = "/"

    if redirect_path and not redirect_path.startswith(("http://", "https://")):
        if not redirect_path.startswith("/"):
            redirect_path = f"/{redirect_path}"
        redirect_url = f"{frontend_base}{redirect_path}"
    else:
        redirect_url = redirect_path if redirect_path else frontend_base

    # JWT 토큰을 쿠키에 설정하고 홈으로 리다이렉트
    try:
        response = HttpResponseRedirect(redirect_url)
        response = utils.set_cookie_jwt(response, access, refresh, access_exp, refresh_exp, request=request)
        return response
    except Exception as e:
        print(f"쿠키 설정 및 리다이렉트 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HttpError(503, f"쿠키 설정 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/native/login",
    summary="카카오 네이티브 로그인",
    description="네이티브 SDK에서 받은 액세스 토큰으로 로그인합니다.",
)
async def kakao_native_login(request, data: KakaoNativeLoginIn):
    profile_data = await fetch_kakao_profile(data.access_token)
    profile_info = parse_kakao_profile(profile_data)
    user, created = await get_or_create_kakao_user(profile_info)
    access, refresh, access_exp, refresh_exp = await issue_tokens_for_user(user)

    response = JsonResponse(
        {
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "nickname": user.nickname,
                "image": user.image,
                "is_new_user": created,
            },
        }
    )
    return utils.set_cookie_jwt(
        response, access, refresh, access_exp, refresh_exp, request=request
    )
