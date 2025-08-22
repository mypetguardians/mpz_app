import uuid
import jwt
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from ninja.testing import TestAsyncClient

from posts.models import Post, PostTag, PostImage
from comments.models import Comment, Reply


User = get_user_model()


class TestPostsAPI(TestCase):
    """Posts API 테스트 클래스"""

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
        
        # 테스트 태그 생성
        self.tag1 = PostTag.objects.create(
            post=self.post1,
            tag_name="테스트태그1"
        )
        
        self.tag2 = PostTag.objects.create(
            post=self.post1,
            tag_name="테스트태그2"
        )
        
        # 테스트 이미지 생성
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
        
        # 테스트 클라이언트 설정
        from posts.api import router
        self.client = TestAsyncClient(router)

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
        headers = self.authenticate(self.user1)
        data = {
            "title": "새로운 게시글",
            "content": "새로운 게시글 내용입니다.",
            "tags": ["태그1", "태그2"],
            "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
        }
        
        response = await self.client.post("/", json=data, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "게시글이 생성되었습니다.")
        self.assertEqual(data_response["community"]["title"], "새로운 게시글")
        self.assertEqual(data_response["community"]["content"], "새로운 게시글 내용입니다.")

    async def test_create_post_unauthorized(self):
        """인증 없이 게시글 생성 테스트"""
        data = {
            "title": "새로운 게시글",
            "content": "새로운 게시글 내용입니다."
        }
        
        response = await self.client.post("/", json=data)
        self.assertEqual(response.status_code, 401)

    async def test_create_post_invalid_data(self):
        """잘못된 데이터로 게시글 생성 테스트"""
        headers = self.authenticate(self.user1)
        data = {
            "title": "",  # 빈 제목
            "content": "내용"
        }
        
        response = await self.client.post("/", json=data, headers=headers)
        self.assertEqual(response.status_code, 422)  # Validation error

    # === 게시글 목록 조회 테스트 ===

    async def test_get_post_list_success(self):
        """게시글 목록 조회 성공 테스트"""
        response = await self.client.get("/")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("posts", data)
        self.assertEqual(len(data["posts"]), 2)
        
        # 최신순 정렬 확인
        post1 = data["posts"][0]
        post2 = data["posts"][1]
        self.assertEqual(post1["title"], "테스트 게시글 2")  # 더 최근
        self.assertEqual(post2["title"], "테스트 게시글 1")

    async def test_get_post_list_with_user_filter(self):
        """사용자별 게시글 필터링 테스트"""
        response = await self.client.get(f"/?user_id={self.user1.id}")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["posts"]), 1)
        self.assertEqual(data["posts"][0]["user_id"], str(self.user1.id))

    # === 게시글 상세 조회 테스트 ===

    async def test_get_post_detail_success(self):
        """게시글 상세 조회 성공 테스트"""
        response = await self.client.get(f"/{self.post1.id}")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("post", data)
        self.assertIn("tags", data)
        self.assertIn("images", data)
        
        post = data["post"]
        self.assertEqual(post["title"], "테스트 게시글 1")
        self.assertEqual(post["content"], "테스트 내용 1")
        self.assertEqual(len(data["tags"]), 2)
        self.assertEqual(len(data["images"]), 2)

    async def test_get_post_detail_not_found(self):
        """존재하지 않는 게시글 조회 테스트"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await self.client.get(f"/{fake_id}")
        self.assertEqual(response.status_code, 404)

    # === 게시글 수정 테스트 ===

    async def test_update_post_success(self):
        """게시글 수정 성공 테스트"""
        headers = self.authenticate(self.user1)
        data = {
            "title": "수정된 제목",
            "content": "수정된 내용"
        }
        
        response = await self.client.put(f"/{self.post1.id}", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "게시글이 수정되었습니다")

    async def test_update_post_unauthorized(self):
        """인증 없이 게시글 수정 테스트"""
        data = {"title": "수정된 제목"}
        response = await self.client.put(f"/{self.post1.id}", json=data)
        self.assertEqual(response.status_code, 401)

    async def test_update_post_no_permission(self):
        """권한 없이 게시글 수정 테스트"""
        headers = self.authenticate(self.user2)
        data = {"title": "수정된 제목"}
        
        response = await self.client.put(f"/{self.post1.id}", json=data, headers=headers)
        self.assertEqual(response.status_code, 403)

    # === 게시글 삭제 테스트 ===

    async def test_delete_post_success(self):
        """게시글 삭제 성공 테스트"""
        headers = self.authenticate(self.user1)
        
        response = await self.client.delete(f"/{self.post1.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "게시글이 삭제되었습니다")

    async def test_delete_post_admin_permission(self):
        """관리자 권한으로 게시글 삭제 테스트"""
        headers = self.authenticate(self.admin_user)
        
        response = await self.client.delete(f"/{self.post2.id}", headers=headers)
        self.assertEqual(response.status_code, 200)

    async def test_delete_post_no_permission(self):
        """권한 없이 게시글 삭제 테스트"""
        headers = self.authenticate(self.user2)
        
        response = await self.client.delete(f"/{self.post1.id}", headers=headers)
        self.assertEqual(response.status_code, 403)

    # === 댓글 생성 테스트 ===

    async def test_create_comment_success(self):
        """댓글 생성 성공 테스트"""
        headers = self.authenticate(self.user2)
        data = {"content": "새로운 댓글입니다."}
        
        response = await self.client.post(f"/{self.post1.id}/comments", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "댓글이 작성되었습니다")
        self.assertIn("comment_id", data_response)

    async def test_create_comment_unauthorized(self):
        """인증 없이 댓글 생성 테스트"""
        data = {"content": "새로운 댓글입니다."}
        response = await self.client.post(f"/{self.post1.id}/comments", json=data)
        self.assertEqual(response.status_code, 401)

    # === 댓글 목록 조회 테스트 ===

    async def test_get_comments_success(self):
        """댓글 목록 조회 성공 테스트"""
        response = await self.client.get(f"/{self.post1.id}/comments")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("comments", data)
        self.assertEqual(len(data["comments"]), 2)

    async def test_get_comments_post_not_found(self):
        """존재하지 않는 게시글의 댓글 조회 테스트"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await self.client.get(f"/{fake_id}/comments")
        self.assertEqual(response.status_code, 404)

    # === 댓글 수정 테스트 ===

    async def test_update_comment_success(self):
        """댓글 수정 성공 테스트"""
        headers = self.authenticate(self.user2)
        data = {"content": "수정된 댓글입니다."}
        
        response = await self.client.put(f"/comments/{self.comment1.id}", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "댓글이 수정되었습니다")

    async def test_update_comment_no_permission(self):
        """권한 없이 댓글 수정 테스트"""
        headers = self.authenticate(self.user1)
        data = {"content": "수정된 댓글입니다."}
        
        response = await self.client.put(f"/comments/{self.comment1.id}", json=data, headers=headers)
        self.assertEqual(response.status_code, 403)

    # === 댓글 삭제 테스트 ===

    async def test_delete_comment_success(self):
        """댓글 삭제 성공 테스트"""
        headers = self.authenticate(self.user2)
        
        response = await self.client.delete(f"/comments/{self.comment1.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "댓글이 삭제되었습니다")

    async def test_delete_comment_admin_permission(self):
        """관리자 권한으로 댓글 삭제 테스트"""
        headers = self.authenticate(self.admin_user)
        
        response = await self.client.delete(f"/comments/{self.comment2.id}", headers=headers)
        self.assertEqual(response.status_code, 200)

    # === 대댓글 생성 테스트 ===

    async def test_create_reply_success(self):
        """대댓글 생성 성공 테스트"""
        headers = self.authenticate(self.user1)
        data = {"content": "새로운 대댓글입니다."}
        
        response = await self.client.post(f"/comments/{self.comment1.id}/replies", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "대댓글이 작성되었습니다")
        self.assertIn("reply_id", data_response)

    # === 대댓글 수정 테스트 ===

    async def test_update_reply_success(self):
        """대댓글 수정 성공 테스트"""
        headers = self.authenticate(self.user1)
        data = {"content": "수정된 대댓글입니다."}
        
        response = await self.client.put(f"/replies/{self.reply1.id}", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "대댓글이 수정되었습니다")

    # === 대댓글 삭제 테스트 ===

    async def test_delete_reply_success(self):
        """대댓글 삭제 성공 테스트"""
        headers = self.authenticate(self.user1)
        
        response = await self.client.delete(f"/replies/{self.reply1.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data_response = response.json()
        self.assertEqual(data_response["message"], "대댓글이 삭제되었습니다")
