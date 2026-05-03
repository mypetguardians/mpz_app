import jwt
from typing import Any, Optional
from django.http import HttpRequest
from ninja.security import HttpBearer
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from user.models import Jwt


User = get_user_model()


class JWTAuth(HttpBearer):
    async def __call__(self, request: HttpRequest) -> Optional[Any]:
        headers = request.headers
        auth_value = headers.get(self.header)

        if not auth_value:
            token = request.COOKIES.get("access")
            if token:
                return await self.authenticate(request, token)
            return None

        parts = auth_value.split(" ")
        if parts[0].lower() != self.openapi_scheme:
            return None

        token = " ".join(parts[1:])
        return await self.authenticate(request, token)

    async def authenticate(self, request, token):
        try:
            # `aud` 클레임은 강아지학교 PostgREST가 자체 검증하므로 마펫쯔 측에선 스킵.
            decoded = jwt.decode(
                token,
                settings.JWT_SIGNING_KEY,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            if decoded["exp"] < timezone.now().timestamp():
                return None  # 토큰이 만료되었습니다.

            # `sub`은 강아지학교 PostgREST 호환을 위한 표준 클레임. 기존 토큰 호환을 위해
            # `user_id`도 fallback으로 받는다.
            user_id = decoded.get("sub") or decoded.get("user_id")
            if user_id:
                # 로그아웃된 토큰 차단: DB에 토큰이 존재하는지 확인
                if not await Jwt.objects.filter(user_id=user_id, access=token).aexists():
                    return None
                return await User.objects.aget(id=user_id)
        except jwt.ExpiredSignatureError:
            return None  # 토큰 만료 에러 처리
        except jwt.DecodeError:
            return None  # 디코드 에러 처리
        except User.DoesNotExist:
            return None  # 사용자가 존재하지 않는 경우
        return None


jwt_auth = JWTAuth()


async def get_authenticated_user(request):
    """request.auth에서 인증된 사용자를 꺼내 반환합니다. 미인증 시 401 에러."""
    from ninja.errors import HttpError

    if not hasattr(request, 'auth') or not request.auth:
        raise HttpError(401, "로그인이 필요합니다")
    current_user = request.auth
    if hasattr(current_user, '__await__'):
        current_user = await current_user
    return current_user
