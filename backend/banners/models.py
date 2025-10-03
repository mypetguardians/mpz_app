from django.db import models
from django.core.files.storage import default_storage
from django.conf import settings
import uuid
import os
from common.models import BaseModel


class Banner(BaseModel):
    """배너 모델"""
    
    TYPE_CHOICES = [
        ('main', '메인'),
        ('sub', '서브'),
    ]
    
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='main', help_text="배너 타입")
    title = models.CharField(max_length=200, blank=True, null=True, help_text="배너 제목")
    description = models.TextField(blank=True, null=True, help_text="배너 설명")
    alt = models.CharField(max_length=200, help_text="이미지 대체 텍스트")
    image_file = models.ImageField(upload_to='banners/', blank=True, null=True, help_text="배너 이미지 파일")
    image_url = models.CharField(max_length=500, blank=True, null=True, help_text="R2 이미지 URL (파일 업로드 시 자동 생성)")
    order_index = models.IntegerField(default=0, help_text="캐러셀 순서")
    is_active = models.BooleanField(default=True, help_text="활성화 상태")
    link_url = models.CharField(max_length=500, blank=True, null=True, help_text="클릭 시 이동할 URL")
    
    class Meta:
        db_table = 'banners'
        verbose_name = '배너'
        verbose_name_plural = '배너들'
        ordering = ['type', 'order_index']
    
    def save(self, *args, **kwargs):
        # 파일이 업로드된 경우 R2에 업로드하고 URL 생성
        if self.image_file and hasattr(self.image_file, 'file'):
            try:
                from cloudflare.services import R2Client
                
                # R2 클라이언트 초기화
                r2 = R2Client()
                
                # 파일 확장자 가져오기
                file_extension = os.path.splitext(self.image_file.name)[1]
                if not file_extension:
                    file_extension = '.jpg'  # 기본값
                
                # R2 키 생성 (banners/ 폴더에 저장)
                key = f"banners/{uuid.uuid4()}{file_extension}"
                
                # 파일을 R2에 업로드
                file_data = self.image_file.read()
                content_type = self.image_file.content_type or 'image/jpeg'
                
                r2.upload_file(key=key, data=file_data, content_type=content_type)
                
                # R2 URL 생성
                self.image_url = f"{r2.public_base_url}/{key}"
                
                # 로컬 파일은 삭제 (R2에 업로드했으므로)
                if self.image_file.name:
                    try:
                        default_storage.delete(self.image_file.name)
                    except:
                        pass
                
                # image_file 필드는 None으로 설정 (R2에만 저장)
                self.image_file = None
                
            except Exception as e:
                # R2 업로드 실패 시 로그만 남기고 계속 진행
                print(f"R2 업로드 실패: {e}")
        
        super().save(*args, **kwargs)
    
    def get_image_url(self):
        """이미지 URL 반환 (R2 URL 우선)"""
        if self.image_url:
            return self.image_url
        elif self.image_file:
            return self.image_file.url
        return None
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.title or self.alt}"
