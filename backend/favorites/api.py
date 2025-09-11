from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from typing import List
from favorites.models import CenterFavorite, AnimalFavorite, PersonalityTest
from centers.models import Center
from animals.models import Animal
from favorites.schemas.inbound import (
    FavoriteListQueryIn,
    PersonalityTestIn,
)
from favorites.schemas.outbound import (
    FavoriteToggleOut,
    FavoriteStatusOut,
    CenterFavoriteOut,
    CenterFavoriteListOut,
    AnimalFavoriteOut,
    AnimalFavoriteListOut,
    PersonalityTestOut,
    ErrorOut
)
from api.security import jwt_auth
from django.db.models import Q

router = Router(tags=["Favorites"])


def _build_center_favorite_response(favorite):
    """찜한 센터 응답 데이터를 구성합니다."""
    center = favorite.center
    return CenterFavoriteOut(
        id=str(center.id),
        name=center.name,
        location=center.location if center.is_public else None,
        region=center.region,
        phone_number=center.phone_number,
        image_url=center.image_url,
        is_favorited=True,
        favorited_at=favorite.created_at.isoformat(),
    )


def _build_animal_favorite_response(favorite):
    """찜한 동물 응답 데이터를 구성합니다."""
    animal = favorite.animal
    return AnimalFavoriteOut(
        id=str(animal.id),
        name=animal.name,
        breed=animal.breed,
        age=animal.age,
        is_female=animal.is_female,
        protection_status=animal.protection_status,
        adoption_status=animal.adoption_status,
        personality=animal.personality,
        found_location=animal.found_location,
        admission_date=animal.admission_date.isoformat() if animal.admission_date else None,
        center_id=str(animal.center.id),
        center_name=animal.center.name,
        is_favorited=True,
        favorited_at=favorite.created_at.isoformat(),
    )


