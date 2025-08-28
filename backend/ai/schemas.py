from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class MatchingScore(int, Enum):
    """매칭 점수 (1-5점)"""
    VERY_LOW = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    EXCELLENT = 5


class AnimalRecommendation(BaseModel):
    """개별 동물 추천 정보"""
    animal_id: str = Field(..., description="동물 ID")
    animal_name: str = Field(..., description="동물 이름")
    animal_type: str = Field(..., description="동물 종류 (개, 고양이 등)")
    breed: Optional[str] = Field(None, description="품종")
    age: Optional[int] = Field(None, description="나이(개월 수)")
    gender: str = Field(..., description="성별")
    matching_score: int = Field(..., ge=1, le=5, description="매칭 점수 (1-5점)")
    matching_reasons: str = Field(..., description="매칭 이유 (3-4줄 문단 형태)")
    considerations: List[str] = Field(..., description="고려사항 및 주의점")
    care_tips: List[str] = Field(..., description="케어 팁")
    center_name: Optional[str] = Field(None, description="보호센터명")
    adoption_fee: Optional[int] = Field(None, description="입양비")


class PersonalityAnalysis(BaseModel):
    """성격 분석 결과"""
    user_personality_type: str = Field(..., description="사용자 성격 유형")
    key_traits: List[str] = Field(..., description="주요 성격 특성")
    lifestyle_match: str = Field(..., description="라이프스타일 매칭 분석")
    experience_level: str = Field(..., description="반려동물 경험 수준")
    recommendations_summary: str = Field(..., description="추천 요약")


class MatchingReport(BaseModel):
    """매칭 결과 보고서"""
    total_analyzed_animals: int = Field(..., description="분석된 총 동물 수")
    recommended_count: int = Field(..., description="추천된 동물 수")
    analysis_criteria: List[str] = Field(..., description="분석 기준")
    matching_algorithm: str = Field(..., description="매칭 알고리즘 설명")
    confidence_level: str = Field(..., description="추천 신뢰도")
    generated_at: str = Field(..., description="생성 시간")


class AIAnimalMatchingResponse(BaseModel):
    """AI 동물 매칭 최종 응답"""
    analysis_reason: PersonalityAnalysis = Field(..., description="성격 분석 사유")
    matching_report: MatchingReport = Field(..., description="매칭 결과 보고서") 
    animal_recommendations: List[AnimalRecommendation] = Field(..., description="동물 추천 리스트")
    
    class Config:
        json_schema_extra = {
            "example": {
                "analysis_reason": {
                    "user_personality_type": "외향적이고 활동적인 성격",
                    "key_traits": ["활발함", "사교적", "책임감 강함"],
                    "lifestyle_match": "활동적인 라이프스타일에 적합",
                    "experience_level": "중급자",
                    "recommendations_summary": "에너지가 높고 사교적인 동물들을 추천합니다"
                },
                "matching_report": {
                    "total_analyzed_animals": 25,
                    "recommended_count": 3,
                    "analysis_criteria": ["성격 매칭", "활동 수준", "사회성", "케어 난이도"],
                    "matching_algorithm": "AI 기반 성격-동물 특성 매칭",
                    "confidence_level": "높음",
                    "generated_at": "2024-01-20T15:30:00Z"
                },
                "animal_recommendations": [
                    {
                        "animal_id": "12345",
                        "animal_name": "바둑이",
                        "animal_type": "개",
                        "breed": "골든 리트리버",
                        "age": 24,
                        "gender": "수컷",
                        "matching_score": 5,
                        "matching_reasons": "바둑이는 사용자의 외향적이고 활발한 성격과 매우 잘 맞는 골든 리트리버입니다. 높은 사회성을 가지고 있어 가족들과 잘 어울리며, 사용자가 선호하는 활동적인 라이프스타일에 완벽하게 부합합니다. 적당한 운동량을 필요로 하여 함께 산책하며 스트레스를 해소할 수 있고, 친근하고 온순한 성격으로 반려동물 초보자도 쉽게 적응할 수 있습니다.",
                        "considerations": [
                            "매일 1-2시간 산책 필요",
                            "털 빠짐이 많아 정기적인 그루밍 필요"
                        ],
                        "care_tips": [
                            "하루 2회 산책 권장",
                            "주 1회 브러싱",
                            "사회화 훈련 지속"
                        ],
                        "center_name": "서울 동물보호센터",
                        "adoption_fee": 150000
                    }
                ]
            }
        }
