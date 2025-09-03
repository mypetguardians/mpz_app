from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from django.http import HttpRequest
from django.utils import timezone
from django.db.models import Q
from asgiref.sync import sync_to_async
from typing import List
from .models import Animal, AnimalMegaphone
from animals.schemas.inbound import (
    AnimalCreateIn, AnimalUpdateIn, AnimalStatusUpdateIn,
    AnimalListQueryIn, MegaphoneToggleIn, RelatedAnimalsQueryIn
)
from animals.schemas.outbound import (
    AnimalOut, AnimalStatusUpdateOut,
    BreedsOut, SuccessOut, 
    ErrorOut, MegaphoneToggleOut
)
from api.security import jwt_auth
from centers.models import Center
from animals.services import PublicDataService
from django.conf import settings
from animals.schemas.public_data import (
    PublicDataSyncResponseOut, PublicDataStatusOut, PublicDataErrorOut,
    PublicDataSyncResultOut
)
from datetime import timedelta

router = Router(tags=["Animals"])

@router.post(
    "/",
    summary="[C] 동물 등록",
    description="새로운 동물을 등록합니다. 센터 관리자 이상의 권한이 필요합니다.",
    response={
        200: AnimalOut,
        201: AnimalOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
    },
    auth=jwt_auth,
)
async def create_animal(request: HttpRequest, data: AnimalCreateIn):
    """새로운 동물을 등록합니다."""
    try:
        # 권한 체크
        user = request.auth

        if user.user_type == "일반사용자":
            raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
        
        # 센터 ID 결정
        center_id = None
        if user.user_type == "센터관리자":
            # 센터 관리자는 자신의 센터에만 등록 가능
            # 먼저 owner로 조회 시도
            try:
                user_center = await sync_to_async(Center.objects.get)(owner=user)
                center_id = user_center.id
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = await sync_to_async(lambda: user.center)()
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                    center_id = user_center.id
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")
        elif user.user_type == "센터최고관리자":
            # 센터 최고관리자는 자신이 소유한 센터에 등록 가능
            try:
                user_center = await sync_to_async(Center.objects.get)(owner=user)
                center_id = user_center.id
            except Center.DoesNotExist:
                raise HttpError(400, "등록된 센터가 없습니다")
        elif user.user_type == "훈련사":
            # 훈련사는 센터 ID를 요청 body에서 받아야 함
            center_id = data.center_id
            if not center_id:
                raise HttpError(400, "센터 ID가 필요합니다")
        else:
            # 예상하지 못한 사용자 타입
            raise HttpError(403, f"동물 등록 권한이 없습니다. 현재 사용자 타입: {user.user_type}")
        
        # 동물 정보 생성 (실제 모델 필드만 사용)
        animal_data = {
            "center_id": center_id,
            "name": data.name,
            "is_female": data.is_female,
            "age": data.age,
            "weight": data.weight,
            "breed": data.breed,
            "description": data.description,
            "status": data.status or "보호중",
            "personality": data.personality,
            "health_notes": data.health_notes,
            "special_needs": data.special_notes,  # special_notes를 special_needs에 매핑
            "announce_number": data.announce_number,
            "found_location": data.found_location,
            "admission_date": data.announcement_date,  # announcement_date를 admission_date로 매핑
            "comment": data.comment,  # comment 필드 매핑
        }
        
        # DB에 동물 정보 삽입
        animal = await sync_to_async(Animal.objects.create)(**animal_data)
        
        # 응답 데이터 변환
        response_data = AnimalOut(
            id=str(animal.id),
            name=animal.name,
            is_female=animal.is_female,
            age=animal.age,
            weight=animal.weight,

            breed=animal.breed,
            description=animal.description,
            status=animal.status,
            waiting_days=0,
            activity_level=animal.activity_level,
            sensitivity=animal.sensitivity,
            sociability=animal.sociability,
            separation_anxiety=animal.separation_anxiety,
            special_notes=animal.special_needs,
            health_notes=animal.health_notes,
            basic_training=animal.basic_training,
            trainer_comment=animal.trainer_comment,
            announce_number=animal.announce_number,
            display_notice_number=animal.display_notice_number,  # 표시용 공고번호
            announcement_date=animal.admission_date.isoformat() if animal.admission_date else None,
            found_location=animal.found_location,
            admission_date=animal.admission_date.isoformat() if animal.admission_date else None,
            personality=animal.personality,
            megaphone_count=animal.megaphone_count,
            is_megaphoned=False,  # 새로 생성된 동물은 기본값
            center_id=str(animal.center_id),
            animal_images=[],
            created_at=animal.created_at.isoformat(),
            updated_at=animal.updated_at.isoformat(),
            
            # 공공데이터 관련 필드
            is_public_data=animal.is_public_data,
            public_notice_number=animal.public_notice_number,
            comment=animal.comment,  # 공공데이터 특이사항 코멘트
        )
        
        # 임시보호 등록 알림 전송
        try:
            from notifications.utils import notify_new_temporary_protection
            await notify_new_temporary_protection(str(animal.id))
        except Exception as e:
            # 알림 전송 실패는 로그만 남기고 API 응답에는 영향 주지 않음
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"임시보호 알림 전송 실패: {e}")
        
        return response_data
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동물 등록 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/",
    summary="[R] 동물 목록 조회",
    description="동물 목록을 조회합니다. 다양한 필터와 페이지네이션을 지원합니다.",
    response={
        200: List[AnimalOut],
        500: ErrorOut,
    },
)
@paginate
async def get_animals(request: HttpRequest, filters: AnimalListQueryIn = Query(AnimalListQueryIn())):
    """동물 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_animals_list():
            # 기본 쿼리셋 생성
            queryset = Animal.objects.select_related('center').prefetch_related('animalimage_set')
            
            # 필터 조건 적용
            if filters.status:
                queryset = queryset.filter(status=filters.status)
            if filters.center_id:
                queryset = queryset.filter(center_id=filters.center_id)
            if filters.gender:
                is_female = filters.gender == "female"
                queryset = queryset.filter(is_female=is_female)
            # 체중 범위 필터링
            if filters.weight_min is not None:
                queryset = queryset.filter(weight__gte=filters.weight_min)
            if filters.weight_max is not None:
                queryset = queryset.filter(weight__lte=filters.weight_max)
            
            # 나이 범위 필터링
            if filters.age_min is not None:
                queryset = queryset.filter(age__gte=filters.age_min)
            if filters.age_max is not None:
                queryset = queryset.filter(age__lte=filters.age_max)
            if filters.has_trainer_comment:
                if filters.has_trainer_comment == "true":
                    queryset = queryset.exclude(trainer_comment__isnull=True).exclude(trainer_comment="")
                else:
                    queryset = queryset.filter(Q(trainer_comment__isnull=True) | Q(trainer_comment=""))
            if filters.breed:
                queryset = queryset.filter(breed__icontains=filters.breed)
            if filters.region:
                queryset = queryset.filter(center__region=filters.region)
            
            # 정렬 기능 추가
            sort_by = filters.sort_by or "created_at"
            sort_order = filters.sort_order or "desc"
            
            if sort_by == "admission_date":
                order_field = "admission_date"
            elif sort_by == "megaphone_count":
                order_field = "megaphone_count"
            else:
                order_field = "created_at"
            
            if sort_order == "asc":
                queryset = queryset.order_by(order_field)
            else:
                queryset = queryset.order_by(f"-{order_field}")
            
            return list(queryset)
        
        # 동물 목록 조회
        animals_list = await get_animals_list()
        
        # 응답 데이터 변환
        animals_response = []
        for animal in animals_list:
            # 이미지 처리 (prefetch_related로 가져온 데이터 사용)
            images = list(animal.animalimage_set.all())
            
            animal_data = AnimalOut(
                id=str(animal.id),
                name=animal.name,
                is_female=animal.is_female,
                age=animal.age,
                weight=animal.weight,
                color=None,  # Animal 모델에 없는 필드
                breed=animal.breed,
                description=animal.description,
                status=animal.status,
                waiting_days=0,
                activity_level=None,  # Animal 모델에 없는 필드
                sensitivity=None,  # Animal 모델에 없는 필드
                sociability=None,  # Animal 모델에 없는 필드
                separation_anxiety=None,  # Animal 모델에 없는 필드
                special_notes=getattr(animal, 'special_needs', None),  # special_needs로 매핑
                health_notes=animal.health_notes,
                basic_training=None,  # Animal 모델에 없는 필드
                trainer_comment=None,  # Animal 모델에 없는 필드
                announce_number=animal.announce_number,
                display_notice_number=animal.display_notice_number,  # 표시용 공고번호
                announcement_date=None,  # Animal 모델에 없는 필드
                found_location=animal.found_location,
                admission_date=animal.admission_date.isoformat() if animal.admission_date else None,
                personality=animal.personality,
                megaphone_count=animal.megaphone_count,
                is_megaphoned=False,  # 목록 조회에서는 기본값
                center_id=str(animal.center_id),
                animal_images=[
                    {
                        "id": str(img.id),
                        "image_url": img.image_url,
                        "is_primary": img.is_primary,
                        "sequence": img.sequence
                    }
                    for img in images
                ],
                created_at=animal.created_at.isoformat(),
                updated_at=animal.updated_at.isoformat(),
                
                # 공공데이터 관련 필드
                is_public_data=animal.is_public_data,
                public_notice_number=animal.public_notice_number,
                comment=animal.comment,  # 공공데이터 특이사항 코멘트
            )
            animals_response.append(animal_data)
        
        return animals_response
        
    except Exception as e:
        raise HttpError(500, f"동물 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/breeds",
    summary="[R] 품종 목록 조회",
    description="등록된 모든 품종 목록을 조회합니다.",
    response={
        200: BreedsOut,
        500: ErrorOut,
    },
)
async def get_breeds(request: HttpRequest):
    """등록된 모든 품종 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_breeds_list():
            # breed 컬럼의 고유한 값들을 가져오기
            breeds_result = Animal.objects.exclude(
                Q(breed__isnull=True) | Q(breed="")
            ).values_list('breed', flat=True).distinct()
            
            # breed 값들을 정렬
            breeds = sorted(list(set(breeds_result)))
            return breeds
        
        breeds = await get_breeds_list()
        return BreedsOut(breeds=breeds, total=len(breeds))
        
    except Exception as e:
        raise HttpError(500, f"품종 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{animal_id}",
    summary="[R] 동물 상세 조회",
    description="특정 동물의 상세 정보를 조회합니다.",
    response={
        200: AnimalOut,
        404: ErrorOut,
        500: ErrorOut,
    },
)
async def get_animal_by_id(request: HttpRequest, animal_id: str):
    """특정 동물의 상세 정보를 조회합니다."""
    try:
        @sync_to_async
        def get_animal_detail():
            try:
                # 동물 정보와 이미지 함께 조회
                animal = Animal.objects.select_related('center').prefetch_related('animalimage_set').get(id=animal_id)
                
                # 이미지 조회
                images = list(animal.animalimage_set.all().order_by('sequence').values(
                    'id', 'image_url', 'is_primary', 'sequence'
                ))
                
                return animal, images
            except Animal.DoesNotExist:
                return None, None
        
        result = await get_animal_detail()
        if result[0] is None:
            raise HttpError(404, "동물을 찾을 수 없습니다")
        
        animal, images = result
        
        response_data = AnimalOut(
            id=str(animal.id),
            name=animal.name,
            is_female=animal.is_female,
            age=animal.age,
            weight=animal.weight,
            color=None,  # Animal 모델에 없는 필드
            breed=animal.breed,
            description=animal.description,
            status=animal.status,
            waiting_days=0,
            activity_level=None,  # Animal 모델에 없는 필드
            sensitivity=None,  # Animal 모델에 없는 필드
            sociability=None,  # Animal 모델에 없는 필드
            separation_anxiety=None,  # Animal 모델에 없는 필드
            special_notes=animal.special_needs,
            health_notes=animal.health_notes,
            basic_training=None,  # Animal 모델에 없는 필드
            trainer_comment=None,  # Animal 모델에 없는 필드
            announce_number=animal.announce_number,
            display_notice_number=animal.display_notice_number,  # 표시용 공고번호
            announcement_date=None,  # Animal 모델에 없는 필드
            found_location=animal.found_location,
            admission_date=animal.admission_date.isoformat() if animal.admission_date else None,
            personality=animal.personality,
            megaphone_count=animal.megaphone_count,
            is_megaphoned=False,  # 상세 조회에서는 기본값
            center_id=str(animal.center_id),
            animal_images=[
                {
                    "id": str(img["id"]),
                    "image_url": img["image_url"],
                    "is_primary": img["is_primary"],
                    "sequence": img["sequence"]
                }
                for img in images
            ],
            created_at=animal.created_at.isoformat(),
            updated_at=animal.updated_at.isoformat(),
            
            # 공공데이터 관련 필드
            is_public_data=animal.is_public_data,
            public_notice_number=animal.public_notice_number,
            comment=animal.comment,  # 공공데이터 특이사항 코멘트
        )
        
        return response_data
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동물 상세 조회 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/{animal_id}",
    summary="[U] 동물 정보 수정",
    description="동물 정보를 수정합니다. 센터 관리자 이상의 권한이 필요합니다.",
    response={
        200: AnimalOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def update_animal(request: HttpRequest, animal_id: str, data: AnimalUpdateIn):
    """동물 정보를 수정합니다."""
    try:
        # 권한 체크
        user = request.auth

        if user.user_type == "일반사용자":
            raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
        
        # 동물 존재 확인
        animal = await sync_to_async(Animal.objects.select_related('center').get)(id=animal_id)
        
        # 센터 관리자인 경우 자신의 센터 동물인지 확인
        if user.user_type == "센터관리자":
            # 센터 관리자는 자신의 센터 동물만 수정 가능
            user_center_id = None
            try:
                user_center = await sync_to_async(Center.objects.get)(owner=user)
                user_center_id = user_center.id
            except Center.DoesNotExist:
                try:
                    user_center = await sync_to_async(lambda: user.center)()
                    if user_center:
                        user_center_id = user_center.id
                except AttributeError:
                    pass
            
            if not user_center_id or animal.center_id != user_center_id:
                raise HttpError(403, "해당 동물에 대한 권한이 없습니다")
        
        # 업데이트할 데이터 준비
        update_data = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.is_female is not None:
            update_data["is_female"] = data.is_female
        if data.age is not None:
            update_data["age"] = data.age
        if data.weight is not None:
            update_data["weight"] = data.weight

        if data.breed is not None:
            update_data["breed"] = data.breed
        if data.description is not None:
            update_data["description"] = data.description
        if data.status is not None:
            update_data["status"] = data.status
        if data.activity_level is not None:
            update_data["activity_level"] = data.activity_level
        if data.sensitivity is not None:
            update_data["sensitivity"] = data.sensitivity
        if data.sociability is not None:
            update_data["sociability"] = data.sociability
        if data.separation_anxiety is not None:
            update_data["separation_anxiety"] = data.separation_anxiety
        if data.special_notes is not None:
            update_data["special_needs"] = data.special_notes
        if data.health_notes is not None:
            update_data["health_notes"] = data.health_notes
        if data.basic_training is not None:
            update_data["basic_training"] = data.basic_training
        if data.trainer_comment is not None:
            update_data["trainer_comment"] = data.trainer_comment
        if data.announce_number is not None:
            update_data["announce_number"] = data.announce_number
        if data.admission_date is not None:
            update_data["admission_date"] = data.admission_date
        if data.found_location is not None:
            update_data["found_location"] = data.found_location
        if data.personality is not None:
            update_data["personality"] = data.personality
        
        # DB 업데이트
        for field, value in update_data.items():
            setattr(animal, field, value)
        await sync_to_async(animal.save)()
        
        # 응답 데이터 변환
        response_data = AnimalOut(
            id=str(animal.id),
            name=animal.name,
            is_female=animal.is_female,
            age=animal.age,
            weight=animal.weight,

            breed=animal.breed,
            description=animal.description,
            status=animal.status,
            waiting_days=0,
            activity_level=animal.activity_level,
            sensitivity=animal.sensitivity,
            sociability=animal.sociability,
            separation_anxiety=animal.separation_anxiety,
            special_notes=animal.special_needs,
            health_notes=animal.health_notes,
            basic_training=animal.basic_training,
            trainer_comment=animal.trainer_comment,
            announce_number=animal.announce_number,
            found_location=animal.found_location,
            admission_date=animal.admission_date.isoformat() if animal.admission_date else None,
            personality=animal.personality,
            center_id=str(animal.center_id),
            animal_images=[],
            created_at=animal.created_at.isoformat(),
            updated_at=animal.updated_at.isoformat(),
        )
        
        return response_data
        
    except Animal.DoesNotExist:
        raise HttpError(404, "동물을 찾을 수 없습니다")
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동물 정보 수정 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/{animal_id}/megaphone",
    summary="[C/D] 동물 확성기 토글",
    description="동물의 확성기(좋아요)를 토글합니다. 사용자당 동물마다 한 번만 가능합니다.",
    response={
        200: MegaphoneToggleOut,
        401: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def toggle_animal_megaphone(request: HttpRequest, animal_id: str, data: MegaphoneToggleIn):
    """동물의 확성기(좋아요)를 토글합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def toggle_megaphone():
            # 동물 존재 확인
            try:
                animal = Animal.objects.get(id=animal_id)
            except Animal.DoesNotExist:
                raise HttpError(404, "동물을 찾을 수 없습니다")

            # 현재 확성기 상태 확인
            try:
                megaphone = AnimalMegaphone.objects.get(
                    user=current_user,
                    animal=animal
                )
                # 확성기 해제
                megaphone.delete()
                animal.megaphone_count = max(0, animal.megaphone_count - 1)
                animal.save()
                is_megaphoned = False
                message = "확성기가 해제되었습니다"
            except AnimalMegaphone.DoesNotExist:
                # 확성기 추가
                AnimalMegaphone.objects.create(
                    user=current_user,
                    animal=animal
                )
                animal.megaphone_count += 1
                animal.save()
                is_megaphoned = True
                message = "확성기를 눌렀습니다"

            return {
                "is_megaphoned": is_megaphoned,
                "message": message,
                "megaphone_count": animal.megaphone_count
            }

        return await toggle_megaphone()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"확성기 토글 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/{animal_id}",
    summary="[D] 동물 정보 삭제",
    description="동물 정보를 삭제합니다. 센터 관리자 이상의 권한이 필요합니다.",
    response={
        200: SuccessOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def delete_animal(request: HttpRequest, animal_id: str):
    """동물 정보를 삭제합니다."""
    try:
        # 권한 체크
        user = request.auth

        if user.user_type == "일반사용자":
            raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
        
        # 동물 존재 확인
        animal = await sync_to_async(Animal.objects.select_related('center').get)(id=animal_id)
        
        # 센터 관리자인 경우 자신의 센터 동물인지 확인
        if user.user_type == "센터관리자":
            # 센터 관리자는 자신의 센터 동물만 삭제 가능
            user_center_id = None
            try:
                user_center = await sync_to_async(Center.objects.get)(owner=user)
                user_center_id = user_center.id
            except Center.DoesNotExist:
                try:
                    user_center = await sync_to_async(lambda: user.center)()
                    if user_center:
                        user_center_id = user_center.id
                except AttributeError:
                    pass
            
            if not user_center_id or animal.center_id != user_center_id:
                raise HttpError(403, "해당 동물에 대한 권한이 없습니다")
        
        # 동물 정보 삭제
        await sync_to_async(animal.delete)()
        
        return SuccessOut(message="동물 정보가 성공적으로 삭제되었습니다")
        
    except Animal.DoesNotExist:
        raise HttpError(404, "동물을 찾을 수 없습니다")
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동물 정보 삭제 중 오류가 발생했습니다: {str(e)}")


@router.patch(
    "/{animal_id}/status",
    summary="[U] 동물 상태 변경",
    description="동물의 상태를 변경합니다. 센터 관리자 이상의 권한이 필요합니다.",
    response={
        200: AnimalStatusUpdateOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def update_animal_status(request: HttpRequest, animal_id: str, data: AnimalStatusUpdateIn):
    """동물의 상태를 변경합니다."""
    try:
        # 권한 체크
        user = request.auth

        if user.user_type == "일반사용자":
            raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
        
        # 동물 존재 확인
        animal = await sync_to_async(Animal.objects.select_related('center').get)(id=animal_id)
        
        # 센터 관리자인 경우 자신의 센터 동물인지 확인
        if user.user_type == "센터관리자":
            # 센터 관리자는 자신의 센터 동물만 상태 변경 가능
            user_center_id = None
            try:
                user_center = await sync_to_async(Center.objects.get)(owner=user)
                user_center_id = user_center.id
            except Center.DoesNotExist:
                try:
                    user_center = await sync_to_async(lambda: user.center)()
                    if user_center:
                        user_center_id = user_center.id
                except AttributeError:
                    pass
            
            if not user_center_id or animal.center_id != user_center_id:
                raise HttpError(403, "해당 동물에 대한 권한이 없습니다")
        
        # 상태 변경 로직
        previous_status = animal.status
        new_status = data.status
        
        # 동일한 상태로 변경하려는 경우 체크
        if previous_status == new_status:
            raise HttpError(400, f"동물의 상태가 이미 '{new_status}'입니다")
        
        # 상태 업데이트
        animal.status = new_status
        await sync_to_async(animal.save)()
        
        # 상태 변경 로그
        status_change_message = f"{animal.name}의 상태가 '{previous_status}'에서 '{new_status}'로 변경되었습니다"
        
        if data.reason:
            print(f"[상태 변경] {status_change_message} (사유: {data.reason})")
        else:
            print(f"[상태 변경] {status_change_message}")
        
        response_data = AnimalStatusUpdateOut(
            id=str(animal.id),
            name=animal.name,
            previous_status=previous_status,
            new_status=new_status,
            updated_at=timezone.now().isoformat(),
            message=status_change_message,
        )
        
        return response_data
        
    except Animal.DoesNotExist:
        raise HttpError(404, "동물을 찾을 수 없습니다")
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동물 상태 변경 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{animal_id}/related",
    summary="[R] 거리 기반 관련 동물 조회",
    description="특정 동물과 관련된 동물들을 조회합니다.",
    response={
        200: List[AnimalOut],
        404: ErrorOut,
        500: ErrorOut,
    },
)
async def get_related_animals_by_distance(
    request: HttpRequest, 
    animal_id: str, 
    query: RelatedAnimalsQueryIn = Query(RelatedAnimalsQueryIn())
):
    """특정 동물과 관련된 동물들을 조회합니다."""
    try:
        @sync_to_async
        def get_related_animals_list():
            try:
                # 현재 동물 정보 조회
                animal = Animal.objects.select_related('center').get(id=animal_id)
                
                # 같은 지역의 다른 동물들을 가져오기 (거리 기반 정렬)
                # 실제 거리 계산이 어려우므로 같은 지역 내에서 최신순으로 정렬
                related_animals = Animal.objects.filter(
                    center_id=animal.center_id,  # 같은 보호소
                    status="보호중"  # 보호중인 동물만
                ).exclude(id=animal_id).order_by('-created_at')[:query.limit]
                
                return list(related_animals), animal
            except Animal.DoesNotExist:
                return None, None
        
        result = await get_related_animals_list()
        if result[0] is None:
            raise HttpError(404, "동물을 찾을 수 없습니다")
        
        related_animals, animal = result
        
        # 응답 데이터 변환
        animals_response = []
        for related_animal in related_animals:
            animal_data = AnimalOut(
                id=str(related_animal.id),
                name=related_animal.name,
                is_female=related_animal.is_female,
                age=related_animal.age,
                weight=related_animal.weight,
                color=None,  # Animal 모델에 없는 필드
                breed=related_animal.breed,
                description=related_animal.description,
                status=related_animal.status,
                waiting_days=0,
                activity_level=None,  # Animal 모델에 없는 필드
                sensitivity=None,  # Animal 모델에 없는 필드
                sociability=None,  # Animal 모델에 없는 필드
                separation_anxiety=None,  # Animal 모델에 없는 필드
                special_notes=related_animal.special_needs,
                health_notes=related_animal.health_notes,
                basic_training=None,  # Animal 모델에 없는 필드
                trainer_comment=None,  # Animal 모델에 없는 필드
                announce_number=related_animal.announce_number,
                display_notice_number=related_animal.display_notice_number,  # 표시용 공고번호
                announcement_date=None,  # Animal 모델에 없는 필드
                found_location=related_animal.found_location,
                admission_date=related_animal.admission_date.isoformat() if related_animal.admission_date else None,
                personality=related_animal.personality,
                megaphone_count=related_animal.megaphone_count,
                is_megaphoned=False,  # 관련 동물 조회에서는 기본값
                center_id=str(related_animal.center_id),
                animal_images=[],  # 빈 배열 임시설정
                created_at=related_animal.created_at.isoformat(),
                updated_at=related_animal.updated_at.isoformat(),
                
                # 공공데이터 관련 필드
                is_public_data=related_animal.is_public_data,
                public_notice_number=related_animal.public_notice_number,
                comment=related_animal.comment,  # 공공데이터 특이사항 코멘트
            )
            animals_response.append(animal_data)
        
        return animals_response
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"관련 동물 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/public-data/sync",
    summary="[R] 공공데이터 동기화",
    description="공공데이터 API에서 유기동물 정보를 가져와서 DB에 동기화합니다. (QStash 스케줄러용)",
    response={
        200: PublicDataSyncResponseOut,
        400: PublicDataErrorOut,
        401: PublicDataErrorOut,
        403: PublicDataErrorOut,
        500: PublicDataErrorOut,
    },
)
async def sync_public_data(
    request: HttpRequest,
    bgnde: str = Query(None, description="구조날짜 시작 (YYYYMMDD) - 미입력시 어제 날짜 자동 설정"),
    endde: str = Query(None, description="구조날짜 종료 (YYYYMMDD) - 미입력시 어제 날짜 자동 설정"),
    upkind: str = Query("417000", description="축종코드 (개: 417000, 고양이: 422400, 기타: 429900)"),
    state: str = Query(None, description="상태 (notice: 공고중, protect: 보호중)"),
    page_no: int = Query(1, description="페이지 번호"),
    num_of_rows: int = Query(1000, description="페이지당 보여줄 개수"),
    sync_strategy: str = Query("incremental", description="동기화 전략 (incremental: 최근 데이터만, full: 전체 데이터, status_check: 상태 체크만)")
):
    """공공데이터 API에서 유기동물 정보를 동기화합니다."""
    try:
        # 헤더 기반 인증 확인 (QStash용)
        x_api_key = request.headers.get('X-API-Key')
        expected_api_key = getattr(settings, 'PUBLIC_DATA_SERVICE_KEY', None)
        
        # 디버깅용 로그
        print(f"🔍 디버깅 정보:")
        print(f"   받은 X-API-Key: {x_api_key}")
        print(f"   설정된 API Key: {expected_api_key}")
        print(f"   키 일치 여부: {x_api_key == expected_api_key}")
        
        if not expected_api_key:
            raise HttpError(500, "공공데이터 API 키가 설정되지 않았습니다")
        
        if not x_api_key or x_api_key != expected_api_key:
            raise HttpError(401, f"유효하지 않은 API 키입니다. 받은 키: {x_api_key}, 예상 키: {expected_api_key}")
        
        # 서비스 키 확인
        service_key = getattr(settings, 'PUBLIC_DATA_SERVICE_KEY', None)
        if not service_key:
            raise HttpError(500, "공공데이터 서비스 키가 설정되지 않았습니다")
        
        # 날짜 설정 (전체 데이터 가져오기)
        if not bgnde:
            # 날짜를 지정하지 않으면 모든 데이터 가져오기
            bgnde = None
        if not endde:
            endde = None
        
        # 동기화 전략에 따른 설정
        is_initial_sync = False
        if sync_strategy == "full":
            is_initial_sync = True
        elif sync_strategy == "status_check":
            # 상태 체크만: 전체 데이터를 가져와서 상태만 업데이트
            is_initial_sync = True
        # incremental은 기본값으로 is_initial_sync = False
        
        # 연도별 상태 자동 설정
        if not state:
            if bgnde:
                start_year = int(bgnde[:4])
                if 2019 <= start_year <= 2022:
                    state = "protect"  # 2019-2022년은 보호중만
                else:
                    state = "protect"  # 2023년 이후는 기본값
            else:
                # 날짜가 지정되지 않은 경우 전체 데이터이므로 상태 필터 없음
                state = None
        
        print(f"📅 데이터 가져오기 설정: 날짜={bgnde or '전체'}, 상태={state or '전체'}")
        print(f"🔍 동기화 전략: {sync_strategy}, 초기 동기화: {is_initial_sync}")
        
        # 공공데이터 서비스 초기화
        public_data_service = PublicDataService(service_key)
        
        # 유기동물 데이터 가져오기
        animals_data = await public_data_service.fetch_abandoned_animals(
            bgnde=bgnde,
            endde=endde,
            upkind=upkind,
            state=state,
            page_no=page_no,
            num_of_rows=num_of_rows,
            is_initial_sync=is_initial_sync
        )
        
        if not animals_data:
            return 200, PublicDataSyncResponseOut(
                message="동기화할 데이터가 없습니다",
                result=PublicDataSyncResultOut(
                    created=0,
                    updated=0,
                    errors=0,
                    total=0
                )
            )
        
        # 동물 데이터 처리
        result = await public_data_service.process_abandoned_animals(animals_data)
        
        # 동기화 전략에 따른 메시지
        if sync_strategy == "status_check":
            message = f"상태 체크 완료: {result['updated']}개 동물 상태 업데이트"
        elif sync_strategy == "full":
            message = f"전체 동기화 완료: {result['created']}개 생성, {result['updated']}개 업데이트"
        else:
            message = f"증분 동기화 완료: {result['created']}개 생성, {result['updated']}개 업데이트"
        
        return 200, PublicDataSyncResponseOut(
            message=message,
            result=PublicDataSyncResultOut(**result)
        )
        
    except HttpError:
        raise
    except Exception as e:
        print(f"공공데이터 동기화 오류: {e}")
        raise HttpError(500, f"공공데이터 동기화 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/public-data/status",
    summary="[R] 공공데이터 동기화 상태 조회",
    description="공공데이터로부터 가져온 동물들의 상태를 조회합니다.",
    response={
        200: PublicDataStatusOut,
        500: PublicDataErrorOut,
    },
)
async def get_public_data_status(request: HttpRequest):
    """공공데이터 동기화 상태를 조회합니다."""
    try:
        from django.db.models import Count
        
        # 공공데이터 동물 통계
        total_public_animals = await Animal.objects.filter(is_public_data=True).acount()
        
        # 상태별 통계
        status_stats = await Animal.objects.filter(
            is_public_data=True
        ).values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # 최근 업데이트 시간
        latest_update = await Animal.objects.filter(
            is_public_data=True
        ).order_by('-public_update_time').values_list('public_update_time', flat=True).afirst()
        
        return 200, PublicDataStatusOut(
            total_public_animals=total_public_animals,
            status_distribution=list(status_stats),
            latest_update=latest_update.isoformat() if latest_update else None
        )
        
    except Exception as e:
        print(f"공공데이터 상태 조회 오류: {e}")
        raise HttpError(500, "공공데이터 상태 조회 중 오류가 발생했습니다")
