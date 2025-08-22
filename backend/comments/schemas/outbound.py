from ninja import Schema, Field
from typing import Optional, List
from datetime import datetime


class CommentUserOut(Schema):
    """댓글 작성자 정보 스키마"""
    id: str = Field(..., description="사용자 ID")
    nickname: Optional[str] = Field(None, description="닉네임")
    image: Optional[str] = Field(None, description="프로필 이미지")


class ReplyOut(Schema):
    """대댓글 출력 스키마"""
    id: str = Field(..., description="대댓글 ID")
    comment_id: str = Field(..., description="댓글 ID")
    user_id: str = Field(..., description="작성자 ID")
    content: str = Field(..., description="대댓글 내용")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: datetime = Field(..., description="수정 시간")


class CommentOut(Schema):
    """댓글 출력 스키마"""
    id: str = Field(..., description="댓글 ID")
    post_id: str = Field(..., description="포스트 ID")
    user_id: str = Field(..., description="작성자 ID")
    content: str = Field(..., description="댓글 내용")
    like_count: int = Field(0, description="좋아요 수")
    replies: List[ReplyOut] = Field([], description="대댓글 목록")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: datetime = Field(..., description="수정 시간")
    user: Optional[CommentUserOut] = Field(None, description="작성자 정보")


class CommentCreateOut(Schema):
    """댓글 생성 응답 스키마"""
    message: str = Field(..., description="응답 메시지")
    comment_id: str = Field(..., description="생성된 댓글 ID")


class CommentUpdateOut(Schema):
    """댓글 수정 응답 스키마"""
    message: str = Field(..., description="응답 메시지")


class CommentDeleteOut(Schema):
    """댓글 삭제 응답 스키마"""
    message: str = Field(..., description="응답 메시지")


class ReplyCreateOut(Schema):
    """대댓글 생성 응답 스키마"""
    message: str = Field(..., description="응답 메시지")
    reply_id: str = Field(..., description="생성된 대댓글 ID")


class ReplyUpdateOut(Schema):
    """대댓글 수정 응답 스키마"""
    message: str = Field(..., description="응답 메시지")


class ReplyDeleteOut(Schema):
    """대댓글 삭제 응답 스키마"""
    message: str = Field(..., description="응답 메시지")


# 순환 참조 해결
CommentOut.model_rebuild()
ReplyOut.model_rebuild()
