from ninja import Router, Query
from ninja.errors import HttpError
from django.http import HttpRequest
from django.db.models import Q
from asgiref.sync import sync_to_async
from typing import List, Optional
from datetime import datetime
from .models import Center, AdoptionContractTemplate, AdoptionConsent, QuestionForm
from .utils import get_region_search_variants
from .schemas.inbound import CenterListQueryIn
from .schemas.outbound import (
    CenterOut, CenterListItemOut, SuccessOut, ErrorOut,
    ContractTemplateOut, ConsentOut, QuestionFormOut
)

router = Router(tags=["Centers"])

@router.get(
    "/",
    summary="[R] 센터 목록 조회",
    description="센터 목록을 조회합니다. 지역, 인증 여부 등으로 필터링 가능합니다.",
    response={
        200: dict,  # 페이지네이션 응답 구조
        500: ErrorOut,
    },
)
async def get_centers(
    request: HttpRequest,
    filters: CenterListQueryIn = Query(CenterListQueryIn()),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """센터 목록을 조회합니다."""
    try:
        # 기본 쿼리셋 (공개된 센터만)
        queryset = Center.objects.filter(is_public=True).select_related('owner')
        
        # 필터 적용
        if filters.region:
            # 지역별 필터링 (두 글자와 전체 이름 모두 지원)
            region_variants = get_region_search_variants(filters.region)
            queryset = queryset.filter(region__in=region_variants)
        
        if filters.verified is not None:
            queryset = queryset.filter(verified=filters.verified)
        
        if filters.has_volunteer is not None:
            queryset = queryset.filter(has_volunteer=filters.has_volunteer)
        
        if filters.has_foster_care is not None:
            queryset = queryset.filter(has_foster_care=filters.has_foster_care)
        
        if filters.search:
            queryset = queryset.filter(
                Q(name__icontains=filters.search) |
                Q(location__icontains=filters.search) |
                Q(description__icontains=filters.search)
            )
        
        # 정렬
        sort_by = filters.sort_by or "created_at"
        sort_order = filters.sort_order or "desc"
        
        if sort_by == "name":
            order_field = "name"
        elif sort_by == "verified":
            order_field = "verified"
        else:
            order_field = "created_at"
        
        if sort_order == "asc":
            queryset = queryset.order_by(order_field)
        else:
            queryset = queryset.order_by(f"-{order_field}")
        
        # 페이지네이션 (async)
        @sync_to_async
        def get_total_count():
            return queryset.count()
        
        @sync_to_async
        def get_paginated_list(offset, limit):
            return list(queryset[offset:offset + limit])
        
        total_count = await get_total_count()
        offset = (page - 1) * page_size
        total_pages = (total_count + page_size - 1) // page_size
        
        centers_list = await get_paginated_list(offset, page_size)
        
        # 응답 데이터 변환
        centers_response = []
        for center in centers_list:
            center_data = CenterListItemOut(
                id=str(center.id),
                name=center.name,
                center_number=center.center_number,
                description=center.description[:100] + "..." if center.description and len(center.description) > 100 else center.description,
                location=center.location,
                region=center.region,
                phone_number=center.phone_number if center.show_phone_number else "문의하기",
                image_url=center.image_url,
                verified=center.verified,
                is_public=center.is_public,
                has_volunteer=center.has_volunteer,
                has_foster_care=center.has_foster_care,
                adoption_price=center.adoption_price,
                is_subscribed=center.is_subscribed,
                owner_name=center.owner.username if center.owner else None,
                created_at=center.created_at.isoformat(),
                updated_at=center.updated_at.isoformat(),
            )
            centers_response.append(center_data)
        
        return {
            "count": len(centers_response),
            "totalCnt": total_count,
            "pageCnt": total_pages,
            "curPage": page,
            "nextPage": page + 1 if page < total_pages else None,
            "previousPage": page - 1 if page > 1 else None,
            "data": centers_response
        }
        
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
    """특정 센터의 상세 정보를 조회합니다."""
    try:
        @sync_to_async
        def get_center_detail():
            try:
                center = Center.objects.select_related('owner').get(id=center_id, is_public=True)
                
                # 관련 계약서 템플릿
                active_contracts = list(AdoptionContractTemplate.objects.filter(
                    center=center, is_active=True
                ).values('id', 'title', 'description', 'content', 'is_active', 'created_at'))
                
                # 관련 동의서
                active_consents = list(AdoptionConsent.objects.filter(
                    center=center, is_active=True
                ).values('id', 'title', 'description', 'content', 'is_active', 'created_at'))
                
                # 질문 폼
                question_forms = list(QuestionForm.objects.filter(
                    center=center
                ).order_by('sequence').values('id', 'question', 'type', 'options', 'is_required', 'sequence'))
                
                return center, active_contracts, active_consents, question_forms
            except Center.DoesNotExist:
                return None, None, None, None
        
        result = await get_center_detail()
        if result[0] is None:
            raise HttpError(404, "센터를 찾을 수 없습니다")
        
        center, contracts, consents, questions = result
        
        # 응답 데이터 변환
        response_data = CenterOut(
            id=str(center.id),
            name=center.name,
            center_number=center.center_number,
            description=center.description,
            location=center.location,
            region=center.get_region_display() if center.region else None,
            phone_number=center.phone_number if center.show_phone_number else None,
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
            has_volunteer=center.has_volunteer,
            has_foster_care=center.has_foster_care,
            show_phone_number=center.show_phone_number,
            show_location=center.show_location,
            call_available_time=center.call_available_time,
            public_reg_no=center.public_reg_no,
            owner_name=center.owner.username if center.owner else None,
            owner_type=center.owner.user_type if center.owner else None,
            contract_templates=[
                ContractTemplateOut(
                    id=str(ct['id']),
                    title=ct['title'],
                    description=ct['description'],
                    content=ct['content'],
                    is_active=ct['is_active'],
                    created_at=ct['created_at'].isoformat() if ct['created_at'] else None
                ) for ct in contracts
            ],
            consents=[
                ConsentOut(
                    id=str(c['id']),
                    title=c['title'],
                    description=c['description'],
                    content=c['content'],
                    is_active=c['is_active'],
                    created_at=c['created_at'].isoformat() if c['created_at'] else None
                ) for c in consents
            ],
            question_forms=[
                QuestionFormOut(
                    id=str(q['id']),
                    question=q['question'],
                    type=q['type'],
                    options=q['options'],
                    is_required=q['is_required'],
                    sequence=q['sequence']
                ) for q in questions
            ],
            created_at=center.created_at.isoformat(),
            updated_at=center.updated_at.isoformat(),
        )
        
        return response_data
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"센터 상세 조회 중 오류가 발생했습니다: {str(e)}")