@router.post(
    "/centers/{center_id}/toggle",
    summary="[C/D] 센터 찜 토글",
    description="센터를 찜하거나 찜을 해제합니다.",
    response={
        200: FavoriteToggleOut,
        401: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def toggle_center_favorite(request: HttpRequest, center_id: str):
    """센터 찜을 토글합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def toggle_favorite():
            # 센터 존재 확인
            try:
                center = Center.objects.get(id=center_id)
            except Center.DoesNotExist:
                raise HttpError(404, "센터를 찾을 수 없습니다")

            # 현재 찜 상태 확인
            try:
                favorite = CenterFavorite.objects.get(
                    user=current_user,
                    center=center
                )
                # 찜 해제
                favorite.delete()
                is_favorited = False
                message = "센터 찜이 해제되었습니다"
            except CenterFavorite.DoesNotExist:
                # 찜 추가
                CenterFavorite.objects.create(
                    user=current_user,
                    center=center
                )
                is_favorited = True
                message = "센터를 찜했습니다"

            # 총 찜 개수 조회
            total_favorites = CenterFavorite.objects.filter(center=center).count()

            return {
                "is_favorited": is_favorited,
                "message": message,
                "total_favorites": total_favorites
            }

        return await toggle_favorite()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"센터 찜 토글 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/centers",
    summary="[R] 내가 찜한 센터 목록 조회",
    description="로그인한 사용자가 찜한 센터 목록을 조회합니다.",
    response={
        200: List[CenterFavoriteOut],
        401: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
@paginate
async def get_center_favorites(request: HttpRequest, filters: FavoriteListQueryIn = Query(FavoriteListQueryIn())):
    """내가 찜한 센터 목록을 조회합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def get_favorites_list():
            # 찜한 센터 목록 조회 (센터 정보와 함께)
            favorites = CenterFavorite.objects.filter(
                user=current_user
            ).select_related('center').order_by('-created_at')

            # CenterFavoriteOut 스키마로 변환하여 반환
            favorites_response = [
                _build_center_favorite_response(favorite)
                for favorite in favorites
            ]

            return favorites_response

        return await get_favorites_list()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"찜한 센터 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/animals/{animal_id}/toggle",
    summary="[C/D] 동물 찜 토글",
    description="동물을 찜하거나 찜을 해제합니다.",
    response={
        200: FavoriteToggleOut,
        401: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def toggle_animal_favorite(request: HttpRequest, animal_id: str):
    """동물 찜을 토글합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def toggle_favorite():
            # 동물 존재 확인
            try:
                animal = Animal.objects.get(id=animal_id)
            except Animal.DoesNotExist:
                raise HttpError(404, "동물을 찾을 수 없습니다")

            # 현재 찜 상태 확인
            try:
                favorite = AnimalFavorite.objects.get(
                    user=current_user,
                    animal=animal
                )
                # 찜 해제
                favorite.delete()
                is_favorited = False
                message = "동물 찜이 해제되었습니다"
            except AnimalFavorite.DoesNotExist:
                # 찜 추가
                AnimalFavorite.objects.create(
                    user=current_user,
                    animal=animal
                )
                is_favorited = True
                message = "동물을 찜했습니다"

            # 총 찜 개수 조회
            total_favorites = AnimalFavorite.objects.filter(animal=animal).count()

            return {
                "is_favorited": is_favorited,
                "message": message,
                "total_favorites": total_favorites
            }

        return await toggle_favorite()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동물 찜 토글 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/animals",
    summary="[R] 내가 찜한 동물 목록 조회",
    description="로그인한 사용자가 찜한 동물 목록을 조회합니다.",
    response={
        200: List[AnimalFavoriteOut],
        401: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
@paginate
async def get_animal_favorites(request: HttpRequest, filters: FavoriteListQueryIn = Query(FavoriteListQueryIn())):
    """내가 찜한 동물 목록을 조회합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def get_favorites_list():
            # 찜한 동물 목록 조회 (동물 및 센터 정보와 함께)
            favorites = AnimalFavorite.objects.filter(
                user=current_user
            ).select_related('animal', 'animal__center').order_by('-created_at')

            # AnimalFavoriteOut 스키마로 변환하여 반환
            favorites_response = [
                _build_animal_favorite_response(favorite)
                for favorite in favorites
            ]

            return favorites_response

        return await get_favorites_list()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"찜한 동물 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/centers/{center_id}/status",
    summary="[R] 센터 찜 상태 확인",
    description="특정 센터의 찜 상태를 확인합니다.",
    response={
        200: FavoriteStatusOut,
        401: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def check_center_favorite_status(request: HttpRequest, center_id: str):
    """센터 찜 상태를 확인합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def check_status():
            # 센터 존재 확인
            try:
                center = Center.objects.get(id=center_id)
            except Center.DoesNotExist:
                raise HttpError(404, "센터를 찾을 수 없습니다")

            # 찜 상태 확인
            is_favorited = CenterFavorite.objects.filter(
                user=current_user,
                center=center
            ).exists()

            # 총 찜 개수 조회
            total_favorites = CenterFavorite.objects.filter(center=center).count()

            return {
                "is_favorited": is_favorited,
                "total_favorites": total_favorites
            }

        return await check_status()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"센터 찜 상태 확인 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/animals/{animal_id}/status",
    summary="[R] 동물 찜 상태 확인",
    description="특정 동물의 찜 상태를 확인합니다.",
    response={
        200: FavoriteStatusOut,
        401: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def check_animal_favorite_status(request: HttpRequest, animal_id: str):
    """동물 찜 상태를 확인합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def check_status():
            # 동물 존재 확인
            try:
                animal = Animal.objects.get(id=animal_id)
            except Animal.DoesNotExist:
                raise HttpError(404, "동물을 찾을 수 없습니다")

            # 찜 상태 확인
            is_favorited = AnimalFavorite.objects.filter(
                user=current_user,
                animal=animal
            ).exists()

            # 총 찜 개수 조회
            total_favorites = AnimalFavorite.objects.filter(animal=animal).count()

            return {
                "is_favorited": is_favorited,
                "total_favorites": total_favorites
            }

        return await check_status()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"동물 찜 상태 확인 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/personality-test",
    summary="[C] 성격 테스트 데이터 생성",
    description="사용자의 성격 테스트 데이터를 저장합니다.",
    response={
        201: PersonalityTestOut,
        400: ErrorOut,
        401: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def create_personality_test(request: HttpRequest, data: PersonalityTestIn):
    """성격 테스트 데이터를 생성합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def create_test():
            # 성격 테스트 생성 - 단순하게 answers 필드에 저장
            personality_test = PersonalityTest.objects.create(
                user=current_user,
                test_type="basic",
                answers=data.answers
            )
            
            return personality_test

        personality_test = await create_test()
        
        # 201 응답 반환
        return 201, {
            "id": str(personality_test.id),
            "answers": personality_test.answers,
            "completed_at": personality_test.completed_at.isoformat(),
            "message": "성격 테스트가 성공적으로 저장되었습니다."
        }
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"성격 테스트 생성 중 오류가 발생했습니다: {str(e)}")

