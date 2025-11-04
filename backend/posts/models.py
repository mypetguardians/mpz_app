from django.db import models
from django.conf import settings
from common.models import BaseModel


class Post(BaseModel):
    """포스트 모델"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, help_text="작성자")
    title = models.CharField(max_length=200, help_text="제목")
    content = models.TextField(help_text="내용")
    animal = models.ForeignKey('animals.Animal', on_delete=models.SET_NULL, null=True, blank=True, help_text="관련 동물")
    content_tags = models.JSONField(null=True, blank=True, help_text="콘텐츠 태그")
    like_count = models.IntegerField(default=0, help_text="좋아요 수")
    is_all_access = models.BooleanField(default=True, help_text="전체 공개 여부 (False인 경우 센터 권한자만 접근 가능)")
    
    class Meta:
        db_table = 'posts'
        verbose_name = '포스트'
        verbose_name_plural = '포스트들'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def has_matching_system_tags(self):
        """이 포스트가 시스템 태그와 매칭되는지 확인합니다."""
        from django.db.models import Q
        post_tags = PostTag.objects.filter(post=self).values_list('tag_name', flat=True)
        if not post_tags:
            return False
        
        # 대소문자 구분 없이 매칭
        matching_system_tags = SystemTag.objects.filter(
            is_active=True,
            name__iexact__in=post_tags
        )
        return matching_system_tags.exists()
    
    def get_matching_system_tags(self):
        """이 포스트와 매칭되는 시스템 태그들을 반환합니다."""
        from django.db.models import Q
        post_tags = PostTag.objects.filter(post=self).values_list('tag_name', flat=True)
        if not post_tags:
            return []
        
        # 대소문자 구분 없이 매칭
        matching_system_tags = SystemTag.objects.filter(
            is_active=True,
            name__iexact__in=post_tags
        )
        return list(matching_system_tags)


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
    """포스트 태그 모델 (사용자가 작성한 태그)"""
    
    post = models.ForeignKey(Post, on_delete=models.CASCADE, help_text="관련 포스트")
    tag_name = models.CharField(max_length=50, help_text="태그명", db_index=True)  # 검색 성능 향상
    
    class Meta:
        db_table = 'post_tags'
        verbose_name = '포스트 태그'
        verbose_name_plural = '포스트 태그들'
        unique_together = ['post', 'tag_name']
        indexes = [
            models.Index(fields=['tag_name']),  # 태그명 검색 최적화
            models.Index(fields=['post', 'tag_name']),  # 복합 인덱스
        ]
    
    def __str__(self):
        return f"{self.post.title} - #{self.tag_name}"


class SystemTag(BaseModel):
    """시스템 태그 모델 (최고관리자가 등록하는 공식 태그)"""
    
    name = models.CharField(max_length=50, unique=True, help_text="태그명", db_index=True)
    description = models.TextField(blank=True, null=True, help_text="태그 설명")
    is_active = models.BooleanField(default=True, help_text="활성화 여부", db_index=True)
    usage_count = models.IntegerField(default=0, help_text="사용된 횟수")
    sequence = models.IntegerField(default=0, help_text="표시 순서")
    
    class Meta:
        db_table = 'system_tags'
        verbose_name = '시스템 태그'
        verbose_name_plural = '시스템 태그들'
        ordering = ['sequence', 'name']
        indexes = [
            models.Index(fields=['name']),  # 태그명 검색 최적화
            models.Index(fields=['is_active', 'name']),  # 활성 태그 검색 최적화
            models.Index(fields=['usage_count']),  # 사용 횟수 정렬 최적화
        ]
    
    def __str__(self):
        return self.name
    
    def update_usage_count(self):
        """사용 횟수를 업데이트합니다."""
        from django.db.models import Count
        count = PostTag.objects.filter(tag_name__iexact=self.name).count()
        self.usage_count = count
        self.save(update_fields=['usage_count'])


class PostLike(BaseModel):
    """포스트 좋아요 모델"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, help_text="좋아요한 사용자")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, help_text="좋아요한 포스트")
    
    class Meta:
        db_table = 'post_likes'
        verbose_name = '포스트 좋아요'
        verbose_name_plural = '포스트 좋아요들'
        unique_together = ['user', 'post']  # 한 사용자는 한 포스트에 한 번만 좋아요 가능
    
    def __str__(self):
        return f"{self.user.username} -> {self.post.title}"
