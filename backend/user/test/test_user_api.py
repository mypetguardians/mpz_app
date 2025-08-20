from django.test import TestCase
from user.api import router
from ninja.testing import TestAsyncClient
from user.models import User
from centers.models import Center
from django.test import override_settings


@override_settings(DJANGO_ENV_NAME="local")
class TestUserAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name="테스트 센터",
            location="서울시 강남구",
            phone_number="02-1234-5678"
        )
        
        # 테스트용 사용자 생성
        self.user = User.objects.create_user(
            username="test1",
            password="password1234!",
            email="test1@example.com",
            user_type=User.UserTypeChoice.normal,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center
        )

    async def authenticate(self):
        data = {
            "username": self.user.username,
            "password": "password1234!",
        }
        response = await self.client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def test_signup(self):
        """회원가입 성공 테스트"""
        data = {
            "username": "test2",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 200)

    async def test_signup_fail_duplicate(self):
        """회원가입 실패 테스트: 이미 등록된 아이디"""
        data = {
            "username": self.user.username,
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 400)

    async def test_signup_fail_no_terms_agreement(self):
        """회원가입 실패 테스트: 약관 동의 없음"""
        data = {
            "username": "test3",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": False,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 400)

    async def test_signup_fail_no_privacy_agreement(self):
        """회원가입 실패 테스트: 개인정보 동의 없음"""
        data = {
            "username": "test4",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": False,
        }
        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 400)

    async def test_login_success(self):
        """로그인 성공 테스트"""
        data = {
            "username": self.user.username,
            "password": "password1234!",
        }
        response = await self.client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())

    async def test_login_fail_invalid_credentials(self):
        """로그인 실패 테스트: 잘못된 인증 정보"""
        data = {
            "username": self.user.username,
            "password": "wrongpassword",
        }
        response = await self.client.post("/login", json=data)
        self.assertEqual(response.status_code, 400)

    async def test_get_me(self):
        """사용자 정보 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get("/me", headers=headers)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["username"], self.user.username)
        self.assertEqual(data["status"], self.user.status)

    async def test_get_me_unauthorized(self):
        """사용자 정보 조회 실패 테스트: 인증 없음"""
        response = await self.client.get("/me")
        self.assertEqual(response.status_code, 401)

    async def test_update_me(self):
        """사용자 정보 수정 테스트"""
        headers = await self.authenticate()
        data = {
            "nickname": "수정된닉네임",
            "phone_number": "01012345678",
            "birth": "1990-01-01",
            "address": "서울시 강남구",
            "address_is_public": True,
        }
        response = await self.client.patch("/me", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)

    async def test_update_me_unauthorized(self):
        """사용자 정보 수정 실패 테스트: 권한 없음"""
        data = {
            "nickname": "수정된닉네임",
            "phone_number": "01012345678",
        }
        response = await self.client.patch("/me", json=data)
        self.assertEqual(response.status_code, 401)

    async def test_refresh_token(self):
        """토큰 갱신 테스트"""
        # 먼저 로그인해서 refresh token 획득
        login_data = {
            "username": self.user.username,
            "password": "password1234!",
        }
        login_response = await self.client.post("/login", json=login_data)
        login_data = login_response.json()
        refresh_token = login_data["refresh_token"]
        
        # refresh token으로 새로운 access token 요청
        refresh_data = {
            "refresh_token": refresh_token
        }
        response = await self.client.post("/refresh-token", json=refresh_data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())

    async def test_refresh_token_invalid(self):
        """토큰 갱신 실패 테스트: 잘못된 refresh token"""
        refresh_data = {
            "refresh_token": "invalid_token"
        }
        response = await self.client.post("/refresh-token", json=refresh_data)
        self.assertEqual(response.status_code, 400)

    async def test_delete_user(self):
        """사용자 삭제 테스트 - 현재는 /me 엔드포인트만 있음"""
        headers = await self.authenticate()
        # 사용자 삭제 엔드포인트가 없으므로 테스트 제거
        pass

    async def test_delete_user_unauthorized(self):
        """사용자 삭제 실패 테스트 - 현재는 /me 엔드포인트만 있음"""
        # 사용자 삭제 엔드포인트가 없으므로 테스트 제거
        pass
