from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from banners.models import Banner
from django.db import models


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    """배너 관리자"""
    
    list_display = [
        'id', 'type', 'title_or_alt', 'image_preview', 'order_index', 
        'is_active', 'link_url_display', 'created_at'
    ]
    
    list_filter = [
        'type', 'is_active', 'created_at'
    ]
    
    search_fields = [
        'title', 'description', 'alt'
    ]
    
    list_editable = [
        'order_index', 'is_active'
    ]
    
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'image_preview_large'
    ]
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('type', 'title', 'description', 'alt')
        }),
        ('이미지 및 링크', {
            'fields': ('image_url', 'image_preview_large', 'link_url')
        }),
        ('설정', {
            'fields': ('order_index', 'is_active')
        }),
        ('시스템 정보', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['type', 'order_index', '-created_at']
    
    actions = ['activate_banners', 'deactivate_banners', 'reorder_banners']
    
    def title_or_alt(self, obj):
        """제목이 있으면 제목, 없으면 alt 텍스트 표시"""
        return obj.title if obj.title else obj.alt
    title_or_alt.short_description = "제목/설명"
    
    def image_preview(self, obj):
        """목록에서 이미지 미리보기"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-width: 60px; max-height: 40px; object-fit: cover;" />',
                obj.image_url
            )
        return "이미지 없음"
    image_preview.short_description = "이미지"
    
    def image_preview_large(self, obj):
        """상세에서 큰 이미지 미리보기"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 200px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;" />',
                obj.image_url
            )
        return "이미지 없음"
    image_preview_large.short_description = "이미지 미리보기"
    
    def link_url_display(self, obj):
        """링크 URL 표시 (클릭 가능)"""
        if obj.link_url:
            return format_html(
                '<a href="{}" target="_blank">{}</a>',
                obj.link_url, obj.link_url[:50] + "..." if len(obj.link_url) > 50 else obj.link_url
            )
        return "-"
    link_url_display.short_description = "링크 URL"
    
    def activate_banners(self, request, queryset):
        """선택된 배너들을 활성화"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated}개의 배너가 활성화되었습니다.")
    activate_banners.short_description = "선택된 배너 활성화"
    
    def deactivate_banners(self, request, queryset):
        """선택된 배너들을 비활성화"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated}개의 배너가 비활성화되었습니다.")
    deactivate_banners.short_description = "선택된 배너 비활성화"
    
    def reorder_banners(self, request, queryset):
        """선택된 배너들의 순서를 재정렬"""
        banners = list(queryset.order_by('type', 'created_at'))
        for i, banner in enumerate(banners):
            banner.order_index = (i + 1) * 10  # 10, 20, 30... 순서로 설정
            banner.save(update_fields=['order_index'])
        self.message_user(request, f"{len(banners)}개의 배너 순서가 재정렬되었습니다.")
    reorder_banners.short_description = "선택된 배너 순서 재정렬"
    
    class Media:
        css = {
            'all': ('admin/css/banner_admin.css',)
        }
        js = ('admin/js/banner_admin.js',)
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        return super().get_queryset(request).select_related()
    
    def save_model(self, request, obj, form, change):
        """모델 저장 시 자동 처리"""
        if not change:  # 새로 생성하는 경우
            # 같은 타입의 배너 중 가장 큰 order_index + 10
            max_order = Banner.objects.filter(type=obj.type).aggregate(
                max_order=models.Max('order_index')
            )['max_order'] or 0
            obj.order_index = max_order + 10
        
        super().save_model(request, obj, form, change)
