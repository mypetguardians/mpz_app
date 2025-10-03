from django.contrib import admin
from .models import CenterFavorite, AnimalFavorite, PersonalityTest


@admin.register(CenterFavorite)
class CenterFavoriteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'center', 'created_at']
    list_filter = ['center__region', 'center__verified']
    search_fields = ['user__username', 'center__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'center')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AnimalFavorite)
class AnimalFavoriteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'animal', 'animal_center', 'created_at']
    list_filter = ['animal__protection_status', 'animal__adoption_status', 'animal__center__region']
    search_fields = ['user__username', 'animal__name', 'animal__center__name']
    readonly_fields = ['created_at', 'updated_at']
    
    def animal_center(self, obj):
        return obj.animal.center.name if obj.animal and obj.animal.center else '-'
    animal_center.short_description = '센터'
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'animal')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PersonalityTest)
class PersonalityTestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'test_type', 'completed_at', 'created_at']
    list_filter = ['test_type']
    search_fields = ['user__username', 'test_type']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'test_type', 'completed_at')
        }),
        ('테스트 결과', {
            'fields': ('answers', 'result')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
