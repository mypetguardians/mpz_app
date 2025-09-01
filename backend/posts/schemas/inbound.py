from ninja import Schema, Field
from typing import Optional, List


class PostCreateIn(Schema):
    """게시글 생성 입력 스키마"""
    title: str = Field(..., min_length=1, max_length=200, description="게시글 제목")
    content: str = Field(..., min_length=1, description="게시글 내용")
    tags: Optional[List[str]] = Field(None, description="태그 목록")
    images: Optional[List[str]] = Field(None, description="이미지 URL 목록")
    animal_id: Optional[str] = Field(None, description="관련 동물 ID")
    is_all_access: Optional[bool] = Field(True, description="전체 공개 여부")


class PostUpdateIn(Schema):
    """게시글 수정 입력 스키마"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="게시글 제목")
    content: Optional[str] = Field(None, min_length=1, description="게시글 내용")
    tags: Optional[List[str]] = Field(None, description="태그 목록")
    images: Optional[List[str]] = Field(None, description="이미지 URL 목록")
    animal_id: Optional[str] = Field(None, description="관련 동물 ID")
    is_all_access: Optional[bool] = Field(True, description="전체 공개 여부")


class PostListQueryIn(Schema):
    """게시글 목록 조회 쿼리 스키마"""
    user_id: Optional[str] = Field(None, description="특정 사용자의 게시글만 조회")
    system_tags: Optional[List[str]] = Field(None, description="시스템 태그로 필터링 (하나라도 매칭되는 글만 표시)")
    is_all_access: Optional[bool] = Field(None, description="전체 공개 여부로 필터링 (True: 전체 공개, False: 제한적 공개)")
    sort_by: Optional[str] = Field("latest", description="정렬 방식 (latest, oldest, most_liked, most_commented)")



