from django.contrib import admin
from .models import Animal, AnimalImage, AnimalMegaphone


@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'center', 'breed', 'age', 'is_female', 'protection_status', 'adoption_status', 'megaphone_count', 'found_location', 'admission_date', 'created_at']
    list_filter = ['protection_status', 'adoption_status', 'is_female', 'center__region', 'breed', 'admission_date']
    search_fields = ['name', 'breed', 'center__name', 'found_location']
    readonly_fields = ['created_at', 'updated_at', 'megaphone_count']
    list_editable = ['protection_status', 'adoption_status']
    autocomplete_fields = ['center']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('center', 'name', 'announce_number', 'breed', 'age', 'is_female', 'weight')
        }),
        ('상태 정보', {
            'fields': ('protection_status', 'adoption_status', 'neutering', 'vaccination', 'heartworm')
        }),
        ('상세 정보', {
            'fields': ('description', 'personality', 'health_notes', 'special_needs')
        }),
        ('위치 및 입소 정보', {
            'fields': ('found_location', 'admission_date')
        }),
        ('행동 및 훈련 정보', {
            'fields': ('activity_level', 'sensitivity', 'sociability', 'separation_anxiety', 'trainer_name', 'trainer_comment')
        }),
        ('기타', {
            'fields': ('adoption_fee', 'is_public')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AnimalImage)
class AnimalImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'animal', 'image_url', 'is_primary', 'sequence']
    list_filter = ['is_primary']
    search_fields = ['animal__name']
    ordering = ['animal', 'sequence']
    list_editable = ['is_primary', 'sequence']


@admin.register(AnimalMegaphone)
class AnimalMegaphoneAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'animal', 'animal_center', 'created_at']
    list_filter = ['animal__protection_status', 'animal__adoption_status', 'animal__center__region', 'created_at']
    search_fields = ['user__username', 'animal__name', 'animal__center__name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
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
