from django.contrib import admin
from .models import ItemConditionReport

@admin.register(ItemConditionReport)
class ItemConditionReportAdmin(admin.ModelAdmin):
    # Fields to display in the admin list view
    list_display = ('id', 'booking', 'report_type', 'reported_by', 'overall_condition', 'report_date', 'created_at')
    
    # Fields to filter by
    list_filter = ('report_type', 'overall_condition', 'report_date', 'created_at', 'updated_at')
    
    # Fields to search by
    search_fields = ('booking__item__title', 'reported_by__username', 'notes', 'overall_condition')
    
    # Fields to display in the detail view
    fieldsets = (
        ('Basic Information', {
            'fields': ('booking', 'report_type', 'reported_by', 'overall_condition', 'notes', 'report_date')
        }),
        ('Images', {
            'fields': ('checkout_image', 'return_image'),
            'classes': ('collapse',)
        }),
        ('Damage Details', {
            'fields': ('checkout_damage_location', 'checkout_damage_description', 'return_damage_location', 'return_damage_description'),
            'classes': ('collapse',)
        }),
    )
    
    # Read-only fields
    readonly_fields = ('created_at', 'updated_at')
    
    # Ordering
    ordering = ('-report_date',)
    
    # Items per page
    list_per_page = 25
    
    # Enable date hierarchy
    date_hierarchy = 'report_date'
    
    # Add custom methods for better display
    def get_item_title(self, obj):
        return obj.booking.item.title
    get_item_title.short_description = "Item"
    get_item_title.admin_order_field = 'booking__item__title'
    
    def get_booking_user(self, obj):
        return obj.booking.user.username
    get_booking_user.short_description = "Booking User"
    get_booking_user.admin_order_field = 'booking__user__username'
