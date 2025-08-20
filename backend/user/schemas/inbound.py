from ninja import Schema

class UserSignupIn(Schema):
    username: str
    password: str
    password_confirm: str
    email: str = None
    nickname: str = None
    terms_of_service: bool
    privacy_policy_agreement: bool


class UserUpdateIn(Schema):
    nickname: str = None
    phone_number: str = None
    birth: str = None
    address: str = None
    address_is_public: bool = None


class UserLoginIn(Schema):
    username: str
    password: str


class RefreshTokenIn(Schema):
    refresh_token: str


class UserCreateIn(Schema):
    """사용자 생성 요청 스키마 (관리자용)"""
    username: str
    password: str
    email: str
    nickname: str = None
    user_type: str = "일반사용자"
    phone_number: str = None
