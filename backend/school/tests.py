from django.contrib.auth import get_user_model
from django.test import TestCase

from school.models import UserSchoolProfile

User = get_user_model()


class UserSchoolProfileModelTest(TestCase):
    """UserSchoolProfile 모델 기본 동작 검증."""

    def setUp(self):
        self.user = User.objects.create(
            username='kakao_test_user',
            kakao_id='9999999',
            email='test@example.com',
            nickname='테스트',
            is_phone_verified=False,
        )

    def test_default_role_is_user(self):
        profile = UserSchoolProfile.objects.create(user=self.user)
        self.assertEqual(profile.role, 'user')
        self.assertIsNone(profile.avatar_url)

    def test_one_to_one_constraint(self):
        UserSchoolProfile.objects.create(user=self.user)
        with self.assertRaises(Exception):
            UserSchoolProfile.objects.create(user=self.user, role='admin')

    def test_user_cascade_delete(self):
        profile = UserSchoolProfile.objects.create(user=self.user)
        profile_id = profile.id
        self.user.delete()
        self.assertFalse(UserSchoolProfile.objects.filter(id=profile_id).exists())

    def test_table_name(self):
        self.assertEqual(UserSchoolProfile._meta.db_table, 'user_school_profile')


class GetOrCreateKakaoUserHookTest(TestCase):
    """카카오 콜백에서 UserSchoolProfile이 자동 생성되는지 검증."""

    async def test_creates_school_profile_for_new_user(self):
        from user.kakao_api import get_or_create_kakao_user

        profile = {
            'id': 'kakao_new_888',
            'email': 'new888@kakao.com',
            'name': '신규',
            'image': '',
        }
        user, created = await get_or_create_kakao_user(profile)
        self.assertTrue(created)

        school_profile = await UserSchoolProfile.objects.aget(user=user)
        self.assertEqual(school_profile.role, 'user')

    async def test_idempotent_for_existing_user(self):
        from user.kakao_api import get_or_create_kakao_user

        profile = {
            'id': 'kakao_existing_777',
            'email': 'exist777@kakao.com',
            'name': '기존',
            'image': '',
        }
        await get_or_create_kakao_user(profile)
        await get_or_create_kakao_user(profile)

        count = await UserSchoolProfile.objects.filter(
            user__kakao_id=profile['id']
        ).acount()
        self.assertEqual(count, 1)
