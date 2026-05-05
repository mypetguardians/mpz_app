import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from urllib.parse import parse_qs

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token):
    """JWT 토큰에서 사용자 정보를 가져옵니다."""
    try:
        decoded = jwt.decode(
            token,
            settings.JWT_SIGNING_KEY,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id = decoded.get("sub") or decoded.get("user_id")
        if user_id:
            return User.objects.get(id=user_id)
    except (jwt.DecodeError, jwt.ExpiredSignatureError, User.DoesNotExist):
        return None
    return None


class JWTAuthMiddleware(BaseMiddleware):
    """WebSocket 연결을 위한 JWT 인증 미들웨어"""
    
    async def __call__(self, scope, receive, send):
        # WebSocket 연결인 경우에만 처리
        if scope["type"] == "websocket":
            # 쿼리 파라미터에서 토큰 가져오기
            query_string = scope.get("query_string", b"").decode()
            query_params = parse_qs(query_string)
            token = query_params.get("token", [None])[0]
            
            # 토큰이 없으면 쿠키에서 가져오기 시도
            if not token:
                headers = dict(scope.get("headers", []))
                cookie_header = headers.get(b"cookie", b"").decode()
                if cookie_header:
                    cookies = dict(
                        item.strip().split("=", 1)
                        for item in cookie_header.split(";")
                        if "=" in item
                    )
                    token = cookies.get("accessToken") or cookies.get("access")
            
            # 토큰이 있으면 사용자 인증
            if token:
                user = await get_user_from_token(token)
                if user:
                    scope["user"] = user
                else:
                    scope["user"] = None
            else:
                scope["user"] = None
        
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """JWT 인증 미들웨어 스택"""
    return JWTAuthMiddleware(inner)
