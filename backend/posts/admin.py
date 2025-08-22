from django.contrib import admin
from .models import Post, PostImage, PostTag


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'title', 'content']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'title', 'content', 'animal', 'adoption', 'content_tags')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PostImage)
class PostImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'image_url', 'order_index', 'created_at']
    list_filter = ['created_at']
    search_fields = ['post__title', 'post__user__username']
    list_editable = ['order_index']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['post', 'order_index']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('post', 'image_url', 'order_index')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PostTag)
class PostTagAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'tag_name', 'created_at']
    list_filter = ['created_at']
    search_fields = ['post__title', 'tag_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('post', 'tag_name')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
