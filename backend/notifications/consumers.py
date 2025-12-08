import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from notifications.models import Notification, PushToken

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """실시간 알림을 위한 WebSocket Consumer"""
    
    async def connect(self):
        """WebSocket 연결 시 호출"""
        # 사용자 인증 확인
        if self.scope["user"].is_authenticated:
            self.user = self.scope["user"]
            self.user_group_name = f"user_{self.user.id}"
            
            # 사용자 그룹에 추가
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # 연결 성공 메시지 전송
            await self.send(text_data=json.dumps({
                "type": "connection_established",
                "message": "실시간 알림 연결이 성공했습니다",
                "user_id": str(self.user.id)
            }))
            
            # 연결된 사용자 정보 로깅
            print(f"사용자 {self.user.username} ({self.user.id}) 실시간 알림 연결")
        else:
            # 인증되지 않은 사용자는 연결 거부
            await self.close()
    
    async def disconnect(self, close_code):
        """WebSocket 연결 해제 시 호출"""
        if hasattr(self, 'user_group_name'):
            # 사용자 그룹에서 제거
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            
            if hasattr(self, 'user'):
                print(f"사용자 {self.user.username} ({self.user.id}) 실시간 알림 연결 해제")
    
    async def receive(self, text_data):
        """클라이언트로부터 메시지 수신 시 호출"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # 핑 메시지에 대한 응답
                await self.send(text_data=json.dumps({
                    "type": "pong",
                    "timestamp": data.get('timestamp')
                }))
            elif message_type == 'get_notifications':
                # 최근 알림 요청
                await self.send_recent_notifications()
            elif message_type == 'mark_read':
                # 알림 읽음 처리
                notification_id = data.get('notification_id')
                await self.mark_notification_read(notification_id)
            else:
                # 알 수 없는 메시지 타입
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"알 수 없는 메시지 타입: {message_type}"
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "잘못된 JSON 형식입니다"
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": f"오류가 발생했습니다: {str(e)}"
            }))
    
    async def notification_message(self, event):
        """실시간 알림 메시지 전송"""
        # 클라이언트에게 알림 데이터 전송
        notification_data = event["data"]
        await self.send(text_data=json.dumps({
            "type": "new_notification",
            "id": notification_data.get("id"),
            "message": notification_data.get("message"),
            "notification_type": notification_data.get("notification_type"),
            "priority": notification_data.get("priority"),
            "action_url": notification_data.get("action_url"),
            "metadata": notification_data.get("metadata"),
            "created_at": notification_data.get("created_at"),
            "is_read": False,
            "title": notification_data.get("message", "")  # title 필드 추가
        }))
    
    async def send_recent_notifications(self):
        """최근 알림 전송"""
        notifications = await self.get_recent_notifications()
        await self.send(text_data=json.dumps({
            "type": "recent_notifications",
            "data": notifications
        }))
    
    async def mark_notification_read(self, notification_id):
        """알림 읽음 처리"""
        success = await self.mark_notification_read_async(notification_id)
        await self.send(text_data=json.dumps({
            "type": "mark_read_result",
            "success": success,
            "notification_id": notification_id
        }))
    
    @database_sync_to_async
    def get_recent_notifications(self):
        """최근 알림 조회"""
        notifications = Notification.objects.filter(
            user=self.user
        ).order_by('-created_at')[:10]
        
        return [
            {
                "id": str(notification.id),
                "title": notification.message,  # title 필드가 없으므로 message 사용
                "message": notification.message,
                "notification_type": notification.notification_type,
                "priority": notification.priority,
                "is_read": notification.is_read,
                "action_url": notification.action_url,
                "metadata": notification.metadata,
                "created_at": notification.created_at.isoformat()
            }
            for notification in notifications
        ]
    
    @database_sync_to_async
    def mark_notification_read_async(self, notification_id):
        """알림 읽음 처리 (비동기)"""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=self.user
            )
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False


class BroadcastConsumer(AsyncWebsocketConsumer):
    """브로드캐스트 알림을 위한 Consumer (관리자용)"""
    
    async def connect(self):
        """WebSocket 연결 시 호출"""
        # 관리자 권한 확인
        if self.scope["user"].is_authenticated and self.scope["user"].is_staff:
            self.user = self.scope["user"]
            self.admin_group_name = "admin_notifications"
            
            # 관리자 그룹에 추가
            await self.channel_layer.group_add(
                self.admin_group_name,
                self.channel_name
            )
            
            await self.accept()
            
            await self.send(text_data=json.dumps({
                "type": "admin_connection_established",
                "message": "관리자 실시간 알림 연결이 성공했습니다"
            }))
        else:
            await self.close()
    
    async def disconnect(self, close_code):
        """WebSocket 연결 해제 시 호출"""
        if hasattr(self, 'admin_group_name'):
            await self.channel_layer.group_discard(
                self.admin_group_name,
                self.channel_name
            )
    
    async def admin_notification_message(self, event):
        """관리자 알림 메시지 전송"""
        await self.send(text_data=json.dumps({
            "type": "admin_notification",
            "data": event["data"]
        }))
