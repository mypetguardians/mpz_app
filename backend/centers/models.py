from django.db import models
from django.conf import settings
from common.models import BaseModel


class Center(BaseModel):
    """보호소/센터 모델"""
    
    USER_TYPE_CHOICES = [
        ('일반사용자', '일반사용자'),
        ('센터관리자', '센터관리자'),
        ('훈련사', '훈련사'),
        ('최고관리자', '최고관리자'),
    ]
    
    REGION_CHOICES = [
        # 두 글자 형식 (기존 호환성)
        ('서울', '서울'),
        ('부산', '부산'),
        ('대구', '대구'),
        ('인천', '인천'),
        ('광주', '광주'),
        ('대전', '대전'),
        ('울산', '울산'),
        ('세종', '세종'),
        ('경기', '경기'),
        ('강원', '강원'),
        ('충북', '충북'),
        ('충남', '충남'),
        ('전북', '전북'),
        ('전남', '전남'),
        ('경북', '경북'),
        ('경남', '경남'),
        ('제주', '제주'),
        # 전체 이름 형식 (공공데이터 호환)
        ('서울특별시', '서울특별시'),
        ('부산광역시', '부산광역시'),
        ('대구광역시', '대구광역시'),
        ('인천광역시', '인천광역시'),
        ('광주광역시', '광주광역시'),
        ('대전광역시', '대전광역시'),
        ('울산광역시', '울산광역시'),
        ('세종특별자치시', '세종특별자치시'),
        ('세종특별시', '세종특별시'),
        ('경기도', '경기도'),
        ('강원도', '강원도'),
        ('강원특별자치도', '강원특별자치도'),
        ('충청북도', '충청북도'),
        ('충청남도', '충청남도'),
        ('전라북도', '전라북도'),
        ('전북특별자치도', '전북특별자치도'),
        ('전라남도', '전라남도'),
        ('경상북도', '경상북도'),
        ('경상남도', '경상남도'),
        ('제주특별자치도', '제주특별자치도'),
    ]
    
    CENTER_TYPE_CHOICES = [
        ('private', '민간'),
        ('public', '공공'),
    ]

    # 센터 소유자/대표자 (1:1 관계 - 센터 최고관리자)
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, help_text="센터 소유자/대표자", related_name="owned_center", null=True, blank=True)
    name = models.CharField(max_length=100, help_text="센터명")
    center_number = models.CharField(max_length=20, blank=True, null=True, help_text="보호소 번호")
    description = models.TextField(blank=True, null=True, help_text="센터 설명")
    location = models.CharField(max_length=200, blank=True, null=True, help_text="위치")
    region = models.CharField(max_length=20, choices=REGION_CHOICES, blank=True, null=True, help_text="지역")
    phone_number = models.CharField(max_length=20, blank=True, null=True, help_text="전화번호")
    adoption_procedure = models.TextField(blank=True, null=True, help_text="입양 절차")
    adoption_guidelines = models.TextField(blank=True, null=True, help_text="입양 유의사항")
    has_monitoring = models.BooleanField(default=False, help_text="모니터링 실시 여부")
    monitoring_period_months = models.IntegerField(default=3, help_text="모니터링 전체 기간 (개월)")
    monitoring_interval_days = models.IntegerField(default=14, help_text="모니터링 체크 간격 (일)")
    monitoring_description = models.TextField(blank=True, null=True, help_text="모니터링 방법/설명")
    verified = models.BooleanField(default=False, help_text="인증 여부")
    is_public = models.BooleanField(default=False, help_text="공개 여부")
    adoption_price = models.IntegerField(default=0, help_text="입양 가격")
    image_url = models.CharField(max_length=500, blank=True, null=True, help_text="센터 이미지 URL")
    is_subscribed = models.BooleanField(default=False, help_text="구독 여부")
    
    # 센터 서비스 관련 필드
    has_volunteer = models.BooleanField(default=False, help_text="봉사활동 여부")
    has_foster_care = models.BooleanField(default=False, help_text="임시보호 여부")
    show_phone_number = models.BooleanField(default=True, help_text="전화번호 노출 여부")
    show_location = models.BooleanField(default=True, help_text="위치 노출 여부")
    call_available_time = models.CharField(max_length=200, blank=True, null=True, help_text="통화 가능 시간")
    
    # 센터 유형 (민간/공공)
    center_type = models.CharField(max_length=10, choices=CENTER_TYPE_CHOICES, default='public', help_text="센터 유형 (민간/공공)")

    # 공공데이터 관련 필드 (최소한만 유지)
    public_reg_no = models.CharField(max_length=50, blank=True, null=True, help_text="공공데이터 보호소번호", unique=True)
    
    def save(self, *args, **kwargs):
        # public_reg_no 유무로 center_type 자동 판별
        if self.public_reg_no:
            self.center_type = 'public'
        else:
            self.center_type = 'private'
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'centers'
        verbose_name = '센터'
        verbose_name_plural = '센터들'
        indexes = [
            models.Index(fields=['public_reg_no']),  # 공공데이터 보호소번호 인덱스
        ]
    
    def __str__(self):
        owner_name = self.owner.username if self.owner else "Unknown Owner"
        return f"{owner_name} - {self.name}"


