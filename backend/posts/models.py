from django.db import models
from django.conf import settings
from common.models import BaseModel


class Post(BaseModel):
    """포스트 모델"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, help_text="작성자")
    title = models.CharField(max_length=200, help_text="제목")
    content = models.TextField(help_text="내용")
    animal = models.ForeignKey('animals.Animal', on_delete=models.SET_NULL, null=True, blank=True, help_text="관련 동물")
    adoption = models.ForeignKey('adoptions.Adoption', on_delete=models.SET_NULL, null=True, blank=True, help_text="관련 입양")
    content_tags = models.JSONField(null=True, blank=True, help_text="콘텐츠 태그")
    
    class Meta:
        db_table = 'posts'
        verbose_name = '포스트'
        verbose_name_plural = '포스트들'
        ordering = ['-created_at']
    
    class Meta:
        db_table = 'posts'
        verbose_name = '포스트'
        verbose_name_plural = '포스트들'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class PostImage(BaseModel):
    """포스트 이미지 모델"""
    
    post = models.ForeignKey(Post, on_delete=models.CASCADE, help_text="관련 포스트")
    image_url = models.CharField(max_length=500, help_text="이미지 URL")
    order_index = models.IntegerField(default=0, help_text="이미지 순서")
    
    class Meta:
        db_table = 'post_images'
        verbose_name = '포스트 이미지'
        verbose_name_plural = '포스트 이미지들'
        ordering = ['post', 'order_index']
    
    def __str__(self):
        return f"{self.post.title} - 이미지 {self.order_index}"


class PostTag(BaseModel):
    """포스트 태그 모델"""
    
    post = models.ForeignKey(Post, on_delete=models.CASCADE, help_text="관련 포스트")
    tag_name = models.CharField(max_length=50, help_text="태그명")
    
    class Meta:
        db_table = 'post_tags'
        verbose_name = '포스트 태그'
        verbose_name_plural = '포스트 태그들'
        unique_together = ['post', 'tag_name']
    
    def __str__(self):
        return f"{self.post.title} - #{self.tag_name}"
