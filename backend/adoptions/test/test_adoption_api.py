from django.test import TestCase
from adoptions.api.adoption import router
from user.api import router as user_router
from ninja.testing import TestAsyncClient
from user.models import User
from centers.models import Center, AdoptionContractTemplate
from animals.models import Animal
from adoptions.models import AdoptionQuestion
from django.test import override_settings
from django.utils import timezone


class TestAdoptionAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.user_client = TestAsyncClient(user_router)
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name="테스트 센터",
            location="서울시 강남구",
            phone_number="02-1234-5678",
            has_monitoring=True,
            monitoring_description="입양 후 모니터링을 제공합니다",
            adoption_guidelines="입양 유의사항입니다",
            adoption_price=50000
        )
        
        # 일반 사용자 생성 (전화번호 인증 완료)
        self.normal_user = User.objects.create_user(
            username="test_user",
            password="password1234!",
            email="test@example.com",
            user_type=User.UserTypeChoice.normal,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center,
            phone_number="010-1234-5678",
            is_phone_verified=True,
            phone_verified_at=timezone.now(),
            nickname="테스트유저",
            birth="1990-01-01",
            address="서울시 강남구",
            address_is_public=False
        )
        
        # 동물 생성
        self.animal = Animal.objects.create(
            name="멍멍이",
            status="보호중",
            center=self.center,
            breed="믹스",
            age=24,  # 2살 = 24개월
            is_female=False,
            weight=15.0,
            neutering=True,
            vaccination=True,
            heartworm=True
        )
        
        # 입양 질문 생성
        self.question1 = AdoptionQuestion.objects.create(
            center=self.center,
            sequence=1,
            content="반려동물을 키워본 경험이 있나요?",
            is_active=True
        )
        self.question2 = AdoptionQuestion.objects.create(
            center=self.center,
            sequence=2,
            content="하루에 몇 시간 정도 함께할 수 있나요?",
            is_active=True
        )
        
        # 계약서 템플릿 생성
        self.contract_template = AdoptionContractTemplate.objects.create(
            center=self.center,
            title="입양 계약서",
            content="이 계약서는 반려동물 입양에 관한 것입니다...",
            is_active=True
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
    async def test_get_adoption_pre_check_success(self):
        """입양 신청 사전 확인 성공 테스트"""
        # 사용자 인증
        headers = await self.authenticate()
        
        response = await self.client.get(
            f"/adoption/pre-check/{self.animal.id}", 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 기본 정보 확인
        self.assertTrue(data["can_apply"])
        self.assertTrue(data["is_phone_verified"])
        self.assertFalse(data["needs_user_settings"])
        self.assertFalse(data["existing_application"])
        
        # 동물 정보 확인
        self.assertEqual(data["animal"]["id"], str(self.animal.id))
        self.assertEqual(data["animal"]["name"], "멍멍이")
        self.assertEqual(data["animal"]["status"], "보호중")
        
        # 센터 정보 확인
        self.assertTrue(data["center_info"]["has_monitoring"])
        self.assertEqual(data["center_info"]["adoption_price"], 50000)
        
        # 질문 목록 확인
        self.assertEqual(len(data["adoption_questions"]), 2)
        self.assertEqual(data["adoption_questions"][0]["sequence"], 1)
        
        # 계약서 템플릿 확인
        self.assertIsNotNone(data["contract_template"])
        self.assertEqual(data["contract_template"]["title"], "입양 계약서")

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_adoption_pre_check_unauthorized_user(self):
        """권한 없는 사용자 테스트"""
        # 센터 관리자 생성
        from asgiref.sync import sync_to_async
        center_admin = await sync_to_async(User.objects.create_user)(
            username="admin_user",
            password="admin_user",
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
        response = await self.client.post("/login", json=data)
        response_data = response.json()
        self.assertEqual(response.status_code, 200)
        headers = {"Authorization": f"Bearer {response_data['access_token']}"}
        
        response = await self.client.get(
            f"/adoption/pre-check/{self.animal.id}", 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 403)
        response_data = response.json()
        self.assertIn("일반사용자만 입양 신청이 가능합니다", response_data.get("detail", ""))

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_adoption_pre_check_animal_not_found(self):
        """존재하지 않는 동물 테스트"""
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.normal_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # 유효한 UUID 형식을 사용하되 존재하지 않는 ID
        response = await self.client.get(
            "/adoption/pre-check/00000000-0000-4000-8000-000000000000", 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)
        response_data = response.json()
        self.assertIn("동물을 찾을 수 없습니다", response_data.get("detail", ""))

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_submit_adoption_application_success(self):
        """입양 신청 제출 성공 테스트"""
        # 사용자 인증
        headers = await self.authenticate()
        
        data = {
            "animal_id": str(self.animal.id),
            "user_settings": {
                "phone": "010-1234-5678",
                "phone_verification": True,
                "name": "홍길동",
                "birth": "1990-01-01",
                "address": "서울시 강남구",
                "address_is_public": False
            },
            "question_responses": [
                {
                    "question_id": str(self.question1.id),
                    "answer": "네, 강아지를 키워본 경험이 있습니다."
                },
                {
                    "question_id": str(self.question2.id),
                    "answer": "하루에 4-5시간 정도 함께할 수 있습니다."
                }
            ],
            "monitoring_agreement": True,
            "guidelines_agreement": True,
            "notes": "잘 키우겠습니다!"
        }
        
        response = await self.client.post(
            "/adoption/apply", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = response.json()
        
        # 응답 데이터 확인
        self.assertEqual(response_data["animal_id"], str(self.animal.id))
        self.assertEqual(response_data["animal_name"], "멍멍이")
        self.assertEqual(response_data["center_name"], "테스트 센터")
        self.assertEqual(response_data["status"], "신청")
        self.assertEqual(response_data["notes"], "잘 키우겠습니다!")

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_submit_adoption_application_phone_not_verified(self):
        """전화번호 미인증 사용자 테스트"""
        # 전화번호 미인증 사용자 생성
        from asgiref.sync import sync_to_async
        unverified_user = await sync_to_async(User.objects.create_user)(
            username="unverified_user",
            password="password1234!",
            email="unverified@example.com",
            user_type=User.UserTypeChoice.normal,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center
        )
        
        # JWT 토큰 생성
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": unverified_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        data = {
            "animal_id": str(self.animal.id),
            "question_responses": [],
            "monitoring_agreement": True,
            "guidelines_agreement": True
        }
        
        response = await self.client.post(
            "/adoption/apply", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 403)
        response_data = response.json()
        self.assertIn("전화번호 인증이 필요합니다", response_data.get("detail", ""))

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_submit_adoption_application_duplicate_application(self):
        """중복 입양 신청 방지 테스트"""
        # 이미 입양 신청 생성
        from adoptions.models import Adoption
        await Adoption.objects.acreate(
            user=self.normal_user,
            animal=self.animal,
            monitoring_agreement=True,
            guidelines_agreement=True
        )
        
        # JWT 토큰 생성
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.normal_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        data = {
            "animal_id": str(self.animal.id),
            "question_responses": [],
            "monitoring_agreement": True,
            "guidelines_agreement": True
        }
        
        response = await self.client.post(
            "/adoption/apply", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 403)
        response_data = response.json()
        self.assertIn("이미 해당 동물에 대한 입양 신청을 하셨습니다", response_data.get("detail", ""))
