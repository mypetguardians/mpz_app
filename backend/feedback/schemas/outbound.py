from ninja import Schema, Field
from typing import Optional, List
from datetime import datetime
from .inbound import FeedbackType, FeedbackStatus, FeedbackPriority


class FeedbackOut(Schema):
    """피드백 출력 스키마"""
    id: str = Field(..., description="피드백 ID")
    user_id: Optional[str] = Field(None, description="사용자 ID")
    content: str = Field(..., description="피드백 내용")
    status: FeedbackStatus = Field(..., description="피드백 상태")
    priority: FeedbackPriority = Field(..., description="피드백 우선순위")
    admin_response: Optional[str] = Field(None, description="관리자 답변")
    admin_id: Optional[str] = Field(None, description="답변한 관리자 ID")
    responded_at: Optional[datetime] = Field(None, description="답변 시간")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: datetime = Field(..., description="수정 시간")


class FeedbackSubmitOut(Schema):
    """피드백 제출 응답 스키마"""
    message: str = Field(..., description="응답 메시지")
    status: str = Field(..., description="피드백 상태")








class ErrorOut(Schema):
    """에러 출력 스키마"""
    error: str = Field(..., description="에러 메시지")
