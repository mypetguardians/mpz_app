from django.db import models
from django.conf import settings
from common.models import BaseModel


class Feedback(BaseModel):
    """피드백 모델"""
    
    TYPE_CHOICES = [
        ('버그신고', '버그신고'),
        ('기능요청', '기능요청'),
        ('불편사항', '불편사항'),
        ('문의사항', '문의사항'),
        ('기타', '기타'),
    ]
    
    STATUS_CHOICES = [
        ('접수', '접수'),
        ('검토중', '검토중'),
        ('처리중', '처리중'),
        ('보류', '보류'),
        ('완료', '완료'),
    ]
    
    PRIORITY_CHOICES = [
        ('낮음', '낮음'),
        ('보통', '보통'),
        ('높음', '높음'),
        ('긴급', '긴급'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        help_text="사용자 (로그인한 경우)"
    )
    content = models.TextField(help_text="피드백 내용")
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='접수', 
        help_text="피드백 상태"
    )
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='보통', 
        help_text="피드백 우선순위"
    )
    admin_response = models.TextField(
        blank=True, 
        null=True, 
        help_text="관리자 답변"
    )
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='responded_feedbacks',
        help_text="답변한 관리자"
    )
    responded_at = models.DateTimeField(
        blank=True, 
        null=True, 
        help_text="답변 시간"
    )
    
    class Meta:
        db_table = 'feedbacks'
        verbose_name = '피드백'
        verbose_name_plural = '피드백들'
        ordering = ['-created_at']
    
    def __str__(self):
        user_info = self.user.username if self.user else "Anonymous"
        return f"{user_info} - {self.content[:30]}... ({self.status})"


class FeedbackStat(BaseModel):
    """피드백 통계 모델"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, help_text="사용자")
    total_feedback = models.IntegerField(default=0, help_text="총 피드백 수")
    resolved_feedback = models.IntegerField(default=0, help_text="해결된 피드백 수")
    pending_feedback = models.IntegerField(default=0, help_text="대기중인 피드백 수")
    average_response_time = models.FloatField(default=0.0, help_text="평균 응답 시간 (시간)")
    
    class Meta:
        db_table = 'feedback_stats'
        verbose_name = '피드백 통계'
        verbose_name_plural = '피드백 통계들'
        unique_together = ['user']
    
    def __str__(self):
        return f"{self.user.username} - 피드백 통계"
