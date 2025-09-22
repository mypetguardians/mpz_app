from typing import List, Dict, Any, Optional
from django.db.models import Q
from asgiref.sync import sync_to_async
from user.models import User
from centers.models import Center
from adoptions.models import Adoption, AdoptionQuestionResponse, AdoptionContract, AdoptionMonitoring
from animals.models import Animal, AnimalImage
from adoptions.schemas.center_outbound import (
    CenterAdoptionOut, UserInfoOut, QuestionResponseOut, 
    AgreementsOut, TimelineOut
)
from adoptions.schemas.user_outbound import (
    UserAdoptionOut, UserAdoptionDetailOut, QuestionResponseOut as UserQuestionResponseOut,
    ContractOut, MonitoringPostOut
)
from ninja.errors import HttpError


def should_show_contact_info(status: str) -> bool:
    """연락처 정보를 표시해야 하는지 확인"""
    return status in ["미팅", "계약서작성", "입양완료", "모니터링"]


async def get_user_center(user: User) -> Center:
    """사용자의 센터 정보 조회"""
    try:
        # 센터 소유자인 경우
        center = await Center.objects.aget(owner=user)
        return center
    except Center.DoesNotExist:
        try:
            # 센터에 소속된 사용자인 경우
            center = await Center.objects.aget(members=user)
            return center
        except Center.DoesNotExist:
            raise HttpError(400, "등록된 센터가 없습니다")


def build_adoption_filter_conditions(center: Center, status_filter: str = None, animal_id_filter: str = None) -> Q:
    """입양 신청 필터 조건 생성"""
    where_conditions = Q(animal__center=center)
    
    if status_filter:
        where_conditions &= Q(status=status_filter)
    
    if animal_id_filter:
        where_conditions &= Q(animal_id=animal_id_filter)
    
    return where_conditions


async def build_center_adoption_response(adoption: Adoption, center: Center) -> CenterAdoptionOut:
    """센터 입양 신청 응답 데이터 생성"""
    # 해당 입양 신청의 질문 응답 조회
    question_responses = await sync_to_async(list)(
        AdoptionQuestionResponse.objects.select_related('question')
        .filter(question__center=center, adoption=adoption)
    )
    
    # 동물 이미지 조회
    animal_image = await sync_to_async(lambda: adoption.animal.animalimage_set.first())()
    
    show_contact_info = should_show_contact_info(adoption.status)
    
    return CenterAdoptionOut(
        id=str(adoption.id),
        user_id=str(adoption.user.id),
        animal_id=str(adoption.animal.id),
        animal_name=adoption.animal.name,
        animal_image=animal_image.image_url if animal_image else None,
        animal_protection_status=adoption.animal.protection_status,
        animal_adoption_status=adoption.animal.adoption_status,
        status=adoption.status,
        notes=adoption.notes,
        center_notes=adoption.center_notes,
        user_info=UserInfoOut(
            name=adoption.user.nickname or "정보 없음",
            phone=adoption.user.phone_number if show_contact_info else None,
            address=adoption.user.address if show_contact_info else None,
            address_is_public=await sync_to_async(lambda: getattr(adoption.user, 'address_is_public', False))()
        ),
        question_responses=[
            QuestionResponseOut(
                question_id=str(response.question.id),
                question_content=response.question.content,
                answer=response.answer
            ) for response in question_responses
        ],
        agreements=AgreementsOut(
            monitoring=adoption.monitoring_agreement,
            guidelines=adoption.guidelines_agreement
        ),
        timeline=TimelineOut(
            applied_at=adoption.created_at.isoformat(),
            meeting_scheduled_at=adoption.meeting_scheduled_at.isoformat() if adoption.meeting_scheduled_at else None,
            contract_sent_at=adoption.contract_sent_at.isoformat() if adoption.contract_sent_at else None,
            adoption_completed_at=adoption.adoption_completed_at.isoformat() if adoption.adoption_completed_at else None,
            monitoring_started_at=adoption.monitoring_started_at.isoformat() if adoption.monitoring_started_at else None,
            monitoring_next_check_at=adoption.monitoring_next_check_at.isoformat() if adoption.monitoring_next_check_at else None
        ),
        created_at=adoption.created_at.isoformat(),
        updated_at=adoption.updated_at.isoformat()
    )


