from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    # Fields to display in the admin list view
    list_display = ('id', 'recipient', 'sender', 'notification_type', 'is_read', 'reference_type', 'reference_id', 'created_at', 'message_preview')
    
    # Fields to filter by
    list_filter = ('notification_type', 'is_read', 'created_at', 'updated_at', 'reference_type')
    
    # Fields to search by
    search_fields = ('recipient__username', 'sender__username', 'message', 'reference_id')
    
    # Fields to display in the detail view
    fields = ('recipient', 'sender', 'notification_type', 'message', 'reference_id', 'reference_type', 'is_read')
    
    # Read-only fields
    readonly_fields = ('created_at', 'updated_at')
    
    # Ordering
    ordering = ('-created_at',)
    
    # Items per page
    list_per_page = 50
    
    # Enable date hierarchy
    date_hierarchy = 'created_at'
    
    # Add actions for bulk operations
    actions = ['mark_as_read', 'mark_as_unread', 'delete_selected_notifications']
    
    def message_preview(self, obj):
        """Show a preview of the notification message"""
        return obj.message[:50] + "..." if len(obj.message) > 50 else obj.message
    message_preview.short_description = "Message Preview"
    
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
        self.message_user(request, f"{queryset.count()} notifications marked as read.")
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
        self.message_user(request, f"{queryset.count()} notifications marked as unread.")
    mark_as_unread.short_description = "Mark selected notifications as unread"
    
    def delete_selected_notifications(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} notifications deleted.")
    delete_selected_notifications.short_description = "Delete selected notifications" 