from ninja import Schema, Field
from typing import Optional


class PushTokenIn(Schema):
    """푸시 토큰 등록 입력 스키마"""
    token: str = Field(..., min_length=1, description="푸시 토큰")
    platform: str = Field(..., pattern="^(android|ios|web)$", description="플랫폼 (android, ios, web)")


class PushTokenDeleteIn(Schema):
    """푸시 토큰 삭제 입력 스키마"""
    platform: str = Field(..., pattern="^(android|ios|web)$", description="플랫폼 (android, ios, web)")


class NotificationListQueryIn(Schema):
    """알림 목록 조회 쿼리 스키마"""
    # @paginate 데코레이터가 page, limit을 자동으로 처리하므로 제거
    pass


class NotificationCreateIn(Schema):
    """알림 생성 입력 스키마 (관리자용)"""
    user_id: str = Field(..., description="알림을 받을 사용자 ID")
    notification_type: str = Field(..., pattern="^(community|adoption|monitoring|other)$", description="알림 유형")
    message: str = Field(..., min_length=1, description="알림 내용")
    priority: Optional[str] = Field("normal", pattern="^(low|normal|high|urgent)$", description="우선순위")
    action_url: Optional[str] = Field(None, max_length=500, description="액션 URL")
    send_push: Optional[bool] = Field(True, description="푸시 알림 전송 여부")