def validate_status_transition(current_status: str, new_status: str) -> bool:
    """상태 변경 유효성 검사"""
    valid_transitions = {
        "신청": ["미팅", "취소"],
        "미팅": ["계약서작성", "취소"],
        # 기존: 계약서작성 → 입양완료(자동). 요구사항에 따라 모니터링으로 직접 전환 허용
        "계약서작성": ["취소", "모니터링"],
        "입양완료": ["모니터링", "취소"],
        "모니터링": ["취소"],
    }
    
    return current_status in valid_transitions and new_status in valid_transitions[current_status]


async def validate_center_permissions(user: User) -> bool:
    """센터 관리자 권한 확인"""
    return await sync_to_async(lambda: user.user_type in [User.UserTypeChoice.center_admin, User.UserTypeChoice.center_super_admin])()


async def validate_center_super_admin_permissions(user: User) -> bool:
    """센터 최고 관리자 권한 확인"""
    return await sync_to_async(lambda: user.user_type == User.UserTypeChoice.center_super_admin)()


async def can_view_user_adoptions(current_user: User, target_user_id: str) -> bool:
    """사용자 입양 신청 조회 권한 확인"""
    # 본인인 경우
    if str(current_user.id) == target_user_id:
        return True
    
    # 센터 관리자 또는 최고 관리자인 경우
    if await validate_center_permissions(current_user) or await validate_center_super_admin_permissions(current_user):
        return True
    
    return False


async def build_user_adoption_response(adoption: Adoption, animal: Animal, 
                                     center: Center, animal_image: AnimalImage = None) -> UserAdoptionOut:
    """사용자 입양 신청 응답 데이터 생성"""
    # 모든 getattr 호출을 한 번에 처리
    user_attrs = await sync_to_async(lambda: {
        'name': getattr(adoption.user, 'name', None),
    })()
    
    adoption_attrs = await sync_to_async(lambda: {
        'monitoring_status': getattr(adoption, 'monitoring_status', None),
    })()
    
    return UserAdoptionOut(
        id=str(adoption.id),
        user_id=str(adoption.user.id),
        user_name=user_attrs['name'],
        user_nickname=adoption.user.nickname,
        animal_id=str(adoption.animal.id),
        animal_name=adoption.animal.name,
        animal_image=animal_image.image_url if animal_image else None,
        animal_is_female=adoption.animal.is_female,
        animal_protection_status=adoption.animal.protection_status,
        animal_adoption_status=adoption.animal.adoption_status,
        center_id=str(adoption.animal.center.id),
        center_name=adoption.animal.center.name,
        status=adoption.status,
        notes=adoption.notes,
        center_notes=adoption.center_notes,
        monitoring_agreement=adoption.monitoring_agreement,
        guidelines_agreement=adoption.guidelines_agreement,
        meeting_scheduled_at=adoption.meeting_scheduled_at.isoformat() if adoption.meeting_scheduled_at else None,
        contract_sent_at=adoption.contract_sent_at.isoformat() if adoption.contract_sent_at else None,
        adoption_completed_at=adoption.adoption_completed_at.isoformat() if adoption.adoption_completed_at else None,
        monitoring_started_at=adoption.monitoring_started_at.isoformat() if adoption.monitoring_started_at else None,
        monitoring_next_check_at=adoption.monitoring_next_check_at.isoformat() if adoption.monitoring_next_check_at else None,
        monitoring_status=adoption_attrs['monitoring_status'],
        created_at=adoption.created_at.isoformat(),
        updated_at=adoption.updated_at.isoformat()
    )


