from ninja import Schema, Field
from typing import List, Optional

class UserAdoptionOut(Schema):
    """사용자 입양 신청 응답 스키마"""
    id: str = Field(..., description="입양 신청 ID")
    user_id: str = Field(..., description="사용자 ID")
    user_name: Optional[str] = Field(None, description="사용자 이름")
    user_nickname: Optional[str] = Field(None, description="사용자 닉네임")
    user_phoneNumber: Optional[str] = Field(None, description="사용자 전화번호")
    animal_id: str = Field(..., description="동물 ID")
    animal_name: str = Field(..., description="동물 이름")
    animal_image: Optional[str] = Field(None, description="동물 이미지 URL")
    animal_breed: Optional[str] = Field(None, description="동물 품종")
    animal_is_female: bool = Field(..., description="동물 성별 (암컷 여부)")
    animal_protection_status: str = Field(..., description="동물 보호 상태")
    animal_adoption_status: str = Field(..., description="동물 입양 상태")
    center_id: str = Field(..., description="센터 ID")
    center_name: str = Field(..., description="센터 이름")
    center_location: Optional[str] = Field(None, description="센터 위치")
    center_centerNumber: Optional[str] = Field(None, description="센터 연락처")
    status: str = Field(..., description="입양 상태")
    notes: Optional[str] = Field(None, description="사용자 메모")
    center_notes: Optional[str] = Field(None, description="센터 메모")
    monitoring_agreement: bool = Field(..., description="모니터링 동의 여부")
    guidelines_agreement: bool = Field(..., description="입양 가이드라인 동의 여부")
    meeting_scheduled_at: Optional[str] = Field(None, description="미팅 예정 시간")
    contract_sent_at: Optional[str] = Field(None, description="계약서 전송 시간")
    adoption_completed_at: Optional[str] = Field(None, description="입양 완료 시간")
    monitoring_started_at: Optional[str] = Field(None, description="모니터링 시작 시간")
    monitoring_next_check_at: Optional[str] = Field(None, description="다음 모니터링 체크 시간")
    monitoring_status: Optional[str] = Field(None, description="모니터링 상태")
    created_at: str = Field(..., description="생성 시간")
    updated_at: str = Field(..., description="수정 시간")


class QuestionResponseOut(Schema):
    """질문 응답 스키마"""
    id: str = Field(..., description="응답 ID")
    question_id: str = Field(..., description="질문 ID")
    question_content: str = Field(..., description="질문 내용")
    answer: str = Field(..., description="답변 내용")
    created_at: str = Field(..., description="생성 시간")


class ContractOut(Schema):
    """계약서 스키마"""
    id: str = Field(..., description="계약서 ID")
    template_id: str = Field(..., description="템플릿 ID")
    contract_content: str = Field(..., description="계약서 내용")
    guidelines_content: Optional[str] = Field(None, description="가이드라인 내용")
    user_signature_url: Optional[str] = Field(None, description="사용자 서명 URL")
    user_signed_at: Optional[str] = Field(None, description="사용자 서명 시간")
    center_signature_url: Optional[str] = Field(None, description="센터 서명 URL")
    center_signed_at: Optional[str] = Field(None, description="센터 서명 시간")
    status: str = Field(..., description="계약서 상태")
    created_at: str = Field(..., description="생성 시간")
    updated_at: str = Field(..., description="수정 시간")


class MonitoringPostOut(Schema):
    """모니터링 포스트 스키마"""
    id: str = Field(..., description="모니터링 ID")
    post_id: str = Field(..., description="포스트 ID")
    post_title: Optional[str] = Field(None, description="포스트 제목")
    post_content: Optional[str] = Field(None, description="포스트 내용")
    created_at: str = Field(..., description="생성 시간")


class UserAdoptionDetailOut(Schema):
    """사용자 입양 신청 상세 응답 스키마"""
    adoption: dict = Field(..., description="입양 신청 정보")
    question_responses: List[QuestionResponseOut] = Field(default=[], description="질문 응답 목록")
    contract: Optional[ContractOut] = Field(None, description="계약서 정보")
    monitoring_posts: List[MonitoringPostOut] = Field(default=[], description="모니터링 포스트 목록")
