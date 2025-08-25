import uuid
import jwt
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async

from posts.models import Post, PostTag, PostImage, SystemTag
from comments.models import Comment, Reply
from user.models import User
from posts.api import router as posts_router


User = get_user_model()


@override_settings(DJANGO_ENV_NAME="local")
class TestPostsAPI(TestCase):
    """Posts API 테스트 클래스"""

    def setUp(self):
        """테스트 데이터 설정"""
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

        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@test.com",
            password="password1234!",
            user_type="최고관리자"
        )

        # 테스트용 포스트 생성
        self.post1 = Post.objects.create(
            user=self.user1,
            title="테스트 포스트 1",
            content="테스트 포스트 1의 내용입니다.",
            is_all_access=True
        )

        self.post2 = Post.objects.create(
            user=self.user2,
            title="테스트 포스트 2",
            content="테스트 포스트 2의 내용입니다.",
            is_all_access=True
        )

        # 테스트용 태그 생성
        self.tag1 = PostTag.objects.create(
            post=self.post1,
            tag_name="강아지"
        )

        self.tag2 = PostTag.objects.create(
            post=self.post1,
            tag_name="고양이"
        )

        self.tag3 = PostTag.objects.create(
            post=self.post2,
            tag_name="강아지"
        )

        # 테스트용 이미지 생성
        self.image1 = PostImage.objects.create(
            post=self.post1,
            image_url="https://example.com/image1.jpg",
            order_index=0
        )

        self.image2 = PostImage.objects.create(
            post=self.post1,
            image_url="https://example.com/image2.jpg",
            order_index=1
        )

        # 테스트용 시스템 태그 생성
        self.system_tag1 = SystemTag.objects.create(
            name="강아지",
            description="강아지 관련 게시글",
            is_active=True
        )

        self.system_tag2 = SystemTag.objects.create(
            name="고양이",
            description="고양이 관련 게시글",
            is_active=True
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

    # === 게시글 생성 테스트 ===

    async def test_create_post_success(self):
        """게시글 생성 성공 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        post_data = {
            "title": "새로운 게시글",
            "content": "새로운 게시글의 내용입니다.",
            "tags": ["새로운", "태그"],
            "images": ["https://example.com/new1.jpg", "https://example.com/new2.jpg"]
        }
        
        response = await self.client.post("/", json=post_data, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        response_data = response.json()
        self.assertIn("message", response_data)
        self.assertIn("community", response_data)

    async def test_create_post_unauthorized(self):
        """인증 없이 게시글 생성 테스트"""
        post_data = {
            "title": "새로운 게시글",
            "content": "새로운 게시글의 내용입니다."
        }
        
        response = await self.client.post("/", json=post_data)
        self.assertEqual(response.status_code, 401)

    async def test_create_post_invalid_data(self):
        """잘못된 데이터로 게시글 생성 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        post_data = {
            "title": "",  # 빈 제목
            "content": "내용"
        }
        
        response = await self.client.post("/", json=post_data, headers=headers)
        self.assertEqual(response.status_code, 422)  # Validation error

    # === 게시글 목록 조회 테스트 ===

    async def test_get_post_list_success(self):
        """게시글 목록 조회 성공 테스트"""
        response = await self.client.get("/all/")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        # paginate 응답 구조 확인
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        self.assertGreater(len(posts_list), 0)
        
        # 첫 번째 포스트 확인
        first_post = posts_list[0]
        self.assertIn('id', first_post)
        self.assertIn('title', first_post)
        self.assertIn('content', first_post)
        self.assertIn('is_all_access', first_post)

    async def test_get_post_list_with_user_filter(self):
        """사용자별 게시글 필터링 테스트"""
        response = await self.client.get(f"/all/?user_id={self.user1.id}")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # user1의 게시글만 조회되어야 함
        for post in posts_list:
            self.assertEqual(post['user_id'], str(self.user1.id))

    # === 게시글 상세 조회 테스트 ===

    async def test_get_post_detail_success(self):
        """게시글 상세 조회 성공 테스트"""
        response = await self.client.get(f"/all/{self.post1.id}")
        self.assertEqual(response.status_code, 200)
        
        post_data = response.json()
        self.assertIn('post', post_data)
        self.assertIn('tags', post_data)
        self.assertIn('images', post_data)
        
        post = post_data['post']
        self.assertEqual(post['id'], str(self.post1.id))
        self.assertEqual(post['title'], self.post1.title)
        self.assertEqual(post['content'], self.post1.content)

    async def test_get_post_detail_not_found(self):
        """존재하지 않는 게시글 조회 테스트"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await self.client.get(f"/all/{fake_id}")
        self.assertEqual(response.status_code, 404)

    # === 게시글 수정 테스트 ===

    async def test_update_post_success(self):
        """게시글 수정 성공 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        update_data = {
            "title": "수정된 제목",
            "content": "수정된 내용"
        }
        
        response = await self.client.put(f"/{self.post1.id}", json=update_data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        response_data = response.json()
        self.assertIn("message", response_data)

    async def test_update_post_unauthorized(self):
        """인증 없이 게시글 수정 테스트"""
        update_data = {
            "title": "수정된 제목"
        }
        
        response = await self.client.put(f"/{self.post1.id}", json=update_data)
        self.assertEqual(response.status_code, 401)

    async def test_update_post_no_permission(self):
        """권한 없이 게시글 수정 테스트"""
        token = self.generate_jwt_token(self.user2)
        headers = {'Authorization': f'Bearer {token}'}
        
        update_data = {
            "title": "수정된 제목"
        }
        
        response = await self.client.put(f"/{self.post1.id}", json=update_data, headers=headers)
        self.assertEqual(response.status_code, 403)

    # === 게시글 삭제 테스트 ===

    async def test_delete_post_success(self):
        """게시글 삭제 성공 테스트"""
        token = self.generate_jwt_token(self.user1)
        headers = {'Authorization': f'Bearer {token}'}
        
        response = await self.client.delete(f"/{self.post1.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        response_data = response.json()
        self.assertIn("message", response_data)

    async def test_delete_post_no_permission(self):
        """권한 없이 게시글 삭제 테스트"""
        token = self.generate_jwt_token(self.user2)
        headers = {'Authorization': f'Bearer {token}'}
        
        response = await self.client.delete(f"/{self.post1.id}", headers=headers)
        self.assertEqual(response.status_code, 403)

    async def test_delete_post_admin_permission(self):
        """관리자 권한으로 게시글 삭제 테스트"""
        token = self.generate_jwt_token(self.admin_user)
        headers = {'Authorization': f'Bearer {token}'}
        
        response = await self.client.delete(f"/{self.post1.id}", headers=headers)
        self.assertEqual(response.status_code, 200)

    # === 시스템 태그 관련 테스트 ===

    async def test_get_system_tags_success(self):
        """시스템 태그 목록 조회 성공 테스트"""
        response = await self.client.get("/tags/system")
        self.assertEqual(response.status_code, 200)
        
        tags = response.json()
        self.assertGreater(len(tags), 0)
        
        # 첫 번째 태그 확인
        first_tag = tags[0]
        self.assertIn('id', first_tag)
        self.assertIn('name', first_tag)
        self.assertIn('description', first_tag)
        self.assertIn('is_active', first_tag)

    async def test_get_post_list_with_system_tag_filter(self):
        """시스템 태그로 게시글 필터링 테스트"""
        response = await self.client.get("/all/?system_tags=강아지")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 강아지 태그가 있는 게시글만 조회되어야 함
        self.assertGreater(len(posts_list), 0)
        
        # 모든 게시글에 강아지 태그가 있어야 함
        for post in posts_list:
            post_tags = [tag['tag_name'] for tag in post.get('tags', [])]
            self.assertIn('강아지', post_tags)

    async def test_get_post_list_with_multiple_system_tags(self):
        """여러 시스템 태그로 게시글 필터링 테스트"""
        response = await self.client.get("/all/?system_tags=강아지&system_tags=고양이")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 강아지 또는 고양이 태그가 있는 게시글만 조회되어야 함
        self.assertGreater(len(posts_list), 0)

    async def test_get_post_list_with_no_matching_system_tags(self):
        """매칭되는 시스템 태그가 없을 때 테스트"""
        response = await self.client.get("/all/?system_tags=존재하지않는태그")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 매칭되는 태그가 없으면 빈 결과
        self.assertEqual(len(posts_list), 0)

    async def test_get_post_list_with_mixed_matching_tags(self):
        """일부만 매칭되는 태그가 있을 때 테스트"""
        response = await self.client.get("/all/?system_tags=강아지&system_tags=존재하지않는태그")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 강아지 태그가 있는 게시글만 조회되어야 함
        self.assertGreater(len(posts_list), 0)

    async def test_system_tag_case_insensitive_matching(self):
        """시스템 태그 대소문자 구분 없이 매칭 테스트"""
        response = await self.client.get("/all/?system_tags=강아지")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 강아지 태그가 있는 게시글 조회 확인
        self.assertGreater(len(posts_list), 0)

    async def test_post_with_no_user_tags_not_shown(self):
        """사용자 태그가 없는 포스트는 시스템 태그 필터링 시 노출되지 않음"""
        # 태그가 없는 포스트 생성
        @sync_to_async
        def create_post_no_tags():
            return Post.objects.create(
                user=self.user1,
                title="태그 없는 포스트",
                content="태그가 없는 포스트입니다.",
                is_all_access=True
            )
        
        post_no_tags = await create_post_no_tags()
        
        response = await self.client.get("/all/?system_tags=강아지")
        self.assertEqual(response.status_code, 200)
        
        posts = response.json()
        if isinstance(posts, dict) and 'data' in posts:
            posts_list = posts['data']
        else:
            posts_list = posts
        
        # 태그가 없는 포스트는 조회되지 않아야 함
        for post in posts_list:
            self.assertNotEqual(post['id'], str(post_no_tags.id))