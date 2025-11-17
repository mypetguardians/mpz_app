from ninja import Schema, Field
from typing import Optional

class UserSignupIn(Schema):
    username: str = Field(..., min_length=3, max_length=30, description="사용자 아이디 (3-30자)")
    password: str = Field(..., min_length=8, max_length=128, description="비밀번호 (8자 이상)")
    password_confirm: str = Field(..., min_length=8, max_length=128, description="비밀번호 확인")
    email: str = Field(None, max_length=254, description="이메일 주소")
    nickname: str = Field(None, min_length=1, max_length=50, description="닉네임 (1-50자)")
    terms_of_service: bool = Field(..., description="서비스 이용약관 동의")
    privacy_policy_agreement: bool = Field(..., description="개인정보처리방침 동의")


class UserUpdateIn(Schema):
    nickname: Optional[str] = Field(None, max_length=50, description="닉네임 (1-50자)")
    name: Optional[str] = Field(None, max_length=100, description="실명")
    phone_number: Optional[str] = Field(None, max_length=20, description="전화번호")
    is_phone_verified: Optional[bool] = Field(None, description="전화번호 인증 여부")
    image: Optional[str] = Field(None, max_length=500, description="프로필 이미지 URL")
    birth: Optional[str] = Field(None, max_length=10, description="생년월일 (YYYY-MM-DD)")
    address: Optional[str] = Field(None, description="주소")


class UserLoginIn(Schema):
    username: str = Field(..., min_length=3, max_length=30, description="사용자 아이디")
    password: str = Field(..., min_length=8, max_length=128, description="비밀번호")
    redirect: Optional[str] = Field(None, max_length=500, description="로그인 후 리다이렉트 경로")
    redirect_path: Optional[str] = Field(None, max_length=500, description="로그인 후 리다이렉트 경로")
    next: Optional[str] = Field(None, max_length=500, description="로그인 후 리다이렉트 경로 (next)")


class RefreshTokenIn(Schema):
    refresh_token: str = Field(..., description="리프레시 토큰")


class UserCreateIn(Schema):
    """사용자 생성 요청 스키마 (관리자용)"""
    username: str = Field(..., min_length=3, max_length=30, description="사용자 아이디 (3-30자)")
    password: str = Field(..., min_length=8, max_length=128, description="비밀번호 (8자 이상)")
    email: str = Field(..., max_length=254, description="이메일 주소")
    nickname: str = Field(None, min_length=1, max_length=50, description="닉네임 (1-50자)")
    user_type: str = Field("일반사용자", description="사용자 유형 (일반사용자, 센터관리자, 훈련사, 최고관리자)")
    phone_number: str = Field(None, max_length=20, description="전화번호")
