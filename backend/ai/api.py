from ninja import Router, Schema, Field
from ninja.errors import HttpError
from typing import List, Dict, Any, Optional
from django.http import HttpRequest
import uuid
from datetime import datetime

from api.security import jwt_auth
from ai.schemas import AIAnimalMatchingResponse
from ai.services import (
    run_agent_recommendation,
    update_personality_test,
    save_recommendation_result,
    test_with_agent,
    save_personality_test_data,
    retrieve_personality_test_data,
    retrieve_user_personality_tests,
)
from favorites.models import PersonalityTest

router = Router(tags=["AI_Animal_Matching"])


class AnimalRecommendationRequest(Schema):
    """동물 추천 요청 스키마"""
    user_id: Optional[str] = Field(None, description="사용자 ID (없으면 현재 로그인 사용자 사용)")
    preferences: Dict[str, Any] = Field(..., description="필수 선호사항")
    limit: Optional[int] = Field(5, description="추천받을 동물 수 (기본값: 5)")


class AnimalRecommendationResponse(Schema):
    """동물 추천 응답 스키마"""
    success: bool = Field(..., description="성공 여부")
    data: Dict[str, Any] = Field(..., description="AI 매칭 결과 (구조화된 응답)")
    meta: Dict[str, Any] = Field(..., description="메타 정보")


class PersonalityTestAnswer(Schema):
    """성격 테스트 개별 질문 응답"""
    question_id: str = Field(..., description="질문 ID")
    question_text: str = Field(..., description="질문 내용")
    answer: str = Field(..., description="사용자 응답")
    answer_type: str = Field(..., description="응답 타입 (text, choice, scale 등)")


class PersonalityTestSubmission(Schema):
    """성격 테스트 제출 데이터"""
    test_name: str = Field(..., description="테스트 이름")
    test_version: Optional[str] = Field("v1.0", description="테스트 버전")
    answers: List[PersonalityTestAnswer] = Field(..., description="질문-응답 목록")
    additional_notes: Optional[str] = Field(None, description="추가 메모")
    test_duration_minutes: Optional[int] = Field(None, description="테스트 소요 시간(분)")


class PersonalityTestResponse(Schema):
    """성격 테스트 저장 응답"""
    success: bool = Field(..., description="성공 여부")
    test_id: str = Field(..., description="저장된 테스트 ID")
    message: str = Field(..., description="응답 메시지")
    saved_at: str = Field(..., description="저장 시간")


