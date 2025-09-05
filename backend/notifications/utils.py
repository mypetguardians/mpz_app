import os
import json
import logging
from typing import List, Dict, Optional
from django.conf import settings
from notifications.models import Notification, PushToken
from asgiref.sync import sync_to_async
import httpx
from django.utils import timezone
from datetime import timedelta
from .models import Notification
from user.models import User
from centers.models import Center
from adoptions.models import Adoption, AdoptionMonitoring
from comments.models import Comment
from posts.models import Post
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


logger = logging.getLogger(__name__)


class FCMPushNotificationService:
    """Firebase Cloud Messaging 푸시 알림 서비스"""
    
    def __init__(self):
        self.fcm_server_key = os.getenv('FCM_SERVER_KEY')
        self.fcm_project_id = os.getenv('FCM_PROJECT_ID')
        self.fcm_url = "https://fcm.googleapis.com/fcm/send"
        
        if not self.fcm_server_key:
            logger.warning("FCM_SERVER_KEY 환경변수가 설정되지 않았습니다.")

    async def send_push_notification(
        self,
        user_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict] = None,
        platform: Optional[str] = None
    ) -> Dict:
        """
        FCM을 통해 푸시 알림을 전송합니다.
        
        Args:
            user_tokens: 푸시 토큰 리스트
            title: 알림 제목
            body: 알림 내용
            data: 추가 데이터 (선택사항)
            platform: 플랫폼별 특별한 처리 (선택사항)
        
        Returns:
            Dict: 전송 결과
        """
        if not self.fcm_server_key:
            logger.error("FCM_SERVER_KEY가 설정되지 않아 푸시 알림을 전송할 수 없습니다.")
            return {"success": False, "error": "FCM_SERVER_KEY not configured"}

        if not user_tokens:
            logger.warning("푸시 토큰이 없어 알림을 전송할 수 없습니다.")
            return {"success": False, "error": "No push tokens provided"}

        headers = {
            "Authorization": f"key={self.fcm_server_key}",
            "Content-Type": "application/json",
        }

        # FCM 페이로드 구성
        notification_data = {
            "title": title,
            "body": body,
        }

        # 플랫폼별 커스터마이징
        if platform == "ios":
            notification_data["sound"] = "default"
        elif platform == "android":
            notification_data["icon"] = "ic_notification"
            notification_data["color"] = "#FF6B35"

        payload = {
            "registration_ids": user_tokens,
            "notification": notification_data,
            "priority": "high",
        }

        # 커스텀 데이터 추가
        if data:
            payload["data"] = data

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.fcm_url,
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"FCM 푸시 알림 전송 성공: {result}")
                    return {
                        "success": True,
                        "success_count": result.get("success", 0),
                        "failure_count": result.get("failure", 0),
                        "results": result.get("results", [])
                    }
                else:
                    logger.error(f"FCM 푸시 알림 전송 실패: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}: {response.text}"
                    }
                    
        except Exception as e:
            logger.error(f"FCM 푸시 알림 전송 중 예외 발생: {str(e)}")
            return {"success": False, "error": str(e)}


# FCM 서비스 인스턴스
fcm_service = FCMPushNotificationService()


async def create_and_send_notification(
    user_id: str,
    notification_type: str,
    message: str,
    priority: str = "normal",
    action_url: Optional[str] = None,
    metadata: Optional[Dict] = None,
    send_push: bool = True
) -> Notification:
    """
    알림을 생성하고 푸시 알림을 전송합니다.
    
    Args:
        user_id: 사용자 ID
        notification_type: 알림 타입
        message: 알림 내용
        priority: 우선순위 (기본값: normal)
        action_url: 액션 URL (선택사항)
        metadata: 메타데이터 (선택사항)
        send_push: 푸시 알림 전송 여부 (기본값: True)
    
    Returns:
        Notification: 생성된 알림 객체
    """
    from user.models import User
    
    @sync_to_async
    def create_notification():
        try:
            user = User.objects.get(id=user_id)
            notification = Notification.objects.create(
                user=user,
                notification_type=notification_type,
                message=message,
                priority=priority,
                action_url=action_url,
                metadata=metadata
            )
            return notification
        except User.DoesNotExist:
            logger.error(f"사용자 {user_id}를 찾을 수 없습니다.")
            raise ValueError(f"사용자 {user_id}를 찾을 수 없습니다.")
    
    # 알림 생성
    notification = await create_notification()
    
    # 푸시 알림 전송
    if send_push:
        await send_push_notification_to_user(user_id, message, message, metadata)
    
    return notification


