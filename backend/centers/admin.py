from django.contrib import admin
from django.db import models
from centers.models import Center, AdoptionContractTemplate, QuestionForm


@admin.register(Center)
class CenterAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'region', 'verified', 'is_public', 'is_subscribed', 'has_volunteer', 'has_foster_care', 'show_phone_number', 'show_location', 'created_at']
    list_filter = ['region', 'verified', 'is_public', 'is_subscribed', 'has_monitoring', 'has_volunteer', 'has_foster_care', 'show_phone_number', 'show_location']
    search_fields = ['name', 'owner__username', 'center_number']
    list_editable = ['verified', 'is_public', 'is_subscribed', 'has_volunteer', 'has_foster_care', 'show_phone_number', 'show_location']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('owner', 'name', 'center_number', 'description', 'image_url')
        }),
        ('위치 정보', {
            'fields': ('location', 'region', 'phone_number', 'show_location', 'show_phone_number')
        }),
        ('입양 관련', {
            'fields': ('adoption_procedure', 'adoption_guidelines', 'adoption_price')
        }),
        ('모니터링', {
            'fields': ('has_monitoring', 'monitoring_period_months', 'monitoring_interval_days', 'monitoring_description')
        }),
        ('서비스', {
            'fields': ('has_volunteer', 'has_foster_care')
        }),
        ('상태', {
            'fields': ('verified', 'is_public', 'is_subscribed')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """센터 목록 조회 시 안전한 쿼리셋 반환"""
        return super().get_queryset(request).select_related('owner')
    
    def save_model(self, request, obj, form, change):
        """센터 저장 시 안전한 저장 처리"""
        try:
            super().save_model(request, obj, form, change)
        except Exception as e:
            from django.contrib import messages
            messages.error(request, f"센터 저장 중 오류가 발생했습니다: {str(e)}")
            raise
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """owner 필드에 대한 안전한 폼 필드 설정"""
        if db_field.name == "owner":
            from user.models import User
            # 올바른 user_type 선택지 사용 ('최고관리자' -> '센터최고관리자')
            kwargs["queryset"] = User.objects.filter(
                user_type__in=['센터관리자', '센터최고관리자']
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(AdoptionContractTemplate)
class AdoptionContractTemplateAdmin(admin.ModelAdmin):
    list_display = ['title', 'center', 'is_active', 'created_at']
    list_filter = ['is_active', 'center']
    search_fields = ['title', 'center__name']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('center', 'title', 'description', 'is_active')
        }),
        ('계약서 내용', {
            'fields': ('content',)
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(QuestionForm)
class QuestionFormAdmin(admin.ModelAdmin):
    list_display = ['center', 'question', 'type', 'is_required', 'sequence', 'created_at']
    list_filter = ['center', 'type', 'is_required']
    search_fields = ['center__name', 'question']
    list_editable = ['is_required', 'sequence']
    ordering = ['center', 'sequence']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('center', 'question', 'type', 'is_required', 'sequence')
        }),
        ('선택지', {
            'fields': ('options',)
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
