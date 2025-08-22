from django.test import TestCase
from adoptions.api.center import router
from ninja.testing import TestAsyncClient
from user.models import User
from centers.models import Center, AdoptionContractTemplate
from animals.models import Animal
from adoptions.models import Adoption, AdoptionQuestion, AdoptionQuestionResponse
from django.test import override_settings
from django.utils import timezone
from asgiref.sync import sync_to_async


class TestCenterAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        
        # 센터 소유자 (center_super_admin) 생성
        self.center_owner = User.objects.create_user(
            username="center_owner",
            password="password1234!",
            email="owner@example.com",
            user_type=User.UserTypeChoice.center_super_admin,
            terms_of_service=True,
            privacy_policy_agreement=True
        )
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name="테스트 센터",
            location="서울시 강남구",
            phone_number="02-1234-5678",
            has_monitoring=True,
            monitoring_period_months=6,
            monitoring_interval_days=30,
            owner=self.center_owner
        )
        
        # 센터 관리자 생성
        self.center_admin = User.objects.create_user(
            username="center_admin",
            password="password1234!",
            email="admin@example.com",
            user_type=User.UserTypeChoice.center_admin,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center
        )
        
        # 일반 사용자 생성
        self.normal_user = User.objects.create_user(
            username="normal_user",
            password="password1234!",
            email="user@example.com",
            user_type=User.UserTypeChoice.normal,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center,
            phone_number="010-1234-5678",
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
            content="반려동물을 키워본 적이 있나요?",
            is_active=True
        )
        
        self.question2 = AdoptionQuestion.objects.create(
            center=self.center,
            sequence=2,
            content="입양 후 모니터링에 동의하시나요?",
            is_active=True
        )
        
        # 입양 신청 생성
        self.adoption = Adoption.objects.create(
            user=self.normal_user,
            animal=self.animal,
            monitoring_agreement=True,
            guidelines_agreement=True,
            status="신청"
        )
        
        # 질문 응답 생성
        self.response1 = AdoptionQuestionResponse.objects.create(
            adoption=self.adoption,
            question=self.question1,
            answer="네, 강아지를 키워본 적이 있습니다."
        )
        
        self.response2 = AdoptionQuestionResponse.objects.create(
            adoption=self.adoption,
            question=self.question2,
            answer="네, 모니터링에 동의합니다."
        )
        
        # 계약서 템플릿 생성
        self.contract_template = AdoptionContractTemplate.objects.create(
            center=self.center,
            title="입양 계약서",
            content="이 계약서는 반려동물 입양에 관한 것입니다...",
            is_active=True
        )
    
    async def authenticate_center_admin(self):
        """센터 관리자 인증 및 JWT 토큰 획득"""
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.center_admin.id})
        return {"Authorization": f"Bearer {access_token}"}
    
    async def authenticate_center_owner(self):
        """센터 소유자 인증 및 JWT 토큰 획득"""
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.center_owner.id})
        return {"Authorization": f"Bearer {access_token}"}
    
    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_center_adoptions_success(self):
        """센터 입양 신청 목록 조회 성공 테스트"""
        headers = await self.authenticate_center_admin()
        
        response = await self.client.get("/center-admin", headers=headers)
        
        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.json()}")
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        # 응답 데이터 확인 (페이지네이션 데코레이터가 적용됨)
        self.assertIn("data", response_data)
        self.assertIn("count", response_data)
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(len(response_data["data"]), 1)
        
        adoption = response_data["data"][0]
        self.assertEqual(adoption["animal_name"], "멍멍이")
        self.assertEqual(adoption["status"], "신청")
        self.assertIn("user_info", adoption)
        self.assertIn("question_responses", adoption)
        self.assertIn("agreements", adoption)
        self.assertIn("timeline", adoption)
    
    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_center_adoptions_unauthorized_user(self):
        """권한 없는 사용자 테스트"""
        # 일반 사용자로 인증
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.normal_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = await self.client.get("/center-admin", headers=headers)
        
        self.assertEqual(response.status_code, 403)
        response_data = response.json()
        self.assertIn("센터 관리자만 접근할 수 있습니다", response_data.get("detail", ""))
    
    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_update_adoption_status_success(self):
        """입양 신청 상태 변경 성공 테스트"""
        headers = await self.authenticate_center_admin()
        
        data = {
            "status": "미팅",
            "center_notes": "미팅 일정을 조율해주세요.",
            "meeting_scheduled_at": "2024-02-01T14:00:00Z"
        }
        
        response = await self.client.put(
            f"/center-admin/{self.adoption.id}/status",
            json=data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        # 응답 데이터 확인
        self.assertEqual(response_data["status"], "미팅")
        self.assertEqual(response_data["center_notes"], "미팅 일정을 조율해주세요.")
        self.assertIn("timeline", response_data)
        
        # 데이터베이스 상태 확인
        await self.adoption.arefresh_from_db()
        self.assertEqual(self.adoption.status, "미팅")
        self.assertEqual(self.adoption.center_notes, "미팅 일정을 조율해주세요.")
        self.assertIsNotNone(self.adoption.meeting_scheduled_at)
    
    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_update_adoption_status_invalid_transition(self):
        """잘못된 상태 변경 테스트"""
        headers = await self.authenticate_center_admin()
        
        # 신청 상태에서 입양완료로 직접 변경 (불가능)
        data = {
            "status": "입양완료",
            "center_notes": "잘못된 상태 변경"
        }
        
        response = await self.client.put(
            f"/center-admin/{self.adoption.id}/status",
            json=data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("신청에서 입양완료로 변경할 수 없습니다", response_data.get("detail", ""))
    
    @override_settings(DJANGO_ENV_NAME="local", SECRET_key="test-secret-key-for-jwt")
    async def test_send_contract_success(self):
        """계약서 전송 성공 테스트"""
        # 먼저 입양 신청 상태를 계약서작성으로 변경
        await Adoption.objects.filter(id=self.adoption.id).aupdate(status="계약서작성")
        
        headers = await self.authenticate_center_admin()
        
        data = {
            "template_id": str(self.contract_template.id),
            "custom_content": "커스텀 계약서 내용입니다.",
            "center_notes": "계약서를 확인해주세요."
        }
        
        response = await self.client.post(
            f"/center-admin/{self.adoption.id}/send-contract",
            json=data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        # 응답 데이터 확인
        self.assertIn("계약서가 성공적으로 전송되었습니다", response_data["message"])
        self.assertIn("contract_id", response_data)
        
        # 데이터베이스 상태 확인
        await self.adoption.arefresh_from_db()
        self.assertIsNotNone(self.adoption.contract_sent_at)
        self.assertEqual(self.adoption.center_notes, "계약서를 확인해주세요.")
    
    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_send_contract_wrong_status(self):
        """잘못된 상태에서 계약서 전송 테스트"""
        headers = await self.authenticate_center_admin()
        
        data = {
            "template_id": str(self.contract_template.id),
            "custom_content": "커스텀 계약서 내용입니다."
        }
        
        # 신청 상태에서 계약서 전송 (불가능)
        response = await self.client.post(
            f"/center-admin/{self.adoption.id}/send-contract",
            json=data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)
        response_data = response.json()
        self.assertIn("계약서 작성 단계의 입양 신청을 찾을 수 없습니다", response_data.get("detail", ""))
    
    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_monitoring_status_success(self):
        """모니터링 상태 조회 성공 테스트"""
        # 입양 신청 상태를 모니터링으로 변경
        await Adoption.objects.filter(id=self.adoption.id).aupdate(
            status="모니터링",
            monitoring_started_at=timezone.now(),
            monitoring_next_check_at=timezone.now() + timezone.timedelta(days=30)
        )
        
        headers = await self.authenticate_center_admin()
        
        response = await self.client.get(
            f"/center-admin/{self.adoption.id}/monitoring-status",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        # 응답 데이터 확인
        self.assertEqual(response_data["adoption_id"], str(self.adoption.id))
        self.assertEqual(response_data["status"], "모니터링")
        self.assertEqual(response_data["monitoring_status"], "진행중")
        self.assertIn("center_config", response_data)