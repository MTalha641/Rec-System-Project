from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'item', 'start_date', 'end_date', 'total_price', 'status', 'delivery_status', 'return_status', 'created_at')
    
    list_filter = ('status', 'delivery_status', 'return_status', 'created_at', 'start_date', 'end_date')

    search_fields = ('user__username', 'item__title', 'user__email')
    
    fields = ('user', 'item', 'start_date', 'end_date', 'total_price', 'status', 'delivery_status', 'return_status')
    
    readonly_fields = ('created_at',)
    
    ordering = ('-created_at',)
    
    list_per_page = 25
    
    date_hierarchy = 'created_at'
    
    actions = ['mark_as_approved', 'mark_as_rejected', 'mark_as_delivered', 'mark_as_returned']
    
    def mark_as_approved(self, request, queryset):
        queryset.update(status='approved')
        self.message_user(request, f"{queryset.count()} bookings marked as approved.")
    mark_as_approved.short_description = "Mark selected bookings as approved"
    
    def mark_as_rejected(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, f"{queryset.count()} bookings marked as rejected.")
    mark_as_rejected.short_description = "Mark selected bookings as rejected"
    
    def mark_as_delivered(self, request, queryset):
        queryset.update(delivery_status='delivered')
        self.message_user(request, f"{queryset.count()} bookings marked as delivered.")
    mark_as_delivered.short_description = "Mark selected bookings as delivered"
    
    def mark_as_returned(self, request, queryset):
        queryset.update(return_status='returned')
        self.message_user(request, f"{queryset.count()} bookings marked as returned.")
    mark_as_returned.short_description = "Mark selected bookings as returned"
