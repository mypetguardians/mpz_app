from ninja import Schema, Field
from typing import Optional, List
from datetime import datetime


class BannerOut(Schema):
    """배너 출력 스키마"""
    id: str = Field(..., description="배너 ID")
    type: str = Field(..., description="배너 타입")
    title: Optional[str] = Field(None, description="배너 제목")
    description: Optional[str] = Field(None, description="배너 설명")
    alt: str = Field(..., description="이미지 alt 텍스트")
    image_url: str = Field(..., description="이미지 URL")
    order_index: int = Field(..., description="배너 순서")
    is_active: bool = Field(..., description="활성화 여부")
    link_url: Optional[str] = Field(None, description="클릭 시 이동할 URL")
    created_at: datetime = Field(..., description="생성일")
    updated_at: datetime = Field(..., description="수정일")


# Django Ninja pagination을 사용하므로 별도의 목록 스키마가 필요 없음
# @paginate 데코레이터가 자동으로 응답을 래핑함
