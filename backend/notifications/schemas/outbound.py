from ninja import Schema, Field
from typing import List, Optional


class NotificationOut(Schema):
    """알림 출력 스키마"""
    id: str = Field(..., description="알림 ID")
    user_id: str = Field(..., description="사용자 ID")
    message: str = Field(..., description="알림 내용")
    notification_type: str = Field(..., description="알림 유형")
    priority: str = Field(..., description="우선순위")
    is_read: bool = Field(..., description="읽음 여부")
    read_at: Optional[str] = Field(None, description="읽은 시간 (ISO 형식)")
    action_url: Optional[str] = Field(None, description="액션 URL (클릭 시 이동할 페이지)")
    metadata: Optional[dict] = Field(None, description="추가 메타데이터")
    created_at: str = Field(..., description="생성 시간 (ISO 형식)")
    updated_at: str = Field(..., description="수정 시간 (ISO 형식)")


class NotificationListOut(Schema):
    """알림 목록 출력 스키마 (페이지네이션 포함)"""
    notifications: List[NotificationOut] = Field(..., description="알림 목록")
    pagination: dict = Field(..., description="페이지네이션 정보")


class NotificationReadOut(Schema):
    """알림 읽음 처리 출력 스키마"""
    message: str = Field(..., description="처리 완료 메시지")


class PushTokenOut(Schema):
    """푸시 토큰 출력 스키마"""
    message: str = Field(..., description="처리 완료 메시지")


class UnreadCountOut(Schema):
    """읽지 않은 알림 개수 출력 스키마"""
    unread_count: int = Field(..., description="읽지 않은 알림 개수")


class ErrorOut(Schema):
    """에러 응답 스키마"""
    error: str = Field(..., description="에러 메시지")
