import logging
from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from typing import List
from django.utils import timezone
from django.core.exceptions import MultipleObjectsReturned
from notifications.models import Notification, PushToken

logger = logging.getLogger(__name__)
from notifications.schemas.inbound import (
    PushTokenIn,
    PushTokenDeleteIn,
    NotificationListQueryIn,
    NotificationCreateIn,
)
from notifications.schemas.outbound import (
    NotificationOut,
    NotificationReadOut,
    PushTokenOut,
    UnreadCountOut,
    ErrorOut
)
from api.security import jwt_auth
from django.db.models import Q

router = Router(tags=["Notifications"])


def _build_notification_response(notification):
    """알림 응답 데이터를 구성합니다."""
    return NotificationOut(
        id=str(notification.id),
        user_id=str(notification.user.id),
        message=notification.message,
        notification_type=notification.notification_type,
        priority=notification.priority,
        is_read=notification.is_read,
        read_at=notification.read_at.isoformat() if notification.read_at else None,
        action_url=notification.action_url,
        metadata=notification.metadata,
        created_at=notification.created_at.isoformat(),
        updated_at=notification.updated_at.isoformat(),
    )


@router.get(
    "/",
    summary="[R] 내 알림 목록 조회",
    description="로그인한 사용자의 알림 목록을 조회합니다.",
    response={
        200: List[NotificationOut],
        401: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
@paginate
async def get_notifications(request: HttpRequest, filters: NotificationListQueryIn = Query(NotificationListQueryIn())):
    """내 알림 목록을 조회합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def get_notifications_list():
            # 알림 목록 조회 (최신순 정렬)
            notifications = Notification.objects.filter(
                user=current_user
            ).order_by('-created_at')

            # NotificationOut 스키마로 변환하여 반환
            notifications_response = [
                _build_notification_response(notification)
                for notification in notifications
            ]

            return notifications_response

        return await get_notifications_list()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"알림 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/{notification_id}/read",
    summary="[U] 알림 읽음 처리",
    description="특정 알림을 읽음 처리합니다.",
    response={
        200: NotificationReadOut,
        401: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def mark_notification_read(request: HttpRequest, notification_id: str):
    """특정 알림을 읽음 처리합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def mark_read():
            # 알림 소유자 확인
            try:
                notification = Notification.objects.get(
                    id=notification_id,
                    user=current_user
                )
            except Notification.DoesNotExist:
                raise HttpError(404, "알림을 찾을 수 없습니다")

            # 읽음 처리
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()

            return {"message": "알림을 읽음 처리했습니다"}

        return await mark_read()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"알림 읽음 처리 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/read-all",
    summary="[U] 모든 알림 읽음 처리",
    description="사용자의 모든 읽지 않은 알림을 읽음 처리합니다.",
    response={
        200: NotificationReadOut,
        401: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def mark_all_notifications_read(request: HttpRequest):
    """모든 읽지 않은 알림을 읽음 처리합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def mark_all_read():
            # 모든 읽지 않은 알림을 읽음 처리
            Notification.objects.filter(
                user=current_user,
                is_read=False
            ).update(
                is_read=True,
                read_at=timezone.now()
            )

            return {"message": "모든 알림을 읽음 처리했습니다"}

        return await mark_all_read()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"전체 알림 읽음 처리 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/push-token",
    summary="[C/U] 푸시 토큰 등록",
    description="푸시 알림을 받기 위한 토큰을 등록하거나 업데이트합니다.",
    response={
        200: PushTokenOut,
        400: ErrorOut,
        401: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def register_push_token(request: HttpRequest, data: PushTokenIn):
    """푸시 토큰을 등록하거나 업데이트합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def register_token():
            try:
                # 1. 같은 사용자, 플랫폼, 토큰 조합이 이미 있는지 확인
                existing_same_token = PushToken.objects.filter(
                    user=current_user,
                    platform=data.platform,
                    token=data.token
                ).first()
                
                if existing_same_token:
                    # 같은 토큰이 이미 존재하는 경우: 업데이트만
                    existing_same_token.last_used = timezone.now()
                    existing_same_token.is_active = True
                    existing_same_token.save()
                    
                    # 같은 플랫폼의 다른 토큰들은 비활성화 (같은 플랫폼에서 하나만 활성화)
                    PushToken.objects.filter(
                        user=current_user,
                        platform=data.platform
                    ).exclude(id=existing_same_token.id).update(is_active=False)
                    
                    return {"message": "푸시 토큰이 업데이트되었습니다"}
                
                # 2. 같은 사용자와 플랫폼의 기존 토큰들 조회 및 비활성화
                existing_tokens = PushToken.objects.filter(
                    user=current_user,
                    platform=data.platform
                )
                
                # 같은 플랫폼의 모든 기존 토큰 비활성화
                existing_tokens.update(is_active=False)
                
                # 3. 새 토큰 생성 (unique_together 제약 조건 고려)
                # get_or_create를 사용하여 중복 생성 방지
                token_obj, created = PushToken.objects.get_or_create(
                    user=current_user,
                    platform=data.platform,
                    token=data.token,
                    defaults={
                        'is_active': True,
                        'last_used': timezone.now()
                    }
                )
                
                if not created:
                    # 이미 존재하는 경우 업데이트
                    token_obj.is_active = True
                    token_obj.last_used = timezone.now()
                    token_obj.save()
                
                return {"message": "푸시 토큰이 등록되었습니다"}
                
            except Exception as e:
                logger.error(f"푸시 토큰 등록 중 오류: {str(e)}")
                # 예외 발생 시에도 안전하게 처리
                # 이미 존재하는 토큰을 찾아서 활성화
                try:
                    token_obj = PushToken.objects.filter(
                        user=current_user,
                        platform=data.platform,
                        token=data.token
                    ).first()
                    
                    if token_obj:
                        token_obj.is_active = True
                        token_obj.last_used = timezone.now()
                        token_obj.save()
                        # 같은 플랫폼의 다른 토큰들 비활성화
                        PushToken.objects.filter(
                            user=current_user,
                            platform=data.platform
                        ).exclude(id=token_obj.id).update(is_active=False)
                        return {"message": "푸시 토큰이 업데이트되었습니다"}
                except Exception as inner_error:
                    logger.error(f"푸시 토큰 복구 중 오류: {str(inner_error)}")
                
                # 최종 실패 시 예외 발생
                raise

        return await register_token()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"푸시 토큰 등록 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/push-token",
    summary="[D] 푸시 토큰 비활성화",
    description="특정 플랫폼의 푸시 토큰을 비활성화합니다.",
    response={
        200: PushTokenOut,
        400: ErrorOut,
        401: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def deactivate_push_token(request: HttpRequest, data: PushTokenDeleteIn):
    """푸시 토큰을 비활성화합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def deactivate_token():
            # 해당 플랫폼의 토큰을 비활성화
            PushToken.objects.filter(
                user=current_user,
                platform=data.platform
            ).update(is_active=False)

            return {"message": "푸시 토큰이 비활성화되었습니다"}

        return await deactivate_token()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"푸시 토큰 비활성화 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/unread-count",
    summary="[R] 읽지 않은 알림 개수",
    description="로그인한 사용자의 읽지 않은 알림 개수를 조회합니다.",
    response={
        200: UnreadCountOut,
        401: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def get_unread_count(request: HttpRequest):
    """읽지 않은 알림 개수를 조회합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def get_count():
            # 읽지 않은 알림 개수 조회
            unread_count = Notification.objects.filter(
                user=current_user,
                is_read=False
            ).count()

            return {"unread_count": unread_count}

        return await get_count()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"읽지 않은 알림 개수 조회 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/create",
    summary="[C] 알림 생성 및 푸시 전송",
    description="새로운 알림을 생성하고 푸시 알림을 전송합니다. (관리자용)",
    response={
        201: NotificationOut,
        400: ErrorOut,
        401: ErrorOut,
        403: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def create_notification(request: HttpRequest, data: NotificationCreateIn):
    """새로운 알림을 생성하고 푸시 알림을 전송합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        # 관리자 권한 확인 (필요시)
        # if current_user.user_type not in ["최고관리자", "센터관리자"]:
        #     raise HttpError(403, "관리자 권한이 필요합니다")

        # create_and_send_notification 유틸리티 사용
        from notifications.utils import create_and_send_notification
        
        # 알림 생성 및 푸시 전송을 한번에 처리
        notification = await create_and_send_notification(
            user_id=data.user_id,
            notification_type=data.notification_type,
            message=data.message,
            priority=data.priority,
            action_url=data.action_url,
            send_push=data.send_push
        )

        # 응답 데이터 구성
        response_data = _build_notification_response(notification)
        return 201, response_data

    except ValueError as e:
        raise HttpError(400, str(e))
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"알림 생성 중 오류가 발생했습니다: {str(e)}")
