from django.test import TestCase
from user.admin_api import router
from ninja.testing import TestAsyncClient
from user.models import User
from centers.models import Center


class TestAdminAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name="테스트 센터",
            location="서울시 강남구",
            phone_number="02-1234-5678"
        )
        
        # 센터 최고관리자 생성
        self.super_admin = User.objects.create_user(
            username="super_admin",
            password="password1234!",
            email="super@example.com",
            user_type=User.UserTypeChoice.center_super_admin,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center
        )
        
        # 센터 소유자 설정
        self.center.owner = self.super_admin
        self.center.save()
        
        # 일반 사용자 생성
        self.normal_user = User.objects.create_user(
            username="normal_user",
            password="password1234!",
            email="normal@example.com",
            user_type=User.UserTypeChoice.normal,
            terms_of_service=True,
            privacy_policy_agreement=True,
            center=self.center
        )
        
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

    async def authenticate_super_admin(self):
        """센터 최고관리자로 인증"""
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.super_admin.id})
        return {
            "Authorization": f"Bearer {access_token}",
        }

    async def authenticate_center_admin(self):
        """센터 관리자로 인증"""
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.center_admin.id})
        return {
            "Authorization": f"Bearer {access_token}",
        }

    async def test_get_center_admins_success(self):
        """센터 관리자 목록 조회 성공 테스트"""
        headers = await self.authenticate_super_admin()
        response = await self.client.get("/center-admins", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    async def test_get_center_admins_unauthorized(self):
        """센터 관리자 목록 조회 실패 테스트: 권한 없음"""
        # 일반 사용자로 인증
        from user.utils import get_access_token
        access_token, _ = get_access_token({"user_id": self.normal_user.id})
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = await self.client.get("/center-admins", headers=headers)
        self.assertEqual(response.status_code, 403)

    async def test_get_center_admins_no_auth(self):
        """센터 관리자 목록 조회 실패 테스트: 인증 없음"""
        response = await self.client.get("/center-admins")
        self.assertEqual(response.status_code, 401)

    async def test_create_center_admin_success(self):
        """센터 관리자 생성 성공 테스트"""
        headers = await self.authenticate_super_admin()
        data = {
            "username": "new_admin",
            "password": "password1234!",
            "email": "newadmin@example.com",
            "nickname": "새관리자",
            "user_type": "센터관리자",
            "phone_number": "010-1234-5678"
        }
        response = await self.client.post("/center-admin", json=data, headers=headers)
        self.assertEqual(response.status_code, 200)

    async def test_create_center_admin_duplicate_username(self):
        """센터 관리자 생성 실패 테스트: 중복 사용자명"""
        headers = await self.authenticate_super_admin()
        data = {
            "username": "normal_user",  # 이미 존재하는 사용자명
            "password": "password1234!",
            "email": "duplicate@example.com",
            "nickname": "중복사용자",
            "user_type": "센터관리자",
            "phone_number": "010-9876-5432"
        }
        response = await self.client.post("/center-admin", json=data, headers=headers)
        self.assertEqual(response.status_code, 400)

    async def test_create_center_admin_invalid_data(self):
        """센터 관리자 생성 실패 테스트: 잘못된 데이터"""
        headers = await self.authenticate_super_admin()
        data = {
            "username": "",  # 빈 사용자명
            "password": "password1234!",
            "email": "invalid-email",  # 잘못된 이메일
        }
        response = await self.client.post("/center-admin", json=data, headers=headers)
        self.assertEqual(response.status_code, 400)

    async def test_update_center_admin_success(self):
        """센터 관리자 수정 성공 테스트"""
        headers = await self.authenticate_super_admin()
        data = {
            "nickname": "수정된닉네임",
            "phone_number": "010-9999-8888"
        }
        response = await self.client.put(
            f"/center-admin/{self.normal_user.id}", 
            json=data, 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

    async def test_update_center_admin_not_found(self):
        """센터 관리자 수정 실패 테스트: 존재하지 않는 사용자"""
        headers = await self.authenticate_super_admin()
        data = {
            "nickname": "수정된닉네임",
        }
        response = await self.client.put(
            "/center-admin/00000000-0000-4000-8000-000000000000", 
            json=data, 
            headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_delete_center_admin_success(self):
        """센터 관리자 삭제 성공 테스트"""
        headers = await self.authenticate_super_admin()
        response = await self.client.delete(
            f"/center-admin/{self.normal_user.id}", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

    async def test_delete_center_admin_not_found(self):
        """센터 관리자 삭제 실패 테스트: 존재하지 않는 사용자"""
        headers = await self.authenticate_super_admin()
        response = await self.client.delete(
            "/center-admin/00000000-0000-4000-8000-000000000000", 
            headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_change_center_admin_role_success(self):
        """센터 관리자 역할 변경 성공 테스트"""
        headers = await self.authenticate_super_admin()
        data = {
            "user_type": "훈련사"
        }
        response = await self.client.patch(
            f"/center-admin/{self.normal_user.id}/change-role", 
            json=data, 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

    async def test_change_center_admin_role_invalid_type(self):
        """센터 관리자 역할 변경 실패 테스트: 잘못된 역할"""
        headers = await self.authenticate_super_admin()
        data = {
            "user_type": "존재하지않는역할"
        }
        response = await self.client.patch(
            f"/center-admin/{self.normal_user.id}/change-role", 
            json=data, 
            headers=headers
        )
        self.assertEqual(response.status_code, 400)

    async def test_self_management_prevention(self):
        """자기 자신 관리 방지 테스트"""
        headers = await self.authenticate_super_admin()
        
        # 자기 자신 삭제 시도
        response = await self.client.delete(
            f"/center-admin/{self.super_admin.id}", 
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        
        # 자기 자신 역할 변경 시도
        data = {"user_type": "일반사용자"}
        response = await self.client.patch(
            f"/center-admin/{self.super_admin.id}/change-role", 
            json=data, 
            headers=headers
        )
        self.assertEqual(response.status_code, 400)

    async def test_center_admin_permission_denied(self):
        """센터 관리자 권한 부족 테스트"""
        headers = await self.authenticate_center_admin()
        
        # 센터 관리자가 다른 사용자 생성 시도
        data = {
            "username": "test_user",
            "password": "password1234!",
            "email": "test@example.com",
        }
        response = await self.client.post("/center-admin", json=data, headers=headers)
        self.assertEqual(response.status_code, 403)
