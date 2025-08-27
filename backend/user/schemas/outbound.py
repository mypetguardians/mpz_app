from ninja import Schema, ModelSchema, Field
from typing import Optional
from datetime import datetime
from user.models import User


class UserMeOut(Schema):
    id: str = Field(..., description="사용자 ID")
    username: str = Field(..., description="사용자 아이디")
    email: Optional[str] = Field(None, description="이메일 주소")
    name: Optional[str] = Field(None, description="실명")
    nickname: Optional[str] = Field(None, description="닉네임")
    phone_number: Optional[str] = Field(None, description="전화번호")
    user_type: str = Field(..., description="사용자 유형")
    status: str = Field(..., description="사용자 상태")
    is_phone_verified: bool = Field(False, description="전화번호 인증 여부")
    image: Optional[str] = Field(None, description="프로필 이미지 URL")
    birth: Optional[str] = Field(None, description="생년월일")
    address: Optional[str] = Field(None, description="주소")
    address_is_public: bool = Field(False, description="주소 공개 여부")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")
    
    @classmethod
    def from_user(cls, user: User):
        """User 모델 인스턴스로부터 UserMeOut 인스턴스를 생성합니다."""
        return cls(
            id=str(user.id),
            username=user.username,
            email=user.email,
            name=user.name,
            nickname=user.nickname,
            phone_number=user.phone_number,
            user_type=user.user_type,
            status=user.status,
            is_phone_verified=user.is_phone_verified,
            image=user.image,
            birth=user.birth,
            address=user.address,
            address_is_public=user.address_is_public,
            created_at=user.created_at.isoformat() if user.created_at else None,
            updated_at=user.updated_at.isoformat() if user.updated_at else None,
        )

class UserLoginOut(Schema):
    access_token: str = Field(..., description="액세스 토큰")
    refresh_token: str = Field(..., description="리프레시 토큰")
    status: str = Field(..., description="로그인 상태")


class UserRefreshTokenOut(Schema):
    access_token: str = Field(..., description="새로운 액세스 토큰")
    refresh_token: str = Field(..., description="새로운 리프레시 토큰")


class UserListOut(Schema):
    """사용자 목록 응답 스키마"""
    id: str = Field(..., description="사용자 ID")
    username: str = Field(..., description="사용자 아이디")
    email: str = Field(..., description="이메일 주소")
    nickname: str = Field(..., description="닉네임")
    user_type: str = Field(..., description="사용자 유형")
    status: str = Field(..., description="사용자 상태")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")


class SuccessOut(Schema):
    detail: str = Field(..., description="성공 메시지")