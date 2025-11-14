from ninja import Schema, Field
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class CenterListItemOut(BaseModel):
    """센터 목록 아이템"""
    id: str
    name: str
    center_number: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    region: Optional[str] = None
    phone_number: Optional[str] = None
    image_url: Optional[str] = None
    verified: bool
    is_public: bool
    has_volunteer: bool
    has_foster_care: bool
    adoption_price: int
    is_subscribed: bool
    owner_name: Optional[str] = None
    created_at: str
    updated_at: str

class ContractTemplateOut(BaseModel):
    """계약서 템플릿"""
    id: str
    title: str
    description: Optional[str] = None
    content: str
    is_active: bool
    created_at: Optional[str] = None

class ConsentOut(BaseModel):
    """동의서"""
    id: str
    title: str
    description: Optional[str] = None
    content: str
    is_active: bool
    created_at: Optional[str] = None

class QuestionFormOut(BaseModel):
    """질문 폼"""
    id: str
    question: str
    type: Optional[str] = None
    options: Optional[dict] = None
    is_required: bool
    sequence: int

class CenterOut(BaseModel):
    """센터 상세 정보"""
    id: str
    name: str
    center_number: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    region: Optional[str] = None
    phone_number: Optional[str] = None
    adoption_procedure: Optional[str] = None
    adoption_guidelines: Optional[str] = None
    has_monitoring: bool
    monitoring_period_months: int
    monitoring_interval_days: int
    monitoring_description: Optional[str] = None
    verified: bool
    is_public: bool
    adoption_price: int
    image_url: Optional[str] = None
    is_subscribed: bool
    has_volunteer: bool
    has_foster_care: bool
    show_phone_number: bool
    show_location: bool
    call_available_time: Optional[str] = None
    public_reg_no: Optional[str] = None
    owner_name: Optional[str] = None
    owner_type: Optional[str] = None
    contract_templates: List[ContractTemplateOut] = []
    consents: List[ConsentOut] = []
    question_forms: List[QuestionFormOut] = []
    created_at: str
    updated_at: str

class ErrorOut(BaseModel):
    """에러 응답"""
    detail: str
    code: Optional[str] = None

class SuccessOut(BaseModel):
    """성공 응답"""
    message: str
    success: bool = True


class ProcedureSettingsOut(Schema):
    """프로시저 설정 출력 스키마"""
    has_monitoring: Optional[bool] = Field(None, description="모니터링 실시 여부")
    monitoring_period_months: Optional[int] = Field(None, description="모니터링 기간 (개월)")
    monitoring_interval_days: Optional[int] = Field(None, description="모니터링 간격 (일)")
    monitoring_description: Optional[str] = Field(None, description="모니터링 설명")
    adoption_guidelines: Optional[str] = Field(None, description="입양 가이드라인")
    adoption_procedure: Optional[str] = Field(None, description="입양 절차")
    contract_templates: List[ContractTemplateOut] = Field(default_factory=list, description="계약서 템플릿 목록")


class AnimalImageOut(Schema):
    """동물 이미지 출력 스키마"""
    id: str = Field(..., description="동물 이미지 ID")
    image_url: str = Field(..., description="이미지 URL")
    order_index: int = Field(..., description="이미지 순서")


class CenterAnimalOut(Schema):
    """센터 동물 출력 스키마"""
    id: str = Field(..., description="동물 ID")
    name: str = Field(..., description="동물 이름")
    is_female: bool = Field(..., description="암컷 여부")
    age: Optional[int] = Field(None, description="나이 (년)")
    weight: Optional[float] = Field(None, description="체중 (kg)")
    color: Optional[str] = Field(None, description="색상")
    breed: Optional[str] = Field(None, description="품종")
    description: Optional[str] = Field(None, description="동물 설명")
    protection_status: str = Field(..., description="보호 상태 (보호중, 안락사, 자연사, 반환)")
    adoption_status: str = Field(..., description="입양 상태 (입양가능, 입양진행중, 입양완료, 입양불가)")
    waiting_days: Optional[int] = Field(None, description="보호 기간 (일)")
    activity_level: Optional[int] = Field(None, description="활동량 수준")
    sensitivity: Optional[int] = Field(None, description="예민함 정도")
    sociability: Optional[int] = Field(None, description="사회성")
    separation_anxiety: Optional[int] = Field(None, description="분리불안 정도")
    special_notes: Optional[str] = Field(None, description="특이사항")
    health_notes: Optional[str] = Field(None, description="건강 정보")
    basic_training: Optional[int] = Field(None, description="기본 훈련 상태")
    trainer_comment: Optional[str] = Field(None, description="훈련사 코멘트")
    announce_number: Optional[str] = Field(None, description="공고번호")
    announcement_date: Optional[str] = Field(None, description="공고일 (ISO 형식)")
    found_location: Optional[str] = Field(None, description="발견 장소")
    admission_date: Optional[str] = Field(None, description="센터 입소일 (ISO 형식)")
    personality: Optional[str] = Field(None, description="성격")
    center_id: str = Field(..., description="센터 ID")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")
    animal_images: List[AnimalImageOut] = Field(default_factory=list, description="동물 이미지 목록")


class CenterAnimalsOut(Schema):
    """센터 동물 목록 출력 스키마"""
    animals: List[CenterAnimalOut] = Field(..., description="동물 목록")
    total: int = Field(..., description="전체 동물 수")
    page: int = Field(..., description="현재 페이지 번호")
    limit: int = Field(..., description="페이지당 항목 수")
    total_pages: int = Field(..., description="전체 페이지 수")
    has_next: bool = Field(..., description="다음 페이지 존재 여부")
    has_prev: bool = Field(..., description="이전 페이지 존재 여부")

class QuestionFormListOut(Schema):
    """질문 폼 목록 출력 스키마"""
    questions: List[QuestionFormOut] = Field(..., description="질문 폼 목록")

class QuestionFormDeleteOut(Schema):
    """질문 폼 삭제 출력 스키마"""
    message: str = Field(..., description="삭제 완료 메시지")


class PresetQuestionOut(Schema):
    """기본 질문 출력 스키마"""
    id: str = Field(..., description="기본 질문 ID")
    category: str = Field(..., description="질문 카테고리 (lifeEnvironment, experience, responsibility)")
    question: str = Field(..., description="질문 내용")
    sequence: int = Field(..., description="질문 순서")
    is_active: bool = Field(..., description="활성화 여부")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")


class PresetQuestionListOut(Schema):
    """기본 질문 목록 출력 스키마"""
    questions: List[PresetQuestionOut] = Field(..., description="기본 질문 목록")


class CenterNoticeOut(Schema):
    """센터 공지사항 출력 스키마"""
    id: str = Field(..., description="공지사항 ID")
    title: str = Field(..., description="공지사항 제목")
    content: str = Field(..., description="공지사항 내용")
    is_important: bool = Field(..., description="중요 공지사항 여부")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")


class CenterNoticeListOut(Schema):
    """센터 공지사항 목록 출력 스키마"""
    notices: List[CenterNoticeOut] = Field(..., description="공지사항 목록")
    total: int = Field(..., description="전체 공지사항 수")


class CenterSubscriptionOut(Schema):
    """센터 구독 상태 변경 출력 스키마"""
    message: str = Field(..., description="구독 상태 변경 완료 메시지")
    is_subscribed: bool = Field(..., description="변경된 구독 상태")
    center_id: str = Field(..., description="센터 ID")
    center_name: str = Field(..., description="센터명")