async def send_push_notification_to_user(
    user_id: str,
    title: str,
    message: str,
    data: Optional[Dict] = None
) -> Dict:
    """
    특정 사용자에게 푸시 알림을 전송합니다.
    
    Args:
        user_id: 사용자 ID
        title: 알림 제목
        message: 알림 내용
        data: 추가 데이터 (선택사항)
    
    Returns:
        Dict: 전송 결과
    """
    @sync_to_async
    def get_user_tokens():
        try:
            tokens = PushToken.objects.filter(
                user_id=user_id,
                is_active=True
            ).values_list('token', 'platform')
            return list(tokens)
        except Exception as e:
            logger.error(f"사용자 {user_id}의 푸시 토큰 조회 실패: {str(e)}")
            return []
    
    # 사용자의 활성 푸시 토큰 조회
    user_tokens_with_platform = await get_user_tokens()
    
    if not user_tokens_with_platform:
        logger.info(f"사용자 {user_id}의 활성 푸시 토큰이 없습니다.")
        return {"success": False, "error": "No active push tokens"}
    
    # 플랫폼별로 토큰 분류
    tokens_by_platform = {}
    for token, platform in user_tokens_with_platform:
        if platform not in tokens_by_platform:
            tokens_by_platform[platform] = []
        tokens_by_platform[platform].append(token)
    
    # 플랫폼별로 푸시 알림 전송
    results = {}
    for platform, tokens in tokens_by_platform.items():
        result = await fcm_service.send_push_notification(
            user_tokens=tokens,
            title=title,
            body=message,
            data=data,
            platform=platform
        )
        results[platform] = result
    
    return results


async def send_bulk_push_notification(
    user_ids: List[str],
    title: str,
    message: str,
    data: Optional[Dict] = None
) -> Dict:
    """
    여러 사용자에게 푸시 알림을 일괄 전송합니다.
    
    Args:
        user_ids: 사용자 ID 리스트
        title: 알림 제목
        message: 알림 내용
        data: 추가 데이터 (선택사항)
    
    Returns:
        Dict: 전송 결과
    """
    @sync_to_async
    def get_all_tokens():
        try:
            tokens = PushToken.objects.filter(
                user_id__in=user_ids,
                is_active=True
            ).values_list('token', flat=True)
            return list(tokens)
        except Exception as e:
            logger.error(f"사용자들의 푸시 토큰 조회 실패: {str(e)}")
            return []
    
    # 모든 사용자의 활성 푸시 토큰 조회
    all_tokens = await get_all_tokens()
    
    if not all_tokens:
        logger.info("활성 푸시 토큰이 없습니다.")
        return {"success": False, "error": "No active push tokens"}
    
    # FCM은 한 번에 최대 1000개의 토큰을 처리할 수 있음
    max_tokens_per_batch = 1000
    results = []
    
    for i in range(0, len(all_tokens), max_tokens_per_batch):
        batch_tokens = all_tokens[i:i + max_tokens_per_batch]
        result = await fcm_service.send_push_notification(
            user_tokens=batch_tokens,
            title=title,
            body=message,
            data=data
        )
        results.append(result)
    
    return {"batch_results": results}


# 편의 함수들

async def send_real_time_notification(user_id: str, notification_data: dict):
    """실시간 알림 전송 (WebSocket)"""
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"user_{user_id}",
        {
            "type": "notification_message",
            "data": notification_data
        }
    )


async def send_broadcast_notification(notification_data: dict):
    """관리자들에게 브로드캐스트 알림 전송"""
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        "admin_notifications",
        {
            "type": "admin_notification_message",
            "data": notification_data
        }
    )


