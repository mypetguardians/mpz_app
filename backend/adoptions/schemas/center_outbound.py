from ninja import Schema, Field
from typing import List, Optional
from datetime import datetime

class UserInfoOut(Schema):
    """사용자 정보 응답 스키마"""
    name: str = Field(..., description="사용자 이름")
    phone: Optional[str] = Field(None, description="전화번호 (미팅 단계부터 공개)")
    address: Optional[str] = Field(None, description="주소 (미팅 단계부터 공개)")
    address_is_public: bool = Field(..., description="주소 공개 여부")

class QuestionResponseOut(Schema):
    """질문 응답 스키마"""
    question_id: str = Field(..., description="질문 ID")
    question_content: str = Field(..., description="질문 내용")
    answer: str = Field(..., description="답변 내용")

class AgreementsOut(Schema):
    """동의사항 스키마"""
    monitoring: bool = Field(..., description="모니터링 동의 여부")
    guidelines: bool = Field(..., description="입양 가이드라인 동의 여부")

class TimelineOut(Schema):
    """타임라인 스키마"""
    applied_at: str = Field(..., description="신청 시간")
    meeting_scheduled_at: Optional[str] = Field(None, description="미팅 예정 시간")
    contract_sent_at: Optional[str] = Field(None, description="계약서 전송 시간")
    adoption_completed_at: Optional[str] = Field(None, description="입양 완료 시간")
    monitoring_started_at: Optional[str] = Field(None, description="모니터링 시작 시간")
    monitoring_next_check_at: Optional[str] = Field(None, description="다음 모니터링 체크 시간")

class CenterAdoptionOut(Schema):
    """센터 입양 신청 응답 스키마"""
    id: str = Field(..., description="입양 신청 ID")
    user_id: str = Field(..., description="사용자 ID")
    animal_id: str = Field(..., description="동물 ID")
    animal_name: str = Field(..., description="동물 이름")
    animal_image: Optional[str] = Field(None, description="동물 이미지 URL")
    animal_protection_status: Optional[str] = Field(None, description="동물 보호 상태")
    animal_adoption_status: Optional[str] = Field(None, description="동물 입양 상태")
    status: str = Field(..., description="입양 상태")
    notes: Optional[str] = Field(None, description="사용자 메모")
    center_notes: Optional[str] = Field(None, description="센터 메모")
    user_memo: Optional[str] = Field(None, description="입양 신청자에 대한 메모")
    user_info: UserInfoOut = Field(..., description="사용자 정보")
    question_responses: List[QuestionResponseOut] = Field(default=[], description="질문 응답 목록")
    agreements: AgreementsOut = Field(..., description="동의사항")
    timeline: TimelineOut = Field(..., description="타임라인")
    created_at: str = Field(..., description="생성 시간")
    updated_at: str = Field(..., description="수정 시간")

class CenterAdoptionsListOut(Schema):
    """센터 입양 신청 목록 응답 스키마"""
    adoptions: List[CenterAdoptionOut] = Field(default=[], description="입양 신청 목록")
    total: int = Field(..., description="전체 개수")
    page: int = Field(..., description="현재 페이지")
    limit: int = Field(..., description="페이지당 개수")
    total_pages: int = Field(..., description="전체 페이지 수")
    has_next: bool = Field(..., description="다음 페이지 존재 여부")
    has_prev: bool = Field(..., description="이전 페이지 존재 여부")

class SendContractOut(Schema):
    """계약서 전송 응답 스키마"""
    message: str = Field(..., description="응답 메시지")
    contract_id: str = Field(..., description="생성된 계약서 ID")

class MonitoringStatusOut(Schema):
    """모니터링 상태 응답 스키마"""
    adoption_id: str = Field(..., description="입양 신청 ID")
    status: str = Field(..., description="입양 상태")
    monitoring_status: Optional[str] = Field(None, description="모니터링 상태")
    monitoring_started_at: Optional[str] = Field(None, description="모니터링 시작 시간")
    monitoring_end_date: Optional[str] = Field(None, description="모니터링 종료 예정일")
    next_check_date: Optional[str] = Field(None, description="다음 체크 예정일")
    days_until_next_deadline: Optional[int] = Field(None, description="다음 체크까지 남은 일수")
    days_until_monitoring_end: Optional[int] = Field(None, description="모니터링 종료까지 남은 일수")
    completed_checks: int = Field(..., description="완료된 체크 수")
    total_checks: int = Field(..., description="전체 체크 수")
    total_monitoring_posts: int = Field(..., description="모니터링 포스트 수")
    monitoring_progress: dict = Field(..., description="모니터링 진행률")
    center_config: dict = Field(..., description="센터 모니터링 설정")
    recent_checks: List[dict] = Field(default=[], description="최근 체크 히스토리")

class ManualMonitoringCheckOut(Schema):
    """수동 모니터링 체크 응답 스키마"""
    success: bool = Field(..., description="체크 실행 성공 여부")
    checked: int = Field(..., description="체크된 입양 건수")
    issues: int = Field(..., description="발견된 문제 건수")
    timestamp: str = Field(..., description="체크 실행 시간")
