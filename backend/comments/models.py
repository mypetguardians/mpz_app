from django.db import models
from django.conf import settings
from common.models import BaseModel


class Comment(BaseModel):
    """댓글 모델"""
    
    post = models.ForeignKey('posts.Post', null=True, blank=True, on_delete=models.CASCADE, help_text="관련 포스트")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, help_text="댓글 작성자")
    content = models.TextField(help_text="댓글 내용")
    
    class Meta:
        db_table = 'comments'
        verbose_name = '댓글'
        verbose_name_plural = '댓글들'
    
    def __str__(self):
        return f"{self.user.username} - {self.content[:50]}"


class Reply(BaseModel):
    """답글 모델"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, help_text="답글 작성자")
    comment = models.ForeignKey(Comment, null=True, blank=True, on_delete=models.CASCADE, help_text="상위 댓글")
    content = models.TextField(help_text="답글 내용")
    
    class Meta:
        db_table = 'replies'
        verbose_name = '답글'
        verbose_name_plural = '답글들'
    
    def __str__(self):
        return f"{self.user.username} -> {self.comment.user.username}: {self.content[:30]}"