@router.post(
    "/recommend",
    summary="[AI] 동물 추천",
    description="사용자의 성격 테스트 결과를 기반으로 적합한 동물을 AI가 추천합니다.",
    response={
        200: AnimalRecommendationResponse,
        400: dict,
        401: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def recommend_animals(request: HttpRequest, data: AnimalRecommendationRequest):
    """AI 기반 동물 추천 API - 에이전트 직접 활용"""
    try:
        current_user = request.auth
        target_user_id = str(current_user.id)
        
        # 요청 데이터 로깅
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔍 AI 추천 요청 받음 - 사용자 ID: {target_user_id}")
        logger.info(f"📝 받은 preferences 데이터: {data.preferences}")
        logger.info(f"📊 preferences 타입: {type(data.preferences)}")
        logger.info(f"📏 preferences 길이: {len(data.preferences) if data.preferences else 0}")
        logger.info(f"🔢 요청 추천 수: {data.limit}")
        
        # preferences 내용 상세 로깅
        if data.preferences:
            for key, value in data.preferences.items():
                logger.info(f"  - {key}: {value} (타입: {type(value)})")
        else:
            logger.warning("⚠️ preferences가 비어있습니다!")
        
        # 권한 체크: 자신의 추천만 받을 수 있음 (일반 사용자의 경우)
        if current_user.user_type == "일반사용자" and target_user_id != str(current_user.id):
            logger.warning(f"❌ 권한 오류 - 사용자 {current_user.id}가 다른 사용자 {target_user_id}의 추천 요청")
            raise HttpError(403, "자신의 동물 추천만 받을 수 있습니다")
        
        # PersonalityTest 업데이트 실행
        logger.info("🔄 PersonalityTest 업데이트 시작...")
        personality_update_result = await update_personality_test(current_user, data.preferences)
        logger.info(f"✅ PersonalityTest 업데이트 완료: {personality_update_result}")
        
        # AI 추천 실행
        logger.info("🤖 AI 추천 실행 시작...")
        ai_result = await run_agent_recommendation(target_user_id, data.limit)
        logger.info(f"🎯 AI 추천 완료. 결과 타입: {type(ai_result)}")
        
        # 추천 결과에서 동물 수 로깅
        if isinstance(ai_result, dict) and "animal_recommendations" in ai_result:
            animal_count = len(ai_result["animal_recommendations"])
            logger.info(f"🐕 추천된 동물 수: {animal_count}마리")
            for i, animal in enumerate(ai_result["animal_recommendations"]):
                animal_name = animal.get("animal_name", "이름없음")
                animal_id = animal.get("animal_id", "ID없음")
                logger.info(f"  {i+1}. {animal_name} (ID: {animal_id})")
        else:
            logger.warning(f"⚠️ 예상과 다른 AI 결과 형식: {ai_result}")
        
        # 추천 결과 저장 실행
        logger.info("💾 추천 결과 저장 시작...")
        save_result = await save_recommendation_result(target_user_id, ai_result, data.preferences, data.limit)
        logger.info(f"💾 추천 결과 저장 완료: {save_result}")        # 응답 구성
        logger.info("📦 최종 응답 구성 중...")
        response_data = {
            "success": True,
            "data": ai_result,
            "personality_test_status": personality_update_result,
            "save_status": save_result,
            "meta": {
                "user_id": target_user_id,
                "request_limit": data.limit,
                "preferences": data.preferences,
                "generated_at": datetime.now().isoformat(),
                "api_version": "v1.0",
                "model_used": "gpt-4o-mini",
                "agent_used": "animal-matching-assistant"
            }
        }
        
        logger.info("🎉 AI 추천 API 처리 완료!")
        return response_data
        
    except HttpError:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"❌ AI 동물 추천 중 오류 발생!")
        logger.error(f"❌ 오류 메시지: {str(e)}")
        logger.error(f"❌ 요청 데이터 - preferences: {getattr(data, 'preferences', 'N/A')}")
        logger.error(f"❌ 요청 데이터 - limit: {getattr(data, 'limit', 'N/A')}")
        logger.error(f"❌ 사용자 ID: {target_user_id if 'target_user_id' in locals() else 'N/A'}")
        raise HttpError(500, f"AI 추천 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/test-tools",
    summary="[AI] 도구 테스트",
    description="AI 도구들이 제대로 작동하는지 테스트합니다.",
    response={200: dict, 500: dict},
    auth=jwt_auth,
)
async def test_ai_tools(request: HttpRequest):
    """AI 도구 테스트 API - 에이전트 활용"""
    try:
        current_user = request.auth
        
        test_results = await test_with_agent(str(current_user.id))
        
        return {
            "status": "success",
            "message": "AI 도구 및 에이전트 테스트 완료",
            "results": test_results,
            "user_id": str(current_user.id),
            "test_time": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HttpError(500, f"도구 테스트 중 오류: {str(e)}")


@router.post(
    "/personality-test",
    summary="[AI] 성격 테스트 결과 저장",
    description="사용자의 성격 테스트 질문과 응답을 Q&A 조합으로 JSON 형태로 저장합니다.",
    response={
        200: PersonalityTestResponse,
        400: dict,
        401: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def save_personality_test(request: HttpRequest, data: PersonalityTestSubmission):
    """성격 테스트 결과 저장 API"""
    try:
        current_user = request.auth
        
        # Q&A 조합을 JSON 형태로 구성
        qa_data = []
        for answer in data.answers:
            qa_item = {
                "question_id": answer.question_id,
                "question": answer.question_text,
                "answer": answer.answer,
                "answer_type": answer.answer_type
            }
            qa_data.append(qa_item)
        
        # 성격 테스트 데이터 저장 실행
        save_result = await save_personality_test_data(current_user, data.test_name, qa_data)
        
        return PersonalityTestResponse(**save_result)
        
    except HttpError:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"성격 테스트 저장 중 오류: {str(e)}")
        raise HttpError(500, f"성격 테스트 저장 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/personality-test/{test_id}",
    summary="[AI] 성격 테스트 결과 조회",
    description="저장된 성격 테스트 결과를 조회합니다.",
    response={
        200: dict,
        401: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def get_personality_test(request: HttpRequest, test_id: str):
    """성격 테스트 결과 조회 API"""
    try:
        current_user = request.auth
        
        # 성격 테스트 데이터 조회 실행
        retrieve_result = await retrieve_personality_test_data(test_id, str(current_user.id))
        
        if not retrieve_result["success"]:
            if "찾을 수 없습니다" in retrieve_result["message"]:
                raise HttpError(404, retrieve_result["message"])
            else:
                raise HttpError(500, retrieve_result["message"])
        
        return retrieve_result
        
    except HttpError:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"성격 테스트 조회 중 오류: {str(e)}")
        raise HttpError(500, f"성격 테스트 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/personality-test/user/{user_id}",
    summary="[AI] 사용자별 성격 테스트 목록 조회",
    description="특정 사용자의 모든 성격 테스트 목록을 조회합니다.",
    response={
        200: dict,
        401: dict,
        403: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def get_user_personality_tests(request: HttpRequest, user_id: str):
    """사용자별 성격 테스트 목록 조회 API"""
    try:
        current_user = request.auth
        
        # 권한 체크: 자신의 테스트만 조회 가능 (일반 사용자의 경우)
        if current_user.user_type == "일반사용자" and user_id != str(current_user.id):
            raise HttpError(403, "자신의 성격 테스트만 조회할 수 있습니다")
        
        # 사용자별 성격 테스트 데이터 조회 실행
        retrieve_result = await retrieve_user_personality_tests(user_id)
        
        if not retrieve_result["success"]:
            raise HttpError(500, retrieve_result["message"])
        
        return retrieve_result
        
    except HttpError:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"사용자별 성격 테스트 조회 중 오류: {str(e)}")
        raise HttpError(500, f"사용자별 성격 테스트 조회 중 오류가 발생했습니다: {str(e)}")
