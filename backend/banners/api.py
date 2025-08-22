from ninja import Router, Query
from ninja.errors import HttpError
from typing import List
from django.http import HttpRequest
from ninja.pagination import paginate
from banners.models import Banner
from banners.schemas.inbound import BannerListQueryIn
from banners.schemas.outbound import BannerOut

router = Router(tags=["Banners"])


@router.get(
    "",
    summary="배너 목록 조회",
    description="활성화된 배너 목록을 조회합니다. 타입별 필터링 및 페이지네이션을 지원합니다.",
    response={
        200: List[BannerOut],
        500: dict,
    }
)
@paginate
def get_banners(request: HttpRequest, filters: Query[BannerListQueryIn]):
    """배너 목록 조회 API (페이지네이션 적용)"""
    try:
        queryset = Banner.objects.filter(is_active=True)
        
        # 타입 필터링
        if filters.type:
            queryset = queryset.filter(type=filters.type)
        
        # 순서대로 정렬 (order_index 오름차순, 생성일 내림차순)
        queryset = queryset.order_by('order_index', '-created_at')
        
        # UUID와 datetime 필드를 적절한 형식으로 변환
        banners_list = []
        for banner in queryset:
            banners_list.append({
                "id": str(banner.id),
                "type": banner.type,
                "title": banner.title,
                "description": banner.description,
                "alt": banner.alt,
                "image_url": banner.image_url,
                "order_index": banner.order_index,
                "is_active": banner.is_active,
                "link_url": banner.link_url,
                "created_at": banner.created_at.isoformat(),
                "updated_at": banner.updated_at.isoformat(),
            })
        
        return banners_list
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"배너 목록 조회 오류: {str(e)}")
        raise HttpError(500, "배너 목록 조회 중 오류가 발생했습니다")


# 배너는 목록 조회만 필요 - CRUD는 Django Admin에서 관리
# Django Admin에서 배너 생성, 수정, 삭제, 순서 변경 등을 편리하게 처리