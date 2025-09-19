from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List, Optional
from django.utils import timezone
from datetime import datetime, timedelta

from adoptions.schemas.monitoring_outbound import (
    MonitoringStatusOut, MonitoringCheckOut, MonitoringSummaryOut
)
from adoptions.models import (
    Adoption, AdoptionMonitoring, AdoptionMonitoringCheck
)
from centers.models import Center
from posts.models import Post
from api.security import jwt_auth

router = Router(tags=["Adoption_Monitoring"])


@router.post(
    "/batch-check",
    summary="[C] 배치 모니터링 체크 (Lambda용)",
    description="오늘 체크해야 할 모든 입양에 대한 모니터링 체크를 수행합니다 (Lambda에서 호출)",
    response={200: dict, 500: dict},
)
async def batch_monitoring_check():
    """배치 모니터링 체크 수행 (Lambda에서 호출)"""
    try:
        print("🔍 Starting batch adoption monitoring check...")
        
        today = timezone.now().date()
        
        # 오늘 체크해야 할 입양들 조회
        @sync_to_async
        def get_adoptions_to_check():
            return list(
                Adoption.objects.select_related('animal', 'animal__center')
                .filter(
                    status="모니터링",
                    monitoring_next_check_at__lte=today
                )
            )
        
        adoptions_to_check = await get_adoptions_to_check()
        
        print(f"📊 Found {len(adoptions_to_check)} adoptions to check")
        
        checks_processed = 0
        checks_with_issues = 0
        
        for adoption in adoptions_to_check:
            try:
                check_result = await perform_single_monitoring_check(adoption)
                checks_processed += 1
                
                if check_result['status'] != "정상":
                    checks_with_issues += 1
                
                print(
                    f"✅ Processed adoption {adoption.id}: {check_result['status']} "
                    f"({check_result['posts_found']} posts) - "
                    f"Check {check_result['check_sequence']}/{check_result['total_checks']}"
                )
                
            except Exception as error:
                print(f"❌ Error checking adoption {adoption.id}: {error}")
        
        print(
            f"🎯 Batch monitoring check completed: {checks_processed} processed, "
            f"{checks_with_issues} with issues"
        )
        
        return {
            "success": True,
            "checked": checks_processed,
            "issues": checks_with_issues,
            "timestamp": today.isoformat(),
        }
        
    except Exception as error:
        print(f"💥 Fatal error in batch monitoring check: {error}")
        raise HttpError(500, f"배치 모니터링 체크 중 오류가 발생했습니다: {str(error)}")


