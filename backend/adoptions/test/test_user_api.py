from django.test import TestCase
from adoptions.api.user import router
from ninja.testing import TestAsyncClient
from user.models import User
from centers.models import Center, AdoptionContractTemplate
from animals.models import Animal, AnimalImage
from adoptions.models import (
    Adoption, AdoptionQuestion, AdoptionQuestionResponse,
    AdoptionContract, AdoptionMonitoring
)
from posts.models import Post
from django.test import override_settings
from django.utils import timezone
from asgiref.sync import sync_to_async


class TestUserAdoptionAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)

        # 센터 생성
        self.center = Center.objects.create(
            name="테스트 센터",
            location="서울시 강남구",
            phone_number="02-1234-5678",
            has_monitoring=True,
            monitoring_period_months=6,
            monitoring_interval_days=30
        )

        # 센터 소유자 생성
        self.center_owner = User.objects.create_user(
            username="center_owner",
            password="password1234!",
            email="owner@example.com",
            user_type=User.UserTypeChoice.center_super_admin,
            terms_of_service=True,
            privacy_policy_agreement=True
        )
        self.center.owner = self.center_owner
        self.center.save()

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

        # 다른 사용자 생성
        self.other_user = User.objects.create_user(
            username="other_user",
            password="password1234!",
            email="other@example.com",
            user_type=User.UserTypeChoice.normal,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center,
            phone_number="010-9876-5432",
            nickname="다른유저",
            birth="1985-05-05",
            address="서울시 서초구",
            address_is_public=True
        )

        # 동물 생성
        self.animal = Animal.objects.create(
            name="멍멍이",
            status="보호중",
            center=self.center,
            breed="믹스",
            age="2살",
            is_female=False,
            weight=15.0,
            neutering=True,
            vaccination=True,
            heartworm=True
        )

        # 동물 이미지 생성
        self.animal_image = AnimalImage.objects.create(
            animal=self.animal,
            image_url="https://example.com/dog1.jpg",
            is_primary=True
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

        # 계약서 생성
        self.contract = AdoptionContract.objects.create(
            adoption=self.adoption,
            template=self.contract_template,
            contract_content="계약서 내용...",
            guidelines_content="가이드라인 내용...",
            status="대기중"
        )

        # 포스트 생성
        self.post = Post.objects.create(
            title="모니터링 포스트",
            content="입양 후 모니터링 내용입니다.",
            user=self.normal_user
        )

        # 모니터링 포스트 생성
        self.monitoring_post = AdoptionMonitoring.objects.create(
            adoption=self.adoption,
            post_id=str(self.post.id)
        )

    async def authenticate_user(self, user):
        """사용자 인증 및 JWT 토큰 획득"""
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": user.id})
        return {"Authorization": f"Bearer {access_token}"}

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_my_adoptions_success(self):
        """내 입양 신청 목록 조회 성공 테스트"""
        headers = await self.authenticate_user(self.normal_user)

        response = await self.client.get("/my", headers=headers)

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
        self.assertEqual(adoption["user_id"], str(self.normal_user.id))
        self.assertEqual(adoption["center_name"], "테스트 센터")

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_my_adoptions_with_status_filter(self):
        """상태별 필터링 테스트"""
        headers = await self.authenticate_user(self.normal_user)

        # 신청 상태로 필터링
        response = await self.client.get(
            "/my?status=신청", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)

        # 존재하지 않는 상태로 필터링
        response = await self.client.get(
            "/my?status=입양완료", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 0)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_my_adoption_detail_success(self):
        """내 입양 신청 상세 조회 성공 테스트"""
        headers = await self.authenticate_user(self.normal_user)

        response = await self.client.get(
            f"/my/{self.adoption.id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        # 응답 데이터 확인
        self.assertIn("adoption", response_data)
        self.assertIn("question_responses", response_data)
        self.assertIn("contract", response_data)
        self.assertIn("monitoring_posts", response_data)

        adoption_data = response_data["adoption"]
        self.assertEqual(adoption_data["animal_name"], "멍멍이")
        self.assertEqual(adoption_data["status"], "신청")
        self.assertEqual(adoption_data["user_id"], str(self.normal_user.id))

        # 질문 응답 확인
        self.assertEqual(len(response_data["question_responses"]), 2)
        self.assertEqual(response_data["question_responses"][0]["answer"], "네, 강아지를 키워본 적이 있습니다.")

        # 계약서 확인
        self.assertIsNotNone(response_data["contract"])
        self.assertEqual(response_data["contract"]["status"], "대기중")

        # 모니터링 포스트 확인
        self.assertEqual(len(response_data["monitoring_posts"]), 1)
        self.assertEqual(response_data["monitoring_posts"][0]["post_title"], "모니터링 포스트")

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_my_adoption_detail_not_found(self):
        """존재하지 않는 입양 신청 조회 테스트"""
        headers = await self.authenticate_user(self.normal_user)

        from uuid import uuid4
        non_existent_id = str(uuid4())

        response = await self.client.get(
            f"/my/{non_existent_id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 404)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret_key-for-jwt")
    async def test_get_my_adoption_detail_unauthorized(self):
        """다른 사용자의 입양 신청 조회 테스트"""
        headers = await self.authenticate_user(self.other_user)

        response = await self.client.get(
            f"/my/{self.adoption.id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 404)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_user_adoptions_as_admin_success(self):
        """관리자 권한으로 특정 사용자 입양 신청 목록 조회 성공 테스트"""
        headers = await self.authenticate_user(self.center_admin)

        response = await self.client.get(
            f"/{self.normal_user.id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        # 응답 데이터 확인
        self.assertIn("data", response_data)
        self.assertIn("count", response_data)
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(len(response_data["data"]), 1)

        adoption = response_data["data"][0]
        self.assertEqual(adoption["user_id"], str(self.normal_user.id))
        self.assertEqual(adoption["animal_name"], "멍멍이")

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_user_adoptions_as_owner_success(self):
        """센터 소유자 권한으로 특정 사용자 입양 신청 목록 조회 성공 테스트"""
        headers = await self.authenticate_user(self.center_owner)

        response = await self.client.get(
            f"/{self.normal_user.id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_user_adoptions_unauthorized(self):
        """권한 없는 사용자의 특정 사용자 입양 신청 목록 조회 테스트"""
        headers = await self.authenticate_user(self.normal_user)

        response = await self.client.get(
            f"/{self.other_user.id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_user_adoption_detail_as_admin_success(self):
        """관리자 권한으로 특정 사용자 입양 신청 상세 조회 성공 테스트"""
        headers = await self.authenticate_user(self.center_admin)

        response = await self.client.get(
            f"/{self.normal_user.id}/{self.adoption.id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        # 응답 데이터 확인
        self.assertIn("adoption", response_data)
        adoption_data = response_data["adoption"]
        self.assertEqual(adoption_data["user_id"], str(self.normal_user.id))
        self.assertEqual(adoption_data["animal_name"], "멍멍이")

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_user_adoption_detail_as_owner_success(self):
        """센터 소유자 권한으로 특정 사용자 입양 신청 상세 조회 성공 테스트"""
        headers = await self.authenticate_user(self.center_owner)

        response = await self.client.get(
            f"/{self.normal_user.id}/{self.adoption.id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("adoption", response_data)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_user_adoption_detail_unauthorized(self):
        """권한 없는 사용자의 특정 사용자 입양 신청 상세 조회 테스트"""
        headers = await self.authenticate_user(self.normal_user)

        response = await self.client.get(
            f"/{self.other_user.id}/{self.adoption.id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_user_adoption_detail_not_found(self):
        """존재하지 않는 사용자 입양 신청 조회 테스트"""
        headers = await self.authenticate_user(self.center_admin)

        from uuid import uuid4
        non_existent_user_id = str(uuid4())

        response = await self.client.get(
            f"/{non_existent_user_id}", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 0)

    @override_settings(DJANGO_ENV_NAME="local", SECRET_KEY="test-secret-key-for-jwt")
    async def test_get_user_adoption_detail_with_status_filter(self):
        """상태별 필터링이 적용된 특정 사용자 입양 신청 목록 조회 테스트"""
        headers = await self.authenticate_user(self.center_admin)

        # 신청 상태로 필터링
        response = await self.client.get(
            f"/{self.normal_user.id}?status=신청", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)

        # 입양완료 상태로 필터링 (존재하지 않는 상태)
        response = await self.client.get(
            f"/{self.normal_user.id}?status=입양완료", 
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 0)
