from django.test import TestCase, override_settings
from ninja.testing import TestAsyncClient
from favorites.models import CenterFavorite, AnimalFavorite
from centers.models import Center
from animals.models import Animal
from user.models import User
from asgiref.sync import sync_to_async
import jwt
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

@override_settings(DJANGO_ENV_NAME="local")
class TestFavoritesAPI(TestCase):
    def setUp(self):
        # API client
        from favorites.api import router as favorites_router
        self.client = TestAsyncClient(favorites_router)

        # 테스트용 사용자 생성
        self.user1 = User.objects.create_user(
            username="user1",
            email="user1@test.com",
            password="password1234!",
            user_type="일반사용자"
        )

        self.user2 = User.objects.create_user(
            username="user2",
            email="user2@test.com",
            password="password1234!",
            user_type="일반사용자"
        )

        # 테스트용 센터 관리자 생성
        self.center_user = User.objects.create_user(
            username="center_manager",
            email="center@test.com",
            password="password1234!",
            user_type="센터관리자"
        )

        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name="테스트 센터",
            owner=self.center_user,
            location="서울시 강남구",
            region="서울",
            phone_number="010-1234-5678",
            is_public=True
        )

        # 테스트용 동물 생성
        self.animal = Animal.objects.create(
            center=self.center,
            name="테스트 강아지",
            is_female=True,
            age=24,
            weight=Decimal('15.50'),
            breed="골든 리트리버",
            status="보호중",
            description="친근한 강아지입니다"
        )

        # 기존 찜 데이터 생성 (user2가 센터와 동물을 찜)
        self.existing_center_favorite = CenterFavorite.objects.create(
            user=self.user2,
            center=self.center
        )

        self.existing_animal_favorite = AnimalFavorite.objects.create(
            user=self.user2,
            animal=self.animal
        )

    def generate_jwt_token(self, user):
        """실제 JWT 토큰을 생성합니다"""
        payload = {
            'user_id': str(user.id),
            'username': user.username,
            'exp': timezone.now() + timedelta(hours=1),
            'iat': timezone.now()
        }
        token = jwt.encode(payload, settings.JWT_SIGNING_KEY, algorithm="HS256")
        return token

    async def authenticate(self, user=None):
        """사용자 인증 및 JWT 토큰 획득"""
        if user is None:
            user = self.user1

        try:
            token = self.generate_jwt_token(user)
            return {
                "Authorization": f"Bearer {token}",
            }
        except Exception as e:
            print(f"Token generation failed: {e}")
            return {
                "Authorization": "Bearer test_token_for_testing",
            }

    # === 센터 찜 관련 테스트 ===

    async def test_toggle_center_favorite_add(self):
        """센터 찜 추가 테스트"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.post(f"/centers/{self.center.id}/toggle", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(data["is_favorited"])
        self.assertEqual(data["message"], "센터를 찜했습니다")
        self.assertEqual(data["total_favorites"], 2)  # user2가 이미 찜했으므로 2

    async def test_toggle_center_favorite_remove(self):
        """센터 찜 해제 테스트"""
        headers = await self.authenticate(self.user2)
        
        response = await self.client.post(f"/centers/{self.center.id}/toggle", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertFalse(data["is_favorited"])
        self.assertEqual(data["message"], "센터 찜이 해제되었습니다")
        self.assertEqual(data["total_favorites"], 0)

    async def test_toggle_center_favorite_not_found(self):
        """존재하지 않는 센터 찜 토글 테스트"""
        headers = await self.authenticate(self.user1)
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = await self.client.post(f"/centers/{fake_id}/toggle", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_toggle_center_favorite_unauthorized(self):
        """인증 없이 센터 찜 토글 테스트"""
        response = await self.client.post(f"/centers/{self.center.id}/toggle")
        self.assertEqual(response.status_code, 401)

    async def test_get_center_favorites_success(self):
        """찜한 센터 목록 조회 성공 테스트"""
        headers = await self.authenticate(self.user2)
        
        response = await self.client.get("/centers", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Django-ninja 페이지네이션 형식 확인
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 1)
        
        center_favorite = data["data"][0]
        self.assertEqual(center_favorite["id"], str(self.center.id))
        self.assertEqual(center_favorite["name"], self.center.name)
        self.assertTrue(center_favorite["is_favorited"])

    async def test_get_center_favorites_empty(self):
        """찜한 센터가 없는 경우 테스트"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.get("/centers", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 0)

    async def test_get_center_favorites_unauthorized(self):
        """인증 없이 찜한 센터 목록 조회 테스트"""
        response = await self.client.get("/centers")
        self.assertEqual(response.status_code, 401)

    async def test_check_center_favorite_status_true(self):
        """센터 찜 상태 확인 테스트 (찜한 상태)"""
        headers = await self.authenticate(self.user2)
        
        response = await self.client.get(f"/centers/{self.center.id}/status", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(data["is_favorited"])
        self.assertEqual(data["total_favorites"], 1)

    async def test_check_center_favorite_status_false(self):
        """센터 찜 상태 확인 테스트 (찜하지 않은 상태)"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.get(f"/centers/{self.center.id}/status", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertFalse(data["is_favorited"])
        self.assertEqual(data["total_favorites"], 1)  # user2가 찜했으므로 1

    async def test_check_center_favorite_status_not_found(self):
        """존재하지 않는 센터 찜 상태 확인 테스트"""
        headers = await self.authenticate(self.user1)
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = await self.client.get(f"/centers/{fake_id}/status", headers=headers)
        self.assertEqual(response.status_code, 404)

    # === 동물 찜 관련 테스트 ===

    async def test_toggle_animal_favorite_add(self):
        """동물 찜 추가 테스트"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.post(f"/animals/{self.animal.id}/toggle", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(data["is_favorited"])
        self.assertEqual(data["message"], "동물을 찜했습니다")
        self.assertEqual(data["total_favorites"], 2)  # user2가 이미 찜했으므로 2

    async def test_toggle_animal_favorite_remove(self):
        """동물 찜 해제 테스트"""
        headers = await self.authenticate(self.user2)
        
        response = await self.client.post(f"/animals/{self.animal.id}/toggle", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertFalse(data["is_favorited"])
        self.assertEqual(data["message"], "동물 찜이 해제되었습니다")
        self.assertEqual(data["total_favorites"], 0)

    async def test_toggle_animal_favorite_not_found(self):
        """존재하지 않는 동물 찜 토글 테스트"""
        headers = await self.authenticate(self.user1)
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = await self.client.post(f"/animals/{fake_id}/toggle", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_toggle_animal_favorite_unauthorized(self):
        """인증 없이 동물 찜 토글 테스트"""
        response = await self.client.post(f"/animals/{self.animal.id}/toggle")
        self.assertEqual(response.status_code, 401)

    async def test_get_animal_favorites_success(self):
        """찜한 동물 목록 조회 성공 테스트"""
        headers = await self.authenticate(self.user2)
        
        response = await self.client.get("/animals", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Django-ninja 페이지네이션 형식 확인
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 1)
        
        animal_favorite = data["data"][0]
        self.assertEqual(animal_favorite["id"], str(self.animal.id))
        self.assertEqual(animal_favorite["name"], self.animal.name)
        self.assertEqual(animal_favorite["center_name"], self.center.name)
        self.assertTrue(animal_favorite["is_favorited"])

    async def test_get_animal_favorites_empty(self):
        """찜한 동물이 없는 경우 테스트"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.get("/animals", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 0)

    async def test_get_animal_favorites_unauthorized(self):
        """인증 없이 찜한 동물 목록 조회 테스트"""
        response = await self.client.get("/animals")
        self.assertEqual(response.status_code, 401)

    async def test_check_animal_favorite_status_true(self):
        """동물 찜 상태 확인 테스트 (찜한 상태)"""
        headers = await self.authenticate(self.user2)
        
        response = await self.client.get(f"/animals/{self.animal.id}/status", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(data["is_favorited"])
        self.assertEqual(data["total_favorites"], 1)

    async def test_check_animal_favorite_status_false(self):
        """동물 찜 상태 확인 테스트 (찜하지 않은 상태)"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.get(f"/animals/{self.animal.id}/status", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertFalse(data["is_favorited"])
        self.assertEqual(data["total_favorites"], 1)  # user2가 찜했으므로 1

    async def test_check_animal_favorite_status_not_found(self):
        """존재하지 않는 동물 찜 상태 확인 테스트"""
        headers = await self.authenticate(self.user1)
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = await self.client.get(f"/animals/{fake_id}/status", headers=headers)
        self.assertEqual(response.status_code, 404)
