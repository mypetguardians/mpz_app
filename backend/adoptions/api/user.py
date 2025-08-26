from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List

from adoptions.schemas.user_inbound import UserAdoptionFilterIn
from ninja import Query
from adoptions.schemas.user_outbound import (
    UserAdoptionOut, UserAdoptionDetailOut, QuestionResponseOut,
    ContractOut, MonitoringPostOut
)
from adoptions.models import (
    Adoption, AdoptionQuestionResponse, AdoptionContract, AdoptionMonitoring
)
from adoptions.utils import (
    can_view_user_adoptions
)
from posts.models import Post
from api.security import jwt_auth

router = Router(tags=["User_Adoption"])


async def get_monitoring_posts_with_details(monitoring_posts):
    """모니터링 포스트의 실제 Post 정보를 안전하게 조회"""
    monitoring_posts_with_details = []
    
    for monitoring_post in monitoring_posts:
        # Post 정보를 안전하게 조회
        post_info = await sync_to_async(lambda mp=monitoring_post: {
            "id": str(mp.id),
            "post_id": mp.post_id,
            "created_at": mp.created_at.isoformat()
        })()
        
        # Post 객체 조회 (존재하지 않으면 기본값 사용)
        try:
            post_data = await sync_to_async(lambda: {
                'title': Post.objects.get(id=monitoring_post.post_id).title,
                'content': Post.objects.get(id=monitoring_post.post_id).content
            })()
            post_info["post_title"] = post_data['title']
            post_info["post_content"] = post_data['content']
        except Post.DoesNotExist:
            post_info["post_title"] = "삭제된 포스트"
            post_info["post_content"] = "포스트가 삭제되었습니다."
        
        monitoring_posts_with_details.append(post_info)
    
    return monitoring_posts_with_details


# utils에서 가져온 함수들을 사용


@router.get(
    "/my",
    summary="[R] 내 입양 신청 목록 조회",
    description="현재 로그인한 사용자의 입양 신청 목록을 조회합니다",
    response={200: List[UserAdoptionOut], 400: dict, 401: dict, 500: dict},
    auth=jwt_auth,
)
@paginate
async def get_my_adoptions(request, filters: UserAdoptionFilterIn = Query(UserAdoptionFilterIn())):
    try:
        current_user = request.auth
        
        @sync_to_async
        def get_my_adoptions_list():
            # 기본 쿼리셋 생성
            queryset = Adoption.objects.select_related('animal', 'animal__center', 'user').filter(
                user=current_user
            )
            
            # 입양 상태 필터 적용
            if filters.status and filters.status.strip():
                queryset = queryset.filter(status=filters.status.strip())
            
            # 임시보호 여부 필터 적용
            if filters.is_temporary_protection is not None:
                queryset = queryset.filter(is_temporary_protection=filters.is_temporary_protection)
            
            return list(queryset.order_by('-created_at'))
        
        # 입양 신청 목록 조회
        adoptions_list = await get_my_adoptions_list()
        
        # 응답 데이터 변환
        adoptions_response = []
        for adoption in adoptions_list:
            # 동물 이미지 조회 - sync_to_async로 감싸서 호출
            animal_image = await sync_to_async(lambda: adoption.animal.animalimage_set.first())()
            
            # 모든 데이터를 한 번에 sync_to_async로 처리
            adoption_data = await sync_to_async(lambda: {
                "id": str(adoption.id),
                "user_id": str(adoption.user.id),
                "user_name": getattr(adoption.user, 'name', None),
                "user_nickname": adoption.user.nickname,
                "user_phoneNumber": getattr(adoption.user, 'phone_number', None),
                "animal_id": str(adoption.animal.id),
                "animal_name": adoption.animal.name,
                "animal_image": animal_image.image_url if animal_image else None,
                "animal_breed": getattr(adoption.animal, 'breed', None),
                "animal_is_female": adoption.animal.is_female,
                "animal_status": adoption.animal.status,
                "center_id": str(adoption.animal.center.id),
                "center_name": adoption.animal.center.name,
                "center_location": getattr(adoption.animal.center, 'location', None),
                "center_centerNumber": getattr(adoption.animal.center, 'center_number', None),
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
                "monitoring_status": getattr(adoption, 'monitoring_status', None),
                "created_at": adoption.created_at.isoformat(),
                "updated_at": adoption.updated_at.isoformat(),
            })()
            
            adoption_data = UserAdoptionOut(**adoption_data)
            adoptions_response.append(adoption_data)
        
        return adoptions_response
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get my adoptions error: {e}")
        raise HttpError(500, "입양 신청 목록 조회 중 오류가 발생했습니다")


