from django.test import TestCase, override_settings
from ninja.testing import TestAsyncClient
from centers.models import Center, QuestionForm
from user.models import User
from asgiref.sync import sync_to_async
import jwt
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

@override_settings(DJANGO_ENV_NAME="local")
class TestQuestionAPI(TestCase):
    def setUp(self):
        # API client
        from centers.api.question_api import router as question_router
        self.client = TestAsyncClient(question_router)

        # 테스트용 사용자 생성 (센터 관리자)
        self.center_user = User.objects.create_user(
            username="center_manager",
            email="center@test.com",
            password="password1234!",
            user_type="센터관리자"
        )

        # 테스트용 일반 사용자 생성
        self.normal_user = User.objects.create_user(
            username="normal_user",
            email="normal@test.com",
            password="password1234!",
            user_type="일반사용자"
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

        # 테스트용 질문 폼 생성
        self.question1 = QuestionForm.objects.create(
            center=self.center,
            question="당신의 직업은 무엇입니까?",
            type="text",
            is_required=True,
            sequence=1
        )

        self.question2 = QuestionForm.objects.create(
            center=self.center,
            question="가족 구성원은 몇 명입니까?",
            type="single_choice",
            options=["1명", "2명", "3명", "4명 이상"],
            is_required=True,
            sequence=2
        )

    def generate_jwt_token(self, user):
        """실제 JWT 토큰을 생성합니다"""
        payload = {
            'user_id': str(user.id),
            'username': user.username,
            'exp': timezone.now() + timedelta(hours=1),
            'iat': timezone.now()
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        return token

    async def authenticate(self, user=None):
        """사용자 인증 및 JWT 토큰 획득"""
        if user is None:
            user = self.center_user

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

    async def test_get_question_forms_success(self):
        """질문 폼 목록 조회 성공 테스트"""
        headers = await self.authenticate()
        response = await self.client.get("/", headers=headers)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("questions", data)
        self.assertEqual(len(data["questions"]), 2)
        
        # 첫 번째 질문 확인
        question1 = data["questions"][0]
        self.assertEqual(question1["question"], "당신의 직업은 무엇입니까?")
        self.assertEqual(question1["type"], "text")
        self.assertEqual(question1["sequence"], 1)
        
        # 두 번째 질문 확인
        question2 = data["questions"][1]
        self.assertEqual(question2["question"], "가족 구성원은 몇 명입니까?")
        self.assertEqual(question2["type"], "single_choice")
        self.assertEqual(question2["sequence"], 2)

    async def test_get_question_forms_unauthorized(self):
        """질문 폼 목록 조회 실패 테스트: 인증 없음"""
        response = await self.client.get("/")
        self.assertEqual(response.status_code, 401)

    async def test_get_question_forms_forbidden(self):
        """질문 폼 목록 조회 실패 테스트: 권한 없음"""
        headers = await self.authenticate(self.normal_user)
        response = await self.client.get("/", headers=headers)
        self.assertEqual(response.status_code, 403)

    async def test_create_question_form_success(self):
        """질문 폼 생성 성공 테스트"""
        headers = await self.authenticate()
        data = {
            "question": "새로운 질문입니다",
            "type": "multiple_choice",
            "options": ["옵션1", "옵션2", "옵션3"],
            "is_required": False
        }
        
        response = await self.client.post("/", json=data, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        question = response.json()
        self.assertEqual(question["question"], "새로운 질문입니다")
        self.assertEqual(question["type"], "multiple_choice")
        self.assertEqual(question["options"], ["옵션1", "옵션2", "옵션3"])
        self.assertEqual(question["is_required"], False)
        self.assertEqual(question["sequence"], 3)  # 자동으로 마지막 순서 + 1

    async def test_create_question_form_with_sequence(self):
        """질문 폼 생성 성공 테스트: 순서 지정"""
        headers = await self.authenticate()
        data = {
            "question": "순서가 지정된 질문",
            "type": "checkbox",
            "options": ["체크1", "체크2"],
            "is_required": True,
            "sequence": 5
        }
        
        response = await self.client.post("/", json=data, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        question = response.json()
        self.assertEqual(question["sequence"], 5)

    async def test_create_question_form_unauthorized(self):
        """질문 폼 생성 실패 테스트: 인증 없음"""
        data = {"question": "테스트 질문", "type": "text"}
        response = await self.client.post("/", json=data)
        self.assertEqual(response.status_code, 401)

    async def test_update_question_form_success(self):
        """질문 폼 수정 성공 테스트"""
        headers = await self.authenticate()
        data = {
            "question": "수정된 질문입니다",
            "is_required": False
        }
        
        response = await self.client.put(f"/{self.question1.id}", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        question = response.json()
        self.assertEqual(question["question"], "수정된 질문입니다")
        self.assertEqual(question["is_required"], False)

    async def test_update_question_form_not_found(self):
        """질문 폼 수정 실패 테스트: 존재하지 않는 질문"""
        headers = await self.authenticate()
        fake_id = "00000000-0000-0000-0000-000000000000"
        data = {"question": "수정된 질문"}
        
        response = await self.client.put(f"/{fake_id}", json=data, headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_update_question_sequence_success(self):
        """질문 순서 변경 성공 테스트"""
        headers = await self.authenticate()
        data = {"sequence": 3}
        
        response = await self.client.patch(f"/{self.question1.id}/sequence", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        question = response.json()
        self.assertEqual(question["sequence"], 3)
        
        # 다른 질문들의 순서가 자동으로 조정되었는지 확인
        response = await self.client.get("/", headers=headers)
        data = response.json()
        questions = data["questions"]
        
        # sequence 1: 가족 구성원 질문
        # sequence 2: (비어있음)
        # sequence 3: 직업 질문
        self.assertEqual(questions[0]["sequence"], 1)
        self.assertEqual(questions[1]["sequence"], 3)

    async def test_update_question_sequence_forward(self):
        """질문 순서 변경 성공 테스트: 앞으로 이동"""
        headers = await self.authenticate()
        data = {"sequence": 1}
        
        response = await self.client.patch(f"/{self.question2.id}/sequence", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        question = response.json()
        self.assertEqual(question["sequence"], 1)
        
        # 다른 질문들의 순서가 자동으로 조정되었는지 확인
        response = await self.client.get("/", headers=headers)
        data = response.json()
        questions = data["questions"]
        
        # sequence 1: 가족 구성원 질문
        # sequence 2: 직업 질문
        self.assertEqual(questions[0]["sequence"], 1)
        self.assertEqual(questions[1]["sequence"], 2)

    async def test_delete_question_form_success(self):
        """질문 폼 삭제 성공 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.delete(f"/{self.question1.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["message"], "질문 폼이 성공적으로 삭제되었습니다")
        
        # 삭제 후 남은 질문의 순서가 자동으로 조정되었는지 확인
        response = await self.client.get("/", headers=headers)
        data = response.json()
        questions = data["questions"]
        
        self.assertEqual(len(questions), 1)
        self.assertEqual(questions[0]["sequence"], 1)  # 2에서 1로 조정

    async def test_delete_question_form_not_found(self):
        """질문 폼 삭제 실패 테스트: 존재하지 않는 질문"""
        headers = await self.authenticate()
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = await self.client.delete(f"/{fake_id}", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_question_form_validation(self):
        """질문 폼 유효성 검사 테스트"""
        headers = await self.authenticate()
        
        # 잘못된 질문 유형
        data = {
            "question": "테스트 질문",
            "type": "invalid_type"
        }
        
        response = await self.client.post("/", json=data, headers=headers)
        self.assertEqual(response.status_code, 422)  # Validation error
        
        # 빈 질문
        data = {
            "question": "",
            "type": "text"
        }
        
        response = await self.client.post("/", json=data, headers=headers)
        self.assertEqual(response.status_code, 422)  # Validation error

    async def test_get_question_forms_by_center_success(self):
        """특정 센터의 질문 폼 목록 조회 성공 테스트 (공개 API)"""
        # 인증 없이 직접 조회
        response = await self.client.get(f"/center/{self.center.id}")
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertIn("questions", data)
        questions = data["questions"]
        self.assertIsInstance(questions, list)
        self.assertEqual(len(questions), 2)
        
        # 첫 번째 질문 확인 (sequence 순서대로)
        question1 = questions[0]
        self.assertEqual(question1['question'], "당신의 직업은 무엇입니까?")
        self.assertEqual(question1['type'], "text")
        self.assertEqual(question1['sequence'], 1)
        self.assertTrue(question1['is_required'])
        
        # 두 번째 질문 확인
        question2 = questions[1]
        self.assertEqual(question2['question'], "가족 구성원은 몇 명입니까?")
        self.assertEqual(question2['type'], "single_choice")
        self.assertEqual(question2['sequence'], 2)
        self.assertEqual(question2['options'], ["1명", "2명", "3명", "4명 이상"])

    async def test_get_question_forms_by_center_not_found(self):
        """존재하지 않는 센터의 질문 폼 목록 조회 테스트 (공개 API)"""
        fake_center_id = "00000000-0000-0000-0000-000000000000"
        response = await self.client.get(f"/center/{fake_center_id}")
        
        # 404 Not Found
        self.assertEqual(response.status_code, 404)
        error = response.json()
        self.assertIn("센터를 찾을 수 없습니다", error['detail'])
