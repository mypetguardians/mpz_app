from django.contrib import admin
from .models import Notification, PushToken


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'notification_type', 'title', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read']
    search_fields = ['user__username', 'title', 'message']
    list_editable = ['priority', 'is_read']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'notification_type', 'title', 'message', 'priority')
        }),
        ('상태 정보', {
            'fields': ('is_read', 'read_at', 'action_url', 'metadata')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'platform', 'token', 'is_active', 'last_used']
    list_filter = ['platform', 'is_active']
    search_fields = ['user__username', 'device_id', 'token']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'platform', 'token', 'device_id')
        }),
        ('상태 정보', {
            'fields': ('is_active', 'last_used')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
