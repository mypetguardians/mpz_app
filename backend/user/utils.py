import jwt, random, string
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from api.exceptions import CustomAuthorizationError
from zoneinfo import ZoneInfo


User = get_user_model()


def get_random(length):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def get_access_token(payload):
    exp = timezone.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRATION_TIME)

    # UUID를 문자열로 변환
    processed_payload = {}
    for key, value in payload.items():
        if hasattr(value, 'hex'):  # UUID 객체인 경우
            processed_payload[key] = str(value)
        else:
            processed_payload[key] = value

    # Supabase PostgREST 호환 클레임 — 강아지학교가 같은 access 토큰으로 직접 검증하려면
    # `sub`(user id), `role`(authenticated), `aud`(authenticated)가 필요하다. 기존 user_id
    # 클레임은 마펫쯔 자체 검증 로직이 그대로 사용하도록 유지한다.
    user_id = processed_payload.get("user_id")
    if user_id and "sub" not in processed_payload:
        processed_payload["sub"] = str(user_id)
    processed_payload.setdefault("role", "authenticated")
    processed_payload.setdefault("aud", "authenticated")

    return (
        jwt.encode(
            {
                "exp": exp,
                **processed_payload,
            },
            settings.JWT_SIGNING_KEY,
            algorithm="HS256",
        ),
        exp,
    )


def get_refresh_token():
    exp = timezone.now() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRATION_TIME)
    return (
        jwt.encode(
            {
                "exp": exp,
                "data": get_random(10),
            },
            settings.JWT_SIGNING_KEY,
            algorithm="HS256",
        ),
        exp,
    )


async def validate_refresh_token(token):
    try:
        decoded = jwt.decode(
            token,
            key=settings.JWT_SIGNING_KEY,
            algorithms="HS256",
            options={"verify_aud": False},
        )
        naive_datetime = datetime.fromtimestamp(decoded["exp"])
        exp_datetime = timezone.make_aware(naive_datetime, ZoneInfo("UTC"))
        if exp_datetime < timezone.now():
            raise CustomAuthorizationError("토큰이 만료되었습니다.", 401)
    except jwt.ExpiredSignatureError:
        raise CustomAuthorizationError("토큰이 만료되었습니다.", 401)
    except jwt.DecodeError:
        raise CustomAuthorizationError("올바르지 않은 토큰입니다.", 401)


async def decodeJWT(bearer):
    if not bearer:
        return None

    token = bearer[7:]
    try:
        decoded = jwt.decode(
            token,
            key=settings.JWT_SIGNING_KEY,
            algorithms="HS256",
            options={"verify_aud": False},
        )
        naive_datetime = datetime.fromtimestamp(decoded["exp"])
        exp_datetime = timezone.make_aware(naive_datetime, ZoneInfo("UTC"))
        if exp_datetime < timezone.now():
            raise CustomAuthorizationError("토큰이 만료되었습니다.", 401)
    except jwt.exceptions.ExpiredSignatureError:
        raise CustomAuthorizationError("토큰이 만료되었습니다.", 401)
    except jwt.exceptions.DecodeError:
        raise CustomAuthorizationError("올바르지 않은 토큰입니다.", 401)

    if decoded:
        try:
            return await User.objects.aget(id=decoded["user_id"])
        except User.DoesNotExist:
            return None



def set_cookie_jwt(response, access, refresh, access_exp, refresh_exp, reset=None, request=None):
    domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
    secure = getattr(settings, 'SESSION_COOKIE_SECURE', True)
    
    # 브라우저별 SameSite 설정 (Safari ITP 대응)
    if request:
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        is_safari = 'Safari' in user_agent and 'Chrome' not in user_agent
        # Safari는 SameSite=Lax, 다른 브라우저는 SameSite=None 사용
        samesite = 'Lax' if is_safari else getattr(settings, 'SESSION_COOKIE_SAMESITE', 'None')
    else:
        # request가 없으면 기본값 사용
        samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'None')

    response.set_cookie(
        key="access",
        value=access,
        expires=access_exp,
        secure=secure,
        samesite=samesite,
        httponly=False,
        domain=domain,
    )

    response.set_cookie(
        key="refresh",
        value=refresh,
        expires=refresh_exp,
        secure=secure,
        samesite=samesite,
        httponly=True,
        domain=domain,
    )

    if reset:
        response.set_cookie(
            key="reset",
            value=reset,
            expires=access_exp,
            secure=secure,
            samesite=samesite,
            httponly=True,
            domain=domain,
        )

    return response
