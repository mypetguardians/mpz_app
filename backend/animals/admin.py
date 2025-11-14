from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Animal, AnimalImage, AnimalMegaphone, AdoptionApplication

@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    """동물 관리자"""
    
    list_display = [
        'name', 'center', 'age', 'weight', 'is_female_display', 
        'protection_status', 'adoption_status', 'is_public_data',
        'admission_date', 'created_at'
    ]
    list_filter = [
        'protection_status', 'adoption_status', 'is_female', 'is_public_data',
        'center', 'admission_date', 'created_at'
    ]
    search_fields = ['name', 'announce_number', 'public_notice_number', 'breed']
    list_per_page = 25
    
    # 센터별 그룹화
    list_select_related = ['center']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('name', 'center', 'announce_number', 'breed', 'age', 
                      'is_female', 'weight', 'admission_date', 'found_location')
        }),
        ('상태 정보', {
            'fields': ('protection_status', 'adoption_status', 'is_public', 
                      'is_public_data', 'public_notice_number')
        }),
        ('건강/관리', {
            'fields': ('neutering', 'vaccination', 'heartworm', 'adoption_fee')
        }),
        ('설명 및 성격', {
            'fields': ('description', 'personality', 'health_notes', 'special_needs')
        }),
        ('공공데이터', {
            'fields': ('comment', 'notice_start_date', 'notice_end_date'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'megaphone_count')
    
    def is_female_display(self, obj):
        """암컷 표시 (아이콘 포함)"""
        if obj.is_female:
            return format_html('<span style="color: pink;">♀ 암컷</span>')
        return format_html('<span style="color: blue;">♂ 수컷</span>')
    is_female_display.short_description = '성별'
    
    def get_queryset(self, request):
        """관리자용 쿼리셋 최적화"""
        qs = super().get_queryset(request)
        return qs.select_related('center').prefetch_related('animalimage_set')

class AnimalImageInline(admin.TabularInline):
    """동물 이미지 인라인"""
    model = AnimalImage
    extra = 1
    fields = ('image_url', 'is_primary', 'sequence')
    readonly_fields = ('image_url_preview',)
    
    def image_url_preview(self, obj):
        """이미지 URL 미리보기"""
        if obj.image_url:
            return mark_safe(f'<img src="{obj.image_url}" style="max-height: 50px; max-width: 50px;" />')
        return "이미지 없음"
    image_url_preview.short_description = '미리보기'

@admin.register(AdoptionApplication)
class AdoptionApplicationAdmin(admin.ModelAdmin):
    """입양 신청 관리자"""
    
    list_display = [
        'user_link', 'animal_link', 'status_display', 'application_date',
        'approval_date', 'processing_days', 'contact_phone', 'is_active'
    ]
    list_filter = [
        'status', 'application_date', 'approval_date', 'has_pet_experience',
        'can_visit_center'
    ]
    search_fields = [
        'user__username', 'user__email', 'user__phone_number', 
        'animal__name', 'reason', 'contact_phone', 'contact_email'
    ]
    list_per_page = 20
    
    # 사용자와 동물 관계 설정
    list_select_related = ['user', 'animal', 'processed_by']
    
    fieldsets = (
        ('신청자 정보', {
            'fields': ('user', 'contact_phone', 'contact_email', 'home_address', 
                      'family_size', 'has_pet_experience', 'can_visit_center')
        }),
        ('입양 대상', {
            'fields': ('animal',)
        }),
        ('신청 내용', {
            'fields': ('reason', 'status', 'application_date', 'approval_date')
        }),
        ('관리자 정보', {
            'fields': ('processed_by', 'admin_notes'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('application_date',)
    
    # 인라인 설정
    inlines = [AnimalImageInline]
    
    def get_readonly_fields(self, request, obj=None):
        """신청자는 상태 변경만 가능하도록"""
        if obj and obj.status != 'pending':
            return self.readonly_fields + ('user', 'animal', 'reason', 'contact_phone', 
                                         'contact_email', 'home_address')
        return self.readonly_fields
    
    def user_link(self, obj):
        """사용자 링크"""
        if obj.user:
            url = reverse('admin:user_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.username)
        return "-"
    user_link.short_description = '신청자'
    
    def animal_link(self, obj):
        """동물 링크"""
        if obj.animal:
            url = reverse('admin:animals_animal_change', args=[obj.animal.id])
            return format_html('<a href="{}">{}</a>', url, obj.animal.name)
        return "-"
    animal_link.short_description = '동물'
    
    def status_display(self, obj):
        """상태 컬러 표시"""
        colors = {
            'pending': 'orange',
            'approved': 'green', 
            'rejected': 'red',
            'cancelled': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html('<span style="color: {};">{}</span>', 
                          color, obj.get_status_display())
    status_display.short_description = '상태'
    
    def processing_days(self, obj):
        """처리 경과일"""
        return obj.processing_days
    processing_days.short_description = '경과일'
    
    def is_active(self, obj):
        """활성 신청 여부"""
        return obj.is_active
    is_active.boolean = True
    is_active.short_description = '활성'
    
    def save_model(self, request, obj, form, change):
        """관리자 저장 시 처리자 정보 추가"""
        if not obj.processed_by:
            obj.processed_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """활성 신청 우선 표시"""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'animal', 'processed_by').prefetch_related('animal__animalimage_set')

# 기존 모델들도 등록 (이미 등록되어 있다면 중복 등록 방지)
try:
    admin.site.register(AnimalImage)
except admin.sites.AlreadyRegistered:
    pass

try:
    admin.site.register(AnimalMegaphone)
except admin.sites.AlreadyRegistered:
    pass

# 동물 목록에서 입양 신청 수 표시를 위한 커스텀 필드
class AnimalWithApplicationsAdmin(AnimalAdmin):
    """입양 신청이 있는 동물 우선 표시"""
    
    def pending_applications_count(self, obj):
        """대기중인 입양 신청 수"""
        count = obj.adoptionapplication_set.filter(status='pending').count()
        if count > 0:
            url = reverse('admin:animals_adoptionapplication_changelist')
            return format_html('<a href="{}?animal__id__exact={}">{}</a>', 
                              url, obj.id, count)
        return 0
    pending_applications_count.short_description = '대기 신청'

# 기본 AnimalAdmin 사용
admin.site.register(Animal, AnimalAdmin)
