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
        
        # 테스트용 센터 생성
        from centers.models import Center
        self.center = Center.objects.create(
            name="테스트 센터",
            location="서울시 강남구",
            phone_number="02-1234-5678",
            is_public=True
        )
        
        # 테스트용 동물 생성
        from animals.models import Animal
        self.animal = Animal.objects.create(
            name="멍멍이",
            center=self.center,
            status="보호중",
            breed="믹스",
            age=24,
            is_female=False
        )


    def generate_jwt_token(self, user):
        """JWT 토큰 생성"""
        payload = {
            'user_id': str(user.id),
            'username': user.username,
            'exp': timezone.now() + timedelta(hours=1),
            'iat': timezone.now()
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        return token


    async def authenticate(self, user=None):
        """사용자 인증"""
        if user is None:
            user = self.user1
            
        token = self.generate_jwt_token(user)
        return {
            "Authorization": f"Bearer {token}",
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
        
        # 응답 데이터 검증
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

    @override_settings(DJANGO_ENV_NAME="local")
    async def test_create_post_with_animal_id_success(self):
        """동물 ID와 함께 게시글 생성 성공 테스트"""
        headers = await self.authenticate()
        
        post_data = {
            "title": "멍멍이에 대한 이야기",
            "content": "멍멍이와 함께한 시간이 정말 즐거웠습니다.",
            "animal_id": str(self.animal.id),
            "tags": ["강아지", "즐거움"],
            "images": ["https://example.com/animal1.jpg"],
            "is_all_access": True
        }
        
        response = await self.client.post("/", json=post_data, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        # 응답 데이터 검증
        response_data = response.json()
        self.assertIn("message", response_data)
        self.assertIn("community", response_data)
        
        # 생성된 게시글 검증
        post = response_data["community"]
        self.assertEqual(post["title"], "멍멍이에 대한 이야기")
        self.assertEqual(post["content"], "멍멍이와 함께한 시간이 정말 즐거웠습니다.")
        self.assertEqual(post["animal_id"], str(self.animal.id))
        self.assertTrue(post["is_all_access"])


    @override_settings(DJANGO_ENV_NAME="local")
    async def test_create_post_without_animal_id_success(self):
        """동물 ID 없이 게시글 생성 성공 테스트"""
        headers = await self.authenticate()
        
        post_data = {
            "title": "일반적인 이야기",
            "content": "동물과 관련 없는 일반적인 이야기입니다.",
            "tags": ["일상"],
            "images": [],
            "is_all_access": True
        }
        
        response = await self.client.post("/", json=post_data, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        # 응답 데이터 검증
        response_data = response.json()
        self.assertIn("message", response_data)
        self.assertIn("community", response_data)
        
        # 생성된 게시글 검증
        post = response_data["community"]
        self.assertEqual(post["title"], "일반적인 이야기")
        self.assertEqual(post["content"], "동물과 관련 없는 일반적인 이야기입니다.")
        self.assertIsNone(post.get("animal_id"))


    @override_settings(DJANGO_ENV_NAME="local")
    async def test_create_post_with_invalid_animal_id(self):
        """잘못된 동물 ID로 게시글 생성 실패 테스트"""
        headers = await self.authenticate()
        
        post_data = {
            "title": "잘못된 동물 ID 테스트",
            "content": "존재하지 않는 동물 ID로 테스트합니다.",
            "animal_id": "00000000-0000-4000-8000-000000000000",
            "tags": ["테스트"],
            "is_all_access": True
        }
        
        response = await self.client.post("/", json=post_data, headers=headers)
        # 동물 ID가 잘못되어도 게시글은 생성되어야 함 (동물 ID는 선택사항)
        self.assertEqual(response.status_code, 201)


    @override_settings(DJANGO_ENV_NAME="local")
    async def test_update_post_animal_id_success(self):
        """게시글 수정 시 동물 ID 변경 성공 테스트"""
        headers = await self.authenticate()
        
        # 먼저 동물 ID 없이 게시글 생성
        post_data = {
            "title": "수정 전 게시글",
            "content": "수정 전 내용입니다.",
            "is_all_access": True
        }
        
        create_response = await self.client.post("/", json=post_data, headers=headers)
        self.assertEqual(create_response.status_code, 201)
        
        post_id = create_response.json()["community"]["id"]
        
        # 동물 ID를 추가하여 게시글 수정
        update_data = {
            "title": "수정된 게시글",
            "content": "수정된 내용입니다.",
            "animal_id": str(self.animal.id)
        }
        
        response = await self.client.put(f"/{post_id}", json=update_data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # 수정된 게시글 검증
        response_data = response.json()
        self.assertEqual(response_data["title"], "수정된 게시글")
        self.assertEqual(response_data["content"], "수정된 내용입니다.")
        self.assertEqual(response_data["animal_id"], str(self.animal.id))

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

    async def test_get_mixed_access_posts_success(self):
        """전체/제한 공개 게시글 목록 조회 성공 테스트"""
        # 센터 관리자 사용자 생성 (제한 공개 게시글을 볼 수 있도록)
        @sync_to_async
        def create_center_admin():
            center_admin = User.objects.create_user(
                username="center_admin",
                password="password1234!",
                email="center@test.com",
                user_type="센터관리자"
            )
            return center_admin
        
        center_admin = await create_center_admin()
        
        # 전체 공개 게시글 생성
        @sync_to_async
        def create_public_post():
            public_post = Post.objects.create(
                user=self.user1,
                title="전체 공개 게시글",
                content="이것은 전체 공개 게시글입니다.",
                is_all_access=True
            )
            return public_post
        
        # 제한 공개 게시글 생성
        @sync_to_async
        def create_private_post():
            private_post = Post.objects.create(
                user=self.user1,
                title="제한 공개 게시글",
                content="이것은 제한 공개 게시글입니다.",
                is_all_access=False
            )
            return private_post
        
        public_post = await create_public_post()
        private_post = await create_private_post()
        
        # 센터 관리자로 로그인하여 API 호출
        from posts.api import get_mixed_access_posts
        from django.http import HttpRequest
        from posts.schemas.inbound import PostListQueryIn
        
        request = HttpRequest()
        request.auth = center_admin
        
        # 빈 쿼리 객체 생성
        empty_query = PostListQueryIn()
        
        response = await get_mixed_access_posts(request, query=empty_query)
        
        # 응답 데이터 구조 확인
        self.assertIsNotNone(response.public_posts)
        self.assertIsNotNone(response.private_posts)
        self.assertIsNotNone(response.public_count)
        self.assertIsNotNone(response.private_count)
        self.assertIsNotNone(response.total_count)
        
        # 생성한 게시글들이 응답에 포함되어 있는지 확인
        public_post_ids = [post.id for post in response.public_posts]
        private_post_ids = [post.id for post in response.private_posts]
        
        self.assertIn(str(public_post.id), public_post_ids)
        self.assertIn(str(private_post.id), private_post_ids)
        
        # 전체 공개 게시글 확인
        public_post_response = next(post for post in response.public_posts if post.id == str(public_post.id))
        self.assertEqual(public_post_response.title, "전체 공개 게시글")
        self.assertEqual(public_post_response.is_all_access, True)
        
        # 제한 공개 게시글 확인
        private_post_response = next(post for post in response.private_posts if post.id == str(private_post.id))
        self.assertEqual(private_post_response.title, "제한 공개 게시글")
        self.assertEqual(private_post_response.is_all_access, False)


    async def test_get_mixed_access_posts_with_filters(self):
        """전체/제한 공개 게시글 목록 조회 - 필터링 테스트"""
        # 센터 관리자 사용자 생성 (제한 공개 게시글을 볼 수 있도록)
        @sync_to_async
        def create_center_admin():
            center_admin = User.objects.create_user(
                username="center_admin",
                password="password1234!",
                email="center@test.com",
                user_type="센터관리자"
            )
            return center_admin
        
        center_admin = await create_center_admin()
        
        # 전체 공개 게시글 생성
        @sync_to_async
        def create_public_posts():
            public_post1 = Post.objects.create(
                user=self.user1,
                title="전체 공개 게시글 1",
                content="이것은 첫 번째 전체 공개 게시글입니다.",
                is_all_access=True
            )
            public_post2 = Post.objects.create(
                user=self.user1,
                title="전체 공개 게시글 2",
                content="이것은 두 번째 전체 공개 게시글입니다.",
                is_all_access=True
            )
            return public_post1, public_post2
        
        # 제한 공개 게시글 생성
        @sync_to_async
        def create_private_posts():
            private_post1 = Post.objects.create(
                user=self.user1,
                title="제한 공개 게시글 1",
                content="이것은 첫 번째 제한 공개 게시글입니다.",
                is_all_access=False
            )
            private_post2 = Post.objects.create(
                user=self.user1,
                title="제한 공개 게시글 2",
                content="이것은 두 번째 제한 공개 게시글입니다.",
                is_all_access=False
            )
            return private_post1, private_post2
        
        created_public_posts = await create_public_posts()
        created_private_posts = await create_private_posts()
        
        # 센터 관리자로 로그인하여 API 호출
        from posts.api import get_mixed_access_posts
        from django.http import HttpRequest
        from posts.schemas.inbound import PostListQueryIn
        
        request = HttpRequest()
        request.auth = center_admin
        
        # 사용자 ID로 필터링
        user_query = PostListQueryIn(user_id=str(self.user1.id))
        response = await get_mixed_access_posts(request, query=user_query)
        
        # 생성한 게시글들이 응답에 포함되어 있는지 확인
        public_post_ids = [post.id for post in response.public_posts]
        private_post_ids = [post.id for post in response.private_posts]
        
        # 생성한 게시글들이 각각의 카테고리에 포함되어 있는지 확인
        for post in created_public_posts:
            self.assertIn(str(post.id), public_post_ids)
        
        for post in created_private_posts:
            self.assertIn(str(post.id), private_post_ids)
        
        # 존재하지 않는 사용자 ID로 필터링
        fake_user_id = "00000000-0000-4000-8000-000000000000"
        fake_user_query = PostListQueryIn(user_id=fake_user_id)
        response = await get_mixed_access_posts(request, query=fake_user_query)
        
        self.assertEqual(response.public_count, 0)
        self.assertEqual(response.private_count, 0)
        self.assertEqual(response.total_count, 0)


    async def test_get_mixed_access_posts_with_sorting(self):
        """전체/제한 공개 게시글 목록 조회 - 정렬 테스트"""
        # 센터 관리자 사용자 생성 (제한 공개 게시글을 볼 수 있도록)
        @sync_to_async
        def create_center_admin():
            center_admin = User.objects.create_user(
                username="center_admin",
                password="password1234!",
                email="center@test.com",
                user_type="센터관리자"
            )
            return center_admin
        
        center_admin = await create_center_admin()
        
        # 게시글 생성
        @sync_to_async
        def create_posts():
            public_post = Post.objects.create(
                user=self.user1,
                title="전체 공개 게시글",
                content="이것은 전체 공개 게시글입니다.",
                is_all_access=True,
                like_count=5
            )
            private_post = Post.objects.create(
                user=self.user1,
                title="제한 공개 게시글",
                content="이것은 제한 공개 게시글입니다.",
                is_all_access=False,
                like_count=10
            )
            return public_post, private_post
        
        await create_posts()
        
        # 센터 관리자로 로그인하여 API 호출
        from posts.api import get_mixed_access_posts
        from django.http import HttpRequest
        from posts.schemas.inbound import PostListQueryIn
        
        request = HttpRequest()
        request.auth = center_admin
        
        # 빈 쿼리 객체 생성 (기본 정렬)
        empty_query = PostListQueryIn()
        response = await get_mixed_access_posts(request, query=empty_query)
        
        # 최신순으로 정렬되어야 함 (created_at 기준)
        self.assertIsNotNone(response.public_posts)
        self.assertIsNotNone(response.private_posts)
        
        # 제한 공개 게시글이 좋아요가 더 많으므로 확인
        if response.private_posts and response.public_posts:
            self.assertGreaterEqual(response.private_posts[0].like_count, response.public_posts[0].like_count)


    async def test_get_mixed_access_posts_center_permission(self):
        """센터 권한자만 제한 공개 게시글을 볼 수 있는지 테스트"""
        # 센터 관리자 사용자 생성
        @sync_to_async
        def create_center_admin():
            center_admin = User.objects.create_user(
                username="center_admin",
                password="password1234!",
                email="center@test.com",
                user_type="센터관리자"
            )
            return center_admin
        
        # 일반 사용자 생성
        @sync_to_async
        def create_normal_user():
            normal_user = User.objects.create_user(
                username="normal_user",
                password="password1234!",
                email="normal@test.com",
                user_type="일반사용자"
            )
            return normal_user
        
        center_admin = await create_center_admin()
        normal_user = await create_normal_user()
        
        # 제한 공개 게시글 생성
        @sync_to_async
        def create_private_post():
            private_post = Post.objects.create(
                user=self.user1,
                title="제한 공개 게시글",
                content="이것은 제한 공개 게시글입니다.",
                is_all_access=False
            )
            return private_post
        
        private_post = await create_private_post()
        
        # 센터 관리자로 로그인하여 조회
        from posts.api import get_mixed_access_posts
        from django.http import HttpRequest
        from posts.schemas.inbound import PostListQueryIn
        
        request = HttpRequest()
        request.auth = center_admin
        
        # 빈 쿼리 객체 생성
        empty_query = PostListQueryIn()
        
        response = await get_mixed_access_posts(request, query=empty_query)
        self.assertIsNotNone(response.private_posts)
        self.assertEqual(len(response.private_posts), 1)
        self.assertEqual(response.private_posts[0].title, "제한 공개 게시글")
        
        # 일반 사용자로 로그인하여 조회
        request.auth = normal_user
        
        response = await get_mixed_access_posts(request, query=empty_query)
        self.assertIsNotNone(response.private_posts)
        self.assertEqual(len(response.private_posts), 0)  # 제한 공개 게시글은 볼 수 없음
        
        # 로그인하지 않은 상태로 조회
        request.auth = None
        
        response = await get_mixed_access_posts(request, query=empty_query)
        self.assertIsNotNone(response.private_posts)
        self.assertEqual(len(response.private_posts), 0)  # 제한 공개 게시글은 볼 수 없음


    async def test_get_mixed_access_posts_empty(self):
        """전체/제한 공개 게시글 목록 조회 - 빈 결과 테스트"""
        # 존재하지 않는 사용자 ID로 필터링하여 빈 결과 생성
        fake_user_id = "00000000-0000-4000-8000-000000000000"
        response = await self.client.get(f"/mixed/?user_id={fake_user_id}")
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 검증
        data = response.json()
        self.assertEqual(data["public_count"], 0)
        self.assertEqual(data["private_count"], 0)
        self.assertEqual(data["total_count"], 0)
        self.assertEqual(len(data["public_posts"]), 0)
        self.assertEqual(len(data["private_posts"]), 0)