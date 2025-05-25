from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Fields to display in the admin list view
    list_display = ('username', 'email', 'first_name', 'last_name', 'userType', 'email_verified', 'is_staff', 'is_active', 'date_joined')
    
    # Fields to filter by in the admin
    list_filter = ('userType', 'email_verified', 'is_staff', 'is_active', 'date_joined', 'bypass_otp')
    
    # Fields to search by
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    # Fields to display in the detail view
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('interests', 'userType', 'email_verified', 'bypass_otp')
        }),
        ('OTP Info', {
            'fields': ('otp_secret', 'otp_created_at'),
            'classes': ('collapse',)  # Make this section collapsible
        }),
    )
    
    # Fields to display when adding a new user
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'interests', 'userType', 'email_verified', 'bypass_otp')
        }),
    )
    
    # Make email required
    readonly_fields = ('date_joined', 'last_login', 'otp_created_at')
    
    # Ordering
    ordering = ('-date_joined',)
