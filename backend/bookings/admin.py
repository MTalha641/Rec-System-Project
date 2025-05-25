from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    # Fields to display in the admin list view
    list_display = ('id', 'user', 'item', 'start_date', 'end_date', 'total_price', 'status', 'delivery_status', 'return_status', 'created_at')
    
    # Fields to filter by
    list_filter = ('status', 'delivery_status', 'return_status', 'created_at', 'start_date', 'end_date')
    
    # Fields to search by
    search_fields = ('user__username', 'item__title', 'user__email')
    
    # Fields to display in the detail view
    fields = ('user', 'item', 'start_date', 'end_date', 'total_price', 'status', 'delivery_status', 'return_status')
    
    # Read-only fields
    readonly_fields = ('created_at',)
    
    # Ordering
    ordering = ('-created_at',)
    
    # Items per page
    list_per_page = 25
    
    # Enable date hierarchy
    date_hierarchy = 'created_at'
    
    # Add actions for bulk status updates
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
