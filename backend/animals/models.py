from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
from centers.models import Center
from common.models import BaseModel


class Animal(BaseModel):
    """동물 모델"""
    
    PROTECTION_STATUS_CHOICES = [
        ('보호중', '보호중'),
        ('임시보호', '임시보호'),
        ('안락사', '안락사'),
        ('자연사', '자연사'),
        ('반환', '반환'),
        ('기증', '기증'),
        ('방사', '방사'),
        ('입양완료', '입양완료'),
    ]
    
    ADOPTION_STATUS_CHOICES = [
        ('입양가능', '입양가능'),
        ('입양진행중', '입양진행중'),
        ('입양완료', '입양완료'),
        ('입양불가', '입양불가'),
    ]
    
    SEX_CHOICES = [
        ('수컷', '수컷'),
        ('암컷', '암컷'),
        ('미확인', '미확인'),
    ]
    
    center = models.ForeignKey(Center, on_delete=models.CASCADE, help_text="보호소/센터")
    name = models.CharField(max_length=100, help_text="동물 이름")
    announce_number = models.CharField(max_length=50, blank=True, null=True, help_text="공고번호")
    breed = models.CharField(max_length=100, blank=True, null=True, help_text="품종")
    age = models.PositiveIntegerField(
        blank=True, 
        null=True, 
        help_text="나이 (개월 단위)",
        validators=[MinValueValidator(0), MaxValueValidator(300)]  # 0개월 ~ 25년
    )
    is_female = models.BooleanField(default=False, help_text="암컷 여부")
    weight = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        blank=True, 
        null=True, 
        help_text="체중 (kg, 최대 999.99kg)",
        validators=[MinValueValidator(Decimal('0.01')), MaxValueValidator(Decimal('999.99'))]
    )
    neutering = models.BooleanField(default=False, help_text="중성화 여부")
    vaccination = models.BooleanField(default=False, help_text="예방접종 여부")
    heartworm = models.BooleanField(default=False, help_text="심장사상충 예방 여부")
    protection_status = models.CharField(max_length=20, choices=PROTECTION_STATUS_CHOICES, default='보호중', help_text="보호 상태")
    adoption_status = models.CharField(max_length=20, choices=ADOPTION_STATUS_CHOICES, default='입양가능', help_text="입양 상태")
    description = models.TextField(blank=True, null=True, help_text="동물 설명")
    personality = models.TextField(blank=True, null=True, help_text="성격")
    health_notes = models.TextField(blank=True, null=True, help_text="건강 상태 메모")
    special_needs = models.TextField(blank=True, null=True, help_text="특별한 요구사항")
    found_location = models.CharField(max_length=200, blank=True, null=True, help_text="발견 장소")
    admission_date = models.DateField(blank=True, null=True, help_text="센터 입소일")
    adoption_fee = models.IntegerField(default=0, help_text="입양비")
    megaphone_count = models.PositiveIntegerField(default=0, help_text="확성기(좋아요) 수")
    is_public = models.BooleanField(default=True, help_text="공개 여부")
    activity_level = models.PositiveIntegerField(default=3, help_text="활동량 수준 (1-5)")
    sensitivity = models.PositiveIntegerField(default=3, help_text="예민함 정도 (1-5)")
    sociability = models.PositiveIntegerField(default=3, help_text="사회성 (1-5)")
    separation_anxiety = models.PositiveIntegerField(default=3, help_text="분리불안 정도 (1-5)")
    
    # 사회성 세부 항목들 (이미지 기준)
    confidence = models.PositiveIntegerField(default=3, help_text="새로운 자극/상황 적극성 (1-5)")
    independence = models.PositiveIntegerField(default=3, help_text="독립성 있는 행동 (1-5)")
    physical_contact = models.PositiveIntegerField(default=3, help_text="사람 터치 긍정적 수용 (1-5)")
    handling_acceptance = models.PositiveIntegerField(default=3, help_text="몸 만지기 저항감 (1-5)")
    strangers_attitude = models.PositiveIntegerField(default=3, help_text="낯선 사람 반응 (1-5)")
    objects_attitude = models.PositiveIntegerField(default=3, help_text="낯선 사물 반응 (1-5)")
    environment_attitude = models.PositiveIntegerField(default=3, help_text="낯선 환경 반응 (1-5)")
    dogs_attitude = models.PositiveIntegerField(default=3, help_text="낯선 강아지 반응 (1-5)")
    
    # 분리불안 세부 항목들 (이미지 기준)
    coping_ability = models.PositiveIntegerField(default=3, help_text="낯선 공간 혼자 남겨졌을 때 반응 (1-5)")
    playfulness_level = models.PositiveIntegerField(default=3, help_text="장난감/바디시그널 놀이 유도 반응 (1-5)")
    walkability_level = models.PositiveIntegerField(default=3, help_text="산책 과정에서 모습 (1-5)")
    grooming_acceptance_level = models.PositiveIntegerField(default=3, help_text="그루밍 진행 시 모습 (1-5)")
    
    trainer_name = models.CharField(max_length=100, blank=True, null=True, help_text="훈련사 이름")
    trainer_comment = models.TextField(blank=True, null=True, help_text="훈련사 코멘트")
    
    # 공공데이터 관련 필드 (최소한만 유지)
    is_public_data = models.BooleanField(default=False, help_text="공공데이터 여부")
    public_notice_number = models.CharField(max_length=50, blank=True, null=True, unique=True, help_text="공공데이터 공고번호 (unique)")
    comment = models.TextField(blank=True, null=True, help_text="공공데이터 특이사항 코멘트")
    # 공공데이터 공고 기간
    notice_start_date = models.DateField(
        blank=True,
        null=True,
        db_index=True,
        help_text=(
            "공고 시작일 — 사용자에게 동물이 노출되기 시작한 날짜. "
            "공공 동물: 공공 API의 noticeSdt(공고 시작일). "
            "민간 동물: 센터가 우리 시스템에 등록한 일자(created_at::date) — pre_save에서 자동 채움. "
            "한 번 set되면 이후 sync에서도 갱신 안 됨 (입양탭 정렬 위치 보존)."
        ),
    )
    notice_end_date = models.DateField(blank=True, null=True, help_text="공고 종료일")
    
    class Meta:
        db_table = 'animals'
        verbose_name = '동물'
        verbose_name_plural = '동물들'
        indexes = [
            models.Index(fields=['public_notice_number']),  # 공고번호 인덱스
            models.Index(fields=['is_public_data']),       # 공공데이터 여부 인덱스
        ]

    def save(self, *args, **kwargs):
        # 민간 동물 등록 시 notice_start_date 자동 채움 (= 등록 시점 = 곧 사용자에게 공고된 시점)
        # 공공 동물은 services.py _create_animal에서 notice_sdt로 직접 set하므로 여기 분기 영향 없음.
        if not self.is_public_data and not self.notice_start_date:
            self.notice_start_date = timezone.now().date()
        super().save(*args, **kwargs)

    def __str__(self):
        center_name = self.center.name if self.center else "Unknown Center"
        animal_name = self.name if self.name else "Unknown Animal"
        protection_status = self.get_protection_status_display() if self.protection_status else "Unknown Protection"
        adoption_status = self.get_adoption_status_display() if self.adoption_status else "Unknown Adoption"
        return f"{center_name} - {animal_name} (보호:{protection_status}, 입양:{adoption_status})"
    
    @property
    def display_notice_number(self):
        """공고번호 표시 (announce_number가 없으면 public_notice_number 사용)"""
        if self.announce_number:
            return self.announce_number
        elif self.public_notice_number:
            return self.public_notice_number
        else:
            return "공고번호 없음"
    
    @property
    def is_public_data_animal(self):
        """공공데이터 동물 여부 확인"""
        return self.is_public_data and self.public_notice_number



