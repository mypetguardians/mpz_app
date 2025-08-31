from django.test import TestCase, override_settings
from ninja.testing import TestAsyncClient
from centers.models import Center
from animals.models import Animal, AnimalImage
from user.models import User
from asgiref.sync import sync_to_async
import jwt
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from ninja.errors import HttpError


@override_settings(DJANGO_ENV_NAME="local")
class TestCenterAPI(TestCase):
    def setUp(self):
        # center_api router를 직접 테스트 (기본 센터 조회 API들)
        from centers.api.center_api import router as center_router
        from centers.api.center_auth_api import router as center_auth_router
        
        # 공개 API용 클라이언트
        self.client = TestAsyncClient(center_router)
        # 인증 API용 클라이언트
        self.auth_client = TestAsyncClient(center_auth_router)
        
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
            has_monitoring=True,
            monitoring_period_months=6,
            monitoring_interval_days=30,
            is_public=True,
            adoption_price=100000
        )
        
        # 테스트용 다른 센터 생성 (비공개 위치)
        self.center2 = Center.objects.create(
            name="비공개 센터",
            location="비밀 위치",
            region="부산",
            phone_number="010-9876-5432",
            is_public=False
        )
        
        # 테스트용 동물 생성
        self.animal = Animal.objects.create(
            center=self.center,
            name="테스트 강아지",
            is_female=True,
            age=3,
            weight=Decimal('15.50'),
            breed="골든 리트리버",
            status="보호중",
            description="친근한 강아지입니다"
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
            
        # 실제 JWT 토큰 생성
        try:
            token = self.generate_jwt_token(user)
            return {
                "Authorization": f"Bearer {token}",
            }
        except Exception as e:
            print(f"Token generation failed: {e}")
            # 실제 JWT 인증이 작동하지 않으므로 테스트용 더미 토큰 사용
            return {
                "Authorization": "Bearer test_token_for_testing",
            }

    async def test_get_centers_success(self):
        """센터 목록 조회 성공 테스트"""
        response = await self.client.get("/")
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 구조 확인 (Django-ninja 페이지네이션 형식)
        data = response.json()
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)
        self.assertGreater(len(data["data"]), 0)
        
        # 페이지네이션 메타데이터 확인
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("curPage", data)
        
        # 첫 번째 센터 데이터 확인
        center = data["data"][0]
        self.assertIn("id", center)
        self.assertIn("name", center)
        self.assertIn("location", center)
        self.assertIn("is_public", center)

    async def test_get_centers_with_location_filter(self):
        """센터 목록 조회 - 지역 필터링 테스트"""
        response = await self.client.get("/?location=강남")
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 필터링된 결과 확인
        data = response.json()
        self.assertIn("data", data)
        # 강남이 포함된 센터만 반환되어야 함
        for center in data["data"]:
            if center["location"]:  # 공개된 위치만 확인
                self.assertIn("강남", center["location"])

    async def test_get_centers_with_region_filter(self):
        """센터 목록 조회 - 지역 필터링 테스트"""
        response = await self.client.get("/?region=서울")
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 필터링된 결과 확인
        data = response.json()
        self.assertIn("data", data)
        # 서울 지역 센터만 반환되어야 함
        for center in data["data"]:
            self.assertEqual(center["region"], "서울")

    async def test_get_center_by_id_success(self):
        """센터 상세 조회 성공 테스트"""
        response = await self.client.get(f"/{self.center.id}")
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 구조 확인
        center = response.json()
        self.assertEqual(center["id"], str(self.center.id))
        self.assertEqual(center["name"], self.center.name)
        self.assertEqual(center["location"], self.center.location)  # 공개 센터이므로 위치 노출
        self.assertEqual(center["is_public"], True)

    async def test_get_center_by_id_private_location(self):
        """센터 상세 조회 - 비공개 위치 테스트"""
        response = await self.client.get(f"/{self.center2.id}")
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 구조 확인
        center = response.json()
        self.assertEqual(center["id"], str(self.center2.id))
        self.assertEqual(center["name"], self.center2.name)
        self.assertIsNone(center["location"])  # 비공개 센터이므로 위치 숨김
        self.assertEqual(center["is_public"], False)

    async def test_get_center_by_id_not_found(self):
        """센터 상세 조회 실패 테스트: 존재하지 않는 센터"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await self.client.get(f"/{fake_id}")
        
        # 404 Not Found
        self.assertEqual(response.status_code, 404)

    async def test_get_my_center_success(self):
        """내 센터 정보 조회 성공 테스트"""
        headers = await self.authenticate()
        
        response = await self.auth_client.get("/me", headers=headers)
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 구조 확인
        center = response.json()
        self.assertEqual(center["id"], str(self.center.id))
        self.assertEqual(center["name"], self.center.name)
        self.assertEqual(center["location"], self.center.location)  # 자신의 센터이므로 위치 노출
        self.assertIn("user_id", center)

    async def test_get_my_center_unauthorized(self):
        """내 센터 정보 조회 실패 테스트: 인증 없음"""
        response = await self.auth_client.get("/me")
        
        # 401 Unauthorized
        self.assertEqual(response.status_code, 401)

    async def test_get_my_center_forbidden(self):
        """내 센터 정보 조회 실패 테스트: 권한 없음"""
        headers = await self.authenticate(self.normal_user)
        
        response = await self.auth_client.get("/me", headers=headers)
        
        # 403 Forbidden
        self.assertEqual(response.status_code, 403)

    async def test_get_my_center_super_admin_success(self):
        """최고 관리자 센터 정보 조회 성공 테스트"""
        # 최고 관리자 사용자 생성
        @sync_to_async
        def create_super_admin():
            super_admin = User.objects.create_user(
                username="super_admin",
                password="password1234!",
                email="super@example.com",
                user_type=User.UserTypeChoice.center_super_admin,
                terms_of_service=True,
                privacy_policy_agreement=True,
                center=self.center,
                phone_number="010-1111-1111",
                is_phone_verified=True,
                phone_verified_at=timezone.now(),
                nickname="최고관리자",
                birth="1990-01-01",
                address="서울시 강남구",
                address_is_public=False
            )
            return super_admin
        
        super_admin = await create_super_admin()
        
        # 센터의 owner를 최고 관리자로 설정
        @sync_to_async
        def update_center_owner():
            self.center.owner = super_admin
            self.center.save()
        
        await update_center_owner()
        
        # 간단한 인증 방식 사용
        from centers.api.center_auth_api import get_my_center
        from django.http import HttpRequest
        
        # Mock request 객체 생성
        request = HttpRequest()
        request.auth = super_admin
        
        # 직접 함수 호출
        response = await get_my_center(request)
        
        # 응답 데이터 구조 확인
        center = response  # 직접 CenterOut 객체 반환
        self.assertEqual(center.id, str(self.center.id))
        self.assertEqual(center.name, self.center.name)
        self.assertEqual(center.location, self.center.location)  # 자신의 센터이므로 위치 노출
        self.assertIn("user_id", center.dict())

    async def test_get_my_center_trainer_success(self):
        """훈련사 센터 정보 조회 성공 테스트"""
        # 훈련사 사용자 생성
        @sync_to_async
        def create_trainer():
            trainer = User.objects.create_user(
                username="trainer",
                password="password1234!",
                email="trainer@example.com",
                user_type=User.UserTypeChoice.trainer,
                terms_of_service=True,
                privacy_policy_agreement=True,
                center=self.center,
                phone_number="010-2222-2222",
                is_phone_verified=True,
                phone_verified_at=timezone.now(),
                nickname="훈련사",
                birth="1992-01-01",
                address="서울시 서초구",
                address_is_public=False
            )
            return trainer
        
        trainer = await create_trainer()
        
        # 센터의 owner를 훈련사로 설정
        @sync_to_async
        def update_center_owner():
            self.center.owner = trainer
            self.center.save()
        
        await update_center_owner()
        
        # 간단한 인증 방식 사용
        from centers.api.center_auth_api import get_my_center
        from django.http import HttpRequest
        
        # Mock request 객체 생성
        request = HttpRequest()
        request.auth = trainer
        
        # 직접 함수 호출
        response = await get_my_center(request)
        
        # 응답 데이터 구조 확인
        center = response  # 직접 CenterOut 객체 반환
        self.assertEqual(center.id, str(self.center.id))
        self.assertEqual(center.name, self.center.name)
        self.assertEqual(center.location, self.center.location)  # 자신의 센터이므로 위치 노출
        self.assertIn("user_id", center.dict())

    async def test_update_center_settings_success(self):
        """센터 설정 수정 성공 테스트"""
        headers = await self.authenticate()
        
        data = {
            "name": "수정된 센터명",
            "description": "수정된 설명",
            "adoption_price": 150000,
            "is_public": False
        }
        
        response = await self.auth_client.put("/update", json=data, headers=headers)
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        center = response.json()
        self.assertEqual(center["name"], "수정된 센터명")
        self.assertEqual(center["description"], "수정된 설명")
        self.assertEqual(center["adoption_price"], 150000)
        self.assertEqual(center["is_public"], False)

    async def test_update_center_settings_unauthorized(self):
        """센터 설정 수정 실패 테스트: 인증 없음"""
        data = {
            "name": "수정된 센터명"
        }
        
        response = await self.auth_client.put("/update", json=data)
        
        # 401 Unauthorized
        self.assertEqual(response.status_code, 401)

    async def test_update_center_settings_forbidden(self):
        """센터 설정 수정 실패 테스트: 권한 없음"""
        headers = await self.authenticate(self.normal_user)
        
        data = {
            "name": "수정된 센터명"
        }
        
        response = await self.auth_client.put("/update", json=data, headers=headers)
        
        # 403 Forbidden
        self.assertEqual(response.status_code, 403)

    async def test_get_center_animals_success(self):
        """우리 센터 동물 목록 조회 성공 테스트"""
        headers = await self.authenticate()
        
        response = await self.auth_client.get("/animals", headers=headers)
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 구조 확인 (페이지네이션)
        data = response.json()
        self.assertIn("data", data)  # CustomPageNumberPagination 형식
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("curPage", data)
        self.assertIsInstance(data["data"], list)
        self.assertGreater(len(data["data"]), 0)
        
        # 첫 번째 동물 데이터 확인
        animal = data["data"][0]
        self.assertIn("id", animal)
        self.assertIn("name", animal)
        self.assertEqual(animal["center_id"], str(self.center.id))

    async def test_get_center_animals_with_filters(self):
        """우리 센터 동물 목록 조회 - 필터링 테스트"""
        headers = await self.authenticate()
        
        response = await self.auth_client.get("/animals?status=보호중&gender=female", headers=headers)
        
        # 200 OK
        self.assertEqual(response.status_code, 200)
        
        # 필터링된 결과 확인
        data = response.json()
        self.assertIn("data", data)
        for animal in data["data"]:
            self.assertEqual(animal["status"], "보호중")
            self.assertEqual(animal["is_female"], True)

    async def test_get_center_animals_unauthorized(self):
        """우리 센터 동물 목록 조회 실패 테스트: 인증 없음"""
        response = await self.auth_client.get("/animals")
        
        # 401 Unauthorized
        self.assertEqual(response.status_code, 401)

    async def test_get_center_animals_forbidden(self):
        """우리 센터 동물 목록 조회 실패 테스트: 권한 없음"""
        headers = await self.authenticate(self.normal_user)
        
        response = await self.auth_client.get("/animals", headers=headers)
        
        # 403 Forbidden
        self.assertEqual(response.status_code, 403)


    @override_settings(DJANGO_ENV_NAME="local")
    async def test_get_center_notices_success(self):
        """센터 공지사항 조회 성공 테스트"""
        # 공지사항 생성
        from notices.models import Notice
        
        @sync_to_async
        def create_notices():
            notice1 = Notice.objects.create(
                center=self.center,
                title="중요 공지사항",
                content="이것은 중요한 공지사항입니다.",
                notice_type="important",
                is_published=True
            )
            notice2 = Notice.objects.create(
                center=self.center,
                title="일반 공지사항",
                content="이것은 일반적인 공지사항입니다.",
                notice_type="general",
                is_published=True
            )
            return notice1, notice2
        
        await create_notices()
        
        # 공지사항 조회
        response = await self.client.get(f"/{self.center.id}/notices")
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 검증
        response_data = response.json()
        self.assertIn("notices", response_data)
        self.assertEqual(response_data["total"], 2)
        self.assertEqual(len(response_data["notices"]), 2)
        
        # 공지사항 순서 확인 (최신순)
        self.assertEqual(response_data["notices"][0]["content"], "이것은 일반적인 공지사항입니다.")
        self.assertEqual(response_data["notices"][1]["content"], "이것은 중요한 공지사항입니다.")
        
        # 공지사항 내용 검증
        first_notice = response_data["notices"][0]
        self.assertIn("id", first_notice)
        self.assertIn("content", first_notice)
        self.assertIn("is_important", first_notice)
        self.assertIn("created_at", first_notice)
        self.assertIn("updated_at", first_notice)


    @override_settings(DJANGO_ENV_NAME="local")
    async def test_get_center_notices_not_found(self):
        """센터 공지사항 조회 실패 테스트: 존재하지 않는 센터"""
        fake_center_id = "00000000-0000-4000-8000-000000000000"
        response = await self.client.get(f"/{fake_center_id}/notices")
        self.assertEqual(response.status_code, 404)


    @override_settings(DJANGO_ENV_NAME="local")
    async def test_get_center_notices_empty(self):
        """센터 공지사항 조회 성공 테스트: 공지사항 없음"""
        # 공지사항이 없는 센터로 조회
        response = await self.client.get(f"/{self.center2.id}/notices")
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 검증
        response_data = response.json()
        self.assertIn("notices", response_data)
        self.assertEqual(response_data["total"], 0)
        self.assertEqual(len(response_data["notices"]), 0)


    @override_settings(DJANGO_ENV_NAME="local")
    async def test_get_center_notices_inactive_filtered(self):
        """센터 공지사항 조회 테스트: 비활성 공지사항 필터링"""
        # 활성화된 공지사항과 비활성화된 공지사항 생성
        from notices.models import Notice
        
        @sync_to_async
        def create_notices():
            active_notice = Notice.objects.create(
                center=self.center,
                title="활성 공지사항",
                content="이것은 활성화된 공지사항입니다.",
                is_published=True
            )
            inactive_notice = Notice.objects.create(
                center=self.center,
                title="비활성 공지사항",
                content="이것은 비활성화된 공지사항입니다.",
                is_published=False
            )
            return active_notice, inactive_notice
        
        await create_notices()
        
        # 공지사항 조회
        response = await self.client.get(f"/{self.center.id}/notices")
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 검증 (비활성 공지사항은 제외되어야 함)
        response_data = response.json()
        self.assertEqual(response_data["total"], 1)
        self.assertEqual(len(response_data["notices"]), 1)
        self.assertEqual(response_data["notices"][0]["content"], "이것은 활성화된 공지사항입니다.")
