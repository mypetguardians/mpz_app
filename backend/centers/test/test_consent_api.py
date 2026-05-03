from django.test import TestCase, override_settings
from ninja.testing import TestAsyncClient
from centers.models import Center, AdoptionConsent
from user.models import User
from asgiref.sync import sync_to_async
import jwt
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


@override_settings(DJANGO_ENV_NAME="local")
class TestConsentAPI(TestCase):
    def setUp(self):
        # consent_api router를 직접 테스트
        from centers.api.consent_api import router
        self.client = TestAsyncClient(router)
        
        # 테스트용 사용자 생성 (센터 관리자)
        self.center_user = User.objects.create_user(
            username="center_manager",
            email="center@test.com",
            password="password1234!",
            user_type="센터관리자"
        )
        
        # 테스트용 센터 최고관리자 생성
        self.super_admin = User.objects.create_user(
            username="super_admin",
            email="super@test.com",
            password="password1234!",
            user_type="센터최고관리자"
        )
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name="테스트 센터",
            owner=self.center_user,
            location="서울시 강남구",
            region="서울",
            phone_number="010-1234-5678",
            description="테스트용 센터입니다",
            is_public=True
        )
        
        # 테스트용 동의서 생성
        self.consent = AdoptionConsent.objects.create(
            center=self.center,
            title="테스트 동의서",
            description="테스트용 동의서입니다",
            content="이 동의서는 테스트 목적으로 작성되었습니다.",
            is_active=True
        )

    def generate_jwt_token(self, user):
        """실제 JWT 토큰을 생성합니다"""
        payload = {
            'user_id': str(user.id),
            'username': user.username,
            'user_type': user.user_type,
            'exp': timezone.now() + timedelta(days=1)
        }
        token = jwt.encode(payload, settings.JWT_SIGNING_KEY, algorithm="HS256")
        return {'Authorization': f'Bearer {token}'}

    async def test_get_consents_success(self):
        """동의서 목록 조회 성공 테스트"""
        headers = await sync_to_async(self.generate_jwt_token)(self.center_user)
        
        response = await self.client.get("/", headers=headers)
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        consents = response.json()
        self.assertIsInstance(consents, list)
        self.assertEqual(len(consents), 1)
        
        consent = consents[0]
        self.assertEqual(consent['title'], "테스트 동의서")
        self.assertEqual(consent['center_id'], str(self.center.id))
        self.assertTrue(consent['is_active'])

    async def test_get_consents_by_center_success(self):
        """특정 센터의 동의서 목록 조회 성공 테스트 (공개 API)"""
        # 인증 없이 직접 조회
        response = await self.client.get(f"/center/{self.center.id}")
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        consents = response.json()
        self.assertIsInstance(consents, list)
        self.assertEqual(len(consents), 1)
        
        consent = consents[0]
        self.assertEqual(consent['title'], "테스트 동의서")
        self.assertEqual(consent['center_id'], str(self.center.id))
        self.assertTrue(consent['is_active'])

    async def test_get_consents_by_center_not_found(self):
        """존재하지 않는 센터의 동의서 목록 조회 테스트 (공개 API)"""
        fake_center_id = "00000000-0000-0000-0000-000000000000"
        response = await self.client.get(f"/center/{fake_center_id}")
        
        # 404 Not Found
        self.assertEqual(response.status_code, 404)
        error = response.json()
        self.assertIn("센터를 찾을 수 없습니다", error['detail'])

    async def test_get_consent_detail_success(self):
        """동의서 상세 조회 성공 테스트"""
        headers = await sync_to_async(self.generate_jwt_token)(self.center_user)
        
        response = await self.client.get(f"/{self.consent.id}", headers=headers)
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        consent = response.json()
        self.assertEqual(consent['id'], str(self.consent.id))
        self.assertEqual(consent['title'], "테스트 동의서")
        self.assertEqual(consent['content'], "이 동의서는 테스트 목적으로 작성되었습니다.")

    async def test_create_consent_success(self):
        """동의서 생성 성공 테스트"""
        headers = await sync_to_async(self.generate_jwt_token)(self.center_user)
        
        data = {
            "title": "새로운 동의서",
            "description": "새로 생성하는 동의서",
            "content": "새로운 동의서 내용입니다.",
            "is_active": True
        }
        
        response = await self.client.post("/", json=data, headers=headers)
        
        # 200 OK (실제로는 200을 반환함)
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        consent = response.json()
        self.assertEqual(consent['title'], "새로운 동의서")
        self.assertEqual(consent['center_id'], str(self.center.id))
        self.assertTrue(consent['is_active'])

    async def test_update_consent_success(self):
        """동의서 수정 성공 테스트"""
        headers = await sync_to_async(self.generate_jwt_token)(self.center_user)
        
        data = {
            "title": "수정된 동의서",
            "content": "수정된 동의서 내용입니다.",
            "is_active": False
        }
        
        response = await self.client.put(f"/{self.consent.id}", json=data, headers=headers)
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        consent = response.json()
        self.assertEqual(consent['title'], "수정된 동의서")
        self.assertEqual(consent['content'], "수정된 동의서 내용입니다.")
        self.assertFalse(consent['is_active'])

    async def test_delete_consent_success(self):
        """동의서 삭제 성공 테스트"""
        headers = await sync_to_async(self.generate_jwt_token)(self.center_user)
        
        response = await self.client.delete(f"/{self.consent.id}", headers=headers)
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        result = response.json()
        self.assertEqual(result['message'], "동의서가 성공적으로 삭제되었습니다")

    async def test_consent_unauthorized(self):
        """동의서 API 인증 실패 테스트"""
        data = {
            "title": "새로운 동의서",
            "content": "새로운 동의서 내용입니다."
        }
        
        response = await self.client.post("/", json=data)
        
        # 401 Unauthorized
        self.assertEqual(response.status_code, 401)

    async def test_consent_forbidden(self):
        """동의서 API 권한 부족 테스트"""
        # 일반 사용자 생성
        normal_user = await sync_to_async(User.objects.create_user)(
            username="normal_user",
            email="normal@test.com",
            password="password1234!",
            user_type="일반사용자"
        )
        
        headers = await sync_to_async(self.generate_jwt_token)(normal_user)
        
        response = await self.client.get("/", headers=headers)
        
        # 403 Forbidden
        self.assertEqual(response.status_code, 403)

    async def test_super_admin_access(self):
        """센터 최고관리자 접근 테스트"""
        # 센터 최고관리자를 센터의 owner로 설정
        self.center.owner = self.super_admin
        await sync_to_async(self.center.save)()
        
        headers = await sync_to_async(self.generate_jwt_token)(self.super_admin)
        
        response = await self.client.get("/", headers=headers)
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        consents = response.json()
        self.assertIsInstance(consents, list)
