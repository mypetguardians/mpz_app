from ninja import Schema, Field
from typing import Optional, List
from datetime import date
from decimal import Decimal


class AnimalCreateIn(Schema):
    """동물 등록 입력 스키마"""
    name: str = Field(..., min_length=1, max_length=50, description="동물 이름")
    center_id: Optional[str] = Field(None, description="센터 ID (훈련사가 동물을 등록할 때 필요)")
    is_female: bool = Field(..., description="암컷 여부")
    neutering: Optional[bool] = Field(None, description="중성화 여부")
    age: Optional[int] = Field(None, ge=0, le=300, description="나이 (개월 단위, 0-300개월)")
    weight: Optional[Decimal] = Field(None, ge=Decimal('0.01'), le=Decimal('999.99'), description="체중 (kg, 0.01-999.99kg)")
    color: Optional[str] = Field(None, max_length=50, description="색상")
    breed: Optional[str] = Field(None, max_length=50, description="품종")
    description: Optional[str] = Field(None, max_length=1000, description="동물 설명")
    protection_status: Optional[str] = Field("보호중", description="보호 상태 (보호중, 임시보호, 안락사, 자연사, 반환, 기증, 방사, 입양완료)")
    adoption_status: Optional[str] = Field("입양가능", description="입양 상태 (입양가능, 입양진행중, 입양완료, 입양불가)")
    activity_level: Optional[str] = Field(None, max_length=50, description="활동량 수준 (1-5)")
    sensitivity: Optional[str] = Field(None, max_length=50, description="예민함 정도 (1-5)")
    sociability: Optional[str] = Field(None, max_length=50, description="사회성 (1-5)")
    separation_anxiety: Optional[str] = Field(None, max_length=50, description="분리불안 정도 (1-5)")
    
    # 사회성 세부 항목들
    confidence: Optional[str] = Field(None, max_length=50, description="새로운 자극/상황 적극성 (1-5)")
    independence: Optional[str] = Field(None, max_length=50, description="독립성 있는 행동 (1-5)")
    physical_contact: Optional[str] = Field(None, max_length=50, description="사람 터치 긍정적 수용 (1-5)")
    handling_acceptance: Optional[str] = Field(None, max_length=50, description="몸 만지기 저항감 (1-5)")
    strangers_attitude: Optional[str] = Field(None, max_length=50, description="낯선 사람 반응 (1-5)")
    objects_attitude: Optional[str] = Field(None, max_length=50, description="낯선 사물 반응 (1-5)")
    environment_attitude: Optional[str] = Field(None, max_length=50, description="낯선 환경 반응 (1-5)")
    dogs_attitude: Optional[str] = Field(None, max_length=50, description="낯선 강아지 반응 (1-5)")
    
    # 분리불안 세부 항목들
    coping_ability: Optional[str] = Field(None, max_length=50, description="낯선 공간 혼자 남겨졌을 때 반응 (1-5)")
    playfulness_level: Optional[str] = Field(None, max_length=50, description="장난감/바디시그널 놀이 유도 반응 (1-5)")
    walkability_level: Optional[str] = Field(None, max_length=50, description="산책 과정에서 모습 (1-5)")
    grooming_acceptance_level: Optional[str] = Field(None, max_length=50, description="그루밍 진행 시 모습 (1-5)")
    
    special_notes: Optional[str] = Field(None, max_length=1000, description="특이사항")
    health_notes: Optional[str] = Field(None, max_length=1000, description="건강 정보")
    trainer_comment: Optional[str] = Field(None, max_length=1000, description="훈련사 코멘트")
    announce_number: Optional[str] = Field(None, max_length=50, description="공고번호")
    announcement_date: Optional[date] = Field(None, description="공고일")
    found_location: Optional[str] = Field(None, max_length=200, description="발견 장소")
    personality: Optional[str] = Field(None, max_length=500, description="성격")
    comment: Optional[str] = Field(None, max_length=1000, description="공공데이터 특이사항 코멘트")
    
    # 이미지 관련 필드
    image_urls: Optional[List[str]] = Field(None, description="동물 이미지 URL 목록")


class AnimalImageCreateIn(Schema):
    """동물 이미지 생성 입력 스키마"""
    image_url: str = Field(..., max_length=500, description="이미지 URL")
    is_primary: Optional[bool] = Field(False, description="대표 이미지 여부")
    sequence: Optional[int] = Field(0, description="이미지 순서")


