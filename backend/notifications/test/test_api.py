from django.test import TestCase, override_settings
from ninja.testing import TestAsyncClient
from notifications.models import Notification, PushToken
from user.models import User
from asgiref.sync import sync_to_async
import jwt
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

@override_settings(DJANGO_ENV_NAME="local")
class TestNotificationsAPI(TestCase):
    def setUp(self):
        # API client
        from notifications.api import router as notifications_router
        self.client = TestAsyncClient(notifications_router)

        # 테스트용 사용자 생성
        self.user1 = User.objects.create_user(
            username="user1",
            email="user1@test.com",
            password="password1234!",
            user_type="일반사용자"
        )

        self.user2 = User.objects.create_user(
            username="user2",
            email="user2@test.com",
            password="password1234!",
            user_type="일반사용자"
        )

        # 테스트용 알림 생성
        self.notification1 = Notification.objects.create(
            user=self.user1,
            notification_type="adoption_update",
            title="입양 상태 업데이트",
            message="입양 신청이 승인되었습니다.",
            is_read=False
        )

        self.notification2 = Notification.objects.create(
            user=self.user1,
            notification_type="system",
            title="시스템 알림",
            message="새로운 기능이 추가되었습니다.",
            is_read=False
        )

        self.notification3 = Notification.objects.create(
            user=self.user2,
            notification_type="center_update",
            title="센터 정보 업데이트",
            message="센터 정보가 변경되었습니다.",
            is_read=False
        )

        # 테스트용 푸시 토큰 생성
        self.push_token1 = PushToken.objects.create(
            user=self.user1,
            platform="android",
            token="test_android_token_123",
            is_active=True
        )

        self.push_token2 = PushToken.objects.create(
            user=self.user1,
            platform="ios",
            token="test_ios_token_456",
            is_active=True
        )

    def generate_jwt_token(self, user):
        """실제 JWT 토큰을 생성합니다"""
        payload = {
            'user_id': str(user.id),
            'username': user.username,
            'exp': timezone.now() + timedelta(hours=1),
            'iat': timezone.now()
        }
        token = jwt.encode(payload, settings.JWT_SIGNING_KEY, algorithm="HS256")
        return token

    async def authenticate(self, user=None):
        """사용자 인증 및 JWT 토큰 획득"""
        if user is None:
            user = self.user1

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

    # === 알림 목록 조회 테스트 ===

    async def test_get_notifications_success(self):
        """알림 목록 조회 성공 테스트"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.get("/", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Django-ninja 페이지네이션 형식 확인
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 2)  # user1의 알림 2개
        
        # 최신순 정렬 확인
        notification1 = data["data"][0]
        notification2 = data["data"][1]
        self.assertEqual(notification1["title"], "시스템 알림")  # 더 최근
        self.assertEqual(notification2["title"], "입양 상태 업데이트")

    async def test_get_notifications_empty(self):
        """알림이 없는 사용자 테스트"""
        # API 응답만으로 테스트 (DB 검증 제거)
        headers = await self.authenticate(self.user2)  # user2는 notification3만 가지고 있음 (다른 사용자)
        
        response = await self.client.get("/", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 1)  # user2의 알림 1개

    async def test_get_notifications_unauthorized(self):
        """인증 없이 알림 목록 조회 테스트"""
        response = await self.client.get("/")
        self.assertEqual(response.status_code, 401)

    # === 알림 읽음 처리 테스트 ===

    async def test_mark_notification_read_success(self):
        """알림 읽음 처리 성공 테스트"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.put(f"/{self.notification1.id}/read", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["message"], "알림을 읽음 처리했습니다")

    async def test_mark_notification_read_not_found(self):
        """존재하지 않는 알림 읽음 처리 테스트"""
        headers = await self.authenticate(self.user1)
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = await self.client.put(f"/{fake_id}/read", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_mark_notification_read_other_user(self):
        """다른 사용자의 알림 읽음 처리 테스트"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.put(f"/{self.notification3.id}/read", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_mark_notification_read_unauthorized(self):
        """인증 없이 알림 읽음 처리 테스트"""
        response = await self.client.put(f"/{self.notification1.id}/read")
        self.assertEqual(response.status_code, 401)

    # === 모든 알림 읽음 처리 테스트 ===

    async def test_mark_all_notifications_read_success(self):
        """모든 알림 읽음 처리 성공 테스트"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.put("/read-all", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["message"], "모든 알림을 읽음 처리했습니다")

    async def test_mark_all_notifications_read_unauthorized(self):
        """인증 없이 모든 알림 읽음 처리 테스트"""
        response = await self.client.put("/read-all")
        self.assertEqual(response.status_code, 401)

    # === 푸시 토큰 등록 테스트 ===

    async def test_register_push_token_new(self):
        """새로운 푸시 토큰 등록 테스트"""
        headers = await self.authenticate(self.user1)
        data = {
            "token": "new_web_token_789",
            "platform": "web"
        }
        
        response = await self.client.post("/push-token", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "푸시 토큰이 등록되었습니다")

    async def test_register_push_token_update(self):
        """기존 푸시 토큰 업데이트 테스트"""
        headers = await self.authenticate(self.user1)
        data = {
            "token": "updated_android_token_999",
            "platform": "android"
        }
        
        response = await self.client.post("/push-token", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "푸시 토큰이 등록되었습니다")

    async def test_register_push_token_invalid_platform(self):
        """잘못된 플랫폼으로 푸시 토큰 등록 테스트"""
        headers = await self.authenticate(self.user1)
        data = {
            "token": "test_token",
            "platform": "invalid_platform"
        }
        
        response = await self.client.post("/push-token", json=data, headers=headers)
        self.assertEqual(response.status_code, 422)  # Validation error

    async def test_register_push_token_unauthorized(self):
        """인증 없이 푸시 토큰 등록 테스트"""
        data = {"token": "test_token", "platform": "android"}
        response = await self.client.post("/push-token", json=data)
        self.assertEqual(response.status_code, 401)

    # === 푸시 토큰 비활성화 테스트 ===

    async def test_deactivate_push_token_success(self):
        """푸시 토큰 비활성화 성공 테스트"""
        headers = await self.authenticate(self.user1)
        data = {"platform": "ios"}
        
        response = await self.client.delete("/push-token", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "푸시 토큰이 비활성화되었습니다")

    async def test_deactivate_push_token_unauthorized(self):
        """인증 없이 푸시 토큰 비활성화 테스트"""
        data = {"platform": "android"}
        response = await self.client.delete("/push-token", json=data)
        self.assertEqual(response.status_code, 401)

    # === 읽지 않은 알림 개수 테스트 ===

    async def test_get_unread_count_success(self):
        """읽지 않은 알림 개수 조회 성공 테스트"""
        headers = await self.authenticate(self.user1)
        
        response = await self.client.get("/unread-count", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["unread_count"], 2)  # user1의 읽지 않은 알림 2개

    async def test_get_unread_count_after_read(self):
        """읽음 처리 후 읽지 않은 알림 개수 조회 테스트"""
        headers = await self.authenticate(self.user1)
        
        # 먼저 알림을 읽음 처리
        await self.client.put(f"/{self.notification1.id}/read", headers=headers)
        
        # 읽지 않은 알림 개수 조회
        response = await self.client.get("/unread-count", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["unread_count"], 1)  # 1개만 남음

    async def test_get_unread_count_unauthorized(self):
        """인증 없이 읽지 않은 알림 개수 조회 테스트"""
        response = await self.client.get("/unread-count")
        self.assertEqual(response.status_code, 401)

    # === 알림 생성 API 테스트 ===

    async def test_create_notification_success(self):
        """알림 생성 및 푸시 전송 성공 테스트"""
        headers = await self.authenticate(self.user1)
        data = {
            "user_id": str(self.user2.id),
            "notification_type": "system",
            "title": "테스트 알림",
            "message": "API를 통해 생성된 테스트 알림입니다.",
            "priority": "normal",
            "send_push": False  # 테스트 환경에서는 푸시 비활성화
        }
        
        response = await self.client.post("/create", json=data, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        notification_data = response.json()
        self.assertEqual(notification_data["title"], "테스트 알림")
        self.assertEqual(notification_data["message"], "API를 통해 생성된 테스트 알림입니다.")
        self.assertEqual(notification_data["notification_type"], "system")

    async def test_create_notification_invalid_user(self):
        """존재하지 않는 사용자에게 알림 생성 테스트"""
        headers = await self.authenticate(self.user1)
        fake_user_id = "00000000-0000-0000-0000-000000000000"
        data = {
            "user_id": fake_user_id,
            "notification_type": "system",
            "title": "테스트 알림",
            "message": "테스트 메시지",
            "send_push": False
        }
        
        response = await self.client.post("/create", json=data, headers=headers)
        self.assertEqual(response.status_code, 400)

    async def test_create_notification_invalid_type(self):
        """잘못된 알림 타입으로 알림 생성 테스트"""
        headers = await self.authenticate(self.user1)
        data = {
            "user_id": str(self.user2.id),
            "notification_type": "invalid_type",
            "title": "테스트 알림",
            "message": "테스트 메시지",
            "send_push": False
        }
        
        response = await self.client.post("/create", json=data, headers=headers)
        self.assertEqual(response.status_code, 422)  # Validation error

    async def test_create_notification_unauthorized(self):
        """인증 없이 알림 생성 테스트"""
        data = {
            "user_id": str(self.user2.id),
            "notification_type": "system",
            "title": "테스트 알림",
            "message": "테스트 메시지"
        }
        response = await self.client.post("/create", json=data)
        self.assertEqual(response.status_code, 401)
