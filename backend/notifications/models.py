from django.db import models
from django.conf import settings
from common.models import BaseModel


class Notification(BaseModel):
    """알림 모델"""
    
    NOTIFICATION_TYPE_CHOICES = [
        # 기존 알림 타입들
        ('adoption_update', '입양 상태 업데이트'),
        ('monitoring_reminder', '모니터링 알림'),
        ('center_update', '센터 정보 업데이트'),
        ('animal_update', '동물 정보 업데이트'),
        ('system', '시스템 알림'),
        
        # 센터 측 알림 타입들
        ('new_adoption_application', '새로운 입양 신청'),
        ('new_temporary_protection', '새로운 임시보호 등록'),
        ('monitoring_delayed', '모니터링 지연'),
        ('adoption_completed', '입양 완료'),
        
        # 유저 측 알림 타입들
        ('monitoring_delayed_user', '모니터링 지연 (사용자)'),
        ('new_comment', '새로운 댓글'),
        ('new_reply', '새로운 대댓글'),
        
        ('other', '기타'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', '낮음'),
        ('normal', '보통'),
        ('high', '높음'),
        ('urgent', '긴급'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, help_text="수신자")
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPE_CHOICES, help_text="알림 타입")
    message = models.TextField(help_text="알림 내용")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal', help_text="우선순위")
    is_read = models.BooleanField(default=False, help_text="읽음 여부")
    read_at = models.DateTimeField(blank=True, null=True, help_text="읽은 시간")
    action_url = models.CharField(max_length=500, blank=True, null=True, help_text="액션 URL")
    metadata = models.JSONField(blank=True, null=True, help_text="추가 메타데이터")
    
    class Meta:
        db_table = 'notifications'
        verbose_name = '알림'
        verbose_name_plural = '알림들'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.message[:50]}..."


class PushToken(BaseModel):
    """푸시 알림 토큰 모델"""
    
    PLATFORM_CHOICES = [
        ('ios', 'iOS'),
        ('android', 'Android'),
        ('web', 'Web'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, help_text="사용자")
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES, null=True, blank=True, help_text="플랫폼")
    token = models.CharField(max_length=500, help_text="푸시 토큰")
    device_id = models.CharField(max_length=200, blank=True, null=True, help_text="디바이스 ID")
    is_active = models.BooleanField(default=True, help_text="활성화 여부")
    last_used = models.DateTimeField(blank=True, null=True, help_text="마지막 사용 시간")
    
    class Meta:
        db_table = 'push_tokens'
        verbose_name = '푸시 토큰'
        verbose_name_plural = '푸시 토큰들'
        unique_together = ['user', 'platform', 'token']
    
    def __str__(self):
        return f"{self.user.username} - {self.platform} ({self.token[:20]}...)"