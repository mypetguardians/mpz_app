from ninja import Schema, ModelSchema
from user.models import User


class UserMeOut(Schema):
    username: str
    status: str

class UserLoginOut(Schema):
    access_token: str
    refresh_token: str
    status: str


class UserRefreshTokenOut(Schema):
    access_token: str
    refresh_token: str


class UserListOut(Schema):
    """사용자 목록 응답 스키마"""
    id: str
    username: str
    email: str
    nickname: str
    user_type: str
    status: str
    created_at: str
    updated_at: str


class SuccessOut(Schema):
    detail: str