@router.get(
    "/regions",
    summary="[R] 지역 목록 조회",
    description="등록된 센터들의 지역 목록을 조회합니다.",
    response={
        200: List[str],
        500: ErrorOut,
    },
)
async def get_regions(request: HttpRequest):
    """지역 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_region_list():
            regions = Center.objects.filter(is_public=True).exclude(
                region__isnull=True
            ).values_list('region', flat=True).distinct()
            return sorted(list(set(regions)))
        
        regions = await get_region_list()
        return regions
        
    except Exception as e:
        raise HttpError(500, f"지역 목록 조회 중 오류가 발생했습니다: {str(e)}")

@router.get(
    "/stats",
    summary="[R] 센터 통계 조회",
    description="전체 센터의 통계 정보를 조회합니다.",
    response={
        200: dict,
        500: ErrorOut,
    },
)
async def get_center_stats(request: HttpRequest):
    """센터 통계 정보를 조회합니다."""
    try:
        @sync_to_async
        def get_stats():
            from django.db.models import Count
            
            total_centers = Center.objects.filter(is_public=True).count()
            verified_centers = Center.objects.filter(is_public=True, verified=True).count()
            volunteer_centers = Center.objects.filter(is_public=True, has_volunteer=True).count()
            foster_centers = Center.objects.filter(is_public=True, has_foster_care=True).count()
            
            # 지역별 센터 수
            region_stats = dict(
                Center.objects.filter(is_public=True)
                .values('region')
                .annotate(count=Count('id'))
                .order_by('-count')
            )
            
            return {
                "total_centers": total_centers,
                "verified_centers": verified_centers,
                "volunteer_centers": volunteer_centers,
                "foster_centers": foster_centers,
                "region_distribution": region_stats,
                "updated_at": datetime.now().isoformat()
            }
        
        stats = await get_stats()
        return stats
        
    except Exception as e:
        raise HttpError(500, f"센터 통계 조회 중 오류가 발생했습니다: {str(e)}")
