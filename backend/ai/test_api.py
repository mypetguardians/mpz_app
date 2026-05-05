from django.test import TestCase
from ninja.testing import TestAsyncClient
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from ai.api import router
from favorites.models import PersonalityTest
import json

User = get_user_model()


class TestAIPersonalityTestAPI(TestCase):
    """AI Personality Test API 테스트"""
    
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
        
        self.center_user = User.objects.create_user(
            username="centeruser",
            email="center@example.com",
            password="testpass123",
            user_type="센터관리자"
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
    
    async def test_save_personality_test(self):
        """성격 테스트 결과 저장 테스트"""
        headers = self.authenticate()
        
        test_data = {
            "test_name": "동물 성격 매칭 테스트",
            "test_version": "v1.0",
            "answers": [
                {
                    "question_id": "q1",
                    "question_text": "당신은 어떤 성격의 소유자입니까?",
                    "answer": "활발하고 사교적",
                    "answer_type": "choice"
                },
                {
                    "question_id": "q2",
                    "question_text": "하루에 동물과 함께할 수 있는 시간은?",
                    "answer": "2-3시간",
                    "answer_type": "choice"
                }
            ],
            "additional_notes": "반려동물을 키워본 경험이 있습니다",
            "test_duration_minutes": 15
        }
        
        response = await self.client.post(
            "/personality-test",
            json=test_data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIsNotNone(data["test_id"])
        self.assertIn("성공적으로 저장되었습니다", data["message"])
        
        # 데이터베이스에 실제로 저장되었는지 확인
        test_count = await sync_to_async(PersonalityTest.objects.count)()
        self.assertEqual(test_count, 1)
    
    async def test_get_personality_test(self):
        """성격 테스트 결과 조회 테스트"""
        headers = self.authenticate()
        
        # 먼저 테스트 데이터 저장
        test_data = {
            "test_name": "동물 성격 매칭 테스트",
            "test_version": "v1.0",
            "answers": [
                {
                    "question_id": "q1",
                    "question_text": "당신은 어떤 성격의 소유자입니까?",
                    "answer": "활발하고 사교적",
                    "answer_type": "choice"
                }
            ]
        }
        
        save_response = await self.client.post(
            "/personality-test",
            json=test_data,
            headers=headers
        )
        test_id = save_response.json()["test_id"]
        
        # 저장된 테스트 조회
        response = await self.client.get(
            f"/personality-test/{test_id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["test_type"], "동물 성격 매칭 테스트")
        
        # test_data는 answers 필드의 내용이어야 함 (result는 비어있음)
        self.assertIsInstance(data["test_data"], list)
        self.assertEqual(len(data["test_data"]), 1)
        self.assertEqual(data["test_data"][0]["question_id"], "q1")
    
    async def test_get_user_personality_tests(self):
        """사용자별 성격 테스트 목록 조회 테스트"""
        headers = self.authenticate()
        
        # 여러 개의 테스트 데이터 저장
        test_data_list = [
            {
                "test_name": "첫 번째 테스트",
                "answers": [
                    {
                        "question_id": "q1",
                        "question_text": "질문1",
                        "answer": "답변1",
                        "answer_type": "choice"
                    }
                ]
            },
            {
                "test_name": "두 번째 테스트",
                "answers": [
                    {
                        "question_id": "q1",
                        "question_text": "질문1",
                        "answer": "답변1",
                        "answer_type": "choice"
                    }
                ]
            }
        ]
        
        for test_data in test_data_list:
            await self.client.post(
                "/personality-test",
                json=test_data,
                headers=headers
            )
        
        # 사용자의 모든 테스트 목록 조회
        response = await self.client.get(
            f"/personality-test/user/{self.regular_user.id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["total_tests"], 2)
        self.assertEqual(len(data["tests"]), 2)
        self.assertEqual(data["tests"][0]["test_name"], "두 번째 테스트")  # 최신순
    
    async def test_save_personality_test_unauthorized(self):
        """인증되지 않은 사용자의 성격 테스트 저장 테스트"""
        test_data = {
            "test_name": "테스트",
            "answers": [
                {
                    "question_id": "q1",
                    "question_text": "질문",
                    "answer": "답변",
                    "answer_type": "choice"
                }
            ]
        }
        
        response = await self.client.post(
            "/personality-test",
            json=test_data
        )
        
        self.assertEqual(response.status_code, 401)
    
    async def test_get_personality_test_unauthorized(self):
        """인증되지 않은 사용자의 성격 테스트 조회 테스트"""
        response = await self.client.get("/personality-test/test-id")
        
        self.assertEqual(response.status_code, 401)
    
    async def test_get_personality_test_not_found(self):
        """존재하지 않는 성격 테스트 조회 테스트"""
        headers = self.authenticate()
        
        response = await self.client.get(
            "/personality-test/non-existent-id",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)
    
    async def test_get_other_user_personality_tests_forbidden(self):
        """다른 사용자의 성격 테스트 목록 조회 금지 테스트"""
        headers = self.authenticate()
        
        # 다른 사용자 ID로 조회 시도
        other_user_id = "other-user-id"
        response = await self.client.get(
            f"/personality-test/user/{other_user_id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 403)
    
    async def test_personality_test_data_structure(self):
        """성격 테스트 데이터 구조 검증 테스트"""
        headers = self.authenticate()
        
        test_data = {
            "test_name": "구조 검증 테스트",
            "test_version": "v2.0",
            "answers": [
                {
                    "question_id": "q1",
                    "question_text": "질문1",
                    "answer": "답변1",
                    "answer_type": "text"
                },
                {
                    "question_id": "q2",
                    "question_text": "질문2",
                    "answer": "답변2",
                    "answer_type": "scale"
                }
            ],
            "additional_notes": "추가 메모",
            "test_duration_minutes": 20
        }
        
        response = await self.client.post(
            "/personality-test",
            json=test_data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 저장된 데이터의 구조 확인
        test_id = response.json()["test_id"]
        get_response = await self.client.get(
            f"/personality-test/{test_id}",
            headers=headers
        )
        
        data = get_response.json()
        saved_data = data["test_data"]  # 이제 answers 필드의 내용
        
        # Q&A 구조 확인 (answers 필드)
        self.assertIsInstance(saved_data, list)
        self.assertEqual(len(saved_data), 2)
        self.assertEqual(saved_data[0]["question_id"], "q1")
        self.assertEqual(saved_data[0]["question"], "질문1")
        self.assertEqual(saved_data[0]["answer"], "답변1")
        self.assertEqual(saved_data[0]["answer_type"], "text")
        
        # result 필드는 None이어야 함 (아직 AI 분석 안됨)
        self.assertIsNone(data["result"])
