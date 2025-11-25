from ninja import Router
from ninja.errors import HttpError
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from typing import List
from centers.models import Center
from animals.models import Animal, AnimalImage
from centers.schemas.inbound import (
    CenterUpdateIn,
    CenterAnimalsQueryIn,
)
from centers.schemas.outbound import (
    CenterOut,
    CenterAnimalOut,
    ErrorOut
)
from api.security import jwt_auth
from django.db.models import Q
from ninja.pagination import paginate, Query

router = Router(tags=["Center Auth"])

def _build_center_response(center):
    """센터 응답 데이터를 구성합니다."""
    return CenterOut(
        id=str(center.id),
        name=center.name,
        center_number=center.center_number,
        description=center.description,
        location=center.location,
        region=center.region,
        phone_number=center.phone_number,
        adoption_procedure=center.adoption_procedure,
        adoption_guidelines=center.adoption_guidelines,
        has_monitoring=center.has_monitoring,
        monitoring_period_months=center.monitoring_period_months,
        monitoring_interval_days=center.monitoring_interval_days,
        monitoring_description=center.monitoring_description,
        verified=center.verified,
        is_public=center.is_public,
        adoption_price=center.adoption_price,
        image_url=center.image_url,
        is_subscribed=center.is_subscribed,
        has_volunteer=center.has_volunteer,
        has_foster_care=center.has_foster_care,
        show_phone_number=center.show_phone_number,
        show_location=center.show_location,
        call_available_time=center.call_available_time,
        public_reg_no=center.public_reg_no,
        owner_name=center.owner.username if center.owner else None,
        created_at=center.created_at.isoformat(),
        updated_at=center.updated_at.isoformat(),
    )

