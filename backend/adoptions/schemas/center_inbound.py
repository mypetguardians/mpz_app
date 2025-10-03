from ninja import Schema, Field
from typing import Optional

class UpdateAdoptionStatusIn(Schema):
    """입양 신청 상태 변경 요청 스키마"""
    status: str = Field(..., description="변경할 상태 (미팅, 계약서작성, 입양완료, 모니터링, 취소)")
    center_notes: Optional[str] = Field(None, description="센터 메모")
    user_memo: Optional[str] = Field(None, description="입양 신청자에 대한 메모")
    meeting_scheduled_at: Optional[str] = Field(None, description="미팅 예정 시간 (ISO 8601)")

class SendContractIn(Schema):
    """계약서 전송 요청 스키마"""
    template_id: str = Field(..., description="계약서 템플릿 ID")
    custom_content: Optional[str] = Field(None, description="커스텀 계약서 내용")
    center_notes: Optional[str] = Field(None, description="센터 메모")

class CenterAdoptionFilterIn(Schema):
    """센터 입양 신청 필터 스키마"""
    status: Optional[str] = Field(None, description="입양 상태 필터")
    animal_id: Optional[str] = Field(None, description="동물 ID 필터")
    is_temporary_protection: Optional[bool] = Field(None, description="임시보호 여부 필터")
