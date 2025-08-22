from ninja import Schema, Field
from typing import Optional


class CommentCreateIn(Schema):
    """댓글 생성 입력 스키마"""
    content: str = Field(..., min_length=1, description="댓글 내용")


class CommentUpdateIn(Schema):
    """댓글 수정 입력 스키마"""
    content: str = Field(..., min_length=1, description="댓글 내용")


class ReplyCreateIn(Schema):
    """대댓글 생성 입력 스키마"""
    content: str = Field(..., min_length=1, description="대댓글 내용")


class ReplyUpdateIn(Schema):
    """대댓글 수정 입력 스키마"""
    content: str = Field(..., min_length=1, description="대댓글 내용")
