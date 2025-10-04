from django.db import models
from django.core.files.storage import default_storage
from django.conf import settings
import uuid
import os
from datetime import datetime
from common.models import BaseModel


def banner_upload_path(instance, filename):
    """배너 파일 업로드 경로 생성 (timestamp 기반 안전한 파일명)"""
    # 파일 확장자 추출
    ext = os.path.splitext(filename)[1].lower()
    if not ext:
        ext = '.jpg'  # 기본값
    
    # timestamp 기반 파일명 생성
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:-3]  # 밀리초까지
    safe_filename = f"banner_{timestamp}{ext}"
    
    return f"banners/{safe_filename}"


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
    image_file = models.ImageField(upload_to=banner_upload_path, blank=True, null=True, help_text="배너 이미지 파일")
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
        # 파일이 업로드된 경우 R2에 업로드하고 URL만 저장
        if self.image_file and hasattr(self.image_file, 'file'):
            try:
                import boto3
                
                # R2 설정 (하드코딩)
                R2_ACCOUNT_ID = "8d401410410a61e14cc2e67a1349462c"
                R2_ACCESS_KEY = "941e949a32330cf45f5f702c0a8b494d"
                R2_SECRET_KEY = "1e98588d8c9189f7974df479119ce80e2fba111619144c18e3ac9de0019a3d55"
                R2_BUCKET = "mpz-animal-images"
                R2_ENDPOINT = "https://8d401410410a61e14cc2e67a1349462c.r2.cloudflarestorage.com"
                R2_PUBLIC_BASE_URL = "https://pub-cb782373d9db4c77afff3d6f1e4d28af.r2.dev"
                
                # boto3 클라이언트 생성
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=R2_ACCESS_KEY,
                    aws_secret_access_key=R2_SECRET_KEY,
                    endpoint_url=R2_ENDPOINT,
                    region_name='auto'
                )
                
                # 파일 확장자 가져오기
                file_extension = os.path.splitext(self.image_file.name)[1]
                if not file_extension:
                    file_extension = '.jpg'  # 기본값
                
                # R2 키 생성 (banners/ 폴더에 저장)
                key = f"banners/{uuid.uuid4()}{file_extension}"
                
                # 파일을 R2에 업로드
                self.image_file.seek(0)  # 파일 포인터를 처음으로 이동
                s3_client.upload_fileobj(
                    self.image_file.file,
                    R2_BUCKET,
                    key,
                    ExtraArgs={'ContentType': 'image/jpeg'}
                )
                
                # R2 URL 저장
                self.image_url = f"{R2_PUBLIC_BASE_URL}/{key}"
                
                # 로컬 파일은 즉시 삭제
                if self.image_file.name:
                    try:
                        default_storage.delete(self.image_file.name)
                    except:
                        pass
                
                # image_file 필드는 None으로 설정 (R2에만 저장)
                self.image_file = None
                
            except Exception as e:
                # R2 업로드 실패 시 로컬 파일로 대체
                print(f"R2 업로드 실패: {e}")
                
                # 로컬 파일 URL 생성
                if hasattr(self.image_file, 'url'):
                    self.image_url = self.image_file.url
                else:
                    # 기본 플레이스홀더 이미지 사용
                    self.image_url = 'https://via.placeholder.com/800x400/cccccc/666666?text=Upload+Failed'
                
                # 로컬 파일은 그대로 유지
                print(f"로컬 파일로 대체: {self.image_url}")
        
        super().save(*args, **kwargs)
    
    def get_image_url(self):
        """이미지 URL 반환 (R2 URL만 사용)"""
        return self.image_url
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.title or self.alt}"
