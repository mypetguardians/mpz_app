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
class TestNewPostStructure(TestCase):
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

    async def test_all_public_posts_list_no_auth(self):
        """전체 공개 게시글 목록 조회 - 인증 불필요"""
        response = await self.client.get("/all/")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        # paginate 응답 구조 확인
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 전체 공개 글만 조회되어야 함
        self.assertEqual(len(posts_list), 1)
        self.assertTrue(posts_list[0]['is_all_access'])

    async def test_all_public_post_detail_no_auth(self):
        """전체 공개 게시글 상세 조회 - 인증 불필요"""
        response = await self.client.get(f"/all/{self.public_post.id}")
        self.assertEqual(response.status_code, 200)
        
        post_data = response.json()['post']
        self.assertEqual(post_data['title'], "전체 공개 포스트")
        self.assertTrue(post_data['is_all_access'])

    async def test_all_public_post_detail_private_post(self):
        """전체 공개 엔드포인트에서 제한적 공개 포스트 접근 시도"""
        response = await self.client.get(f"/all/{self.private_post.id}")
        self.assertEqual(response.status_code, 404)

    async def test_center_posts_list_with_auth(self):
        """센터 권한자용 게시글 목록 조회 - 인증 필요"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        response = await self.client.get("/center/", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        # paginate 응답 구조 확인
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 전체 공개 + 본인 글 + 센터 권한자 글 조회되어야 함
        self.assertEqual(len(posts_list), 3)
        
        # is_all_access 필드가 모든 글에 있어야 함
        for post in posts_list:
            self.assertIn('is_all_access', post)
            self.assertIn('is_liked', post)

    async def test_center_posts_list_unauthorized(self):
        """센터 권한자용 게시글 목록 조회 - 인증 없음"""
        response = await self.client.get("/center/")
        self.assertEqual(response.status_code, 401)

    async def test_center_post_detail_with_auth(self):
        """센터 권한자용 게시글 상세 조회 - 인증 필요"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        # 본인 글 조회
        response = await self.client.get(f"/center/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        post_data = response.json()['post']
        self.assertEqual(post_data['title'], "제한적 공개 포스트")
        self.assertFalse(post_data['is_all_access'])

    async def test_center_post_detail_center_user(self):
        """센터 권한자용 게시글 상세 조회 - 센터 관리자"""
        token = self.generate_jwt_token(self.center_user)
        headers = {'Authorization': f'Bearer {token}'}
        
        # 다른 사용자의 제한적 공개 글 조회
        response = await self.client.get(f"/center/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 200)

    async def test_center_post_detail_unauthorized_user(self):
        """센터 권한자용 게시글 상세 조회 - 권한 없는 사용자"""
        token = self.generate_jwt_token(self.user2)
        headers = {'Authorization': f'Bearer {token}'}
        
        # 다른 사용자의 제한적 공개 글 조회 시도
        response = await self.client.get(f"/center/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 403)

    async def test_center_post_detail_unauthorized(self):
        """센터 권한자용 게시글 상세 조회 - 인증 없음"""
        response = await self.client.get(f"/center/{self.private_post.id}")
        self.assertEqual(response.status_code, 401)

    async def test_create_post_with_auth(self):
        """게시글 생성 - 인증 필요"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        post_data = {
            "title": "새로운 게시글",
            "content": "새로운 게시글 내용입니다.",
            "is_all_access": False
        }
        
        response = await self.client.post("/", json=post_data, headers=headers)
        self.assertEqual(response.status_code, 201)

    async def test_create_post_unauthorized(self):
        """게시글 생성 - 인증 없음"""
        post_data = {
            "title": "새로운 게시글",
            "content": "새로운 게시글 내용입니다.",
            "is_all_access": False
        }
        
        response = await self.client.post("/", json=post_data)
        self.assertEqual(response.status_code, 401)

    async def test_update_post_with_auth(self):
        """게시글 수정 - 인증 필요"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        update_data = {
            "title": "수정된 제목"
        }
        
        response = await self.client.put(f"/{self.private_post.id}", json=update_data, headers=headers)
        self.assertEqual(response.status_code, 200)

    async def test_delete_post_with_auth(self):
        """게시글 삭제 - 인증 필요"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        response = await self.client.delete(f"/{self.private_post.id}", headers=headers)
        self.assertEqual(response.status_code, 200)

    async def test_like_toggle_with_auth(self):
        """게시글 좋아요 토글 - 인증 필요"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        response = await self.client.post(f"/{self.public_post.id}/like/toggle", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        like_data = response.json()
        self.assertTrue(like_data['is_liked'])
        self.assertEqual(like_data['total_likes'], 1)

    async def test_like_status_with_auth(self):
        """게시글 좋아요 상태 확인 - 인증 필요"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        response = await self.client.get(f"/{self.public_post.id}/like/status", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        status_data = response.json()
        self.assertIn('is_liked', status_data)
        self.assertIn('total_likes', status_data)

    async def test_system_tags_no_auth(self):
        """시스템 태그 목록 조회 - 인증 불필요"""
        response = await self.client.get("/tags/system")
        self.assertEqual(response.status_code, 200)
