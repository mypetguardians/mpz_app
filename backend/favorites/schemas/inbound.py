from ninja import Schema, Field
from pydantic import ConfigDict
from typing import Optional, Dict, Any, List


class FavoriteListQueryIn(Schema):
    """찜 목록 조회 쿼리 스키마"""
    # @paginate 데코레이터가 page, limit을 자동으로 처리하므로 제거
    pass


class BatchAnimalFavoriteIn(Schema):
    """동물 찜 상태 일괄 조회 입력 스키마"""
    animal_ids: List[str] = Field(..., description="동물 ID 목록 (최대 100개)")


class PersonalityTestIn(Schema):
    """성격 테스트 입력 스키마 (간단 버전)"""
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "answers": {
                "당신의 생활 공간에 더 가까운 것은 어떤 편인가요?": "조용한 분위기를 좋아해요",
                "평소 활동량은 어느 정도인가요?": "적당히 활동적이에요",
                "반려동물과 함께하는 시간은?": "매일 충분히 시간을 낼 수 있어요"
            }
        }
    })

    answers: Dict[str, str] = Field(..., description="질문-답변 쌍")
