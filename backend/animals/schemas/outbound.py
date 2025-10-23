from ninja import Schema, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class AnimalImageOut(Schema):
    """동물 이미지 출력 스키마"""
    id: str = Field(..., description="동물 이미지 ID")
    image_url: str = Field(..., description="이미지 URL")
    is_primary: bool = Field(..., description="대표 이미지 여부")
    sequence: int = Field(..., description="이미지 순서")


class AnimalOut(Schema):
    """동물 출력 스키마"""
    id: str = Field(..., description="동물 ID")
    name: str = Field(..., description="동물 이름")
    is_female: bool = Field(..., description="암컷 여부")
    age: Optional[int] = Field(None, description="나이 (개월)")
    weight: Optional[Decimal] = Field(None, description="체중 (kg)")
    color: Optional[str] = Field(None, description="색상")
    breed: Optional[str] = Field(None, description="품종")
    description: Optional[str] = Field(None, description="동물 설명")
    protection_status: str = Field(..., description="보호 상태 (보호중, 임시보호, 안락사, 자연사, 반환, 기증, 방사, 입양완료)")
    adoption_status: str = Field(..., description="입양 상태 (입양가능, 입양진행중, 입양완료, 입양불가)")
    waiting_days: int = Field(0, description="보호 기간 (일)")
    activity_level: Optional[int] = Field(None, description="활동량 수준")
    sensitivity: Optional[int] = Field(None, description="예민함 정도")
    sociability: Optional[int] = Field(None, description="사회성")
    separation_anxiety: Optional[int] = Field(None, description="분리불안 정도")
    
    # 사회성 세부 항목들
    confidence: Optional[int] = Field(None, description="새로운 자극/상황 적극성")
    independence: Optional[int] = Field(None, description="독립성 있는 행동")
    physical_contact: Optional[int] = Field(None, description="사람 터치 긍정적 수용")
    handling_acceptance: Optional[int] = Field(None, description="몸 만지기 저항감")
    strangers_attitude: Optional[int] = Field(None, description="낯선 사람 반응")
    objects_attitude: Optional[int] = Field(None, description="낯선 사물 반응")
    environment_attitude: Optional[int] = Field(None, description="낯선 환경 반응")
    dogs_attitude: Optional[int] = Field(None, description="낯선 강아지 반응")
    
    # 분리불안 세부 항목들
    coping_ability: Optional[int] = Field(None, description="낯선 공간 혼자 남겨졌을 때 반응")
    playfulness_level: Optional[int] = Field(None, description="장난감/바디시그널 놀이 유도 반응")
    walkability_level: Optional[int] = Field(None, description="산책 과정에서 모습")
    grooming_acceptance_level: Optional[int] = Field(None, description="그루밍 진행 시 모습")
    
    special_notes: Optional[str] = Field(None, description="특이사항")
    health_notes: Optional[str] = Field(None, description="건강 정보")
    trainer_name: Optional[str] = Field(None, description="훈련사 이름")
    trainer_comment: Optional[str] = Field(None, description="훈련사 코멘트")
    announce_number: Optional[str] = Field(None, description="공고번호")
    display_notice_number: str = Field(..., description="표시용 공고번호 (announce_number 또는 public_notice_number)")
    announcement_date: Optional[str] = Field(None, description="공고일 (ISO 형식)")
    notice_sdt: Optional[str] = Field(None, description="공고 시작일 (ISO 형식)")
    notice_edt: Optional[str] = Field(None, description="공고 종료일 (ISO 형식)")
    found_location: Optional[str] = Field(None, description="발견 장소")
    admission_date: Optional[str] = Field(None, description="센터 입소일 (ISO 형식)")
    personality: Optional[str] = Field(None, description="성격")
    megaphone_count: int = Field(0, description="확성기(좋아요) 수")
    is_megaphoned: bool = Field(False, description="현재 사용자가 확성기를 눌렀는지 여부")
    center_id: str = Field(..., description="센터 ID")
    animal_images: List[AnimalImageOut] = Field(default_factory=list, description="동물 이미지 목록")
    created_at: str = Field(..., description="생성일시 (ISO 형식)")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")
    
    # 공공데이터 관련 필드
    is_public_data: bool = Field(False, description="공공데이터 여부")
    public_notice_number: Optional[str] = Field(None, description="공공데이터 공고번호")
    comment: Optional[str] = Field(None, description="공공데이터 특이사항 코멘트")


