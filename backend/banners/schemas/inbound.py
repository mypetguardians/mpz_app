from ninja import Schema, Field
from typing import Optional


class BannerListQueryIn(Schema):
    """배너 목록 조회 쿼리 파라미터"""
    type: Optional[str] = Field(None, description="배너 타입 필터")


# 배너 생성/수정은 Django Admin에서 처리하므로 별도 스키마 불필요
