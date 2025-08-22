import json
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja.testing import TestClient

from banners.models import Banner
from banners.api import router

User = get_user_model()


class TestBannerAPI(TestCase):
    """Banner API 테스트 - 목록 조회만"""

    def setUp(self):
        """테스트 데이터 설정"""
        # 테스트용 배너 생성
        self.banner1 = Banner.objects.create(
            type="main",
            title="메인 배너 1",
            description="메인 배너 설명 1",
            alt="메인 배너 1 이미지",
            image_url="https://example.com/banner1.jpg",
            order_index=10,
            is_active=True,
            link_url="https://example.com/link1"
        )
        
        self.banner2 = Banner.objects.create(
            type="sub",
            title="서브 배너 1",
            description="서브 배너 설명 1",
            alt="서브 배너 1 이미지",
            image_url="https://example.com/banner2.jpg",
            order_index=20,
            is_active=True,
            link_url="https://example.com/link2"
        )
        
        # 비활성화된 배너
        self.inactive_banner = Banner.objects.create(
            type="main",
            title="비활성화 배너",
            alt="비활성화 배너 이미지",
            image_url="https://example.com/banner3.jpg",
            order_index=30,
            is_active=False
        )
        
        self.client = TestClient(router)

    def test_get_banners_success(self):
        """배너 목록 조회 성공 테스트 (페이지네이션 적용)"""
        response = self.client.get("/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 커스텀 페이지네이션 응답 구조 확인
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("curPage", data)
        
        # 활성화된 배너만 조회되는지 확인
        banners = data["data"]
        self.assertEqual(len(banners), 2)  # 활성화된 배너만
        self.assertEqual(data["totalCnt"], 2)
        
        # 첫 번째 배너 검증
        banner = banners[0]
        self.assertIn("id", banner)
        self.assertIn("type", banner)
        self.assertIn("title", banner)
        self.assertIn("image_url", banner)
        self.assertTrue(banner["is_active"])

    def test_get_banners_with_type_filter(self):
        """배너 목록 조회 - 타입 필터링 테스트"""
        response = self.client.get("/?type=main")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["totalCnt"], 1)
        self.assertEqual(data["data"][0]["type"], "main")

    def test_get_banners_with_pagination(self):
        """배너 목록 조회 - 페이지네이션 테스트"""
        response = self.client.get("/?page=1&page_size=1")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["count"], 1)  # 현재 페이지 아이템 수
        self.assertEqual(len(data["data"]), 1)  # 현재 페이지 아이템들
        self.assertEqual(data["curPage"], 1)  # 현재 페이지 번호

    def test_get_banners_inactive_not_included(self):
        """비활성화된 배너는 목록에 포함되지 않는지 테스트"""
        response = self.client.get("/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        banners = data["data"]
        inactive_banner_ids = [str(self.inactive_banner.id)]
        
        # 비활성화된 배너가 목록에 없는지 확인
        for banner in banners:
            self.assertNotIn(banner["id"], inactive_banner_ids)

    def test_banner_ordering(self):
        """배너 순서 정렬 테스트"""
        response = self.client.get("/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        banners = data["data"]
        
        # order_index 순서대로 정렬되어 있는지 확인
        for i in range(len(banners) - 1):
            current_order = banners[i]["order_index"]
            next_order = banners[i + 1]["order_index"]
            self.assertLessEqual(current_order, next_order)
