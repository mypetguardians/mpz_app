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

router = Router(tags=["Animals"])

@router.post(
    "/",
    summary="[C] 동물 등록",
    description="새로운 동물을 등록합니다. 센터 관리자 이상의 권한이 필요합니다.",
    response={
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
            user_center = await sync_to_async(Center.objects.filter(user=user).first)()
            if not user_center:
                raise HttpError(400, "등록된 센터가 없습니다")
            center_id = user_center.id
        else:
            # 훈련사나 최고관리자는 센터 ID를 요청에서 받아야 함
            center_id = request.GET.get("center_id")
            if not center_id:
                raise HttpError(400, "센터 ID가 필요합니다")
        
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
            color=animal.color,
            breed=animal.breed,
            description=animal.description,
            status=animal.status,
            waiting_days=0,
            activity_level=animal.activity_level,
            sensitivity=animal.sensitivity,
            sociability=animal.sociability,
            separation_anxiety=animal.separation_anxiety,
            special_notes=animal.special_notes,
            health_notes=animal.health_notes,
            basic_training=animal.basic_training,
            trainer_comment=animal.trainer_comment,
            announce_number=animal.announce_number,
            announcement_date=animal.announcement_date,
            found_location=animal.found_location,
            admission_date=animal.admission_date.isoformat() if animal.admission_date else None,
            personality=animal.personality,
            megaphone_count=animal.megaphone_count,
            is_megaphoned=False,  # 새로 생성된 동물은 기본값
            center_id=str(animal.center_id),
            animal_images=[],
            created_at=animal.created_at.isoformat(),
            updated_at=animal.updated_at.isoformat(),
        )
        
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
        if data.color is not None:
            update_data["color"] = data.color
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
            update_data["special_notes"] = data.special_notes
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
            color=animal.color,
            breed=animal.breed,
            description=animal.description,
            status=animal.status,
            waiting_days=0,
            activity_level=animal.activity_level,
            sensitivity=animal.sensitivity,
            sociability=animal.sociability,
            separation_anxiety=animal.separation_anxiety,
            special_notes=animal.special_notes,
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
                announcement_date=None,  # Animal 모델에 없는 필드
                found_location=None,  # Animal 모델에 없는 필드
                personality=related_animal.personality,
                center_id=str(related_animal.center_id),
                animal_images=[],  # 빈 배열 임시설정
                created_at=related_animal.created_at.isoformat(),
                updated_at=related_animal.updated_at.isoformat(),
            )
            animals_response.append(animal_data)
        
        return animals_response
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"관련 동물 조회 중 오류가 발생했습니다: {str(e)}")
