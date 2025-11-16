from ninja import Schema, Field
from typing import Optional, List
from pydantic import BaseModel


class ContractTemplateCreateIn(Schema):
    """계약서 템플릿 생성 입력 스키마"""
    title: str = Field(..., min_length=1, max_length=200, description="계약서 템플릿 제목")
    description: Optional[str] = Field(None, max_length=500, description="계약서 템플릿 설명")
    content: str = Field(..., min_length=1, description="계약서 템플릿 내용")
    is_active: Optional[bool] = Field(True, description="활성화 상태")


class ContractTemplateUpdateIn(Schema):
    """계약서 템플릿 수정 입력 스키마"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="계약서 템플릿 제목")
    description: Optional[str] = Field(None, max_length=500, description="계약서 템플릿 설명")
    content: Optional[str] = Field(None, min_length=1, description="계약서 템플릿 내용")
    is_active: Optional[bool] = Field(None, description="활성화 상태")


class ConsentCreateIn(Schema):
    """동의서 생성 입력 스키마"""
    title: str = Field(..., min_length=1, max_length=200, description="동의서 제목")
    description: Optional[str] = Field(None, max_length=500, description="동의서 설명")
    content: str = Field(..., min_length=1, description="동의서 내용")
    is_active: Optional[bool] = Field(True, description="활성화 상태")


class ConsentUpdateIn(Schema):
    """동의서 수정 입력 스키마"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="동의서 제목")
    description: Optional[str] = Field(None, max_length=500, description="동의서 설명")
    content: Optional[str] = Field(None, min_length=1, description="동의서 내용")
    is_active: Optional[bool] = Field(None, description="활성화 상태")


class ProcedureSettingsCreateIn(Schema):
    """프로시저 설정 생성 입력 스키마"""
    has_monitoring: Optional[bool] = Field(None, description="모니터링 실시 여부")
    monitoring_period_months: Optional[int] = Field(None, ge=1, le=60, description="모니터링 기간 (개월)")
    monitoring_interval_days: Optional[int] = Field(None, ge=1, le=365, description="모니터링 간격 (일)")
    monitoring_description: Optional[str] = Field(None, max_length=1000, description="모니터링 설명")
    adoption_guidelines: Optional[str] = Field(None, max_length=2000, description="입양 가이드라인")
    adoption_procedure: Optional[str] = Field(None, max_length=2000, description="입양 절차")


class ProcedureSettingsUpdateIn(Schema):
    """프로시저 설정 수정 입력 스키마"""
    has_monitoring: Optional[bool] = Field(None, description="모니터링 실시 여부")
    monitoring_period_months: Optional[int] = Field(None, ge=1, le=60, description="모니터링 기간 (개월)")
    monitoring_interval_days: Optional[int] = Field(None, ge=1, le=365, description="모니터링 간격 (일)")
    monitoring_description: Optional[str] = Field(None, max_length=1000, description="모니터링 설명")
    adoption_guidelines: Optional[str] = Field(None, max_length=2000, description="입양 가이드라인")
    adoption_procedure: Optional[str] = Field(None, max_length=2000, description="입양 절차")


class CenterListQueryIn(BaseModel):
    """센터 목록 조회 쿼리 스키마"""
    name: Optional[str] = None  # 센터명 부분 일치 검색
    location: Optional[str] = None  # 위치 부분 일치 검색
    region: Optional[str] = None  # 지역 필터 (서울, 부산 등)
    verified: Optional[bool] = None  # 인증 여부
    has_volunteer: Optional[bool] = None  # 봉사활동 여부
    has_foster_care: Optional[bool] = None  # 임시보호 여부
    search: Optional[str] = None  # 검색어 (센터명, 위치, 설명)
    sort_by: Optional[str] = "created_at"  # 정렬 기준 (name, verified, created_at)
    sort_order: Optional[str] = "desc"  # 정렬 방향 (asc, desc)