@router.get(
    "/me",
    summary="[R] 내 센터 정보 조회",
    description="센터 관리자가 자신의 센터 정보를 조회합니다.",
    response={
        200: CenterOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def get_my_center(request: HttpRequest):
    """내 센터 정보를 조회합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "인증이 필요합니다")
        
        # 현재 사용자 (jwt_auth에서 request.auth에 User 객체를 설정함)
        current_user = request.auth
        
        # request.auth가 awaitable인 경우 await 처리
        if hasattr(current_user, '__await__'):
            current_user = await current_user
        
        @sync_to_async
        def get_my_center_info():
            # 센터 관리자, 최고 관리자, 훈련사 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자", "훈련사"]:
                raise HttpError(403, "센터 관리자, 최고 관리자, 훈련사 권한이 필요합니다")
            
            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(404, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(404, "등록된 센터가 없습니다")
            
            # 응답 데이터 변환
            return _build_center_response(user_center)
        
        return await get_my_center_info()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"센터 정보를 가져오는데 실패했습니다: {str(e)}")


@router.put(
    "/update",
    summary="[U] 센터 설정 수정",
    description="센터 관리자가 센터 설정을 수정합니다.",
    response={
        200: CenterOut,
        401: ErrorOut,
        403: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def update_center_settings(request: HttpRequest, data: CenterUpdateIn):
    """센터 설정을 수정합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "인증이 필요합니다")
        
        # 현재 사용자 (jwt_auth에서 request.auth에 User 객체를 설정함)
        current_user = request.auth
        
        # request.auth가 awaitable인 경우 await 처리
        if hasattr(current_user, '__await__'):
            current_user = await current_user
        
        @sync_to_async
        def update_center():
            # 센터 관리자 또는 센터 최고관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
            
            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(404, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(404, "등록된 센터가 없습니다")
            
            # 업데이트할 데이터만 필터링하여 업데이트
            update_fields = {
                'name': data.name,
                'center_number': data.center_number,
                'description': data.description,
                'location': data.location,
                'region': data.region,
                'phone_number': data.phone_number,
                'adoption_procedure': data.adoption_procedure,
                'adoption_guidelines': data.adoption_guidelines,
                'has_monitoring': data.has_monitoring,
                'monitoring_period_months': data.monitoring_period_months,
                'monitoring_interval_days': data.monitoring_interval_days,
                'monitoring_description': data.monitoring_description,
                'adoption_price': data.adoption_price,
                'image_url': data.image_url,
                'has_volunteer': data.has_volunteer,
                'has_foster_care': data.has_foster_care,
                'call_available_time': data.call_available_time,
            }
            
            # None이 아니고 빈 문자열이 아닌 값만 업데이트 (단, image_url은 빈 문자열도 허용)
            update_data = {}
            for k, v in update_fields.items():
                if v is not None:
                    if k == 'image_url':
                        # image_url은 빈 문자열도 허용
                        update_data[k] = v
                    elif v != '':
                        # 다른 필드는 빈 문자열 제외
                        update_data[k] = v
            
            # 센터 정보 업데이트
            Center.objects.filter(id=user_center.id).update(**update_data)
            
            # 업데이트된 센터 정보 조회
            updated_center = Center.objects.select_related('owner').get(id=user_center.id)
            
            # 응답 데이터 변환
            return _build_center_response(updated_center)
        
        return await update_center()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"센터 설정 수정 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/animals",
    summary="[R] 우리 센터 동물 목록 조회",
    description="센터 관리자가 자신의 센터에 등록된 동물 목록을 조회합니다.",
    response={
        200: List[CenterAnimalOut],
        401: ErrorOut,
        403: ErrorOut,
        400: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
@paginate
async def get_center_animals(request: HttpRequest, filters: CenterAnimalsQueryIn = Query(CenterAnimalsQueryIn())):
    """우리 센터의 동물 목록을 조회합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "인증이 필요합니다")
        
        # 현재 사용자 (jwt_auth에서 request.auth에 User 객체를 설정함)
        current_user = request.auth
        
        # request.auth가 awaitable인 경우 await 처리
        if hasattr(current_user, '__await__'):
            current_user = await current_user
        
        @sync_to_async
        def get_animals_list():
            # 센터 관리자 이상 권한 확인
            if current_user.user_type == "일반사용자":
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")
            
            # 센터 ID 결정
            if current_user.user_type == "센터관리자":
                # 센터 관리자는 자신의 센터만 조회 가능
                try:
                    user_center = Center.objects.get(owner=current_user)
                    center_id = str(user_center.id)
                except Center.DoesNotExist:
                    raise HttpError(400, "등록된 센터가 없습니다")
            else:
                # 훈련사나 최고관리자는 센터 ID를 요청에서 받아야 함
                if not filters.center_id:
                    raise HttpError(400, "센터 ID가 필요합니다")
                center_id = filters.center_id
            
            # 기본 쿼리셋
            queryset = Animal.objects.filter(center_id=center_id)
            
            # 필터링
            if filters.status:
                from django.db.models import Q
                # 특별한 필터 처리
                if filters.status == '무지개다리':
                    # 무지개다리는 자연사, 안락사, 반환 모두 포함
                    queryset = queryset.filter(
                        Q(protection_status='자연사') | 
                        Q(protection_status='안락사') | 
                        Q(protection_status='반환')
                    )
                elif filters.status == '입양가능':
                    # 입양가능은 입양가능과 입양진행중 모두 포함
                    queryset = queryset.filter(
                        Q(adoption_status='입양가능') | 
                        Q(adoption_status='입양진행중')
                    )
                else:
                    # 기존 status 필터를 protection_status와 adoption_status로 분리
                    if filters.status in ['보호중', '안락사', '자연사', '반환']:
                        queryset = queryset.filter(protection_status=filters.status)
                    elif filters.status in ['입양가능', '입양진행중', '입양완료', '입양불가']:
                        queryset = queryset.filter(adoption_status=filters.status)
                    else:
                        # 기타 상태는 두 필드 모두에서 검색
                        queryset = queryset.filter(
                            Q(protection_status=filters.status) | Q(adoption_status=filters.status)
                        )
            
            if filters.breed:
                queryset = queryset.filter(breed__icontains=filters.breed)
            
            if filters.gender:
                is_female = filters.gender == "female"
                queryset = queryset.filter(is_female=is_female)
            
            # 체중 필터링
            if filters.weight:
                if filters.weight == "10kg_under":
                    queryset = queryset.filter(weight__lte=10.0)
                elif filters.weight == "25kg_under":
                    queryset = queryset.filter(weight__gt=10.0, weight__lte=25.0)
                elif filters.weight == "over_25kg":
                    queryset = queryset.filter(weight__gt=25.0)
            
            # 나이 필터링
            if filters.age:
                if filters.age == "2_under":
                    queryset = queryset.filter(age__lte=2)
                elif filters.age == "7_under":
                    queryset = queryset.filter(age__gte=3, age__lte=7)
                elif filters.age == "over_7":
                    queryset = queryset.filter(age__gte=8)
            
            # 훈련사 코멘트 필터링
            if filters.has_trainer_comment:
                if filters.has_trainer_comment == "true":
                    queryset = queryset.exclude(
                        Q(trainer_comment__isnull=True) | Q(trainer_comment="")
                    )
                else:
                    queryset = queryset.filter(
                        Q(trainer_comment__isnull=True) | Q(trainer_comment="")
                    )
            
            # 최신순 정렬
            queryset = queryset.order_by('-created_at')
            
            # CenterAnimalOut 스키마로 변환하여 반환
            animals_response = []
            for animal in queryset:
                # 동물 이미지 조회
                animal_images = AnimalImage.objects.filter(animal=animal).order_by('sequence')
                images_response = [
                    {
                        'id': str(img.id),
                        'image_url': img.image_url,
                        'order_index': img.sequence
                    }
                    for img in animal_images
                ]
                
                # CenterAnimalOut 스키마 생성
                animal_out = CenterAnimalOut(
                    id=str(animal.id),
                    name=animal.name,
                    is_female=animal.is_female,
                    age=animal.age,
                    weight=float(animal.weight) if animal.weight else None,
                    color=getattr(animal, 'color', None),
                    breed=animal.breed,
                    description=animal.description,
                    protection_status=animal.protection_status,
                    adoption_status=animal.adoption_status,
                    waiting_days=0,  # 기본값
                    activity_level=getattr(animal, 'activity_level', None),
                    sensitivity=getattr(animal, 'sensitivity', None),
                    sociability=getattr(animal, 'sociability', None),
                    separation_anxiety=getattr(animal, 'separation_anxiety', None),
                    special_notes=getattr(animal, 'special_notes', None),
                    health_notes=animal.health_notes,
                    basic_training=getattr(animal, 'basic_training', None),
                    trainer_comment=getattr(animal, 'trainer_comment', None),
                    announce_number=animal.announce_number,
                    announcement_date=getattr(animal, 'announcement_date', None),
                    found_location=getattr(animal, 'found_location', None),
                    admission_date=animal.admission_date.isoformat() if animal.admission_date else None,
                    personality=animal.personality,
                    center_id=str(animal.center.id),
                    created_at=animal.created_at.isoformat(),
                    updated_at=animal.updated_at.isoformat(),
                    animal_images=images_response
                )
                animals_response.append(animal_out)
            
            return animals_response
        
        return await get_animals_list()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"센터 동물 목록 조회 중 오류가 발생했습니다: {str(e)}")