async def build_user_adoption_detail_response(adoption: Adoption, animal_image: AnimalImage = None,
                                            question_responses: List[AdoptionQuestionResponse] = None,
                                            contract: AdoptionContract = None,
                                            monitoring_posts: List[AdoptionMonitoring] = None) -> UserAdoptionDetailOut:
    """사용자 입양 신청 상세 응답 데이터 생성"""
    # 동물 이미지 조회
    if animal_image is None:
        animal_image = await sync_to_async(lambda: adoption.animal.animalimage_set.first())()
    
    # 질문 응답 조회
    if question_responses is None:
        question_responses = await sync_to_async(list)(
            AdoptionQuestionResponse.objects.select_related('question')
            .filter(adoption=adoption)
        )
    
    # 계약서 정보 조회
    if contract is None:
        try:
            contract = await AdoptionContract.objects.aget(adoption=adoption)
        except AdoptionContract.DoesNotExist:
            contract = None
    
    # 모니터링 포스트 조회
    if monitoring_posts is None:
        monitoring_posts = await sync_to_async(list)(
            AdoptionMonitoring.objects.filter(adoption=adoption)
        )
    
    # 모든 데이터를 한 번에 sync_to_async로 처리
    all_data = await sync_to_async(lambda: {
        "id": str(adoption.id),
        "user_id": str(adoption.user.id),
        "animal_id": str(adoption.animal.id),
        "animal_name": adoption.animal.name,
        "animal_image": animal_image.image_url if animal_image else None,
        "animal_breed": adoption.animal.breed,
        "animal_age": adoption.animal.age,
        "animal_gender": "암컷" if adoption.animal.is_female else "수컷",
        "found_location": getattr(adoption.animal, 'found_location', None),
        "center_id": str(adoption.animal.center.id),
        "center_name": adoption.animal.center.name,
        "center_location": adoption.animal.center.location,
        "status": adoption.status,
        "notes": adoption.notes,
        "center_notes": adoption.center_notes,
        "monitoring_agreement": adoption.monitoring_agreement,
        "guidelines_agreement": adoption.guidelines_agreement,
        "meeting_scheduled_at": adoption.meeting_scheduled_at.isoformat() if adoption.meeting_scheduled_at else None,
        "contract_sent_at": adoption.contract_sent_at.isoformat() if adoption.contract_sent_at else None,
        "adoption_completed_at": adoption.adoption_completed_at.isoformat() if adoption.adoption_completed_at else None,
        "monitoring_started_at": adoption.monitoring_started_at.isoformat() if adoption.monitoring_started_at else None,
        "monitoring_next_check_at": adoption.monitoring_next_check_at.isoformat() if adoption.monitoring_next_check_at else None,
        "monitoring_end_date": getattr(adoption, 'monitoring_end_date', None),
        "monitoring_status": getattr(adoption, 'monitoring_status', None),
        "monitoring_completed_checks": getattr(adoption, 'monitoring_completed_checks', 0),
        "monitoring_total_checks": getattr(adoption, 'monitoring_total_checks', 0),
        "created_at": adoption.created_at.isoformat(),
        "updated_at": adoption.updated_at.isoformat(),
    })()
    
    return UserAdoptionDetailOut(
        adoption=all_data,
        question_responses=[
            UserQuestionResponseOut(
                id=str(response.id),
                question_id=str(response.question.id),
                question_content=response.question.content,
                answer=response.answer,
                created_at=response.created_at.isoformat()
            ) for response in question_responses
        ],
        contract=ContractOut(
            id=str(contract.id),
            template_id=str(contract.template.id),
            contract_content=contract.contract_content,
            guidelines_content=contract.guidelines_content,
            user_signature_url=contract.user_signature_url,
            user_signed_at=contract.user_signed_at.isoformat() if contract.user_signed_at else None,
            center_signature_url=contract.center_signature_url,
            center_signed_at=contract.center_signed_at.isoformat() if contract.center_signed_at else None,
            status=contract.status,
            created_at=contract.created_at.isoformat(),
            updated_at=contract.updated_at.isoformat()
        ) if contract else None,
        monitoring_posts=[
            MonitoringPostOut(
                id=str(post.id),
                post_id=post.post_id,
                post_title=None,  # post_id만 있고 실제 Post 객체는 없음
                post_content=None,  # post_id만 있고 실제 Post 객체는 없음
                created_at=post.created_at.isoformat()
            ) for post in monitoring_posts
        ]
    )


async def get_animal_image(animal: Animal) -> AnimalImage:
    """동물 이미지 조회"""
    return await sync_to_async(lambda: animal.animalimage_set.first())()


async def get_adoption_question_responses(adoption: Adoption) -> List[AdoptionQuestionResponse]:
    """입양 신청 질문 응답 조회"""
    return await sync_to_async(list)(
        AdoptionQuestionResponse.objects.select_related('question')
        .filter(adoption=adoption)
    )


async def get_adoption_contract(adoption: Adoption) -> AdoptionContract:
    """입양 신청 계약서 조회"""
    try:
        return await AdoptionContract.objects.aget(adoption=adoption)
    except AdoptionContract.DoesNotExist:
        return None


async def get_adoption_monitoring_posts(adoption: Adoption) -> List[AdoptionMonitoring]:
    """입양 신청 모니터링 포스트 조회"""
    return await sync_to_async(list)(
        AdoptionMonitoring.objects.filter(adoption=adoption)
    )


async def has_completed_adoption_history(user: User) -> bool:
    """사용자가 입양 완료 이력이 있는지 확인"""
    return await sync_to_async(
        lambda: Adoption.objects.filter(
            user=user,
            status__in=['입양완료', '모니터링']
        ).exists()
    )()
