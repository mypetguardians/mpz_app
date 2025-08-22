from django.test import TestCase
from adoptions.api.contract import router
from user.api import router as user_router
from ninja.testing import TestAsyncClient
from user.models import User
from centers.models import Center, AdoptionContractTemplate
from animals.models import Animal
from adoptions.models import Adoption, AdoptionContract
from django.test import override_settings
from django.utils import timezone


class TestContractAPI(TestCase):
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
        
        # 입양 신청 생성
        self.adoption = Adoption.objects.create(
            user=self.normal_user,
            animal=self.animal,
            monitoring_agreement=True,
            guidelines_agreement=True
        )
        
        # 계약서 템플릿 생성
        self.contract_template = AdoptionContractTemplate.objects.create(
            center=self.center,
            title="입양 계약서",
            content="이 계약서는 반려동물 입양에 관한 것입니다...",
            is_active=True
        )
        
        # 계약서 생성
        self.contract = AdoptionContract.objects.create(
            adoption=self.adoption,
            template=self.contract_template,
            contract_content="계약서 내용...",
            status="대기중"
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
    async def test_sign_contract_success(self):
        """계약서 서명 성공 테스트"""
        # 사용자 인증
        headers = await self.authenticate()
        
        data = {
            "contract_id": str(self.contract.id),
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }
        
        response = await self.client.post(
            "/contract/sign", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        # 응답 데이터 확인
        self.assertIn("계약서 서명이 완료되었습니다", response_data["message"])
        self.assertEqual(response_data["adoption_status"], "입양완료")
        
        # 데이터베이스 상태 확인
        await self.contract.arefresh_from_db()
        await self.adoption.arefresh_from_db()
        
        self.assertEqual(self.contract.status, "사용자서명완료")
        self.assertIsNotNone(self.contract.user_signed_at)
        self.assertEqual(self.adoption.status, "입양완료")
        self.assertIsNotNone(self.adoption.adoption_completed_at)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_sign_contract_unauthorized_user(self):
        """권한 없는 사용자 테스트"""
        # 다른 사용자 생성
        from asgiref.sync import sync_to_async
        other_user = await sync_to_async(User.objects.create_user)(
            username="other_user",
            password="password1234!",
            email="other@example.com",
            user_type=User.UserTypeChoice.normal,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center
        )
        
        # JWT 토큰 생성
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": other_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        data = {
            "contract_id": str(self.contract.id),
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }
        
        response = await self.client.post(
            "/contract/sign", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)
        response_data = response.json()
        self.assertIn("서명 가능한 계약서를 찾을 수 없습니다", response_data.get("detail", ""))

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_sign_contract_not_found(self):
        """존재하지 않는 계약서 테스트"""
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.normal_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        data = {
            "contract_id": "00000000-0000-4000-8000-000000000000",
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }
        
        response = await self.client.post(
            "/contract/sign", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)
        response_data = response.json()
        self.assertIn("서명 가능한 계약서를 찾을 수 없습니다", response_data.get("detail", ""))

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_sign_contract_wrong_status(self):
        """잘못된 상태의 계약서 테스트"""
        # 계약서 상태를 이미 서명 완료로 변경
        await AdoptionContract.objects.filter(id=self.contract.id).aupdate(
            status="사용자서명완료"
        )
        
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.normal_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        data = {
            "contract_id": str(self.contract.id),
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }
        
        response = await self.client.post(
            "/contract/sign", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)
        response_data = response.json()
        self.assertIn("서명 가능한 계약서를 찾을 수 없습니다", response_data.get("detail", ""))

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_sign_contract_center_admin_denied(self):
        """센터 관리자 권한 거부 테스트"""
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
        
        # JWT 토큰 생성
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": center_admin.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        data = {
            "contract_id": str(self.contract.id),
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }
        
        response = await self.client.post(
            "/contract/sign", 
            json=data, 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 403)
        response_data = response.json()
        self.assertIn("일반사용자만 계약서 서명이 가능합니다", response_data.get("detail", ""))
