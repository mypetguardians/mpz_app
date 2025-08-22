import os
import json
import logging
from typing import List, Dict, Optional
from django.conf import settings
from notifications.models import Notification, PushToken
from asgiref.sync import sync_to_async
import httpx

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
    title: str,
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
        title: 알림 제목
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
                title=title,
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
        await send_push_notification_to_user(user_id, title, message, metadata)
    
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

async def send_adoption_update_notification(user_id: str, adoption_status: str, animal_name: str):
    """입양 상태 업데이트 알림"""
    title = f"입양 상태 업데이트: {animal_name}"
    message = f"{animal_name}의 입양 상태가 '{adoption_status}'로 변경되었습니다."
    
    await create_and_send_notification(
        user_id=user_id,
        notification_type="adoption_update",
        title=title,
        message=message,
        priority="high",
        metadata={"animal_name": animal_name, "status": adoption_status}
    )


async def send_monitoring_reminder_notification(user_id: str, reminder_type: str):
    """모니터링 리마인더 알림"""
    title = "모니터링 알림"
    message = f"{reminder_type} 모니터링 시간입니다."
    
    await create_and_send_notification(
        user_id=user_id,
        notification_type="monitoring_reminder",
        title=title,
        message=message,
        priority="normal",
        metadata={"reminder_type": reminder_type}
    )


async def send_center_update_notification(user_id: str, center_name: str, update_type: str):
    """센터 정보 업데이트 알림"""
    title = f"센터 업데이트: {center_name}"
    message = f"{center_name}의 {update_type} 정보가 업데이트되었습니다."
    
    await create_and_send_notification(
        user_id=user_id,
        notification_type="center_update",
        title=title,
        message=message,
        priority="normal",
        metadata={"center_name": center_name, "update_type": update_type}
    )


async def send_system_notification(user_id: str, title: str, message: str):
    """시스템 알림"""
    await create_and_send_notification(
        user_id=user_id,
        notification_type="system",
        title=title,
        message=message,
        priority="normal"
    )
