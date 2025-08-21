from django.test import TestCase
from adoptions.api.phone_verification import router
from user.api import router as user_router
from ninja.testing import TestAsyncClient
from user.models import User, PhoneVerificationToken
from centers.models import Center
from django.test import override_settings
from django.utils import timezone
from datetime import timedelta


class TestPhoneVerificationAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.user_client = TestAsyncClient(user_router)
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name="테스트 센터",
            location="서울시 강남구",
            phone_number="02-1234-5678"
        )
        
        # 일반 사용자 생성
        self.normal_user = User.objects.create_user(
            username="test_user",
            password="password1234!",
            email="test@example.com",
            user_type=User.UserTypeChoice.normal,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center
        )
    
    async def authenticate(self):
        """사용자 인증 및 JWT 토큰 획득"""
        data = {
            "username": self.normal_user.username,
            "password": "password1234!",
        }
        response = await self.user_client.post("/login", json=data)
        response_data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response_data)
        self.assertIn("refresh_token", response_data)
        return {
            "Authorization": f"Bearer {response_data['access_token']}",
        }

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_send_phone_verification_success(self):
        """전화번호 인증코드 발송 성공 테스트"""
        # 사용자 인증
        headers = await self.authenticate()
        
        data = {"phone_number": "010-1234-5678"}
        response = await self.client.post(
            "/phone/send-verification", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("인증번호가 발송되었습니다", data["message"])
        
        # 데이터베이스에 토큰이 저장되었는지 확인
        token_count = await PhoneVerificationToken.objects.filter(
            user_id=self.normal_user.id,
            phone_number="010-1234-5678"
        ).acount()
        self.assertEqual(token_count, 1)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_send_phone_verification_duplicate_request(self):
        """전화번호 인증코드 중복 요청 방지 테스트"""
        # 사용자 인증
        headers = await self.authenticate()
        
        data = {"phone_number": "010-1234-5678"}
        
        # 첫 번째 요청
        response1 = await self.client.post(
            "/phone/send-verification", 
            json=data, 
            headers=headers
        )
        self.assertEqual(response1.status_code, 200)
        
        # 1분 내 두 번째 요청 (스팸 방지)
        response2 = await self.client.post(
            "/phone/send-verification", 
            json=data, 
            headers=headers
        )
        self.assertEqual(response2.status_code, 429)
        response_data = response2.json()
        print(f"Response data: {response_data}")  # 디버깅용
        self.assertIn("1분 후에 다시 시도해주세요", response_data.get("detail", ""))

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_send_phone_verification_unauthorized_user(self):
        """권한 없는 사용자 테스트"""
        # 센터 관리자 생성
        from asgiref.sync import sync_to_async
        center_admin = await sync_to_async(User.objects.create_user)(
            username="admin_user",
            password="password1234!",
            email="admin@example.com",
            user_type=User.UserTypeChoice.center_admin,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center
        )
        
        # 센터 관리자 인증
        data = {
            "username": center_admin.username,
            "password": "password1234!",
        }
        response = await self.user_client.post("/login", json=data)
        response_data = response.json()
        self.assertEqual(response.status_code, 200)
        headers = {"Authorization": f"Bearer {response_data['access_token']}"}
        
        data = {"phone_number": "010-1234-5678"}
        response = await self.client.post(
            "/phone/send-verification", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 403)
        response_data = response.json()
        print(f"Response data: {response_data}")  # 디버깅용
        self.assertIn("일반사용자만 전화번호 인증이 가능합니다", response_data.get("detail", ""))

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_verify_phone_code_success(self):
        """전화번호 인증코드 확인 성공 테스트"""
        # 먼저 인증코드 발송
        headers = await self.authenticate()
        
        # 인증코드 발송
        send_data = {"phone_number": "010-1234-5678"}
        await self.client.post(
            "/phone/send-verification", 
            json=send_data, 
            headers=headers
        )
        
        # 발송된 토큰 조회
        token_obj = await PhoneVerificationToken.objects.filter(
            user_id=self.normal_user.id,
            phone_number="010-1234-5678"
        ).afirst()
        
        # 인증코드 확인
        verify_data = {
            "phone_number": "010-1234-5678",
            "verification_code": token_obj.token
        }
        response = await self.client.post(
            "/adoption/phone/verify", 
            json=verify_data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["is_verified"])
        
        # 사용자 상태 업데이트 확인
        await self.normal_user.arefresh_from_db()
        self.assertTrue(self.normal_user.is_phone_verified)
        self.assertEqual(self.normal_user.phone_number, "010-1234-5678")

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_verify_phone_code_invalid_code(self):
        """잘못된 인증코드 테스트"""
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.normal_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        verify_data = {
            "phone_number": "010-1234-5678",
            "verification_code": "000000"
        }
        response = await self.client.post(
            "/adoption/phone/verify", 
            json=verify_data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        print(f"Response data: {response_data}")  # 디버깅용
        self.assertIn("인증번호가 일치하지 않거나 만료되었습니다", response_data.get("detail", ""))

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_verify_phone_code_expired_token(self):
        """만료된 인증코드 테스트"""
        # 만료된 토큰 생성
        expired_time = timezone.now() - timedelta(minutes=10)
        await PhoneVerificationToken.objects.acreate(
            user_id=self.normal_user.id,
            phone_number="010-1234-5678",
            token="123456",
            expires_at=expired_time,
            is_used=False
        )
        
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.normal_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        verify_data = {
            "phone_number": "010-1234-5678",
            "verification_code": "123456"
        }
        response = await self.client.post(
            "/adoption/phone/verify", 
            json=verify_data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        print(f"Response data: {response_data}")  # 디버깅용
        self.assertIn("인증번호가 일치하지 않거나 만료되었습니다", response_data.get("detail", ""))
