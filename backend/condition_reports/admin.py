from django.contrib import admin
from .models import ItemConditionReport

@admin.register(ItemConditionReport)
class ItemConditionReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'report_type', 'reported_by', 'overall_condition', 'report_date', 'created_at')
    
    list_filter = ('report_type', 'overall_condition', 'report_date', 'created_at', 'updated_at')
    
    search_fields = ('booking__item__title', 'reported_by__username', 'notes', 'overall_condition')
    
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
    
    readonly_fields = ('created_at', 'updated_at')
    
    ordering = ('-report_date',)
    
    list_per_page = 25
    
    date_hierarchy = 'report_date'
    
    def get_item_title(self, obj):
        return obj.booking.item.title
    get_item_title.short_description = "Item"
    get_item_title.admin_order_field = 'booking__item__title'
    
    def get_booking_user(self, obj):
        return obj.booking.user.username
    get_booking_user.short_description = "Booking User"
    get_booking_user.admin_order_field = 'booking__user__username'
