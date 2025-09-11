from langchain_core.tools import tool
from typing import List, Dict, Any, Optional
from django.db import transaction
from asgiref.sync import sync_to_async
import json


@tool
def get_user_personality_test_data(user_id: str) -> Dict[str, Any]:
    """
    사용자의 성격 테스트 데이터를 조회합니다.
    
    Args:
        user_id: 사용자 ID
        
    Returns:
        Dict containing personality test data including answers and results
    """
    from favorites.models import PersonalityTest
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        user = User.objects.get(id=user_id)
        # 가장 최근 성격 테스트 결과 가져오기
        personality_test = PersonalityTest.objects.filter(
            user=user
        ).order_by('-completed_at').first()
        
        if not personality_test:
            return {
                "status": "no_data",
                "message": "사용자의 성격 테스트 데이터가 없습니다."
            }
        
        return {
            "status": "success",
            "user_id": str(user.id),
            #"test_type": personality_test.test_type,
            "answers": personality_test.answers,
            #"result": personality_test.result,
            "completed_at": personality_test.completed_at.isoformat(),
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"성격 테스트 데이터 조회 중 오류: {str(e)}"
        }


@tool
def get_available_animals(
    protection_status: Optional[str] = "보호중",
    adoption_status: Optional[str] = "입양가능",
    animal_type: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    입양 가능한 동물 목록을 조회합니다.
    
    Args:
        protection_status: 보호 상태 (기본값: 보호중)
        adoption_status: 입양 상태 (기본값: 입양가능)
        animal_type: 동물 종류 필터
        limit: 조회할 최대 개수
        
    Returns:
        List of animals with their characteristics
    """
    from animals.models import Animal
    
    try:
        queryset = Animal.objects.filter(
            is_public=True,
            protection_status=protection_status or "보호중",
            adoption_status=adoption_status or "입양가능"
        ).select_related('center')
        
        if animal_type:
            queryset = queryset.filter(animal_type=animal_type)
        
        animals = queryset.order_by('?')[:limit]
        
        animal_list = []
        for animal in animals:
            animal_data = {
                "id": str(animal.id),
                "name": animal.name,
                "announce_number": animal.announce_number,
                "breed": animal.breed,
                "age": animal.age,
                "weight": animal.weight,
                "is_female": animal.is_female,
                "neutering": animal.neutering,
                "personality": animal.personality,
                "description": animal.description,
                "special_needs": animal.special_needs,
                "health_notes": animal.health_notes,
                "activity_level": animal.activity_level,
                "sensitivity": animal.sensitivity,
                "sociability": animal.sociability,
                "separation_anxiety": animal.separation_anxiety,
                "basic_training": animal.basic_training,
                "trainer_comment": animal.trainer_comment,
                "center_name": animal.center.name if animal.center else None,
                "adoption_fee": animal.adoption_fee,
                "found_location": animal.found_location,
                "admission_date": animal.admission_date.isoformat() if animal.admission_date else None,
                "protection_status": animal.protection_status,
                "adoption_status": animal.adoption_status,
            }
            animal_list.append(animal_data)
        
        return animal_list
        
    except Exception as e:
        return [{
            "status": "error",
            "message": f"동물 데이터 조회 중 오류: {str(e)}"
        }]


@tool
def filter_animals_by_characteristics(
    personality_traits: List[str],
    activity_level_range: Optional[tuple] = None,
    sociability_min: Optional[int] = None,
    separation_anxiety_max: Optional[int] = None,
    basic_training_min: Optional[int] = None,
    is_female: Optional[bool] = None,
    size_category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    특정 특성을 가진 동물들을 필터링합니다.
    
    Args:
        personality_traits: 찾고자 하는 성격 특성 키워드 리스트
        activity_level_range: 활동량 범위 (min, max)
        sociability_min: 최소 사회성 점수
        separation_anxiety_max: 최대 분리불안 점수
        basic_training_min: 최소 기본 훈련 점수
        is_female: 성별 필터 (True: 암컷, False: 수컷, None: 전체)
        size_category: 체형 필터 ("소형": 10kg 미만, "중형": 10-25kg, "대형": 25kg 이상, None: 전체)
        
    Returns:
        Filtered list of animals
    """
    from animals.models import Animal
    from django.db.models import Q
    
    try:
        queryset = Animal.objects.filter(
            is_public=True,
            protection_status="보호중",
            adoption_status="입양가능"
        ).select_related('center')
        
        # 성격 키워드 필터링
        if personality_traits:
            personality_q = Q()
            for trait in personality_traits:
                personality_q |= Q(personality__icontains=trait)
            queryset = queryset.filter(personality_q)
        
        # 활동량 필터링
        if activity_level_range:
            min_activity, max_activity = activity_level_range
            queryset = queryset.filter(
                activity_level__gte=min_activity,
                activity_level__lte=max_activity
            )
        
        # 사회성 필터링
        if sociability_min is not None:
            queryset = queryset.filter(sociability__gte=sociability_min)
        
        # 분리불안 필터링
        if separation_anxiety_max is not None:
            queryset = queryset.filter(separation_anxiety__lte=separation_anxiety_max)
        
        # 기본 훈련 필터링
        if basic_training_min is not None:
            queryset = queryset.filter(basic_training__gte=basic_training_min)
        
        # 성별 필터링
        if is_female is not None:
            queryset = queryset.filter(is_female=is_female)
        
        # 체형(몸무게) 필터링
        if size_category:
            if size_category == "소형":
                queryset = queryset.filter(weight__lt=10.0)
            elif size_category == "중형":
                queryset = queryset.filter(weight__gte=10.0, weight__lt=25.0)
            elif size_category == "대형":
                queryset = queryset.filter(weight__gte=25.0)
        
        animals = queryset.order_by('?')[:10]  # 상위 10개만
        
        animal_list = []
        for animal in animals:
            animal_data = {
                "id": str(animal.id),
                "name": animal.name,
                "breed": animal.breed,
                "age": animal.age,
                "is_female": animal.is_female,
                "personality": animal.personality,
                "activity_level": animal.activity_level,
                "sensitivity": animal.sensitivity,
                "sociability": animal.sociability,
                "separation_anxiety": animal.separation_anxiety,
                "basic_training": animal.basic_training,
                "trainer_comment": animal.trainer_comment,
                "center_name": animal.center.name if animal.center else None,
                "protection_status": animal.protection_status,
                "adoption_status": animal.adoption_status,
            }
            animal_list.append(animal_data)
        
        return animal_list
        
    except Exception as e:
        return [{
            "status": "error",
            "message": f"동물 필터링 중 오류: {str(e)}"
        }]


@tool
def get_animal_by_id(animal_id: str) -> Dict[str, Any]:
    """
    특정 동물의 상세 정보를 조회합니다.
    
    Args:
        animal_id: 동물 ID
        
    Returns:
        Detailed animal information
    """
    from animals.models import Animal
    
    try:
        animal = Animal.objects.select_related('center').get(id=animal_id)
        
        return {
            "id": str(animal.id),
            "name": animal.name,
            "announce_number": animal.announce_number,
            "breed": animal.breed,
            "age": animal.age,
            "weight": animal.weight,
            "is_female": animal.is_female,
            "neutering": animal.neutering,
            "vaccination": animal.vaccination,
            "heartworm": animal.heartworm,
            "personality": animal.personality,
            "description": animal.description,
            "special_needs": animal.special_needs,
            "health_notes": animal.health_notes,
            "activity_level": animal.activity_level,
            "sensitivity": animal.sensitivity,
            "sociability": animal.sociability,
            "separation_anxiety": animal.separation_anxiety,
            "basic_training": animal.basic_training,
            "trainer_comment": animal.trainer_comment,
            "center_name": animal.center.name if animal.center else None,
            "adoption_fee": animal.adoption_fee,
            "found_location": animal.found_location,
            "admission_date": animal.admission_date.isoformat() if animal.admission_date else None,
        }
        
    except Animal.DoesNotExist:
        return {
            "status": "not_found",
            "message": "해당 동물을 찾을 수 없습니다."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"동물 정보 조회 중 오류: {str(e)}"
        }


# 도구 그룹화
personality_tools = [
    get_user_personality_test_data
]

animal_tools = [
    get_available_animals,
    filter_animals_by_characteristics,
    get_animal_by_id
]

# 전체 동물 매칭 도구
animal_matching_tools = personality_tools + animal_tools