class AnimalImage(BaseModel):
    """동물 이미지 모델"""
    
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, help_text="관련 동물")
    image_url = models.CharField(max_length=500, help_text="이미지 URL")
    is_primary = models.BooleanField(default=False, help_text="대표 이미지 여부")
    sequence = models.IntegerField(default=0, help_text="이미지 순서")
    
    class Meta:
        db_table = 'animal_images'
        verbose_name = '동물 이미지'
        verbose_name_plural = '동물 이미지들'
        ordering = ['animal', 'sequence']
    
    def __str__(self):
        animal_name = self.animal.name if self.animal else "Unknown Animal"
        return f"{animal_name} - 이미지 {self.sequence}"


class SyncLog(models.Model):
    """공공데이터 동기화 실행 로그"""

    STRATEGY_CHOICES = [
        ('incremental', '증분 동기화'),
        ('full', '전체 동기화'),
        ('status_check', '상태 체크'),
        ('status_sync', '상태 동기화'),
    ]
    STATUS_CHOICES = [
        ('success', '성공'),
        ('failed', '실패'),
        ('partial', '부분 성공'),
    ]

    strategy = models.CharField(max_length=20, choices=STRATEGY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')
    created_count = models.IntegerField(default=0)
    updated_count = models.IntegerField(default=0)
    deleted_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    total_count = models.IntegerField(default=0)
    duration_seconds = models.FloatField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sync_logs'
        verbose_name = '동기화 로그'
        verbose_name_plural = '동기화 로그들'
        ordering = ['-started_at']

    def __str__(self):
        return f"[{self.status}] {self.strategy} - {self.started_at:%Y-%m-%d %H:%M} ({self.duration_seconds:.1f}s)"


class AnimalMegaphone(BaseModel):
    """동물 확성기(좋아요) 모델"""
    
    user = models.ForeignKey('user.User', on_delete=models.CASCADE, help_text="사용자")
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, help_text="동물")
    
    class Meta:
        db_table = 'animal_megaphones'
        verbose_name = '동물 확성기'
        verbose_name_plural = '동물 확성기들'
        unique_together = ['user', 'animal']  # 사용자당 동물마다 한 번만 가능
    
    def __str__(self):
        user_name = self.user.username if self.user else "Unknown User"
        animal_name = self.animal.name if self.animal else "Unknown Animal"
        return f"{user_name} -> {animal_name}"