async def send_adoption_update_notification(user_id: str, adoption_status: str, animal_name: str, adoption_id: str = None):
    """입양 상태 업데이트 알림"""
    message = f"{animal_name}의 입양 상태가 '{adoption_status}'로 변경되었습니다."
    
    # action_url 설정 (입양 신청 상세 페이지로 이동)
    action_url = None
    if adoption_id:
        action_url = f"/my-adoptions/{adoption_id}"
    
    await create_and_send_notification(
        user_id=user_id,
        notification_type="adoption_update",
        message=message,
        priority="high",
        action_url=action_url,
        metadata={"animal_name": animal_name, "status": adoption_status, "adoption_id": adoption_id}
    )


async def send_monitoring_reminder_notification(user_id: str, reminder_type: str, adoption_id: str = None):
    """모니터링 리마인더 알림"""
    message = f"{reminder_type} 모니터링 시간입니다."
    
    # action_url 설정 (모니터링 페이지로 이동)
    action_url = None
    if adoption_id:
        action_url = f"/my-adoptions/{adoption_id}/monitoring"
    
    await create_and_send_notification(
        user_id=user_id,
        notification_type="monitoring_reminder",
        message=message,
        priority="normal",
        action_url=action_url,
        metadata={"reminder_type": reminder_type, "adoption_id": adoption_id}
    )


async def send_center_update_notification(user_id: str, center_name: str, update_type: str, center_id: str = None):
    """센터 정보 업데이트 알림"""
    message = f"{center_name}의 {update_type} 정보가 업데이트되었습니다."
    
    # action_url 설정 (센터 상세 페이지로 이동)
    action_url = None
    if center_id:
        action_url = f"/centers/{center_id}"
    
    await create_and_send_notification(
        user_id=user_id,
        notification_type="center_update",
        message=message,
        priority="normal",
        action_url=action_url,
        metadata={"center_name": center_name, "update_type": update_type, "center_id": center_id}
    )


async def send_system_notification(user_id: str, message: str):
    """시스템 알림"""
    await create_and_send_notification(
        user_id=user_id,
        notification_type="system",
        message=message,
        priority="normal"
    )


async def create_notification_for_center_users(center_id: str, notification_type: str, message: str, 
                                             action_url: str = None, metadata: dict = None, priority: str = 'normal'):
    """센터의 모든 관리자에게 알림을 생성하고 FCM 푸시 알림을 전송합니다."""
    
    @sync_to_async
    def create_center_notifications():
        # 센터의 소유자와 관리자들을 찾기
        center_users = User.objects.filter(
            models.Q(owned_center__id=center_id) |  # 센터 소유자
            models.Q(user_type__in=['센터관리자', '센터최고관리자'])  # 센터 관리자
        ).distinct()
        
        notifications = []
        push_tokens = []
        for user in center_users:
            notification = Notification(
                user=user,
                notification_type=notification_type,
                message=message,
                priority=priority,
                action_url=action_url,
                metadata=metadata
            )
            notifications.append(notification)
            
            # 사용자의 활성 푸시 토큰들 수집
            user_tokens = PushToken.objects.filter(user=user, is_active=True).values_list('token', flat=True)
            push_tokens.extend(user_tokens)
        
        # 대량 생성
        if notifications:
            Notification.objects.bulk_create(notifications)
        
        return len(notifications), push_tokens, [str(user.id) for user in center_users]
    
    notification_count, push_tokens, user_ids = await create_center_notifications()
    
    # FCM 푸시 알림 전송
    if push_tokens:
        try:
            fcm_service = FCMPushNotificationService()
            await fcm_service.send_push_notification(
                user_tokens=push_tokens,
                title=message,
                body=message,
                data={
                    'notification_type': notification_type,
                    'action_url': action_url,
                    'metadata': metadata
                }
            )
        except Exception as e:
            logger.error(f"FCM 푸시 알림 전송 실패: {e}")
    
    # 실시간 WebSocket 알림 전송
    notification_data = {
        "message": message,
        "notification_type": notification_type,
        "priority": priority,
        "action_url": action_url,
        "metadata": metadata,
        "timestamp": timezone.now().isoformat()
    }
    
    for user_id in user_ids:
        try:
            await send_real_time_notification(user_id, notification_data)
        except Exception as e:
            logger.error(f"실시간 알림 전송 실패 (사용자 {user_id}): {e}")
    
    return notification_count


