"""
URL configuration for cfehome project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from api.docs import MixedDocs
from user.api import router as user_router
from user.admin_api import router as admin_router
from user.kakao_api import router as kakao_router
from adoptions.api.main_api import router as adoption_router
from animals.api import router as animals_router
from centers.api import router as centers_router
from cloudflare.api import router as cloudflare_router
from favorites.api import router as favorites_router
from notifications.api import router as notifications_router
from posts.api import router as posts_router
from comments.api.main_api import router as comments_router
from ai.api import router as ai_router
from feedback.api import router as feedback_router
from banners.api import router as banners_router
from django.contrib.admin.views.decorators import staff_member_required

base_api = NinjaAPI(
    title="MPZ API",
    version="0.1.0",
    docs_url="/<engine>/",
    docs_decorator=staff_member_required,
    docs=MixedDocs(),
)


@base_api.get("", include_in_schema=False)
def health_check_handler(request):
    return {"ping": "pong"}


base_api.add_router("v1/auth", user_router)
base_api.add_router("v1/admin", admin_router)
base_api.add_router("v1/kakao", kakao_router)
base_api.add_router("v1/adoptions", adoption_router)
base_api.add_router("v1/animals", animals_router)
base_api.add_router("v1/centers", centers_router)
base_api.add_router("v1/cloudflare", cloudflare_router)
base_api.add_router("v1/favorites", favorites_router)
base_api.add_router("v1/notifications", notifications_router)
base_api.add_router("v1/posts", posts_router)
base_api.add_router("v1/comments", comments_router)
base_api.add_router("v1/ai", ai_router)
base_api.add_router("v1/feedback", feedback_router)
base_api.add_router("v1/banners", banners_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", base_api.urls),
]