class AdoptionApplication(BaseModel):
    """입양 신청 모델"""
    
    STATUS_CHOICES = [
        ('pending', '대기중'),
        ('approved', '승인'),
        ('rejected', '거절'),
        ('cancelled', '취소'),
    ]
    
    user = models.ForeignKey('user.User', on_delete=models.CASCADE, help_text="신청자")
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, help_text="입양 희망 동물")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', help_text="신청 상태")
    application_date = models.DateTimeField(auto_now_add=True, help_text="신청일")
    approval_date = models.DateTimeField(null=True, blank=True, help_text="승인/거절일")
    reason = models.TextField(blank=True, null=True, help_text="입양 사유")
    contact_phone = models.CharField(max_length=20, help_text="연락처")
    contact_email = models.EmailField(help_text="이메일")
    home_address = models.CharField(max_length=200, help_text="거주지")
    family_size = models.PositiveIntegerField(default=1, help_text="가족 구성원 수")
    has_pet_experience = models.BooleanField(default=False, help_text="반려동물 양육 경험")
    can_visit_center = models.BooleanField(default=True, help_text="센터 방문 가능 여부")
    
    # 관리자용 필드
    admin_notes = models.TextField(blank=True, null=True, help_text="관리자 코멘트")
    processed_by = models.ForeignKey('user.User', on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='processed_applications', help_text="처리 담당자")
    
    class Meta:
        db_table = 'adoption_applications'
        verbose_name = '입양 신청'
        verbose_name_plural = '입양 신청들'
        unique_together = ['user', 'animal']  # 한 사용자당 동물당 한 번만 신청 가능
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['application_date']),
            models.Index(fields=['animal', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.animal.name} ({self.get_status_display()})"
    
    @property
    def is_active(self):
        """활성 신청 여부 (대기중 또는 처리중)"""
        return self.status in ['pending']
    
    @property
    def processing_days(self):
        """신청 후 경과일"""
        from django.utils import timezone
        if self.application_date:
            delta = timezone.now().date() - self.application_date.date()
            return delta.days
        return 0
