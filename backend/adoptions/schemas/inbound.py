from ninja import Schema, Field
from typing import List, Optional


class SendPhoneVerificationIn(Schema):
    """전화번호 인증코드 발송 요청 스키마"""
    phone_number: str = Field(..., description="전화번호 (하이픈 포함)")


class VerifyPhoneCodeIn(Schema):
    """전화번호 인증코드 확인 요청 스키마"""
    phone_number: str = Field(..., description="전화번호 (하이픈 포함)")
    verification_code: str = Field(..., description="6자리 인증번호")


class UserSettingsIn(Schema):
    """입양 신청 시 사용자 설정 정보 스키마"""
    phone: str = Field(..., description="전화번호 (필수)")
    phone_verification: bool = Field(..., description="전화번호 인증 완료 여부 (필수)")
    name: str = Field(..., description="실명 (필수)")
    birth: str = Field(..., description="생년월일 (필수, YYYY-MM-DD)")
    address: str = Field(..., description="주소 (필수)")
    address_is_public: bool = Field(False, description="주소 공개 여부")


class AdoptionQuestionResponseIn(Schema):
    """입양 질문 응답 스키마"""
    question_id: str = Field(..., description="질문 ID")
    answer: str = Field(..., description="답변 내용")


class AdoptionApplicationIn(Schema):
    """입양 신청 제출 요청 스키마"""
    animal_id: str = Field(..., description="입양 신청할 동물 ID (필수)")
    user_settings: Optional[UserSettingsIn] = None  # 사용자 설정 (선택적)
    question_responses: List[AdoptionQuestionResponseIn] = Field(default=[], description="질문 응답 목록")
    monitoring_agreement: bool = Field(..., description="모니터링 동의 (필수)")
    guidelines_agreement: bool = Field(..., description="입양 유의사항 동의 (필수)")
    is_temporary_protection: bool = Field(False, description="임시보호 여부 (기본값: False)")
    notes: Optional[str] = Field(None, description="추가 메모 (선택적)")


class ContractSignIn(Schema):
    """계약서 서명 요청 스키마"""
    contract_id: str = Field(..., description="계약서 ID (필수)")
    signature_data: str = Field(..., description="Base64 인코딩된 서명 이미지 데이터 (필수)")