class AnimalUpdateIn(Schema):
    """동물 정보 수정 입력 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="동물 이름")
    is_female: Optional[bool] = Field(None, description="암컷 여부")
    neutering: Optional[bool] = Field(None, description="중성화 여부")
    age: Optional[int] = Field(None, ge=0, le=300, description="나이 (개월 단위, 0-300개월)")
    weight: Optional[Decimal] = Field(None, ge=Decimal('0.01'), le=Decimal('999.99'), description="체중 (kg, 0.01-999.99kg)")
    color: Optional[str] = Field(None, max_length=50, description="색상")
    breed: Optional[str] = Field(None, max_length=50, description="품종")
    description: Optional[str] = Field(None, max_length=1000, description="동물 설명")
    protection_status: Optional[str] = Field(None, description="보호 상태 (보호중, 임시보호, 안락사, 자연사, 반환, 기증, 방사, 입양완료)")
    adoption_status: Optional[str] = Field(None, description="입양 상태 (입양가능, 입양진행중, 입양완료, 입양불가)")
    activity_level: Optional[str] = Field(None, max_length=50, description="활동량 수준")
    sensitivity: Optional[str] = Field(None, max_length=50, description="예민함 정도")
    sociability: Optional[str] = Field(None, max_length=50, description="사회성")
    separation_anxiety: Optional[str] = Field(None, max_length=50, description="분리불안 정도")
    special_notes: Optional[str] = Field(None, max_length=1000, description="특이사항")
    health_notes: Optional[str] = Field(None, max_length=50, description="건강 정보")
    basic_training: Optional[str] = Field(None, max_length=500, description="기본 훈련 상태")
    trainer_comment: Optional[str] = Field(None, max_length=1000, description="훈련사 코멘트")
    announce_number: Optional[str] = Field(None, max_length=50, description="공고번호")
    admission_date: Optional[date] = Field(None, description="공고일")
    found_location: Optional[str] = Field(None, max_length=200, description="발견 장소")
    personality: Optional[str] = Field(None, max_length=500, description="성격")
    # 이미지 URL 목록(전체 교체)
    image_urls: Optional[List[str]] = Field(None, description="동물 이미지 URL 목록 (전체 교체)")


class AnimalStatusUpdateIn(Schema):
    """동물 상태 변경 입력 스키마"""
    protection_status: Optional[str] = Field(None, description="새로운 보호 상태")
    adoption_status: Optional[str] = Field(None, description="새로운 입양 상태")


class AnimalListQueryIn(Schema):
    """동물 목록 조회 쿼리 입력 스키마"""
    status: Optional[str] = Field(None, description="동물 상태 필터 (단일 값 또는 쉼표로 구분된 여러 값: '반환,방사')")
    center_id: Optional[str] = Field(None, description="센터 ID 필터")
    gender: Optional[str] = Field(None, description="성별 필터 (male/female)")
    weight_min: Optional[Decimal] = Field(None, description="최소 체중 (kg)")
    weight_max: Optional[Decimal] = Field(None, description="최대 체중 (kg)")
    age_min: Optional[int] = Field(None, description="최소 나이 (개월)")
    age_max: Optional[int] = Field(None, description="최대 나이 (개월)")
    breed: Optional[str] = Field(None, description="품종 필터")
    search: Optional[str] = Field(None, description="통합 검색 (품종, 이름, 발견장소)")
    region: Optional[str] = Field(None, description="지역 필터")
    city: Optional[str] = Field(None, description="시/군 필터 (예: 서울시, 수원시)")
    has_trainer_comment: Optional[str] = Field(None, description="훈련사 코멘트 존재 여부 (true/false)")
    sort_by: Optional[str] = Field("created_at", description="정렬 기준 (created_at, admission_date, megaphone_count)")
    sort_order: Optional[str] = Field("desc", description="정렬 순서 (asc/desc)")
    protection_status: Optional[str] = Field(None, description="보호 상태 필터 (보호중, 임시보호, 안락사, 자연사, 반환, 기증, 방사, 입양완료)")
    adoption_status: Optional[str] = Field(None, description="입양 상태 필터 (입양가능, 입양진행중, 입양완료, 입양불가)")


class MegaphoneToggleIn(Schema):
    """확성기 토글 입력 스키마"""
    pass  # 추가 데이터 없음

class RelatedAnimalsQueryIn(Schema):
    """관련 동물 조회 쿼리 스키마"""
    limit: Optional[int] = Field(6, ge=1, le=20, description="조회할 관련 동물 수 (최대 20)")