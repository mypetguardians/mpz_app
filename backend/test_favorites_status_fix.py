#!/usr/bin/env python
"""
찜한 동물 리스트 status 필드 수정 테스트
"""

import os
import sys
import django
import asyncio
from django.utils import timezone

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfehome.settings')
django.setup()

from animals.models import Animal
from centers.models import Center
from user.models import User
from favorites.models import AnimalFavorite
from asgiref.sync import sync_to_async


async def test_favorites_status_fields():
    """찜한 동물 리스트 status 필드 테스트"""
    print("=== 찜한 동물 리스트 status 필드 테스트 ===\n")
    
    try:
        # 1. 테스트 데이터 생성
        print("1. 테스트 데이터 생성...")
        
        # 사용자 생성
        try:
            user = await sync_to_async(User.objects.get)(username="favorites_test_user")
        except User.DoesNotExist:
            user = await sync_to_async(User.objects.create)(
                username="favorites_test_user",
                email="favorites@example.com",
                user_type="일반사용자"
            )
        
        # 센터 생성
        try:
            center = await sync_to_async(Center.objects.get)(name="찜한 동물 테스트 보호소")
        except Center.DoesNotExist:
            center = await sync_to_async(Center.objects.create)(
                name="찜한 동물 테스트 보호소",
                location="서울시 강남구",
                center_number="FAV-001"
            )
        
        # 동물 생성 (다양한 상태로)
        test_animals = [
            {
                'name': '찜한 강아지1',
                'protection_status': '보호중',
                'adoption_status': '입양가능'
            },
            {
                'name': '찜한 강아지2',
                'protection_status': '보호중',
                'adoption_status': '입양진행중'
            },
            {
                'name': '찜한 강아지3',
                'protection_status': '보호중',
                'adoption_status': '입양완료'
            },
            {
                'name': '찜한 강아지4',
                'protection_status': '안락사',
                'adoption_status': '입양불가'
            }
        ]
        
        created_animals = []
        for animal_data in test_animals:
            animal = await sync_to_async(Animal.objects.create)(
                center=center,
                name=animal_data['name'],
                is_female=False,
                age=12,
                weight=5.0,
                breed="믹스견",
                protection_status=animal_data['protection_status'],
                adoption_status=animal_data['adoption_status']
            )
            created_animals.append(animal)
            print(f"   ✅ {animal_data['name']} 생성: 보호상태={animal_data['protection_status']}, 입양상태={animal_data['adoption_status']}")
        
        # 2. 찜한 동물 생성
        print(f"\n2. 찜한 동물 생성...")
        
        for animal in created_animals:
            favorite = await sync_to_async(AnimalFavorite.objects.create)(
                user=user,
                animal=animal
            )
            print(f"   ✅ {animal.name} 찜하기 완료")
        
        # 3. 찜한 동물 리스트 조회 테스트
        print(f"\n3. 찜한 동물 리스트 조회 테스트...")
        
        from favorites.api import _build_animal_favorite_response
        
        favorites = await sync_to_async(list)(
            AnimalFavorite.objects.filter(user=user)
            .select_related('animal', 'animal__center')
            .order_by('-created_at')
        )
        
        for favorite in favorites:
            try:
                # _build_animal_favorite_response 함수 테스트
                response_data = _build_animal_favorite_response(favorite)
                
                print(f"   ✅ {favorite.animal.name}:")
                print(f"      보호상태: {response_data.protection_status}")
                print(f"      입양상태: {response_data.adoption_status}")
                print(f"      찜한일시: {response_data.favorited_at}")
                
                # 필드 존재 여부 확인
                assert hasattr(response_data, 'protection_status'), "protection_status 필드가 없습니다"
                assert hasattr(response_data, 'adoption_status'), "adoption_status 필드가 없습니다"
                assert not hasattr(response_data, 'status'), "기존 status 필드가 여전히 존재합니다"
                
            except Exception as e:
                print(f"   ❌ {favorite.animal.name} 처리 실패: {e}")
                return False
        
        # 4. 상태별 통계
        print(f"\n4. 상태별 통계:")
        
        from django.db.models import Count
        
        protection_stats = await sync_to_async(list)(
            Animal.objects.filter(animalfavorite__user=user)
            .values('protection_status')
            .annotate(count=Count('id'))
            .order_by('protection_status')
        )
        
        adoption_stats = await sync_to_async(list)(
            Animal.objects.filter(animalfavorite__user=user)
            .values('adoption_status')
            .annotate(count=Count('id'))
            .order_by('adoption_status')
        )
        
        print("   보호상태별:")
        for stat in protection_stats:
            print(f"      - {stat['protection_status']}: {stat['count']}마리")
        
        print("   입양상태별:")
        for stat in adoption_stats:
            print(f"      - {stat['adoption_status']}: {stat['count']}마리")
        
        print("\n✅ 찜한 동물 리스트 status 필드 테스트 완료!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 찜한 동물 리스트 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """메인 테스트 함수"""
    print("찜한 동물 리스트 status 필드 수정 테스트를 시작합니다...\n")
    
    # 찜한 동물 status 필드 테스트
    test_result = await test_favorites_status_fields()
    
    if test_result:
        print("\n🎉 찜한 동물 리스트 status 필드 수정이 성공적으로 완료되었습니다!")
        print("\n📋 수정 결과 요약:")
        print("✅ AnimalFavoriteOut 스키마에서 status → protection_status, adoption_status로 변경")
        print("✅ _build_animal_favorite_response 함수에서 새로운 필드 사용")
        print("✅ 관련 API들에서 새로운 상태 필드 사용")
        print("✅ 찜한 동물 리스트에서 정상적으로 데이터 조회 가능")
    else:
        print("\n❌ 찜한 동물 리스트 테스트가 실패했습니다.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
