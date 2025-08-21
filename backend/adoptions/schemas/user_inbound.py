from ninja import Schema, Field
from typing import Optional

class UserAdoptionFilterIn(Schema):
    """사용자 입양 신청 필터 스키마"""
    status: Optional[str] = Field(None, description="입양 상태 필터")
