"""AI 관련 서비스 로직 모듈"""

from typing import Dict, Any
from datetime import datetime
from asgiref.sync import sync_to_async
import uuid
import re
from langchain_core.output_parsers import PydanticOutputParser

from ai.agents import get_animal_matching_agent
from ai.schemas import AIAnimalMatchingResponse
from ai.prompts import SIMPLE_RECOMMENDATION_PROMPT, TOOL_TEST_PROMPT
from ai.tools import (
    get_user_personality_test_data,
    get_available_animals,
)
from favorites.models import PersonalityTest


@sync_to_async
def run_agent_recommendation(target_user_id: str, limit: int):
    """에이전트를 사용한 AI 추천 실행"""
    try:
        # AI 에이전트 생성
        agent = get_animal_matching_agent()
        
        # 대화 세션 ID 생성
        thread_id = str(uuid.uuid4())
        
        # 에이전트에게 직접 추천 요청
        user_query = SIMPLE_RECOMMENDATION_PROMPT.format(
            user_id=target_user_id,
            limit=limit
        )
        
        # AI 에이전트 실행
        result = agent.invoke(
            {"messages": [("user", user_query)]},
            config={"configurable": {"thread_id": thread_id}}
        )
        
    # 응답에서 JSON 구조 추출 시도
        ai_response = result["messages"][-1].content
        
        # AI 응답 원본 로깅
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[AI 응답 원본] user_id: {target_user_id}, ai_response: {ai_response}")
        
        # Pydantic Parser로 구조화된 응답 파싱 시도
        parser = PydanticOutputParser(pydantic_object=AIAnimalMatchingResponse)
        
        try:
            # JSON 부분만 추출하여 파싱
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                parsed_response = parser.parse(json_str)
                return parsed_response.dict()
            else:
                # JSON 형태가 아닌 경우 raw 응답 반환
                return {
                    "raw_response": ai_response,
                    "parsing_status": "failed - no JSON found"
                }
        except Exception as parse_error:
            # 파싱 실패 시 raw 응답 반환
            return {
                "raw_response": ai_response,
                "parsing_status": f"failed - {str(parse_error)}"
            }
        
    except Exception as e:
        return {
            "error": f"에이전트 실행 중 오류: {str(e)}",
            "status": "agent_error"
        }


@sync_to_async
def update_personality_test(current_user, preferences: Dict[str, Any]):
    """PersonalityTest 생성 또는 업데이트"""
    try:
        # 해당 사용자의 기존 PersonalityTest 찾기
        existing_test = PersonalityTest.objects.filter(
            user_id=current_user.id
        ).order_by('-completed_at').first()
        
        if existing_test:
            # 기존 테스트 업데이트 (answers 덮어쓰기 - preferences 그대로 저장)
            existing_test.answers = preferences
            existing_test.completed_at = datetime.now()
            existing_test.save()
            
            return {
                "action": "updated",
                "personality_test_id": str(existing_test.id),
                "message": "기존 성격 테스트가 preferences로 업데이트되었습니다."
            }
        else:
            new_test = PersonalityTest.objects.create(
                user=current_user,
                test_type="AI_Preferences",
                answers=preferences,  # preferences 그대로 저장
                completed_at=datetime.now()
            )
            
            return {
                "action": "created",
                "personality_test_id": str(new_test.id),
                "message": "새로운 성격 테스트가 preferences로 생성되었습니다."
            }
            
    except Exception as e:
        return {
            "action": "error",
            "error": f"PersonalityTest 처리 중 오류: {str(e)}"
        }


@sync_to_async
def save_recommendation_result(target_user_id: str, ai_result: Dict[str, Any], preferences: Dict[str, Any], limit: int):
    """추천 결과를 PersonalityTest의 result 필드에 저장"""
    try:
        # 해당 사용자의 가장 최근 PersonalityTest 가져오기
        latest_test = PersonalityTest.objects.filter(
            user_id=target_user_id
        ).order_by('-completed_at').first()
        
        if latest_test:
            # AI 추천 결과를 result 필드에 저장
            recommendation_result = {
                "ai_recommendation": ai_result,
                "recommendation_date": datetime.now().isoformat(),
                "model_used": "gpt-4o-mini",
                "agent_used": "animal-matching-assistant",
                "preferences": preferences,
                "limit": limit
            }
            
            latest_test.result = recommendation_result
            latest_test.save()
            
            return {
                "saved": True,
                "personality_test_id": str(latest_test.id),
                "message": "추천 결과가 성격 테스트 result 필드에 저장되었습니다."
            }
        else:
            return {
                "saved": False,
                "message": "해당 사용자의 성격 테스트를 찾을 수 없습니다."
            }
            
    except Exception as e:
        return {
            "saved": False,
            "error": f"결과 저장 중 오류: {str(e)}"
        }


