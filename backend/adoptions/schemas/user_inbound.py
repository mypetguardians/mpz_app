from ninja import Schema, Field
from typing import Optional

class UserAdoptionFilterIn(Schema):
    """사용자 입양 신청 필터 스키마"""
    status: Optional[str] = Field(None, description="입양 상태 필터")
    is_temporary_protection: Optional[bool] = Field(None, description="임시보호 여부 필터")
