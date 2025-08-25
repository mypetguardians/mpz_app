from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from centers.models import Center
from common.models import BaseModel


class Animal(BaseModel):
    """동물 모델"""
    
    STATUS_CHOICES = [
        ('보호중', '보호중'),
        ('입양대기', '입양대기'),
        ('입양진행중', '입양진행중'),
        ('입양완료', '입양완료'),
        ('안락사', '안락사'),
        ('자연사', '자연사'),
        ('반환', '반환'),
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='보호중', help_text="보호 상태")
    description = models.TextField(blank=True, null=True, help_text="동물 설명")
    personality = models.TextField(blank=True, null=True, help_text="성격")
    health_notes = models.TextField(blank=True, null=True, help_text="건강 상태 메모")
    special_needs = models.TextField(blank=True, null=True, help_text="특별한 요구사항")
    found_location = models.CharField(max_length=200, blank=True, null=True, help_text="발견 장소")
    admission_date = models.DateField(blank=True, null=True, help_text="센터 입소일")
    adoption_fee = models.IntegerField(default=0, help_text="입양비")
    megaphone_count = models.PositiveIntegerField(default=0, help_text="확성기(좋아요) 수")
    is_public = models.BooleanField(default=True, help_text="공개 여부")
    activity_level = models.PositiveIntegerField(default=0, help_text="활동량 수준")
    sensitivity = models.PositiveIntegerField(default=0, help_text="예민함 정도")
    sociability = models.PositiveIntegerField(default=0, help_text="사회성")
    separation_anxiety = models.PositiveIntegerField(default=0, help_text="분리불안 정도")
    basic_training = models.PositiveIntegerField(default=0, help_text="기본 훈련 상태")
    trainer_comment = models.TextField(blank=True, null=True, help_text="훈련사 코멘트")
    
    class Meta:
        db_table = 'animals'
        verbose_name = '동물'
        verbose_name_plural = '동물들'
    
    def __str__(self):
        center_name = self.center.name if self.center else "Unknown Center"
        animal_name = self.name if self.name else "Unknown Animal"
        status = self.get_status_display() if self.status else "Unknown Status"
        return f"{center_name} - {animal_name} ({status})"
    



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
