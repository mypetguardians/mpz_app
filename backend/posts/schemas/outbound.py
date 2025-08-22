from ninja import Schema, Field
from typing import Optional, List
from datetime import datetime


class PostTagOut(Schema):
    """포스트 태그 출력 스키마"""
    id: str = Field(..., description="태그 ID")
    post_id: str = Field(..., description="포스트 ID")
    tag_name: str = Field(..., description="태그명")
    created_at: datetime = Field(..., description="생성 시간")


class PostImageOut(Schema):
    """포스트 이미지 출력 스키마"""
    id: str = Field(..., description="이미지 ID")
    post_id: str = Field(..., description="포스트 ID")
    image_url: str = Field(..., description="이미지 URL")
    order_index: int = Field(..., description="이미지 순서")
    created_at: datetime = Field(..., description="생성 시간")


class PostOut(Schema):
    """포스트 출력 스키마"""
    id: str = Field(..., description="포스트 ID")
    title: str = Field(..., description="제목")
    content: str = Field(..., description="내용")
    user_id: str = Field(..., description="작성자 ID")
    animal_id: Optional[str] = Field(None, description="관련 동물 ID")
    adoption_id: Optional[str] = Field(None, description="관련 입양 ID")
    content_tags: Optional[dict] = Field(None, description="콘텐츠 태그")
    like_count: int = Field(0, description="좋아요 수")
    comment_count: int = Field(0, description="댓글 수")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: datetime = Field(..., description="수정 시간")
    user_nickname: str = Field(..., description="작성자 닉네임")
    user_image: Optional[str] = Field(None, description="작성자 이미지")
    tags: List[PostTagOut] = Field([], description="태그 목록")
    images: List[PostImageOut] = Field([], description="이미지 목록")


class PostDetailOut(Schema):
    """포스트 상세 출력 스키마"""
    post: PostOut = Field(..., description="포스트 정보")
    tags: List[PostTagOut] = Field(..., description="태그 목록")
    images: List[PostImageOut] = Field(..., description="이미지 목록")


class PostCreateOut(Schema):
    """게시글 생성 응답 스키마"""
    message: str = Field(..., description="응답 메시지")
    community: PostOut = Field(..., description="생성된 게시글 정보")


class PostUpdateOut(Schema):
    """게시글 수정 응답 스키마"""
    message: str = Field(..., description="응답 메시지")


class PostDeleteOut(Schema):
    """게시글 삭제 응답 스키마"""
    message: str = Field(..., description="응답 메시지")



