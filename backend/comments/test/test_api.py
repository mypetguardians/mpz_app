import uuid
import jwt
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from ninja.testing import TestAsyncClient

from comments.models import Comment, Reply
from posts.models import Post


User = get_user_model()


class TestCommentsAPI(TestCase):
    """Comments API 테스트 클래스"""

    def setUp(self):
        """테스트 데이터 설정"""
        # 테스트 사용자 생성
        self.user1 = User.objects.create_user(
            username="testuser1",
            email="test1@test.com",
            password="password1234!",
            user_type="일반사용자"
        )
        
        self.user2 = User.objects.create_user(
            username="testuser2",
            email="test2@test.com",
            password="password1234!",
            user_type="일반사용자"
        )
        
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@test.com",
            password="password1234!",
            user_type="최고관리자"
        )
        
        # 테스트 게시글 생성
        self.post1 = Post.objects.create(
            user=self.user1,
            title="테스트 게시글 1",
            content="테스트 내용 1"
        )
        
        self.post2 = Post.objects.create(
            user=self.user2,
            title="테스트 게시글 2",
            content="테스트 내용 2"
        )
        
        # 테스트 댓글 생성
        self.comment1 = Comment.objects.create(
            post=self.post1,
            user=self.user2,
            content="테스트 댓글 1"
        )
        
        self.comment2 = Comment.objects.create(
            post=self.post1,
            user=self.user1,
            content="테스트 댓글 2"
        )
        
        # 테스트 대댓글 생성
        self.reply1 = Reply.objects.create(
            comment=self.comment1,
            user=self.user1,
            content="테스트 대댓글 1"
        )
        
        self.reply2 = Reply.objects.create(
            comment=self.comment1,
            user=self.user2,
            content="테스트 대댓글 2"
        )
        
        # 테스트 클라이언트 설정
        from comments.api.comment_api import router as comments_router
        self.client = TestAsyncClient(comments_router)

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

    def authenticate(self, user=None):
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

    # === 댓글 API 테스트 ===

    async def test_create_comment_success(self):
        """댓글 생성 성공 테스트"""
        headers = self.authenticate(self.user1)
        data = {
            "content": "새로운 댓글입니다"
        }
        
        response = await self.client.post(
            f"/{self.post1.id}/comments",
            json=data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
        self.assertIn("comment_id", response.json())

    async def test_create_comment_unauthorized(self):
        """인증 없이 댓글 생성 테스트"""
        data = {
            "content": "새로운 댓글입니다"
        }
        
        response = await self.client.post(
            f"/{self.post1.id}/comments",
            json=data
        )
        
        self.assertEqual(response.status_code, 401)

    async def test_create_comment_invalid_data(self):
        """잘못된 데이터로 댓글 생성 테스트"""
        headers = self.authenticate(self.user1)
        data = {
            "content": ""  # 빈 내용
        }
        
        response = await self.client.post(
            f"/{self.post1.id}/comments",
            json=data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 422)

    async def test_get_comments_success(self):
        """댓글 목록 조회 성공 테스트"""
        response = await self.client.get(
            f"/{self.post1.id}/comments"
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)

    async def test_get_comments_post_not_found(self):
        """존재하지 않는 게시글의 댓글 조회 테스트"""
        fake_post_id = str(uuid.uuid4())
        response = await self.client.get(
            f"/{fake_post_id}/comments"
        )
        
        self.assertEqual(response.status_code, 404)

    async def test_update_comment_success(self):
        """댓글 수정 성공 테스트"""
        headers = self.authenticate(self.user2)  # 댓글 작성자
        data = {
            "content": "수정된 댓글 내용입니다"
        }
        
        response = await self.client.put(
            f"/comments/{self.comment1.id}",
            json=data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())

    async def test_update_comment_no_permission(self):
        """권한 없이 댓글 수정 테스트"""
        headers = self.authenticate(self.user1)  # 다른 사용자
        data = {
            "content": "수정된 댓글 내용입니다"
        }
        
        response = await self.client.put(
            f"/comments/{self.comment1.id}",
            json=data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 403)

    async def test_delete_comment_success(self):
        """댓글 삭제 성공 테스트"""
        headers = self.authenticate(self.user2)  # 댓글 작성자
        
        response = await self.client.delete(
            f"/comments/{self.comment1.id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())

    async def test_delete_comment_admin_permission(self):
        """관리자 권한으로 댓글 삭제 테스트"""
        headers = self.authenticate(self.admin_user)
        
        response = await self.client.delete(
            f"/comments/{self.comment2.id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())

