from django.contrib import admin
from adoptions.models import (
    Adoption, AdoptionQuestion, AdoptionQuestionResponse, 
    AdoptionContract, AdoptionMonitoring, AdoptionMonitoringCheck
)


class AdoptionQuestionResponseInline(admin.TabularInline):
    model = AdoptionQuestionResponse
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


class AdoptionMonitoringInline(admin.TabularInline):
    model = AdoptionMonitoring
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


class AdoptionMonitoringCheckInline(admin.TabularInline):
    model = AdoptionMonitoringCheck
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Adoption)
class AdoptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'animal', 'status', 'monitoring_status', 'created_at']
    list_display_links = ['id']
    list_filter = ['status', 'monitoring_status', 'monitoring_agreement', 'guidelines_agreement']
    search_fields = ['user__username', 'animal__name', 'animal__center__name']
    list_editable = ['status', 'monitoring_status']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [AdoptionQuestionResponseInline, AdoptionMonitoringInline, AdoptionMonitoringCheckInline]
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'animal', 'status', 'notes')
        }),
        ('동의 사항', {
            'fields': ('monitoring_agreement', 'guidelines_agreement')
        }),
        ('일정 관리', {
            'fields': ('meeting_scheduled_at', 'contract_sent_at', 'adoption_completed_at')
        }),
        ('모니터링', {
            'fields': ('monitoring_started_at', 'monitoring_next_check_at', 'monitoring_end_date')
        }),
        ('모니터링 통계', {
            'fields': ('monitoring_completed_checks', 'monitoring_total_checks', 'monitoring_status')
        }),
        ('센터 메모', {
            'fields': ('center_notes',)
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AdoptionQuestion)
class AdoptionQuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'center', 'sequence', 'content', 'is_active', 'created_at']
    list_display_links = ['id']
    list_filter = ['center', 'is_active']
    search_fields = ['center__name', 'content']
    list_editable = ['sequence', 'is_active']
    ordering = ['center', 'sequence']


@admin.register(AdoptionQuestionResponse)
class AdoptionQuestionResponseAdmin(admin.ModelAdmin):
    list_display = ['id', 'adoption', 'question', 'answer', 'created_at']
    list_filter = ['adoption__status']
    search_fields = ['adoption__user__username', 'adoption__animal__name', 'question__content']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AdoptionContract)
class AdoptionContractAdmin(admin.ModelAdmin):
    list_display = ['id', 'adoption', 'template', 'status', 'user_signed_at', 'center_signed_at']
    list_display_links = ['id']
    list_filter = ['status', 'template__center']
    search_fields = ['adoption__user__username', 'adoption__animal__name']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('adoption', 'template', 'status')
        }),
        ('계약서 내용', {
            'fields': ('contract_content', 'guidelines_content')
        }),
        ('서명 정보', {
            'fields': ('user_signature_url', 'user_signed_at', 'center_signature_url', 'center_signed_at')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AdoptionMonitoring)
class AdoptionMonitoringAdmin(admin.ModelAdmin):
    list_display = ['id', 'adoption', 'created_at']
    list_filter = ['adoption__status']
    search_fields = ['adoption__user__username', 'adoption__animal__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AdoptionMonitoringCheck)
class AdoptionMonitoringCheckAdmin(admin.ModelAdmin):
    list_display = ['id', 'adoption', 'check_sequence', 'status', 'check_date', 'expected_check_date']
    list_filter = ['status', 'adoption__status']
    search_fields = ['adoption__user__username', 'adoption__animal__name']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['adoption', 'check_sequence']
