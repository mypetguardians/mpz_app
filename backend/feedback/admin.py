from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'status', 'priority', 'user', 
        'content_preview', 'created_at', 'responded_at'
    ]
    list_filter = [
        'status', 'priority', 'created_at', 'responded_at'
    ]
    search_fields = [
        'content', 'user__username', 'admin_response'
    ]
    readonly_fields = [
        'created_at', 'updated_at'
    ]
    list_editable = ['status', 'priority']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'content', 'status', 'priority')
        }),
        ('관리자 응답', {
            'fields': ('admin_response', 'admin', 'responded_at')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def content_preview(self, obj):
        """내용 미리보기"""
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = "내용 미리보기"
    
    def get_queryset(self, request):
        """관리자 권한에 따른 쿼리셋 제한"""
        qs = super().get_queryset(request)
        if request.user.user_type == "센터관리자":
            # 센터관리자는 자신의 센터 관련 피드백만 볼 수 있음
            # (필요시 추가 로직 구현)
            pass
        return qs
    
    def has_change_permission(self, request, obj=None):
        """수정 권한 체크"""
        if not request.user.user_type or request.user.user_type not in ["센터관리자", "최고관리자"]:
            return False
        return super().has_change_permission(request, obj)
    
    def has_delete_permission(self, request, obj=None):
        """삭제 권한 체크"""
        if not request.user.user_type or request.user.user_type not in ["센터관리자", "최고관리자"]:
            return False
        return super().has_delete_permission(request, obj)