@router.get(
    "/my/{adoption_id}",
    summary="[R] 내 입양 신청 상세 조회",
    description="현재 로그인한 사용자의 특정 입양 신청 상세 정보를 조회합니다",
    response={200: UserAdoptionDetailOut, 400: dict, 401: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def get_my_adoption_detail(request, adoption_id: str):
    try:
        current_user = request.auth
        
        # 입양 신청 상세 정보 조회
        try:
            adoption = await Adoption.objects.select_related(
                'animal', 'animal__center', 'user'
            ).aget(
                id=adoption_id,
                user=current_user
            )
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 동물 이미지 조회
        animal_image = await sync_to_async(lambda: adoption.animal.animalimage_set.first())()
        
        # 질문 응답 조회
        question_responses = await sync_to_async(list)(
            AdoptionQuestionResponse.objects.select_related('question')
            .filter(adoption=adoption)
        )
        
        # 계약서 정보 조회
        try:
            contract = await AdoptionContract.objects.aget(adoption=adoption)
        except AdoptionContract.DoesNotExist:
            contract = None
        
        # 모니터링 포스트 조회
        monitoring_posts = await sync_to_async(list)(
            AdoptionMonitoring.objects.filter(adoption=adoption)
        )
        
        # 모니터링 포스트의 실제 Post 정보 조회
        monitoring_posts_with_details = await get_monitoring_posts_with_details(monitoring_posts)
        
        # 응답 데이터 구성
        adoption_data = await sync_to_async(lambda: {
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
        
        # 응답 데이터를 sync_to_async로 안전하게 처리
        question_responses_data = await sync_to_async(lambda: [
            {
                "id": str(response.id),
                "question_id": str(response.question.id),
                "question_content": response.question.content,
                "answer": response.answer,
                "created_at": response.created_at.isoformat()
            } for response in question_responses
        ])()
        
        contract_data = None
        if contract:
            contract_data = await sync_to_async(lambda: {
                "id": str(contract.id),
                "template_id": str(contract.template.id),
                "contract_content": contract.contract_content,
                "guidelines_content": contract.guidelines_content,
                "user_signature_url": contract.user_signature_url,
                "user_signed_at": contract.user_signed_at.isoformat() if contract.user_signed_at else None,
                "center_signature_url": contract.center_signature_url,
                "center_signed_at": contract.center_signed_at.isoformat() if contract.center_signed_at else None,
                "status": contract.status,
                "created_at": contract.created_at.isoformat(),
                "updated_at": contract.updated_at.isoformat()
            })()
        
        return UserAdoptionDetailOut(
            adoption=adoption_data,
            question_responses=[
                QuestionResponseOut(**response_data) for response_data in question_responses_data
            ],
            contract=ContractOut(**contract_data) if contract_data else None,
            monitoring_posts=[
                MonitoringPostOut(
                    id=str(post["id"]),
                    post_id=post["post_id"],
                    post_title=post["post_title"],
                    post_content=post["post_content"],
                    created_at=post["created_at"]
                ) for post in monitoring_posts_with_details
            ]
        )
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get my adoption detail error: {e}")
        raise HttpError(500, "입양 신청 상세 조회 중 오류가 발생했습니다")


@router.get(
    "/{user_id}",
    summary="[R] 특정 사용자 입양 신청 목록 조회 (관리자용)",
    description="센터 관리자나 최고 관리자가 특정 사용자의 입양 신청 목록을 조회합니다",
    response={200: List[UserAdoptionOut], 400: dict, 401: dict, 403: dict, 500: dict},
    auth=jwt_auth,
)
@paginate
async def get_user_adoptions(request, user_id: str, filters: UserAdoptionFilterIn = Query(UserAdoptionFilterIn())):
    try:
        current_user = request.auth
        
        # 권한 체크: 본인 또는 관리자만 조회 가능
        if not await can_view_user_adoptions(current_user, user_id):
            raise HttpError(403, "권한이 없습니다")
        
        @sync_to_async
        def get_user_adoptions_list():
            # 기본 쿼리셋 생성
            queryset = Adoption.objects.select_related('animal', 'animal__center', 'user').filter(
                user_id=user_id
            )
            
            # 입양 상태 필터 적용
            if filters.status and filters.status.strip():
                queryset = queryset.filter(status=filters.status.strip())
            
            # 임시보호 여부 필터 적용
            if filters.is_temporary_protection is not None:
                queryset = queryset.filter(is_temporary_protection=filters.is_temporary_protection)
            
            return list(queryset.order_by('-created_at'))
        
        # 입양 신청 목록 조회
        adoptions_list = await get_user_adoptions_list()
        
        # 응답 데이터 변환
        adoptions_response = []
        for adoption in adoptions_list:
            # 동물 이미지 조회 - sync_to_async로 감싸서 호출
            animal_image = await sync_to_async(lambda: adoption.animal.animalimage_set.first())()
            
            # 모든 데이터를 한 번에 sync_to_async로 처리
            adoption_data = await sync_to_async(lambda: {
                "id": str(adoption.id),
                "user_id": str(adoption.user.id),
                "user_name": getattr(adoption.user, 'name', None),
                "user_nickname": adoption.user.nickname,
                "user_phoneNumber": getattr(adoption.user, 'phone_number', None),
                "animal_id": str(adoption.animal.id),
                "animal_name": adoption.animal.name,
                "animal_image": animal_image.image_url if animal_image else None,
                "animal_breed": getattr(adoption.animal, 'breed', None),
                "animal_is_female": adoption.animal.is_female,
                "animal_status": adoption.animal.status,
                "center_id": str(adoption.animal.center.id),
                "center_name": adoption.animal.center.name,
                "center_location": getattr(adoption.animal.center, 'location', None),
                "center_centerNumber": getattr(adoption.animal.center, 'center_number', None),
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
                "monitoring_status": getattr(adoption, 'monitoring_status', None),
                "created_at": adoption.created_at.isoformat(),
                "updated_at": adoption.updated_at.isoformat(),
            })()
            
            adoption_data = UserAdoptionOut(**adoption_data)
            adoptions_response.append(adoption_data)
        
        return adoptions_response
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get user adoptions error: {e}")
        raise HttpError(500, "입양 신청 목록 조회 중 오류가 발생했습니다")


@router.get(
    "/{user_id}/{adoption_id}",
    summary="[R] 특정 사용자 입양 신청 상세 조회 (관리자용)",
    description="센터 관리자나 최고 관리자가 특정 사용자의 특정 입양 신청 상세 정보를 조회합니다",
    response={200: UserAdoptionDetailOut, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def get_user_adoption_detail(request, user_id: str, adoption_id: str):
    try:
        current_user = request.auth
        
        # 권한 체크: 본인 또는 관리자만 조회 가능
        if not await can_view_user_adoptions(current_user, user_id):
            raise HttpError(403, "권한이 없습니다")
        
        # 입양 신청 상세 정보 조회
        try:
            adoption = await Adoption.objects.select_related(
                'animal', 'animal__center', 'user'
            ).aget(
                id=adoption_id,
                user_id=user_id
            )
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 동물 이미지 조회
        animal_image = await sync_to_async(lambda: adoption.animal.animalimage_set.first())()
        
        # 질문 응답 조회
        question_responses = await sync_to_async(list)(
            AdoptionQuestionResponse.objects.select_related('question')
            .filter(adoption=adoption)
        )
        
        # 계약서 정보 조회
        try:
            contract = await AdoptionContract.objects.aget(adoption=adoption)
        except AdoptionContract.DoesNotExist:
            contract = None
        
        # 모니터링 포스트 조회
        monitoring_posts = await sync_to_async(list)(
            AdoptionMonitoring.objects.filter(adoption=adoption)
        )
        
        # 모니터링 포스트의 실제 Post 정보 조회
        monitoring_posts_with_details = await get_monitoring_posts_with_details(monitoring_posts)
        
        # 응답 데이터 구성
        adoption_data = await sync_to_async(lambda: {
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
        
        # 응답 데이터를 sync_to_async로 안전하게 처리
        question_responses_data = await sync_to_async(lambda: [
            {
                "id": str(response.id),
                "question_id": str(response.question.id),
                "question_content": response.question.content,
                "answer": response.answer,
                "created_at": response.created_at.isoformat()
            } for response in question_responses
        ])()
        
        contract_data = None
        if contract:
            contract_data = await sync_to_async(lambda: {
                "id": str(contract.id),
                "template_id": str(contract.template.id),
                "contract_content": contract.contract_content,
                "guidelines_content": contract.guidelines_content,
                "user_signature_url": contract.user_signature_url,
                "user_signed_at": contract.user_signed_at.isoformat() if contract.user_signed_at else None,
                "center_signature_url": contract.center_signature_url,
                "center_signed_at": contract.center_signed_at.isoformat() if contract.center_signed_at else None,
                "status": contract.status,
                "created_at": contract.created_at.isoformat(),
                "updated_at": contract.updated_at.isoformat()
            })()
        
        return UserAdoptionDetailOut(
            adoption=adoption_data,
            question_responses=[
                QuestionResponseOut(**response_data) for response_data in question_responses_data
            ],
            contract=ContractOut(**contract_data) if contract_data else None,
            monitoring_posts=[
                MonitoringPostOut(
                    id=str(post["id"]),
                    post_id=post["post_id"],
                    post_title=post["post_title"],
                    post_content=post["post_content"],
                    created_at=post["created_at"]
                ) for post in monitoring_posts_with_details
            ]
        )
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get user adoption detail error: {e}")
        raise HttpError(500, "입양 신청 상세 조회 중 오류가 발생했습니다")
