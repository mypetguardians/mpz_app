from ninja import Schema, Field
from typing import List, Optional


class PhoneVerificationOut(Schema):
    """전화번호 인증 응답 스키마"""
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")
    is_verified: Optional[bool] = Field(None, description="인증 완료 여부 (선택적)")


class UserSettingsOut(Schema):
    """사용자 설정 정보 응답 스키마"""
    phone: str = Field(..., description="전화번호")
    phone_verification: bool = Field(..., description="전화번호 인증 완료 여부")
    name: str = Field(..., description="실명")
    birth: str = Field(..., description="생년월일")
    address: str = Field(..., description="주소")
    address_is_public: bool = Field(..., description="주소 공개 여부")


class AdoptionQuestionOut(Schema):
    """입양 질문 응답 스키마"""
    id: str = Field(..., description="질문 ID")
    content: str = Field(..., description="질문 내용")
    sequence: int = Field(..., description="질문 순서")


class AnimalInfoOut(Schema):
    """동물 정보 응답 스키마"""
    id: str = Field(..., description="동물 ID")
    name: str = Field(..., description="동물 이름")
    protection_status: str = Field(..., description="보호 상태 (보호중, 안락사, 자연사, 반환)")
    adoption_status: str = Field(..., description="입양 상태 (입양가능, 입양진행중, 입양완료, 입양불가)")
    center_id: str = Field(..., description="센터 ID")
    center_name: str = Field(..., description="센터 이름")


class CenterInfoOut(Schema):
    """센터 정보 응답 스키마"""
    has_monitoring: bool = Field(..., description="모니터링 제공 여부")
    monitoring_description: Optional[str] = Field(None, description="모니터링 설명")
    adoption_guidelines: Optional[str] = Field(None, description="입양 가이드라인")
    adoption_price: int = Field(..., description="입양 비용")


class ContractTemplateOut(Schema):
    """계약서 템플릿 응답 스키마"""
    id: str = Field(..., description="템플릿 ID")
    title: str = Field(..., description="템플릿 제목")
    content: str = Field(..., description="템플릿 내용")


class AdoptionPreCheckOut(Schema):
    """입양 신청 사전 확인 응답 스키마"""
    can_apply: bool = Field(..., description="입양 신청 가능 여부")
    is_phone_verified: bool = Field(..., description="전화번호 인증 상태")
    needs_user_settings: bool = Field(..., description="사용자 설정 입력 필요 여부")
    animal: AnimalInfoOut = Field(..., description="동물 정보")
    user_settings: Optional[UserSettingsOut] = Field(None, description="사용자 설정 정보")
    adoption_questions: List[AdoptionQuestionOut] = Field(default=[], description="입양 질문 목록")
    center_info: CenterInfoOut = Field(..., description="센터 정보")
    contract_template: Optional[ContractTemplateOut] = Field(None, description="계약서 템플릿")
    existing_application: bool = Field(..., description="기존 신청 존재 여부")


class AdoptionApplicationOut(Schema):
    """입양 신청 응답 스키마"""
    id: str = Field(..., description="입양 신청 ID")
    animal_id: str = Field(..., description="동물 ID")
    animal_name: str = Field(..., description="동물 이름")
    center_name: str = Field(..., description="센터 이름")
    status: str = Field(..., description="입양 상태 (신청, 미팅, 계약서작성, 입양완료, 모니터링, 취소)")
    notes: Optional[str] = Field(None, description="추가 메모")
    created_at: str = Field(..., description="생성 시간 (ISO 8601)")
    updated_at: str = Field(..., description="수정 시간 (ISO 8601)")


class ContractSignOut(Schema):
    """계약서 서명 응답 스키마"""
    message: str = Field(..., description="응답 메시지")
    adoption_status: str = Field(..., description="입양 상태")


class SuccessOut(Schema):
    """성공 응답 스키마"""
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")


class ErrorOut(Schema):
    """에러 응답 스키마"""
    error: str = Field(..., description="에러 메시지")


class AdoptionWithdrawOut(Schema):
    """입양 철회 응답 스키마"""
    message: str = Field(..., description="철회 완료 메시지")
    adoption_id: str = Field(..., description="철회된 입양 신청 ID")
    status: str = Field(..., description="변경된 상태")
