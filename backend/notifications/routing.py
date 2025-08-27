from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # 사용자별 실시간 알림
    re_path(
        r"ws/notifications/(?P<user_id>\w+)/$",
        consumers.NotificationConsumer.as_asgi()
    ),
    
    # 관리자 브로드캐스트 알림
    re_path(
        r"ws/admin/notifications/$",
        consumers.BroadcastConsumer.as_asgi()
    ),
]
