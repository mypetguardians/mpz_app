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
class TestPostAccessControl(TestCase):
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

        self.center_user = User.objects.create_user(
            username="center_manager",
            email="center@test.com",
            password="password1234!",
            user_type="센터관리자"
        )

        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@test.com",
            password="password1234!",
            user_type="최고관리자"
        )

        # 테스트용 포스트 생성
        self.public_post = Post.objects.create(
            user=self.user1,
            title="전체 공개 포스트",
            content="모든 사용자가 볼 수 있는 포스트입니다.",
            is_all_access=True
        )

        self.private_post = Post.objects.create(
            user=self.user1,
            title="제한적 공개 포스트",
            content="센터 권한자와 본인만 볼 수 있는 포스트입니다.",
            is_all_access=False
        )

        self.center_post = Post.objects.create(
            user=self.center_user,
            title="센터 관리자 포스트",
            content="센터 관리자가 작성한 포스트입니다.",
            is_all_access=False
        )

    def generate_jwt_token(self, user):
        """JWT 토큰을 생성합니다."""
        payload = {
            'user_id': str(user.id),
            'username': user.username,
            'user_type': user.user_type,
            'exp': timezone.now() + timedelta(hours=1)
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    async def test_public_post_access_for_all_users(self):
        """전체 공개 포스트는 모든 사용자가 접근 가능"""
        # 비로그인 사용자
        response = await self.client.get(f"/all/{self.public_post.id}")
        self.assertEqual(response.status_code, 200)
        
        # 일반 사용자
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.get(f"/all/{self.public_post.id}")
        self.assertEqual(response.status_code, 200)
        
        # 센터 관리자
        token = self.generate_jwt_token(self.center_user)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.get(f"/all/{self.public_post.id}")
        self.assertEqual(response.status_code, 200)

    async def test_private_post_access_restricted(self):
        """제한적 공개 포스트는 권한이 있는 사용자만 접근 가능"""
        # 비로그인 사용자 - 404 (전체 공개 엔드포인트에서 찾을 수 없음)
        response = await self.client.get(f"/all/{self.private_post.id}")
        self.assertEqual(response.status_code, 404)
        
        # 권한 없는 일반 사용자 - 403
        token = self.generate_jwt_token(self.user2)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.get(f"/center/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 403)
        
        # 작성자 본인 - 200
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.get(f"/center/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # 센터 관리자 - 200
        token = self.generate_jwt_token(self.center_user)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.get(f"/center/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # 최고 관리자 - 200
        token = self.generate_jwt_token(self.admin_user)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.get(f"/center/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 200)

    async def test_unauthorized_user_cannot_access_private_post(self):
        """권한 없는 사용자는 제한적 공개 포스트에 접근 불가"""
        # 비로그인 사용자
        response = await self.client.get(f"/center/{self.private_post.id}")
        self.assertEqual(response.status_code, 401)
        
        # 권한 없는 일반 사용자
        token = self.generate_jwt_token(self.user2)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.get(f"/center/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 403)

    async def test_list_filtering_by_access_control(self):
        """접근 권한에 따른 목록 필터링 테스트"""
        # 전체 공개 목록 - 비로그인 사용자도 접근 가능
        response = await self.client.get("/all/")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 전체 공개 글만 조회되어야 함
        self.assertEqual(len(posts_list), 1)
        self.assertTrue(posts_list[0]['is_all_access'])
        
        # 센터 권한자용 목록 - 인증 필요
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.get("/center/", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 전체 공개 + 본인 글 + 센터 권한자 글 조회되어야 함
        self.assertEqual(len(posts_list), 3)

    async def test_post_creation_with_access_control(self):
        """접근 권한을 고려한 게시글 생성 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        # 전체 공개 게시글 생성
        post_data = {
            "title": "전체 공개 게시글",
            "content": "모든 사용자가 볼 수 있는 게시글입니다.",
            "is_all_access": True
        }
        response = await self.client.post("/", json=post_data, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        # 제한적 공개 게시글 생성
        post_data = {
            "title": "제한적 공개 게시글",
            "content": "센터 권한자와 본인만 볼 수 있는 게시글입니다.",
            "is_all_access": False
        }
        response = await self.client.post("/", json=post_data, headers=headers)
        self.assertEqual(response.status_code, 201)

    async def test_update_post_access_control(self):
        """게시글 수정 시 접근 권한 확인"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        # 본인 글 수정 - 성공
        update_data = {
            "title": "수정된 제목",
            "is_all_access": True
        }
        response = await self.client.put(f"/{self.private_post.id}", json=update_data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # 다른 사용자 글 수정 시도 - 실패
        token = self.generate_jwt_token(self.user2)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.put(f"/{self.private_post.id}", json=update_data, headers=headers)
        self.assertEqual(response.status_code, 403)

    async def test_delete_post_access_control(self):
        """게시글 삭제 시 접근 권한 확인"""
        # 작성자 삭제 - 성공
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.delete(f"/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # 다른 사용자 삭제 시도 - 실패
        token = self.generate_jwt_token(self.user2)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.delete(f"/{self.center_post.id}", headers=headers)
        self.assertEqual(response.status_code, 403)
        
        # 최고 관리자 삭제 - 성공
        token = self.generate_jwt_token(self.admin_user)
        headers = {'Authorization': f'Bearer {token}'}
        response = await self.client.delete(f"/{self.center_post.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
