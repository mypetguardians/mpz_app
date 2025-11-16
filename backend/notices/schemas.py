from typing import Optional, List
from ninja import Schema, Field


class SuperadminNoticeOut(Schema):
    id: str = Field(..., description="공지 ID")
    title: str = Field(..., description="제목")
    content: str = Field(..., description="내용")
    notice_type: str = Field(..., description="공지 유형")
    is_published: bool = Field(..., description="공개 여부")
    is_pinned: bool = Field(..., description="상단 고정 여부")
    target_users: Optional[dict] = Field(None, description="대상 사용자 타입들")
    view_count: int = Field(..., description="조회수")
    created_at: str = Field(..., description="생성 시간 (ISO 형식)")
    updated_at: str = Field(..., description="수정 시간 (ISO 형식)")


class SuperadminNoticeListOut(Schema):
    notices: List[SuperadminNoticeOut] = Field(..., description="공지 목록")


class SuperadminNoticeCreateIn(Schema):
    title: str = Field(..., description="제목")
    content: str = Field(..., description="내용")
    notice_type: str = Field("system", description="공지 유형")
    is_published: bool = Field(True, description="공개 여부")
    is_pinned: bool = Field(False, description="상단 고정 여부")
    target_users: Optional[dict] = Field(None, description="대상 사용자 타입들")


class SuperadminNoticeUpdateIn(Schema):
    title: Optional[str] = Field(None, description="제목")
    content: Optional[str] = Field(None, description="내용")
    notice_type: Optional[str] = Field(None, description="공지 유형")
    is_published: Optional[bool] = Field(None, description="공개 여부")
    is_pinned: Optional[bool] = Field(None, description="상단 고정 여부")
    target_users: Optional[dict] = Field(None, description="대상 사용자 타입들")


class MessageOut(Schema):
    message: str = Field(..., description="결과 메시지")


class ErrorOut(Schema):
    error: str = Field(..., description="에러 메시지")

class SuperadminNoticeAdminListQueryIn(Schema):
    is_published: Optional[bool] = Field(None, description="공개 여부로 필터")
    is_pinned: Optional[bool] = Field(None, description="상단 고정 여부로 필터")
    notice_type: Optional[str] = Field(None, description="공지 유형으로 필터")
    q: Optional[str] = Field(None, description="제목/내용 검색어")
    limit: Optional[int] = Field(50, description="최대 개수")
    offset: Optional[int] = Field(0, description="시작 위치")