class AdoptionContractTemplate(BaseModel):
    """센터별 입양 계약서 템플릿"""
    
    center = models.ForeignKey(Center, on_delete=models.CASCADE, help_text="관련 센터")
    title = models.CharField(max_length=200, help_text="계약서 제목")
    description = models.TextField(blank=True, null=True, help_text="계약서 설명/목적")
    content = models.TextField(help_text="계약서 본문 내용")
    is_active = models.BooleanField(default=True, help_text="활성화 여부")
    
    class Meta:
        db_table = 'adoption_contract_templates'
        verbose_name = '입양 계약서 템플릿'
        verbose_name_plural = '입양 계약서 템플릿들'
    
    def __str__(self):
        return f"{self.center.name} - {self.title}"


class AdoptionConsent(BaseModel):
    """센터별 입양 동의서"""
    
    center = models.ForeignKey(Center, on_delete=models.CASCADE, help_text="관련 센터")
    title = models.CharField(max_length=200, help_text="동의서 제목")
    description = models.TextField(blank=True, null=True, help_text="동의서 설명/목적")
    content = models.TextField(help_text="동의서 본문 내용")
    is_active = models.BooleanField(default=True, help_text="활성화 여부")
    
    class Meta:
        db_table = 'adoption_consents'
        verbose_name = '입양 동의서'
        verbose_name_plural = '입양 동의서들'
    
    def __str__(self):
        return f"{self.center.name} - {self.title}"


class QuestionForm(BaseModel):
    """센터별 질문 폼"""
    
    QUESTION_TYPE_CHOICES = [
        ('text', '텍스트'),
        ('multiple_choice', '다중 선택'),
        ('single_choice', '단일 선택'),
        ('checkbox', '체크박스'),
    ]
    
    center = models.ForeignKey(Center, on_delete=models.CASCADE, help_text="관련 센터")
    question = models.TextField(help_text="질문 내용")
    type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, null=True, blank=True, help_text="질문 타입")
    options = models.JSONField(blank=True, null=True, help_text="선택지 옵션들")
    is_required = models.BooleanField(default=False, help_text="필수 여부")
    sequence = models.IntegerField(default=1, help_text="질문 순서")
    
    class Meta:
        db_table = 'question_forms'
        verbose_name = '질문 폼'
        verbose_name_plural = '질문 폼들'
        ordering = ['center', 'sequence']
    
    def __str__(self):
        return f"{self.center.name} - {self.question[:50]}"


class PresetQuestion(BaseModel):
    """기본 질문 프리셋"""
    
    CATEGORY_CHOICES = [
        ('lifeEnvironment', '생활 환경'),
        ('experience', '반려 경험'),
        ('responsibility', '책임과 계획'),
    ]
    
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, help_text="질문 카테고리")
    question = models.TextField(help_text="질문 내용")
    sequence = models.IntegerField(default=1, help_text="질문 순서")
    is_active = models.BooleanField(default=True, help_text="활성화 여부")
    
    class Meta:
        db_table = 'preset_questions'
        verbose_name = '기본 질문'
        verbose_name_plural = '기본 질문들'
        ordering = ['category', 'sequence']
    
    def __str__(self):
        return f"{self.get_category_display()} - {self.question[:50]}"


class PresetContractTemplate(BaseModel):
    """센터 구분 없이 공용으로 쓰는 기본 계약서 템플릿"""
    title = models.CharField(max_length=200, help_text="계약서 제목")
    description = models.TextField(blank=True, null=True, help_text="계약서 설명/목적")
    content = models.TextField(help_text="계약서 본문 내용")
    is_active = models.BooleanField(default=True, help_text="활성화 여부")
    
    class Meta:
        db_table = 'preset_contract_templates'
        verbose_name = '기본 계약서 템플릿'
        verbose_name_plural = '기본 계약서 템플릿들'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class PresetConsent(BaseModel):
    """센터 구분 없이 공용으로 쓰는 기본 동의서"""
    title = models.CharField(max_length=200, help_text="동의서 제목")
    description = models.TextField(blank=True, null=True, help_text="동의서 설명/목적")
    content = models.TextField(help_text="동의서 본문 내용")
    is_active = models.BooleanField(default=True, help_text="활성화 여부")
    
    class Meta:
        db_table = 'preset_consents'
        verbose_name = '기본 동의서'
        verbose_name_plural = '기본 동의서들'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
