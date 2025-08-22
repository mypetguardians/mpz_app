from django.db import models
from django.conf import settings
from centers.models import Center, AdoptionContractTemplate
from animals.models import Animal
from common.models import BaseModel


class Adoption(BaseModel):
    """입양 신청 모델"""
    
    STATUS_CHOICES = [
        ('신청', '신청'),
        ('미팅', '미팅'),
        ('계약서작성', '계약서작성'),
        ('입양완료', '입양완료'),
        ('모니터링', '모니터링'),
        ('취소', '취소'),
    ]
    
    MONITORING_STATUS_CHOICES = [
        ('진행중', '진행중'),
        ('완료', '완료'),
        ('지연', '지연'),
        ('중단', '중단'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, help_text="입양 신청자")
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, help_text="입양 대상 동물")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='신청', help_text="입양 상태")
    notes = models.TextField(blank=True, null=True, help_text="메모")
    
    # 입양 신청 시 동의 사항들
    monitoring_agreement = models.BooleanField(help_text="모니터링 동의")
    guidelines_agreement = models.BooleanField(help_text="가이드라인 동의")
    
    # 임시보호 여부
    is_temporary_protection = models.BooleanField(default=False, help_text="임시보호 여부")
    
    # 단계별 처리 시간 추적
    meeting_scheduled_at = models.DateTimeField(blank=True, null=True, help_text="미팅 일정")
    contract_sent_at = models.DateTimeField(blank=True, null=True, help_text="계약서 전송 시간")
    adoption_completed_at = models.DateTimeField(blank=True, null=True, help_text="입양 완료 시간")
    monitoring_started_at = models.DateTimeField(blank=True, null=True, help_text="모니터링 시작 시간")
    monitoring_next_check_at = models.DateTimeField(blank=True, null=True, help_text="다음 모니터링 확인 시간")
    monitoring_end_date = models.DateTimeField(blank=True, null=True, help_text="모니터링 종료 예정일")
    
    # 모니터링 관련
    monitoring_completed_checks = models.IntegerField(default=0, help_text="완료된 모니터링 체크 수")
    monitoring_total_checks = models.IntegerField(default=0, help_text="총 필요한 모니터링 체크 수")
    monitoring_status = models.CharField(max_length=10, choices=MONITORING_STATUS_CHOICES, default='진행중', help_text="모니터링 전반적 상태")
    
    # 센터 관리자의 처리 메모
    center_notes = models.TextField(blank=True, null=True, help_text="센터 메모")
    
    class Meta:
        db_table = 'adoptions'
        verbose_name = '입양 신청'
        verbose_name_plural = '입양 신청들'
    
    def __str__(self):
        return f"{self.user.username} - {self.animal.name} ({self.status})"


class AdoptionQuestion(BaseModel):
    """센터별 입양 질문들"""
    
    center = models.ForeignKey(Center, on_delete=models.CASCADE, help_text="관련 센터")
    sequence = models.IntegerField(default=0, help_text="질문 순서")
    content = models.TextField(help_text="질문 내용")
    is_active = models.BooleanField(default=True, help_text="활성화 여부")
    
    class Meta:
        db_table = 'adoption_questions'
        verbose_name = '입양 질문'
        verbose_name_plural = '입양 질문들'
        ordering = ['center', 'sequence']
    
    def __str__(self):
        return f"{self.center.name} - {self.content[:50]}"


class AdoptionQuestionResponse(BaseModel):
    """사용자의 질문 응답"""
    
    adoption = models.ForeignKey(Adoption, on_delete=models.CASCADE, help_text="관련 입양 신청")
    question = models.ForeignKey(AdoptionQuestion, on_delete=models.CASCADE, help_text="관련 질문")
    answer = models.TextField(help_text="응답 내용")
    
    class Meta:
        db_table = 'adoption_question_responses'
        verbose_name = '입양 질문 응답'
        verbose_name_plural = '입양 질문 응답들'
    
    def __str__(self):
        return f"{self.adoption.user.username} - {self.question.content[:30]}"


class AdoptionContract(BaseModel):
    """입양 계약서 및 서명 관리"""
    
    STATUS_CHOICES = [
        ('대기중', '대기중'),
        ('사용자서명완료', '사용자서명완료'),
        ('센터서명완료', '센터서명완료'),
        ('계약완료', '계약완료'),
    ]
    
    adoption = models.ForeignKey(Adoption, on_delete=models.CASCADE, help_text="관련 입양 신청")
    template = models.ForeignKey(AdoptionContractTemplate, on_delete=models.CASCADE, help_text="사용된 템플릿")
    contract_content = models.TextField(help_text="실제 계약서 내용")
    guidelines_content = models.TextField(blank=True, null=True, help_text="입양 유의사항")
    user_signature_url = models.CharField(max_length=500, blank=True, null=True, help_text="사용자 서명 이미지")
    user_signed_at = models.DateTimeField(blank=True, null=True, help_text="사용자 서명 시간")
    center_signature_url = models.CharField(max_length=500, blank=True, null=True, help_text="센터 서명 이미지")
    center_signed_at = models.DateTimeField(blank=True, null=True, help_text="센터 서명 시간")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='대기중', help_text="계약 상태")
    
    class Meta:
        db_table = 'adoption_contracts'
        verbose_name = '입양 계약서'
        verbose_name_plural = '입양 계약서들'
    
    def __str__(self):
        return f"{self.adoption.user.username} - {self.adoption.animal.name} 계약서"


class AdoptionMonitoring(BaseModel):
    """입양 후 모니터링 기록"""
    
    adoption = models.ForeignKey(Adoption, on_delete=models.CASCADE, help_text="관련 입양 신청")
    post_id = models.CharField(max_length=100, help_text="관련 포스트 ID")
    
    class Meta:
        db_table = 'adoption_monitoring'
        verbose_name = '입양 모니터링'
        verbose_name_plural = '입양 모니터링들'
    
    def __str__(self):
        return f"{self.adoption.user.username} - {self.adoption.animal.name} 모니터링"


class AdoptionMonitoringCheck(BaseModel):
    """모니터링 주기별 체크 기록"""
    
    STATUS_CHOICES = [
        ('정상', '정상'),
        ('지연', '지연'),
        ('미제출', '미제출'),
    ]
    
    adoption = models.ForeignKey(Adoption, on_delete=models.CASCADE, help_text="관련 입양 신청")
    check_sequence = models.IntegerField(help_text="체크 순서")
    check_date = models.DateTimeField(help_text="체크 실행 일자")
    expected_check_date = models.DateTimeField(help_text="예정된 체크 일자")
    period_start = models.DateTimeField(help_text="모니터링 대상 기간 시작")
    period_end = models.DateTimeField(help_text="모니터링 대상 기간 종료")
    posts_found = models.IntegerField(default=0, help_text="해당 기간 중 발견된 포스트 수")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, help_text="체크 상태")
    delay_days = models.IntegerField(default=0, help_text="지연 일수")
    days_until_deadline = models.IntegerField(blank=True, null=True, help_text="마감일까지 남은 일수")
    next_check_date = models.DateTimeField(blank=True, null=True, help_text="다음 체크 예정일")
    notes = models.TextField(blank=True, null=True, help_text="추가 메모")
    
    class Meta:
        db_table = 'adoption_monitoring_checks'
        verbose_name = '모니터링 체크'
        verbose_name_plural = '모니터링 체크들'
        ordering = ['check_sequence']
    
    def __str__(self):
        return f"{self.adoption.user.username} - {self.adoption.animal.name} 체크 {self.check_sequence}"
