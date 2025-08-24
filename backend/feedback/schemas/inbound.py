from ninja import Schema, Field
from typing import Optional
from enum import Enum


class FeedbackType(str, Enum):
    """피드백 타입"""
    BUG_REPORT = "버그신고"
    FEATURE_REQUEST = "기능요청"
    INCONVENIENCE = "불편사항"
    INQUIRY = "문의사항"
    OTHER = "기타"


class FeedbackStatus(str, Enum):
    """피드백 상태"""
    RECEIVED = "접수"
    UNDER_REVIEW = "검토중"
    IN_PROGRESS = "처리중"
    ON_HOLD = "보류"
    COMPLETED = "완료"


class FeedbackPriority(str, Enum):
    """피드백 우선순위"""
    LOW = "낮음"
    NORMAL = "보통"
    HIGH = "높음"
    URGENT = "긴급"


class FeedbackSubmitIn(Schema):
    """피드백 제출 입력 스키마"""
    content: str = Field(..., description="피드백 내용")