class CenterUpdateIn(Schema):
    """센터 설정 수정 입력 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="센터명")
    center_number: Optional[str] = Field(None, max_length=50, description="센터 등록번호")
    description: Optional[str] = Field(None, max_length=1000, description="센터 소개")
    location: Optional[str] = Field(None, max_length=200, description="센터 위치")
    region: Optional[str] = Field(None, max_length=50, description="센터 지역")
    phone_number: Optional[str] = Field(None, max_length=20, description="센터 전화번호")
    adoption_procedure: Optional[str] = Field(None, max_length=2000, description="입양 절차")
    adoption_guidelines: Optional[str] = Field(None, max_length=2000, description="입양 가이드라인")
    has_monitoring: Optional[bool] = Field(None, description="모니터링 실시 여부")
    monitoring_period_months: Optional[int] = Field(None, ge=1, le=60, description="모니터링 기간 (개월)")
    monitoring_interval_days: Optional[int] = Field(None, ge=1, le=365, description="모니터링 간격 (일)")
    monitoring_description: Optional[str] = Field(None, max_length=1000, description="모니터링 설명")
    adoption_price: Optional[int] = Field(None, ge=0, description="입양비 (원)")
    image_url: Optional[str] = Field(None, max_length=500, description="센터 이미지 URL")
    has_volunteer: Optional[bool] = Field(None, description="봉사활동 여부")
    has_foster_care: Optional[bool] = Field(None, description="임시보호 여부")
    call_available_time: Optional[str] = Field(None, max_length=200, description="통화 가능 시간")


class CenterAnimalsQueryIn(Schema):
    """센터 동물 목록 조회 쿼리 스키마"""
    center_id: Optional[str] = Field(None, description="센터 ID")
    status: Optional[str] = Field(None, description="동물 상태 (보호중, 입양대기, 입양완료)")
    breed: Optional[str] = Field(None, max_length=50, description="동물 품종")
    gender: Optional[str] = Field(None, pattern="^(female|male)$", description="성별 (female or male)")
    weight: Optional[str] = Field(None, pattern="^(10kg_under|25kg_under|over_25kg)$", description="체중 범위")
    age: Optional[str] = Field(None, pattern="^(2_under|7_under|over_7)$", description="나이 범위")
    has_trainer_comment: Optional[str] = Field(None, pattern="^(true|false)$", description="훈련사 코멘트 존재 여부")

class QuestionFormCreateIn(Schema):
    """질문 폼 생성 입력 스키마"""
    question: str = Field(..., min_length=1, max_length=500, description="질문 내용")
    type: str = Field(..., pattern="^(text|multiple_choice|single_choice|checkbox)$", description="질문 유형 (text, multiple_choice, single_choice, checkbox)")
    options: Optional[List[str]] = Field(None, description="선택지 목록 (multiple_choice, single_choice, checkbox 유형에서 사용)")
    is_required: Optional[bool] = Field(False, description="필수 질문 여부")
    sequence: Optional[int] = Field(None, ge=1, description="질문 순서 (자동 설정 시 생략 가능)")

class QuestionFormUpdateIn(Schema):
    """질문 폼 수정 입력 스키마"""
    question: Optional[str] = Field(None, min_length=1, max_length=500, description="질문 내용")
    type: Optional[str] = Field(None, pattern="^(text|multiple_choice|single_choice|checkbox)$", description="질문 유형 (text, multiple_choice, single_choice, checkbox)")
    options: Optional[List[str]] = Field(None, description="선택지 목록 (multiple_choice, single_choice, checkbox 유형에서 사용)")
    is_required: Optional[bool] = Field(None, description="필수 질문 여부")
    sequence: Optional[int] = Field(None, ge=1, description="질문 순서")

class QuestionSequenceUpdateIn(Schema):
    """질문 순서 변경 입력 스키마"""
    sequence: int = Field(..., ge=1, description="새로운 질문 순서")


class CenterSubscriptionUpdateIn(Schema):
    """센터 구독 상태 변경 입력 스키마"""
    is_subscribed: bool = Field(..., description="구독 여부 (true: 구독, false: 구독 해제)")
