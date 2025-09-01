from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from typing import List
from centers.models import Center
from centers.schemas.inbound import (
    CenterListQueryIn,
    CenterSubscriptionUpdateIn,
)
from centers.schemas.outbound import (
    CenterOut,
    ErrorOut,
    CenterNoticeListOut,
    CenterNoticeOut,
    CenterSubscriptionOut,
)

router = Router(tags=["Centers"])

def _build_center_response(center, show_private_location=False):
    """센터 응답 데이터를 구성합니다."""
    return CenterOut(
        id=str(center.id),
        user_id=str(center.owner.id) if center.owner else None,
        name=center.name,
        center_number=center.center_number,
        description=center.description,
        location=center.location if (show_private_location or center.is_public) else None,
        region=center.region,
        phone_number=center.phone_number,
        adoption_procedure=center.adoption_procedure,
        adoption_guidelines=center.adoption_guidelines,
        has_monitoring=center.has_monitoring,
        monitoring_period_months=center.monitoring_period_months,
        monitoring_interval_days=center.monitoring_interval_days,
        monitoring_description=center.monitoring_description,
        verified=center.verified,
        is_public=center.is_public,
        adoption_price=center.adoption_price,
        image_url=center.image_url,
        is_subscribed=center.is_subscribed,
        created_at=center.created_at.isoformat(),
        updated_at=center.updated_at.isoformat(),
    )

@router.get(
    "/",
    summary="[R] 센터 목록 조회",
    description="지역별 센터 목록을 조회합니다.",
    response={
        200: List[CenterOut],
        500: ErrorOut,
    },
)
@paginate
async def get_centers(request: HttpRequest, filters: CenterListQueryIn = Query(CenterListQueryIn())):
    """센터 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_centers_list():
            # 기본 쿼리셋 (공개된 센터만)
            queryset = Center.objects.filter(is_public=True).select_related('owner')
            
            # 지역별 필터링
            if filters.location:
                queryset = queryset.filter(location__icontains=filters.location)
            
            # 지역별 필터링
            if filters.region:
                queryset = queryset.filter(region__icontains=filters.region)
            
            # 최신순 정렬
            queryset = queryset.order_by('-created_at')
            
            # 응답 데이터 변환 (주소 공개 여부에 따라 조건부 노출)
            centers_response = [
                _build_center_response(center, show_private_location=False)
                for center in queryset
            ]
            
            return centers_response
        
        return await get_centers_list()
        
    except Exception as e:
        raise HttpError(500, f"센터 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{center_id}",
    summary="[R] 센터 상세 조회",
    description="특정 센터의 상세 정보를 조회합니다.",
    response={
        200: CenterOut,
        404: ErrorOut,
        500: ErrorOut,
    },
)
async def get_center_by_id(request: HttpRequest, center_id: str):
    """센터 상세 정보를 조회합니다."""
    try:
        @sync_to_async
        def get_center_detail():
            try:
                center = Center.objects.select_related('owner').get(id=center_id)
            except Center.DoesNotExist:
                raise HttpError(404, "보호소를 찾을 수 없습니다")
            
            # 응답 데이터 변환 (주소 공개 여부에 따라 조건부 노출)
            return _build_center_response(center, show_private_location=False)
        
        return await get_center_detail()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"보호소 정보 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{center_id}/notices",
    summary="[R] 센터 공지사항 조회",
    description="특정 센터의 공지사항 목록을 조회합니다.",
    response={
        200: CenterNoticeListOut,
        404: ErrorOut,
        500: ErrorOut,
    },
)
async def get_center_notices(request: HttpRequest, center_id: str):
    """센터 공지사항을 조회합니다."""
    try:
        @sync_to_async
        def get_center_notices_list():
            # 센터 존재 확인
            try:
                center = Center.objects.get(id=center_id)
            except Center.DoesNotExist:
                raise HttpError(404, "보호소를 찾을 수 없습니다")
            
            # 공지사항 조회 (notices 앱에서)
            from notices.models import Notice
            notices = Notice.objects.filter(
                center=center,
                is_published=True
            ).order_by('-created_at')
            
            # 응답 데이터 변환
            notices_response = [
                CenterNoticeOut(
                    id=str(notice.id),
                    content=notice.content,
                    is_important=notice.notice_type in ['important', 'urgent'],
                    created_at=notice.created_at.isoformat(),
                    updated_at=notice.updated_at.isoformat(),
                )
                for notice in notices
            ]
            
            return CenterNoticeListOut(
                notices=notices_response,
                total=len(notices_response)
            )
        
        return await get_center_notices_list()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"센터 공지사항 조회 중 오류가 발생했습니다: {str(e)}")


@router.patch(
    "/{center_id}/subscription",
    summary="[U] 센터 구독 상태 변경",
    description="특정 센터의 구독 상태를 변경합니다.",
    response={
        200: CenterSubscriptionOut,
        404: ErrorOut,
        500: ErrorOut,
    },
)
async def update_center_subscription(request: HttpRequest, center_id: str, payload: CenterSubscriptionUpdateIn):
    """센터 구독 상태를 변경합니다."""
    try:
        @sync_to_async
        def update_subscription():
            try:
                center = Center.objects.get(id=center_id)
            except Center.DoesNotExist:
                raise HttpError(404, "보호소를 찾을 수 없습니다")
            
            # 구독 상태 업데이트
            center.is_subscribed = payload.is_subscribed
            center.save()
            
            # 성공 메시지 생성
            action = "구독" if payload.is_subscribed else "구독 해제"
            message = f"{center.name} 센터가 {action}되었습니다."
            
            return CenterSubscriptionOut(
                message=message,
                is_subscribed=center.is_subscribed,
                center_id=str(center.id),
                center_name=center.name
            )
        
        return await update_subscription()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"센터 구독 상태 변경 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/subscribed",
    summary="[R] 구독된 센터 목록 조회",
    description="구독된 센터 목록을 조회합니다.",
    response={
        200: List[CenterOut],
        500: ErrorOut,
    },
)
@paginate
async def get_subscribed_centers(request: HttpRequest, filters: CenterListQueryIn = Query(CenterListQueryIn())):
    """구독된 센터 목록을 조회합니다. 혹시몰라서 일단 추가! """
    try:
        @sync_to_async
        def get_subscribed_centers_list():
            # 구독된 센터만 조회
            queryset = Center.objects.filter(is_subscribed=True, is_public=True).select_related('owner')
            
            # 지역별 필터링
            if filters.location:
                queryset = queryset.filter(location__icontains=filters.location)
            
            # 지역별 필터링
            if filters.region:
                queryset = queryset.filter(region__icontains=filters.region)
            
            # 최신순 정렬
            queryset = queryset.order_by('-created_at')
            
            # 응답 데이터 변환
            centers_response = [
                _build_center_response(center, show_private_location=False)
                for center in queryset
            ]
            
            return centers_response
        
        return await get_subscribed_centers_list()
        
    except Exception as e:
        raise HttpError(500, f"구독된 센터 목록 조회 중 오류가 발생했습니다: {str(e)}")