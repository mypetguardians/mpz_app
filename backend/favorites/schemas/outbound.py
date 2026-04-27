from ninja import Schema, Field
from typing import List, Optional, Dict, Any


class FavoriteToggleOut(Schema):
    """찜 토글 출력 스키마"""
    is_favorited: bool = Field(..., description="찜 상태")
    message: str = Field(..., description="결과 메시지")
    total_favorites: int = Field(..., description="총 찜 개수")


class FavoriteStatusOut(Schema):
    """찜 상태 확인 출력 스키마"""
    is_favorited: bool = Field(..., description="찜 상태")
    total_favorites: int = Field(..., description="총 찜 개수")


class CenterFavoriteOut(Schema):
    """찜한 센터 출력 스키마"""
    id: str = Field(..., description="센터 ID")
    name: str = Field(..., description="센터명")
    location: Optional[str] = Field(None, description="센터 위치 (공개 설정에 따라 조건부 노출)")
    region: Optional[str] = Field(None, description="센터 지역")
    phone_number: Optional[str] = Field(None, description="센터 전화번호")
    image_url: Optional[str] = Field(None, description="센터 이미지 URL")
    is_favorited: bool = Field(True, description="찜 상태 (항상 True)")
    favorited_at: str = Field(..., description="찜한 일시 (ISO 형식)")


class CenterFavoriteListOut(Schema):
    """찜한 센터 목록 출력 스키마"""
    centers: List[CenterFavoriteOut] = Field(..., description="찜한 센터 목록")
    total: int = Field(..., description="전체 찜한 센터 수")
    page: int = Field(..., description="현재 페이지 번호")
    limit: int = Field(..., description="페이지당 항목 수")
    total_pages: int = Field(..., description="전체 페이지 수")
    has_next: bool = Field(..., description="다음 페이지 존재 여부")
    has_prev: bool = Field(..., description="이전 페이지 존재 여부")


class AnimalFavoriteOut(Schema):
    """찜한 동물 출력 스키마"""
    id: str = Field(..., description="동물 ID")
    name: str = Field(..., description="동물 이름")
    breed: Optional[str] = Field(None, description="품종")
    age: Optional[int] = Field(None, description="나이 (개월)")
    isFemale: Optional[bool] = Field(None, description="암컷 여부")
    protection_status: str = Field(..., description="보호 상태 (보호중, 안락사, 자연사, 반환)")
    adoption_status: str = Field(..., description="입양 상태 (입양가능, 입양진행중, 입양완료, 입양불가)")
    personality: Optional[str] = Field(None, description="성격")
    found_location: Optional[str] = Field(None, description="발견 장소")
    admission_date: Optional[str] = Field(None, description="센터 입소일 (ISO 형식)")
    centerId: Optional[str] = Field(None, description="센터 ID")
    centerName: Optional[str] = Field(None, description="센터명")
    animalImages: List[str] = Field(default_factory=list, description="동물 이미지 URL 목록")
    isFavorited: Optional[bool] = Field(None, description="찜 상태")
    favoritedAt: Optional[str] = Field(None, description="찜한 일시 (ISO 형식)")
    status: Optional[str] = Field(None, description="동물 상태")


class AnimalFavoriteListOut(Schema):
    """찜한 동물 목록 출력 스키마"""
    animals: List[AnimalFavoriteOut] = Field(..., description="찜한 동물 목록")
    total: int = Field(..., description="전체 찜한 동물 수")
    page: int = Field(..., description="현재 페이지 번호")
    limit: int = Field(..., description="페이지당 항목 수")
    totalPages: int = Field(..., description="전체 페이지 수")
    hasNext: bool = Field(..., description="다음 페이지 존재 여부")
    hasPrev: bool = Field(..., description="이전 페이지 존재 여부")


class BatchFavoriteStatusOut(Schema):
    """동물 찜 상태 일괄 조회 출력 스키마"""
    statuses: Dict[str, bool] = Field(..., description="동물 ID별 찜 상태")


class ErrorOut(Schema):
    """에러 응답 스키마"""
    error: str = Field(..., description="에러 메시지")


class PersonalityTestOut(Schema):
    """성격 테스트 출력 스키마 (간단 버전)"""
    id: str = Field(..., description="테스트 ID")
    answers: Dict[str, str] = Field(..., description="질문-답변 쌍")
    completed_at: str = Field(..., description="완료 시간")
    message: str = Field(..., description="결과 메시지")