async def create_notification_for_user(user_id: str, notification_type: str, message: str,
                                     action_url: str = None, metadata: dict = None, priority: str = 'normal'):
    """특정 사용자에게 알림을 생성하고 FCM 푸시 알림을 전송합니다."""
    
    @sync_to_async
    def create_user_notification():
        notification = Notification.objects.create(
            user_id=user_id,
            notification_type=notification_type,
            message=message,
            priority=priority,
            action_url=action_url,
            metadata=metadata
        )
        
        # 사용자의 활성 푸시 토큰들 수집
        push_tokens = PushToken.objects.filter(user_id=user_id, is_active=True).values_list('token', flat=True)
        
        return notification, list(push_tokens)
    
    notification, push_tokens = await create_user_notification()
    
    # FCM 푸시 알림 전송
    if push_tokens:
        try:
            fcm_service = FCMPushNotificationService()
            await fcm_service.send_push_notification(
                user_tokens=push_tokens,
                title=message,
                body=message,
                data={
                    'notification_type': notification_type,
                    'action_url': action_url,
                    'metadata': metadata
                }
            )
        except Exception as e:
            logger.error(f"FCM 푸시 알림 전송 실패: {e}")
    
    # 실시간 WebSocket 알림 전송
    notification_data = {
        "id": str(notification.id),
        "message": message,
        "notification_type": notification_type,
        "priority": priority,
        "action_url": action_url,
        "metadata": metadata,
        "created_at": notification.created_at.isoformat()
    }
    
    try:
        await send_real_time_notification(user_id, notification_data)
    except Exception as e:
        logger.error(f"실시간 알림 전송 실패 (사용자 {user_id}): {e}")
    
    return notification


async def notify_new_adoption_application(adoption_id: str):
    """새로운 입양 신청 알림을 센터 관리자들에게 전송합니다."""
    
    @sync_to_async
    def get_adoption_info():
        adoption = Adoption.objects.select_related('animal', 'animal__center', 'user').get(id=adoption_id)
        return adoption
    
    adoption = await get_adoption_info()
    
    message = f"{adoption.user.nickname}님이 {adoption.animal.name}의 입양을 신청했습니다."
    action_url = f"/adoptions/{adoption.id}"
    metadata = {
        'adoption_id': str(adoption.id),
        'animal_id': str(adoption.animal.id),
        'user_id': str(adoption.user.id),
        'center_id': str(adoption.animal.center.id)
    }
    
    await create_notification_for_center_users(
        center_id=str(adoption.animal.center.id),
        notification_type='new_adoption_application',
        message=message,
        action_url=action_url,
        metadata=metadata,
        priority='high'
    )


async def notify_new_temporary_protection(animal_id: str):
    """새로운 임시보호 등록 알림을 센터 관리자들에게 전송합니다."""
    
    @sync_to_async
    def get_animal_info():
        animal = Animal.objects.select_related('center').get(id=animal_id)
        return animal
    
    animal = await get_animal_info()
    
    message = f"{animal.name}이(가) 임시보호로 등록되었습니다."
    action_url = f"/animals/{animal.id}"
    metadata = {
        'animal_id': str(animal.id),
        'center_id': str(animal.center.id)
    }
    
    await create_notification_for_center_users(
        center_id=str(animal.center.id),
        notification_type='new_temporary_protection',
        message=message,
        action_url=action_url,
        metadata=metadata,
        priority='normal'
    )


async def notify_monitoring_delayed_for_center(adoption_id: str, delay_days: int):
    """모니터링 지연 알림을 센터 관리자들에게 전송합니다."""
    
    @sync_to_async
    def get_adoption_info():
        adoption = Adoption.objects.select_related('animal', 'animal__center', 'user').get(id=adoption_id)
        return adoption
    
    adoption = await get_adoption_info()
    
    message = f"{adoption.user.nickname}님의 {adoption.animal.name} 모니터링이 {delay_days}일 지연되었습니다."
    action_url = f"/adoptions/{adoption.id}/monitoring"
    metadata = {
        'adoption_id': str(adoption.id),
        'delay_days': delay_days,
        'center_id': str(adoption.animal.center.id)
    }
    
    await create_notification_for_center_users(
        center_id=str(adoption.animal.center.id),
        notification_type='monitoring_delayed',
        message=message,
        action_url=action_url,
        metadata=metadata,
        priority='high'
    )


