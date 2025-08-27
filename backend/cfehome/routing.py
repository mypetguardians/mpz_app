from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack


def get_websocket_urlpatterns():
    from notifications.routing import websocket_urlpatterns as notification_urlpatterns
    
    return notification_urlpatterns


def get_application():
    django_asgi_app = get_asgi_application()
    return ProtocolTypeRouter(
        {
            "http": django_asgi_app,
            "websocket": AuthMiddlewareStack(URLRouter(get_websocket_urlpatterns())),
        }
    )
