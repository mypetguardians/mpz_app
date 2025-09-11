from ninja import Schema, Field
from typing import Optional, List



class ContractTemplateOut(Schema):
    """계약서 템플릿 출력 스키마"""
    id: str = Field(..., description="계약서 템플릿 ID")
    center_id: str = Field(..., description="센터 ID")
    title: str = Field(..., description="계약서 템플릿 제목")
    description: Optional[str] = Field(None, description="계약서 템플릿 설명")
    content: str = Field(..., description="계약서 템플릿 내용")
    is_active: bool = Field(..., description="활성화 상태")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")


class ConsentOut(Schema):
    """동의서 출력 스키마"""
    id: str = Field(..., description="동의서 ID")
    center_id: str = Field(..., description="센터 ID")
    title: str = Field(..., description="동의서 제목")
    description: Optional[str] = Field(None, description="동의서 설명")
    content: str = Field(..., description="동의서 내용")
    is_active: bool = Field(..., description="활성화 상태")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")


class SuccessOut(Schema):
    """성공 응답 스키마"""
    message: str = Field(..., description="성공 메시지")


class ErrorOut(Schema):
    """에러 응답 스키마"""
    error: str = Field(..., description="에러 메시지")


class ProcedureSettingsOut(Schema):
    """프로시저 설정 출력 스키마"""
    has_monitoring: Optional[bool] = Field(None, description="모니터링 실시 여부")
    monitoring_period_months: Optional[int] = Field(None, description="모니터링 기간 (개월)")
    monitoring_interval_days: Optional[int] = Field(None, description="모니터링 간격 (일)")
    monitoring_description: Optional[str] = Field(None, description="모니터링 설명")
    adoption_guidelines: Optional[str] = Field(None, description="입양 가이드라인")
    adoption_procedure: Optional[str] = Field(None, description="입양 절차")
    contract_templates: List[ContractTemplateOut] = Field(default_factory=list, description="계약서 템플릿 목록")


class CenterOut(Schema):
    """센터 출력 스키마"""
    id: str = Field(..., description="센터 ID")
    user_id: Optional[str] = Field(None, description="센터 관리자 사용자 ID")
    name: str = Field(..., description="센터명")
    center_number: Optional[str] = Field(None, description="센터 등록번호")
    description: Optional[str] = Field(None, description="센터 소개")
    location: Optional[str] = Field(None, description="센터 위치 (공개 설정에 따라 조건부 노출)")
    region: Optional[str] = Field(None, description="센터 지역")
    phone_number: Optional[str] = Field(None, description="센터 전화번호")
    adoption_procedure: Optional[str] = Field(None, description="입양 절차")
    adoption_guidelines: Optional[str] = Field(None, description="입양 가이드라인")
    has_monitoring: Optional[bool] = Field(None, description="모니터링 실시 여부")
    monitoring_period_months: Optional[int] = Field(None, description="모니터링 기간 (개월)")
    monitoring_interval_days: Optional[int] = Field(None, description="모니터링 간격 (일)")
    monitoring_description: Optional[str] = Field(None, description="모니터링 설명")
    verified: Optional[bool] = Field(None, description="인증 상태")
    is_public: Optional[bool] = Field(None, description="공개 센터 여부")
    adoption_price: Optional[int] = Field(None, description="입양비 (원)")
    image_url: Optional[str] = Field(None, description="센터 이미지 URL")
    is_subscribed: Optional[bool] = Field(None, description="구독 여부")
    has_volunteer: Optional[bool] = Field(None, description="봉사활동 여부")
    has_foster_care: Optional[bool] = Field(None, description="임시보호 여부")
    show_phone_number: Optional[bool] = Field(None, description="전화번호 노출 여부")
    show_location: Optional[bool] = Field(None, description="위치 노출 여부")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")


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
    status: str = Field(..., description="동물 상태 (보호중, 입양대기, 입양완료)")
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

class QuestionFormOut(Schema):
    """질문 폼 출력 스키마"""
    id: str = Field(..., description="질문 폼 ID")
    center_id: str = Field(..., description="센터 ID")
    question: str = Field(..., description="질문 내용")
    type: str = Field(..., description="질문 유형 (text, multiple_choice, single_choice, checkbox)")
    options: Optional[List[str]] = Field(None, description="선택지 목록")
    is_required: bool = Field(..., description="필수 질문 여부")
    sequence: int = Field(..., description="질문 순서")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")

class QuestionFormListOut(Schema):
    """질문 폼 목록 출력 스키마"""
    questions: List[QuestionFormOut] = Field(..., description="질문 폼 목록")

class QuestionFormDeleteOut(Schema):
    """질문 폼 삭제 출력 스키마"""
    message: str = Field(..., description="삭제 완료 메시지")


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