async def notify_monitoring_delayed_for_user(adoption_id: str, delay_days: int):
    """모니터링 지연 알림을 사용자에게 전송합니다."""
    
    @sync_to_async
    def get_adoption_info():
        adoption = Adoption.objects.select_related('animal', 'user').get(id=adoption_id)
        return adoption
    
    adoption = await get_adoption_info()
    
    message = f"{adoption.animal.name}의 모니터링이 {delay_days}일 지연되었습니다. 지금 바로 확인해보세요."
    action_url = f"/adoptions/my/{adoption.id}/monitoring"
    metadata = {
        'adoption_id': str(adoption.id),
        'delay_days': delay_days
    }
    
    await create_notification_for_user(
        user_id=str(adoption.user.id),
        notification_type='monitoring_delayed_user',
        message=message,
        action_url=action_url,
        metadata=metadata,
        priority='high'
    )


async def notify_new_comment(comment_id: str):
    """새로운 댓글 알림을 포스트 작성자에게 전송합니다."""
    
    @sync_to_async
    def get_comment_info():
        comment = Comment.objects.select_related('post', 'user').get(id=comment_id)
        return comment
    
    comment = await get_comment_info()
    
    # 본인이 댓글을 단 경우는 알림을 보내지 않음
    if comment.user.id == comment.post.user.id:
        return
    
    message = f"{comment.user.nickname}님이 '{comment.post.title}'에 댓글을 달았습니다. 지금 바로 확인해보세요."
    action_url = f"/posts/{comment.post.id}"
    metadata = {
        'comment_id': str(comment.id),
        'post_id': str(comment.post.id),
        'commenter_id': str(comment.user.id)
    }
    
    await create_notification_for_user(
        user_id=str(comment.post.user.id),
        notification_type='new_comment',
        message=message,
        action_url=action_url,
        metadata=metadata,
        priority='normal'
    )


async def notify_new_reply(reply_id: str):
    """새로운 대댓글 알림을 댓글 작성자에게 전송합니다."""
    
    @sync_to_async
    def get_reply_info():
        reply = Reply.objects.select_related('comment', 'comment__post', 'user').get(id=reply_id)
        return reply
    
    reply = await get_reply_info()
    
    # 본인이 대댓글을 단 경우는 알림을 보내지 않음
    if reply.user.id == reply.comment.user.id:
        return
    
    message = f"{reply.user.nickname}님이 '{reply.comment.post.title}'의 댓글에 대댓글을 달았습니다. 지금 바로 확인해보세요."
    action_url = f"/posts/{reply.comment.post.id}"
    metadata = {
        'reply_id': str(reply.id),
        'comment_id': str(reply.comment.id),
        'post_id': str(reply.comment.post.id),
        'replier_id': str(reply.user.id)
    }
    
    await create_notification_for_user(
        user_id=str(reply.comment.user.id),
        notification_type='new_reply',
        message=message,
        action_url=action_url,
        metadata=metadata,
        priority='normal'
    )


async def check_and_notify_monitoring_delays():
    """모니터링 지연을 확인하고 알림을 전송합니다."""
    
    @sync_to_async
    def get_delayed_monitorings():
        # 모니터링이 지연된 입양 신청들을 찾기
        now = timezone.now()
        delayed_adoptions = []
        
        adoptions = Adoption.objects.filter(
            monitoring_status='진행중',
            monitoring_next_check_at__lt=now
        ).select_related('animal', 'animal__center', 'user')
        
        for adoption in adoptions:
            delay_days = (now - adoption.monitoring_next_check_at).days
            if delay_days > 0:
                delayed_adoptions.append((adoption, delay_days))
        
        return delayed_adoptions
    
    delayed_adoptions = await get_delayed_monitorings()
    
    for adoption, delay_days in delayed_adoptions:
        # 센터 관리자들에게 알림
        await notify_monitoring_delayed_for_center(str(adoption.id), delay_days)
        # 사용자에게 알림
        await notify_monitoring_delayed_for_user(str(adoption.id), delay_days)


# 필요한 import 추가
from django.db import models
from animals.models import Animal
from comments.models import Reply
