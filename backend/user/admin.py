from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Jwt, PhoneVerificationRequest, PhoneVerificationToken
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'nickname', 'user_type', 'status', 'is_phone_verified', 'created_at']
    list_filter = ['user_type', 'status', 'is_phone_verified', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'nickname', 'phone_number', 'kakao_id']
    list_editable = ['status', 'user_type', 'is_phone_verified']
    readonly_fields = ['created_at', 'updated_at']
    
    # BaseUserAdmin의 기본 fieldsets를 오버라이드하여 first_name, last_name 제거
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        ('개인 정보', {
            'fields': ('email', 'nickname', 'phone_number', 'user_type', 'is_phone_verified', 'phone_verified_at', 'kakao_id', 'image')
        }),
        ('추가 정보', {
            'fields': ('birth', 'address', 'address_is_public')
        }),
        ('권한', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('중요한 날짜', {
            'fields': ('last_login', 'date_joined')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
        ('개인 정보', {
            'fields': ('email', 'nickname', 'phone_number', 'user_type', 'kakao_id', 'image')
        }),
        ('추가 정보', {
            'fields': ('birth', 'address', 'address_is_public')
        }),
    )


@admin.register(Jwt)
class JwtAdmin(admin.ModelAdmin):
    list_display = ['user', 'access', 'refresh', 'created_at']
    list_filter = ['user__user_type']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'access', 'refresh')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PhoneVerificationRequest)
class PhoneVerificationRequestAdmin(admin.ModelAdmin):
    list_display = ['phone_number', 'verification_code', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used']
    search_fields = ['phone_number', 'verification_code']
    list_editable = ['is_used']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('phone_number', 'verification_code', 'is_used')
        }),
        ('만료 정보', {
            'fields': ('expires_at',)
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PhoneVerificationToken)
class PhoneVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone_number', 'token', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used', 'user__user_type']
    search_fields = ['user__username', 'phone_number', 'token']
    list_editable = ['is_used']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'phone_number', 'token', 'is_used')
        }),
        ('만료 정보', {
            'fields': ('expires_at',)
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )