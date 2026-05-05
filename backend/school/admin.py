from django.contrib import admin

from school.models import UserSchoolProfile


@admin.register(UserSchoolProfile)
class UserSchoolProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__email', 'user__nickname', 'user__kakao_id')
    readonly_fields = ('id', 'created_at', 'updated_at')
    autocomplete_fields = ('user',)