@sync_to_async  
def test_with_agent(current_user_id: str):
    """에이전트를 사용한 도구 테스트"""
    results = {}
    
    try:
        # AI 에이전트 생성 테스트
        agent = get_animal_matching_agent()
        
        # 도구 테스트 프롬프트 실행
        test_query = TOOL_TEST_PROMPT.format(user_id=str(current_user_id))
        
        # 에이전트 실행
        thread_id = str(uuid.uuid4())
        result = agent.invoke(
            {"messages": [("user", test_query)]},
            config={"configurable": {"thread_id": thread_id}}
        )
        
        ai_response = result["messages"][-1].content
        
        results["agent_test"] = {
            "success": True,
            "response": ai_response,
            "thread_id": thread_id
        }
        
    except Exception as e:
        results["agent_test"] = {"error": f"에이전트 테스트 실패: {str(e)}"}
    
    # 개별 도구 직접 테스트
    try:
        personality_result = get_user_personality_test_data.invoke({"user_id": str(current_user_id)})
        results["direct_personality_test"] = personality_result
    except Exception as e:
        results["direct_personality_test"] = {"error": str(e)}
    
    try:
        animals_result = get_available_animals.invoke({"limit": 2})
        results["direct_animals_test"] = {
            "count": len(animals_result) if isinstance(animals_result, list) else 0,
            "sample": animals_result[:1] if animals_result and isinstance(animals_result, list) else []
        }
    except Exception as e:
        results["direct_animals_test"] = {"error": str(e)}
    
    return results


@sync_to_async
def save_personality_test_data(current_user, test_name: str, answers_data: list):
    """성격 테스트 데이터를 데이터베이스에 저장"""
    try:
        # PersonalityTest 모델에 저장 (result는 비워둠)
        personality_test = PersonalityTest.objects.create(
            user=current_user,
            test_type=test_name,
            answers=answers_data,  # answers 필드에만 Q&A 데이터 저장
            # result는 None으로 비워둠 (AI 분석 후 별도로 저장)
            completed_at=datetime.now()
        )
        
        return {
            "success": True,
            "test_id": str(personality_test.id),
            "message": "성격 테스트 결과가 성공적으로 저장되었습니다.",
            "saved_at": personality_test.completed_at.isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "test_id": "",
            "message": f"데이터 저장 중 오류가 발생했습니다: {str(e)}",
            "saved_at": ""
        }


@sync_to_async
def retrieve_personality_test_data(test_id: str, current_user_id: str):
    """데이터베이스에서 성격 테스트 데이터 조회"""
    try:
        # UUID 형식 검증
        import uuid
        try:
            uuid.UUID(test_id)
        except ValueError:
            return {
                "success": False,
                "message": "해당 테스트를 찾을 수 없습니다."
            }
        
        # 해당 테스트 데이터 조회
        personality_test = PersonalityTest.objects.get(id=test_id)
        
        # 권한 체크: 자신의 테스트만 조회 가능
        if str(personality_test.user.id) != str(current_user_id):
            return {
                "success": False,
                "message": "해당 테스트에 대한 접근 권한이 없습니다."
            }
        
        return {
            "success": True,
            "test_data": personality_test.answers,  # answers 필드 반환
            "test_type": personality_test.test_type,
            "completed_at": personality_test.completed_at.isoformat(),
            "user_id": str(personality_test.user.id),
            "result": personality_test.result  # AI 분석 결과 (있다면)
        }
        
    except PersonalityTest.DoesNotExist:
        return {
            "success": False,
            "message": "해당 테스트를 찾을 수 없습니다."
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"데이터 조회 중 오류가 발생했습니다: {str(e)}"
        }


@sync_to_async
def retrieve_user_personality_tests(user_id: str):
    """사용자의 최신 성격 테스트 데이터 조회"""
    try:
        # 해당 사용자의 최신 테스트 하나만 조회
        latest_test = PersonalityTest.objects.filter(
            user_id=user_id
        ).order_by('-completed_at').first()
        
        if latest_test:
            test_summary = {
                "test_id": str(latest_test.id),
                "test_type": latest_test.test_type,
                "completed_at": latest_test.completed_at.isoformat(),
                "total_questions": len(latest_test.answers) if latest_test.answers else 0,
                "test_name": latest_test.test_type,
                "test_result": latest_test.result if latest_test.result else None
            }
            
            return {
                "success": True,
                "user_id": user_id,
                "test": test_summary
            }
        else:
            return {
                "success": True,
                "user_id": user_id,
                "test": None,
                "message": "성격 테스트 데이터가 없습니다."
            }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"데이터 조회 중 오류가 발생했습니다: {str(e)}"
        }