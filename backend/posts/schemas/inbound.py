from ninja import Schema, Field
from typing import Optional, List


class PostCreateIn(Schema):
    """게시글 생성 입력 스키마"""
    title: str = Field(..., min_length=1, max_length=200, description="게시글 제목")
    content: str = Field(..., min_length=1, description="게시글 내용")
    tags: Optional[List[str]] = Field(None, description="태그 목록")
    images: Optional[List[str]] = Field(None, description="이미지 URL 목록")
    adoption_id: Optional[str] = Field(None, description="관련 입양 ID")


class PostUpdateIn(Schema):
    """게시글 수정 입력 스키마"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="게시글 제목")
    content: Optional[str] = Field(None, min_length=1, description="게시글 내용")
    tags: Optional[List[str]] = Field(None, description="태그 목록")
    images: Optional[List[str]] = Field(None, description="이미지 URL 목록")
    adoption_id: Optional[str] = Field(None, description="관련 입양 ID")


class PostListQueryIn(Schema):
    """게시글 목록 조회 쿼리 스키마"""
    user_id: Optional[str] = Field(None, description="특정 사용자의 게시글만 조회")



