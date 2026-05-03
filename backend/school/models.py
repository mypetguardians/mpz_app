from django.conf import settings
from django.db import models

from common.models import BaseModel


class UserSchoolProfile(BaseModel):
    """강아지학교 전용 사용자 프로필.

    마펫쯔 user 테이블과 1:1 분리하여 강아지학교에서만 의미 있는 필드(role, avatar_url 등)를
    저장한다. 회원 탈퇴 시 마펫쯔 user CASCADE로 자동 삭제되므로 별도 처리 불필요.
    Supabase RLS의 admin 정책은 이 테이블의 role='admin' 여부로 결정한다.
    """

    USER_ROLE_CHOICES = (
        ('user', '일반 사용자'),
        ('admin', '관리자'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='school_profile',
        help_text='연결된 마펫쯔 사용자',
    )
    role = models.CharField(
        max_length=20,
        choices=USER_ROLE_CHOICES,
        default='user',
        help_text='강아지학교 권한 (RLS admin 정책 제어용)',
    )
    avatar_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text='강아지학교 전용 프로필 이미지 URL (마펫쯔 image와 별개)',
    )

    class Meta:
        db_table = 'user_school_profile'
        verbose_name = '강아지학교 사용자 프로필'
        verbose_name_plural = '강아지학교 사용자 프로필'

    def __str__(self) -> str:
        return f'{self.user_id} ({self.role})'