class AnimalListItemOut(Schema):
    """동물 목록 아이템 출력 스키마 (경량화)"""
    id: str = Field(..., description="동물 ID")
    name: str = Field(..., description="동물 이름")
    is_female: bool = Field(..., description="암컷 여부")
    age: Optional[int] = Field(None, description="나이 (개월)")
    weight: Optional[Decimal] = Field(None, description="체중 (kg)")
    breed: Optional[str] = Field(None, description="품종")
    description: Optional[str] = Field(None, description="동물 설명")
    protection_status: str = Field(..., description="보호 상태")
    adoption_status: str = Field(..., description="입양 상태")
    waiting_days: int = Field(0, description="보호 기간 (일)")
    
    # 기본 성격 지표만 포함 (상세 항목은 제외)
    activity_level: Optional[int] = Field(None, description="활동량 수준")
    sensitivity: Optional[int] = Field(None, description="예민함 정도")
    sociability: Optional[int] = Field(None, description="사회성")
    
    display_notice_number: str = Field(..., description="표시용 공고번호")
    found_location: Optional[str] = Field(None, description="발견 장소")
    admission_date: Optional[str] = Field(None, description="센터 입소일 (ISO 형식)")
    personality: Optional[str] = Field(None, description="성격")
    megaphone_count: int = Field(0, description="확성기(좋아요) 수")
    is_megaphoned: bool = Field(False, description="현재 사용자가 확성기를 눌렀는지 여부")
    center_id: str = Field(..., description="센터 ID")
    animal_images: List[AnimalImageOut] = Field(default_factory=list, description="동물 이미지 목록")
    updated_at: str = Field(..., description="수정일시 (ISO 형식)")
    
    # 공공데이터 관련 필드
    is_public_data: bool = Field(False, description="공공데이터 여부")


class AnimalListOut(Schema):
    """동물 목록 출력 스키마"""
    animals: List[AnimalOut] = Field(..., description="동물 목록")
    total: int = Field(..., description="전체 동물 수")
    page: int = Field(..., description="현재 페이지 번호")
    limit: int = Field(..., description="페이지당 항목 수")
    total_pages: int = Field(..., description="전체 페이지 수")
    has_next: bool = Field(..., description="다음 페이지 존재 여부")
    has_prev: bool = Field(..., description="이전 페이지 존재 여부")


class AnimalStatusUpdateOut(Schema):
    """동물 상태 변경 출력 스키마"""
    id: str = Field(..., description="동물 ID")
    name: str = Field(..., description="동물 이름")
    previous_protection_status: Optional[str] = Field(None, description="이전 보호 상태")
    new_protection_status: Optional[str] = Field(None, description="새로운 보호 상태")
    previous_adoption_status: Optional[str] = Field(None, description="이전 입양 상태")
    new_adoption_status: Optional[str] = Field(None, description="새로운 입양 상태")
    updated_at: str = Field(..., description="상태 변경 일시 (ISO 형식)")
    message: str = Field(..., description="상태 변경 메시지")


class BreedsOut(Schema):
    """품종 목록 출력 스키마"""
    breeds: List[str] = Field(..., description="품종 목록")
    total: int = Field(..., description="전체 품종 수")


class RelatedAnimalsOut(Schema):
    """관련 동물 목록 출력 스키마"""
    animals: List[AnimalOut] = Field(..., description="관련 동물 목록")
    total: int = Field(..., description="관련 동물 수")


class SuccessOut(Schema):
    """성공 응답 스키마"""
    message: str = Field(..., description="성공 메시지")


class MegaphoneToggleOut(Schema):
    """확성기 토글 응답 스키마"""
    is_megaphoned: bool = Field(..., description="확성기 상태")
    megaphone_count: int = Field(..., description="총 확성기 수")
    message: str = Field(..., description="결과 메시지")


class AdoptionStatusCountOut(Schema):
    """입양 상태별 동물 카운트 출력 스키마"""
    adoption_available: int = Field(..., description="입양가능 동물 수")
    adoption_in_progress: int = Field(..., description="입양진행중 동물 수")
    adoption_completed: int = Field(..., description="입양완료 동물 수")
    adoption_unavailable: int = Field(..., description="입양불가 동물 수")
    total: int = Field(..., description="전체 입양 관련 동물 수")


class ErrorOut(Schema):
    """에러 응답 스키마"""
    error: str = Field(..., description="에러 메시지")