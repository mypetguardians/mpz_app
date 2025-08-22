from django.contrib import admin
from .models import Comment, Reply


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'user', 'content', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'content', 'post__title']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('post', 'user', 'content')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'comment', 'content', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'comment__content', 'content']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'comment', 'content')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
