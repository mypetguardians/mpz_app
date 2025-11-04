from django.contrib import admin
from .models import Post, PostImage, PostTag, SystemTag, PostLike


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'is_all_access', 'created_at']
    list_filter = ['is_all_access', 'created_at']
    search_fields = ['user__username', 'title', 'content']
    list_editable = ['is_all_access']
    readonly_fields = ['created_at', 'updated_at']
    list_select_related = False  # 명시적으로 비활성화
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'title', 'content', 'animal', 'content_tags', 'is_all_access')
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


@admin.register(SystemTag)
class SystemTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'sequence', 'is_active', 'usage_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    list_editable = ['sequence', 'is_active']
    readonly_fields = ['usage_count', 'created_at', 'updated_at']
    ordering = ['sequence', 'name']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('name', 'description', 'sequence', 'is_active')
        }),
        ('통계 정보', {
            'fields': ('usage_count',),
            'classes': ('collapse',)
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['update_usage_counts', 'activate_tags', 'deactivate_tags']
    
    def update_usage_counts(self, request, queryset):
        """선택된 태그들의 사용 횟수를 업데이트합니다."""
        updated = 0
        for tag in queryset:
            tag.update_usage_count()
            updated += 1
        self.message_user(request, f"{updated}개의 태그 사용 횟수가 업데이트되었습니다.")
    update_usage_counts.short_description = "사용 횟수 업데이트"
    
    def activate_tags(self, request, queryset):
        """선택된 태그들을 활성화합니다."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated}개의 태그가 활성화되었습니다.")
    activate_tags.short_description = "태그 활성화"
    
    def deactivate_tags(self, request, queryset):
        """선택된 태그들을 비활성화합니다."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated}개의 태그가 비활성화되었습니다.")
    deactivate_tags.short_description = "태그 비활성화"


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__title']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'post')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
