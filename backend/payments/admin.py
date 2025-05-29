from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'booking', 'amount', 'currency', 'status', 'payment_method', 'created_at', 'updated_at')
    
    list_filter = ('status', 'payment_method', 'currency', 'created_at', 'updated_at')
    
    search_fields = ('user__username', 'user__email', 'booking__id', 'stripe_payment_id', 'phone_number')
    
    fields = ('user', 'booking', 'amount', 'currency', 'status', 'payment_method', 'stripe_payment_id', 'address', 'phone_number')
    
    readonly_fields = ('created_at', 'updated_at')
    
    ordering = ('-created_at',)
    
    list_per_page = 25
    
    date_hierarchy = 'created_at'
    
    actions = ['mark_as_completed', 'mark_as_failed', 'mark_as_refunded', 'mark_as_cancelled']
    
    def mark_as_completed(self, request, queryset):
        queryset.update(status='completed')
        self.message_user(request, f"{queryset.count()} payments marked as completed.")
    mark_as_completed.short_description = "Mark selected payments as completed"
    
    def mark_as_failed(self, request, queryset):
        queryset.update(status='failed')
        self.message_user(request, f"{queryset.count()} payments marked as failed.")
    mark_as_failed.short_description = "Mark selected payments as failed"
    
    def mark_as_refunded(self, request, queryset):
        queryset.update(status='refunded')
        self.message_user(request, f"{queryset.count()} payments marked as refunded.")
    mark_as_refunded.short_description = "Mark selected payments as refunded"
    
    def mark_as_cancelled(self, request, queryset):
        queryset.update(status='cancelled')
        self.message_user(request, f"{queryset.count()} payments marked as cancelled.")
    mark_as_cancelled.short_description = "Mark selected payments as cancelled" 