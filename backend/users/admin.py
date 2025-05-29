from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'userType', 'email_verified', 'is_staff', 'is_active', 'date_joined')
    
    list_filter = ('userType', 'email_verified', 'is_staff', 'is_active', 'date_joined', 'bypass_otp')
    
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('interests', 'userType', 'email_verified', 'bypass_otp')
        }),
        ('OTP Info', {
            'fields': ('otp_secret', 'otp_created_at'),
            'classes': ('collapse',)  
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'interests', 'userType', 'email_verified', 'bypass_otp')
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login', 'otp_created_at')
    
    ordering = ('-date_joined',)
