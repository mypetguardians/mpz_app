from django.test import TestCase, override_settings
from ninja.testing import TestAsyncClient
from posts.models import Post, PostLike
from user.models import User
from posts.api import router as posts_router
import jwt
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

@override_settings(DJANGO_ENV_NAME="local")
class TestPostLikeAPI(TestCase):
    def setUp(self):
        # API client
        self.client = TestAsyncClient(posts_router)

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

        # 테스트용 포스트 생성
        self.post = Post.objects.create(
            user=self.user1,
            title="테스트 포스트",
            content="테스트 내용입니다.",
            like_count=0
        )

    def generate_jwt_token(self, user):
        """JWT 토큰을 생성합니다."""
        payload = {
            'user_id': str(user.id),
            'username': user.username,
            'exp': timezone.now() + timedelta(hours=1)
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    async def test_toggle_post_like(self):
        """포스트 좋아요 토글 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}

        # 좋아요 추가
        response = await self.client.post(
            f"/{self.post.id}/like/toggle",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['is_liked'])
        self.assertEqual(response.json()['total_likes'], 1)
        self.assertEqual(response.json()['message'], "포스트를 좋아요했습니다")

        # 좋아요 해제
        response = await self.client.post(
            f"/{self.post.id}/like/toggle",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['is_liked'])
        self.assertEqual(response.json()['total_likes'], 0)
        self.assertEqual(response.json()['message'], "포스트 좋아요가 해제되었습니다")

    async def test_check_post_like_status(self):
        """포스트 좋아요 상태 확인 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}

        # 초기 상태 확인 (좋아요 안함)
        response = await self.client.get(
            f"/{self.post.id}/like/status",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['is_liked'])
        self.assertEqual(response.json()['total_likes'], 0)

        # 좋아요 추가 후 상태 확인
        from asgiref.sync import sync_to_async
        
        @sync_to_async
        def create_like():
            PostLike.objects.create(user=self.user1, post=self.post)
        
        await create_like()
        
        response = await self.client.get(
            f"/{self.post.id}/like/status",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['is_liked'])
        self.assertEqual(response.json()['total_likes'], 1)

    async def test_post_like_unauthorized(self):
        """인증되지 않은 사용자의 좋아요 시도 테스트"""
        # 토큰 없이 요청
        response = await self.client.post(f"/{self.post.id}/like/toggle")
        self.assertEqual(response.status_code, 401)

        response = await self.client.get(f"/{self.post.id}/like/status")
        self.assertEqual(response.status_code, 401)

    async def test_post_like_not_found(self):
        """존재하지 않는 포스트에 대한 좋아요 시도 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}

        # 존재하지 않는 포스트 ID
        fake_post_id = "00000000-0000-0000-0000-000000000000"
        
        response = await self.client.post(
            f"/{fake_post_id}/like/toggle",
            headers=headers
        )
        self.assertEqual(response.status_code, 404)

        response = await self.client.get(
            f"/{fake_post_id}/like/status",
            headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_post_like_unique_constraint(self):
        """한 사용자가 같은 포스트에 중복 좋아요 방지 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}

        # 첫 번째 좋아요
        response = await self.client.post(
            f"/{self.post.id}/like/toggle",
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['is_liked'])

        # 두 번째 좋아요 시도 (이미 좋아요한 상태)
        response = await self.client.post(
            f"/{self.post.id}/like/toggle",
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['is_liked'])

    async def test_post_like_count_update(self):
        """포스트 좋아요 개수 업데이트 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}

        # 초기 좋아요 개수 확인
        from asgiref.sync import sync_to_async
        
        @sync_to_async
        def refresh_post():
            self.post.refresh_from_db()
            return self.post.like_count
        
        initial_count = await refresh_post()
        self.assertEqual(initial_count, 0)

        # 좋아요 추가
        response = await self.client.post(
            f"/{self.post.id}/like/toggle",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['total_likes'], 1)

        # Post 모델의 like_count 필드 업데이트 확인
        @sync_to_async
        def refresh_post():
            self.post.refresh_from_db()
            return self.post.like_count
        
        updated_count = await refresh_post()
        self.assertEqual(updated_count, 1)

        # 좋아요 해제
        response = await self.client.post(
            f"/{self.post.id}/like/toggle",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['total_likes'], 0)

        # Post 모델의 like_count 필드 업데이트 확인
        @sync_to_async
        def refresh_post():
            self.post.refresh_from_db()
            return self.post.like_count
        
        updated_count = await refresh_post()
        self.assertEqual(updated_count, 0)
