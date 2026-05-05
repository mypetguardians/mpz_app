from django.test import TestCase
from ninja.testing import TestAsyncClient
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from feedback.api import router
from feedback.models import Feedback
from feedback.schemas.inbound import FeedbackType, FeedbackStatus, FeedbackPriority
import json

User = get_user_model()


class TestFeedbackAPI(TestCase):
    """Feedback API 테스트"""
    
    def setUp(self):
        """테스트 설정"""
        self.client = TestAsyncClient(router)
        
        # 테스트 사용자 생성
        self.regular_user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            user_type="일반사용자"
        )
        

        
        # JWT 토큰 생성 함수
        def generate_jwt_token(user):
            import jwt
            from django.conf import settings
            from django.utils import timezone
            from datetime import timedelta
            
            payload = {
                'user_id': str(user.id),
                'username': user.username,
                'exp': timezone.now() + timedelta(hours=1),
                'iat': timezone.now()
            }
            return jwt.encode(payload, settings.JWT_SIGNING_KEY, algorithm="HS256")
        
        self.generate_jwt_token = generate_jwt_token
    
    def authenticate(self, user=None):
        """사용자 인증"""
        if user is None:
            user = self.regular_user
        
        token = self.generate_jwt_token(user)
        return {"Authorization": f"Bearer {token}"}
    
    async def test_submit_feedback(self):
        """피드백 제출 테스트"""
        headers = self.authenticate()
        
        feedback_data = {
            "content": "로그인 버튼이 작동하지 않습니다."
        }
        
        response = await self.client.post(
            "/",
            json=feedback_data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["message"], "피드백이 성공적으로 제출되었습니다")
        self.assertEqual(data["status"], "접수")
        
        # 데이터베이스에 실제로 저장되었는지 확인
        feedback_count = await sync_to_async(Feedback.objects.count)()
        self.assertEqual(feedback_count, 1)
    
    async def test_get_my_feedback(self):
        """내 피드백 목록 조회 테스트"""
        headers = self.authenticate()
        
        # 먼저 피드백 데이터 생성
        feedback_data = {
            "content": "다크모드 기능을 추가해주세요."
        }
        
        await self.client.post(
            "/",
            json=feedback_data,
            headers=headers
        )
        
        # 피드백 목록 조회
        response = await self.client.get(
            "/",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # paginate 데코레이터 사용 시 응답 형식이 변경됨
        self.assertEqual(len(data["data"]), 1)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
    
    async def test_get_feedback_detail(self):
        """피드백 상세 조회 테스트"""
        headers = self.authenticate()
        
        # 먼저 피드백 데이터 생성
        feedback_data = {
            "content": "페이지 로딩이 너무 느립니다."
        }
        
        submit_response = await self.client.post(
            "/",
            json=feedback_data,
            headers=headers
        )
        
        # 생성된 피드백의 ID 가져오기
        feedbacks = await sync_to_async(list)(Feedback.objects.filter(user=self.regular_user))
        feedback_id = str(feedbacks[0].id)
        
        # 피드백 상세 조회
        response = await self.client.get(
            f"/{feedback_id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["content"], "페이지 로딩이 너무 느립니다.")
    
    async def test_get_feedback_with_filters(self):
        """필터링된 피드백 목록 조회 테스트"""
        headers = self.authenticate()
        
        # 여러 개의 피드백 데이터 생성
        feedback_data_list = [
            {
                "content": "첫 번째 피드백"
            },
            {
                "content": "두 번째 피드백"
            }
        ]
        
        for feedback_data in feedback_data_list:
            await self.client.post(
                "/",
                json=feedback_data,
                headers=headers
            )
        
        # 상태별 필터링
        response = await self.client.get(
            "/?status=접수",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # paginate 데코레이터 사용 시 응답 형식이 변경됨
        self.assertEqual(len(data["data"]), 2)
    
    async def test_get_feedback_unauthorized(self):
        """인증되지 않은 사용자의 피드백 조회 테스트"""
        response = await self.client.get("/")
        
        self.assertEqual(response.status_code, 401)
    
    async def test_get_feedback_not_found(self):
        """존재하지 않는 피드백 조회 테스트"""
        headers = self.authenticate()
        
        response = await self.client.get(
            "/non-existent-id",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)
    

    
    async def test_feedback_pagination(self):
        """피드백 페이지네이션 테스트"""
        headers = self.authenticate()
        
        # 여러 개의 피드백 데이터 생성
        for i in range(5):
            feedback_data = {
                "content": f"페이지네이션 테스트용 피드백 {i+1}"
            }
            
            await self.client.post(
                "/",
                json=feedback_data,
                headers=headers
            )
        
        # 첫 번째 페이지 조회 (기본 limit: 10)
        response = await self.client.get(
            "/?page=1",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # paginate 데코레이터 사용 시 응답 형식이 변경됨
        self.assertEqual(len(data["data"]), 5)
        self.assertEqual(data["curPage"], 1)
        self.assertEqual(data["totalCnt"], 5)
        self.assertEqual(data["pageCnt"], 1)
    
    async def test_feedback_validation(self):
        """피드백 데이터 검증 테스트"""
        headers = self.authenticate()
        
        # 유효한 피드백 데이터
        valid_feedback_data = {
            "content": "유효한 피드백 내용입니다."
        }
        
        response = await self.client.post(
            "/",
            json=valid_feedback_data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 201)
        
        # 빈 내용 테스트 (Django-ninja에서는 빈 문자열 허용)
        empty_content_data = {
            "content": ""
        }
        
        response = await self.client.post(
            "/",
            json=empty_content_data,
            headers=headers
        )
        
        # 빈 내용도 허용됨 (Django-ninja 기본 동작)
        self.assertEqual(response.status_code, 201)