@router.get(
    "/status/{adoption_id}",
    summary="[R] 입양 모니터링 상태 조회",
    description="특정 입양의 모니터링 상태와 진행 상황을 조회합니다",
    response={200: MonitoringStatusOut, 400: dict, 401: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def get_monitoring_status(request, adoption_id: str):
    """특정 입양의 모니터링 상태 조회"""
    try:
        current_user = request.auth
        
        # 입양 정보 조회
        try:
            adoption = await Adoption.objects.select_related(
                'animal', 'animal__center', 'user'
            ).aget(id=adoption_id)
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
      
        
        # 전체 모니터링 포스트 수 조회
        total_posts = await sync_to_async(AdoptionMonitoring.objects.filter(adoption=adoption).count)()
        
        # 다음 모니터링 마감일까지 남은 일수 계산
        days_until_next_deadline = None
        next_deadline = None
        
        if adoption.monitoring_next_check_at:
            next_check = adoption.monitoring_next_check_at
            next_deadline = next_check.isoformat()
            days_until_next_deadline = (next_check - timezone.now().date()).days
        
        # 전체 모니터링 기간 남은 일수 계산
        days_until_monitoring_end = None
        if adoption.monitoring_end_date:
            end_date = adoption.monitoring_end_date
            days_until_monitoring_end = (end_date - timezone.now().date()).days
        
        # 모니터링 진행률 계산
        total_checks = adoption.monitoring_total_checks or 0
        completed_checks = adoption.monitoring_completed_checks or 0
        
        if total_checks > 0:
            percentage = round((completed_checks / total_checks) * 100)
        else:
            percentage = 0
        
        # 센터 설정 정보
        center_config = await sync_to_async(lambda: {
            'monitoring_period_months': adoption.animal.center.monitoring_period_months or 3,
            'monitoring_interval_days': adoption.animal.center.monitoring_interval_days or 14,
        })()
        
        # 최근 체크 기록 데이터 변환
        recent_checks_data = await sync_to_async(lambda: [
            {
                'check_sequence': check.check_sequence,
                'check_date': check.check_date.isoformat(),
                'expected_check_date': check.expected_check_date.isoformat(),
                'period': {
                    'start': check.period_start.isoformat(),
                    'end': check.period_end.isoformat(),
                },
                'posts_found': check.posts_found,
                'status': check.status,
                'delay_days': check.delay_days,
                'days_until_deadline': check.days_until_deadline,
                'notes': check.notes,
            } for check in recent_checks
        ])()
        
        return MonitoringStatusOut(
            adoption_id=str(adoption.id),
            status=adoption.status,
            monitoring_status=adoption.monitoring_status,
            monitoring_started_at=adoption.monitoring_started_at.isoformat() if adoption.monitoring_started_at else None,
            monitoring_end_date=adoption.monitoring_end_date.isoformat() if adoption.monitoring_end_date else None,
            next_check_date=next_deadline,
            days_until_next_deadline=days_until_next_deadline,
            days_until_monitoring_end=days_until_monitoring_end,
            completed_checks=completed_checks,
            total_checks=total_checks,
            total_monitoring_posts=total_posts,
            monitoring_progress={
                'percentage': percentage,
                'description': f"{completed_checks}/{total_checks} 체크 완료",
            },
            center_config=center_config,
            recent_checks=recent_checks_data
        )
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get monitoring status error: {e}")
        raise HttpError(500, "모니터링 상태 조회 중 오류가 발생했습니다")


@router.get(
    "/checks/{adoption_id}",
    summary="[R] 입양 모니터링 체크 기록 조회",
    description="특정 입양의 모니터링 체크 기록들을 조회합니다",
    response={200: List[MonitoringCheckOut], 400: dict, 401: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
@paginate
async def get_monitoring_checks(request, adoption_id: str):
    """특정 입양의 모니터링 체크 기록 조회"""
    try:
        current_user = request.auth
        
        # 입양 정보 조회
        try:
            adoption = await Adoption.objects.select_related(
                'animal', 'animal__center', 'user'
            ).aget(id=adoption_id)
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 권한 체크: 본인 또는 센터 관리자만 조회 가능
        if str(adoption.user.id) != str(current_user.id):
        
        # 모니터링 체크 기록 조회
         @sync_to_async
         def get_monitoring_checks_list():
            return list(
                AdoptionMonitoringCheck.objects.filter(adoption=adoption)
                .order_by('-check_sequence')
            )
        
        checks_list = await get_monitoring_checks_list()
        
        # 응답 데이터 변환
        checks_response = []
        for check in checks_list:
            check_data = await sync_to_async(lambda: {
                'id': str(check.id),
                'adoption_id': str(check.adoption.id),
                'check_sequence': check.check_sequence,
                'check_date': check.check_date.isoformat(),
                'expected_check_date': check.expected_check_date.isoformat(),
                'period_start': check.period_start.isoformat(),
                'period_end': check.period_end.isoformat(),
                'posts_found': check.posts_found,
                'status': check.status,
                'delay_days': check.delay_days,
                'days_until_deadline': check.days_until_deadline,
                'next_check_date': check.next_check_date.isoformat() if check.next_check_date else None,
                'notes': check.notes,
                'created_at': check.created_at.isoformat(),
            })()
            
            checks_response.append(MonitoringCheckOut(**check_data))
        
        return checks_response
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get monitoring checks error: {e}")
        raise HttpError(500, "모니터링 체크 기록 조회 중 오류가 발생했습니다")


@router.get(
    "/summary",
    summary="[R] 모니터링 요약 정보 조회",
    description="현재 사용자의 모니터링 중인 입양들의 요약 정보를 조회합니다",
    response={200: MonitoringSummaryOut, 400: dict, 401: dict, 500: dict},
    auth=jwt_auth,
)
async def get_monitoring_summary(request):
    """모니터링 요약 정보 조회"""
    try:
        current_user = request.auth
        
        # 모니터링 중인 입양들 조회
        @sync_to_async
        def get_monitoring_adoptions():
            return list(
                Adoption.objects.select_related('animal', 'animal__center')
                .filter(user=current_user, status="모니터링")
                .order_by('-monitoring_started_at')
            )
        
        adoptions_list = await get_monitoring_adoptions()
        
        # 요약 정보 계산
        total_adoptions = len(adoptions_list)
        total_checks = 0
        completed_checks = 0
        delayed_adoptions = 0
        upcoming_deadlines = 0
        
        today = timezone.now().date()
        
        for adoption in adoptions_list:
            total_checks += adoption.monitoring_total_checks or 0
            completed_checks += adoption.monitoring_completed_checks or 0
            
            if adoption.monitoring_status == "지연":
                delayed_adoptions += 1
            
            if adoption.monitoring_next_check_at:
                days_until = (adoption.monitoring_next_check_at - today).days
                if 0 <= days_until <= 7:  # 7일 이내 마감
                    upcoming_deadlines += 1
        
        # 진행률 계산
        if total_checks > 0:
            overall_progress = round((completed_checks / total_checks) * 100)
        else:
            overall_progress = 0
        
        return MonitoringSummaryOut(
            total_adoptions=total_adoptions,
            total_checks=total_checks,
            completed_checks=completed_checks,
            overall_progress=overall_progress,
            delayed_adoptions=delayed_adoptions,
            upcoming_deadlines=upcoming_deadlines,
            summary_date=today.isoformat()
        )
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get monitoring summary error: {e}")
        raise HttpError(500, "모니터링 요약 정보 조회 중 오류가 발생했습니다")


@router.post(
    "/initialize/{adoption_id}",
    summary="[C] 입양 모니터링 초기화",
    description="입양 완료 후 모니터링을 시작합니다 (센터 관리자만)",
    response={200: dict, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def initialize_monitoring(request, adoption_id: str):
    """입양 모니터링 초기화"""
    try:
        current_user = request.auth
        
        # 센터 관리자 권한 체크
        if not await sync_to_async(lambda: current_user.user_type in ['center_admin', 'center_super_admin'])():
            raise HttpError(403, "센터 관리자만 접근할 수 있습니다")
        
        # 입양 정보 조회
        try:
            adoption = await Adoption.objects.select_related(
                'animal', 'animal__center'
            ).aget(id=adoption_id)
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 센터 확인
        if str(adoption.animal.center.id) != str(current_user.center.id):
            raise HttpError(403, "해당 센터의 입양이 아닙니다")
        
        # 입양 상태 확인
        if adoption.status != "입양완료":
            raise HttpError(400, "입양 완료 상태가 아닙니다")
        
        # 모니터링 초기화
        now = timezone.now()
        center = adoption.animal.center
        
        monitoring_period_months = center.monitoring_period_months or 3
        monitoring_interval_days = center.monitoring_interval_days or 14
        
        # 총 체크 횟수 계산
        total_days_in_period = monitoring_period_months * 30
        total_checks = (total_days_in_period + monitoring_interval_days - 1) // monitoring_interval_days
        
        # 모니터링 종료일 계산
        monitoring_end_date = now.date() + timedelta(days=total_days_in_period)
        
        # 첫 번째 체크 일정
        first_check_date = now.date() + timedelta(days=monitoring_interval_days)
        
        # 입양 레코드 업데이트
        await sync_to_async(lambda: adoption.__class__.objects.filter(id=adoption.id).update(
            status="모니터링",
            monitoring_started_at=now,
            monitoring_next_check_at=first_check_date,
            monitoring_end_date=monitoring_end_date,
            monitoring_completed_checks=0,
            monitoring_total_checks=total_checks,
            monitoring_status="진행중",
            updated_at=now,
        ))()
        
        return {
            "success": True,
            "message": "모니터링이 성공적으로 시작되었습니다",
            "adoption_id": str(adoption.id),
            "monitoring_started_at": now.isoformat(),
            "monitoring_end_date": monitoring_end_date.isoformat(),
            "first_check_date": first_check_date.isoformat(),
            "total_checks": total_checks,
            "monitoring_period_months": monitoring_period_months,
            "monitoring_interval_days": monitoring_interval_days,
        }
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Initialize monitoring error: {e}")
        raise HttpError(500, "모니터링 초기화 중 오류가 발생했습니다")


@router.post(
    "/perform-check/{adoption_id}",
    summary="[C] 모니터링 체크 수행",
    description="특정 입양에 대한 모니터링 체크를 수행합니다 (센터 관리자만)",
    response={200: dict, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def perform_monitoring_check(request, adoption_id: str):
    """모니터링 체크 수행"""
    try:
        current_user = request.auth
        
        # 센터 관리자 권한 체크
        if not await sync_to_async(lambda: current_user.user_type in ['center_admin', 'center_super_admin'])():
            raise HttpError(403, "센터 관리자만 접근할 수 있습니다")
        
        # 입양 정보 조회
        try:
            adoption = await Adoption.objects.select_related(
                'animal', 'animal__center'
            ).aget(id=adoption_id)
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 센터 확인
        if str(adoption.animal.center.id) != str(current_user.center.id):
            raise HttpError(403, "해당 센터의 입양이 아닙니다")
        
        # 모니터링 상태 확인
        if adoption.status != "모니터링":
            raise HttpError(400, "모니터링 중인 입양이 아닙니다")
        
        # 체크 수행
        check_result = await perform_single_monitoring_check(adoption)
        
        return {
            "success": True,
            "message": "모니터링 체크가 완료되었습니다",
            **check_result
        }
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Perform monitoring check error: {e}")
        raise HttpError(500, "모니터링 체크 수행 중 오류가 발생했습니다")


async def perform_single_monitoring_check(adoption):
    """개별 입양에 대한 모니터링 체크 수행"""
    check_date = timezone.now().date()
    center = adoption.animal.center
    monitoring_period_months = center.monitoring_period_months or 3
    monitoring_interval_days = center.monitoring_interval_days or 14
    
    # 총 체크 횟수 계산
    total_days_in_period = monitoring_period_months * 30
    total_checks = (total_days_in_period + monitoring_interval_days - 1) // monitoring_interval_days
    
    # 이전 체크 기록 조회
    @sync_to_async
    def get_previous_checks():
        return list(
            AdoptionMonitoringCheck.objects.filter(adoption=adoption)
            .order_by('-check_sequence')[:1]
        )
    
    previous_checks = await get_previous_checks()
    
    # 현재 체크 순서 결정
    current_check_sequence = 1
    if previous_checks:
        current_check_sequence = previous_checks[0].check_sequence + 1
    
    # 체크 대상 기간 설정
    if previous_checks:
        prev_check = previous_checks[0]
        period_start = prev_check.period_end
        expected_check_date = prev_check.next_check_date
        if not expected_check_date:
            raise HttpError(400, "이전 체크에 다음 체크 일정이 없습니다")
    else:
        # 첫 번째 체크
        if not adoption.adoption_completed_at:
            raise HttpError(400, "입양 완료일이 설정되지 않았습니다")
        period_start = adoption.adoption_completed_at.date()
        expected_check_date = period_start + timedelta(days=monitoring_interval_days)
    
    period_end = check_date
    
    # 해당 기간 동안의 모니터링 포스트 조회
    @sync_to_async
    def get_monitoring_posts():
        return list(
            AdoptionMonitoring.objects.filter(
                adoption=adoption,
                created_at__date__gte=period_start,
                created_at__date__lte=period_end
            )
        )
    
    monitoring_posts = await get_monitoring_posts()
    posts_found = len(monitoring_posts)
    
    # 마감일까지 남은 일수 계산
    days_until_deadline = (expected_check_date - check_date).days
    
    # 상태 판정
    if posts_found > 0:
        status = "정상"
    elif days_until_deadline >= 0:
        status = "정상"  # 아직 마감일이 지나지 않음
    elif days_until_deadline >= -7:
        status = "지연"
        delay_days = -days_until_deadline
    else:
        status = "미제출"
        delay_days = -days_until_deadline
    
    # 다음 체크 일자 설정
    next_check_date = expected_check_date + timedelta(days=monitoring_interval_days)
    
    # 모니터링 체크 기록 저장
    check_record = await sync_to_async(AdoptionMonitoringCheck.objects.create)(
        adoption=adoption,
        check_sequence=current_check_sequence,
        check_date=check_date,
        expected_check_date=expected_check_date,
        period_start=period_start,
        period_end=period_end,
        posts_found=posts_found,
        status=status,
        delay_days=delay_days if status != "정상" else 0,
        days_until_deadline=days_until_deadline,
        next_check_date=next_check_date if current_check_sequence < total_checks else None,
        notes=f"{delay_days}일 {status}" if status != "정상" else None,
    )
    
    # 모니터링 전반적 상태 결정
    overall_monitoring_status = "진행중"
    if current_check_sequence >= total_checks:
        overall_monitoring_status = "완료"
    elif status == "미제출":
        overall_monitoring_status = "지연"
    
    # 입양 레코드 업데이트
    update_data = {
        'monitoring_completed_checks': current_check_sequence,
        'monitoring_total_checks': total_checks,
        'monitoring_status': overall_monitoring_status,
        'updated_at': timezone.now(),
    }
    
    if current_check_sequence < total_checks:
        update_data['monitoring_next_check_at'] = next_check_date
    else:
        update_data['monitoring_next_check_at'] = None  # 모니터링 완료
    
    await sync_to_async(lambda: adoption.__class__.objects.filter(id=adoption.id).update(**update_data))()
    
    return {
        'adoption_id': str(adoption.id),
        'check_sequence': current_check_sequence,
        'total_checks': total_checks,
        'check_date': check_date.isoformat(),
        'expected_check_date': expected_check_date.isoformat(),
        'period_start': period_start.isoformat(),
        'period_end': period_end.isoformat(),
        'posts_found': posts_found,
        'status': status,
        'delay_days': delay_days if status != "정상" else 0,
        'days_until_deadline': days_until_deadline,
        'next_check_date': next_check_date.isoformat() if current_check_sequence < total_checks else None,
        'monitoring_status': overall_monitoring_status,
    }


@router.post(
    "/link-post",
    summary="[C] 포스트를 모니터링과 연결",
    description="사용자가 작성한 포스트를 입양 모니터링과 연결합니다",
    response={200: dict, 400: dict, 401: dict, 500: dict},
    auth=jwt_auth,
)
async def link_post_to_monitoring(request, post_id: str):
    """포스트를 모니터링과 연결"""
    try:
        current_user = request.auth
        
        # 해당 사용자의 모니터링 중인 입양 조회
        @sync_to_async
        def get_active_adoptions():
            return list(
                Adoption.objects.filter(
                    user=current_user,
                    status="모니터링"
                )
            )
        
        active_adoptions = await get_active_adoptions()
        
        if not active_adoptions:
            return {
                "success": False,
                "message": "모니터링 중인 입양이 없습니다",
                "linked_count": 0
            }
        
        # 각 입양에 대해 모니터링 포스트로 등록
        linked_count = 0
        for adoption in active_adoptions:
            try:
                await sync_to_async(AdoptionMonitoring.objects.create)(
                    adoption=adoption,
                    post_id=post_id,
                )
                linked_count += 1
            except Exception as e:
                print(f"Error linking post {post_id} to adoption {adoption.id}: {e}")
        
        print(f"📝 Linked post {post_id} to {linked_count} adoption monitoring records")
        
        return {
            "success": True,
            "message": f"포스트가 {linked_count}개의 입양 모니터링과 연결되었습니다",
            "post_id": post_id,
            "linked_count": linked_count,
            "total_adoptions": len(active_adoptions)
        }
        
    except Exception as e:
        print(f"Error linking post to monitoring: {e}")
        raise HttpError(500, "포스트 연결 중 오류가 발생했습니다")


@router.get(
    "/posts/{adoption_id}",
    summary="[R] 입양 모니터링 포스트 목록 조회",
    description="특정 입양의 모니터링 포스트 목록을 조회합니다",
    response={200: List[dict], 400: dict, 401: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
@paginate
async def get_monitoring_posts(request, adoption_id: str):
    """입양 모니터링 포스트 목록 조회"""
    try:
        current_user = request.auth
        
        # 입양 정보 조회
        try:
            adoption = await Adoption.objects.select_related(
                'animal', 'animal__center', 'user'
            ).aget(id=adoption_id)
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 권한 체크: 본인 또는 센터 관리자만 조회 가능
        if str(adoption.user.id) != str(current_user.id):
        
        # 모니터링 포스트 조회
         @sync_to_async
         def get_monitoring_posts_list():
            return list(
                AdoptionMonitoring.objects.filter(adoption=adoption)
                .order_by('-created_at')
            )
        
        monitoring_posts = await get_monitoring_posts_list()
        
        # 포스트 상세 정보 조회
        posts_response = []
        for monitoring_post in monitoring_posts:
            try:
                # Post 객체 조회
                post_data = await sync_to_async(lambda: {
                    'title': Post.objects.get(id=monitoring_post.post_id).title,
                    'content': Post.objects.get(id=monitoring_post.post_id).content,
                    'created_at': Post.objects.get(id=monitoring_post.post_id).created_at,
                })()
                
                posts_response.append({
                    'id': str(monitoring_post.id),
                    'post_id': monitoring_post.post_id,
                    'post_title': post_data['title'],
                    'post_content': post_data['content'],
                    'post_created_at': post_data['created_at'].isoformat(),
                    'monitoring_created_at': monitoring_post.created_at.isoformat(),
                })
                
            except Post.DoesNotExist:
                # Post가 삭제된 경우
                posts_response.append({
                    'id': str(monitoring_post.id),
                    'post_id': monitoring_post.post_id,
                    'post_title': "삭제된 포스트",
                    'post_content': "포스트가 삭제되었습니다",
                    'post_created_at': None,
                    'monitoring_created_at': monitoring_post.created_at.isoformat(),
                })
        
        return posts_response
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get monitoring posts error: {e}")
        raise HttpError(500, "모니터링 포스트 조회 중 오류가 발생했습니다")
