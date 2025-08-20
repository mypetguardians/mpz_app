from django.test import TestCase
from user.kakao_api import router
from ninja.testing import TestAsyncClient
from user.models import User
from centers.models import Center
from unittest.mock import patch
from django.test import override_settings


class TestKakaoAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name="테스트 센터",
            location="서울시 강남구",
            phone_number="02-1234-5678"
        )

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_kakao_login_url_generation(self):
        """카카오 로그인 URL 생성 테스트"""
        response = await self.client.get("/login")
        # 카카오 로그인은 302 리다이렉트를 반환
        self.assertEqual(response.status_code, 302)
        # 리다이렉트 URL이 카카오 인증 페이지를 가리키는지 확인
        self.assertIn("kauth.kakao.com", response.url)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_kakao_login_callback_missing_code(self):
        """카카오 로그인 콜백 실패 테스트: code 파라미터 누락"""
        response = await self.client.get("/login/callback")
        self.assertEqual(response.status_code, 422)  # 파라미터 누락

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_kakao_login_callback_missing_state(self):
        """카카오 로그인 콜백 실패 테스트: state 파라미터 누락"""
        response = await self.client.get("/login/callback?code=test_code")
        self.assertEqual(response.status_code, 422)  # 파라미터 누락

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_kakao_login_callback_invalid_code(self):
        """카카오 로그인 콜백 실패 테스트: 잘못된 code"""
        # 잘못된 code로 요청 시 503 에러 (카카오 API 호출 실패)
        response = await self.client.get("/login/callback?code=invalid_code&state=valid_state")
        self.assertEqual(response.status_code, 503)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_kakao_login_callback_network_error(self):
        """카카오 로그인 콜백 실패 테스트: 네트워크 오류"""
        with patch('httpx.AsyncClient.post') as mock_post:
            # 네트워크 오류 모킹
            mock_post.side_effect = Exception("Network error")
            
            response = await self.client.get("/login/callback?code=test_code&state=valid_state")
            self.assertEqual(response.status_code, 503)
