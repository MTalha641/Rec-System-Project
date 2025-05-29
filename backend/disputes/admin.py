from django.contrib import admin
from .models import Dispute

@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ('id', 'rental', 'filed_by', 'status', 'outcome', 'at_fault', 'created_at', 'updated_at')
    
    list_filter = ('status', 'outcome', 'at_fault', 'created_at', 'updated_at', 'rental__category')
    
    search_fields = ('filed_by__username', 'rental__title', 'description', 'admin_notes')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('rental', 'filed_by', 'description', 'evidence')
        }),
        ('Reports', {
            'fields': ('checkout_report', 'return_report')
        }),
        ('Status & Resolution', {
            'fields': ('status', 'outcome', 'at_fault')
        }),
        ('Analysis & Notes', {
            'fields': ('ai_analysis', 'admin_notes'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    ordering = ('-created_at',)
    
    list_per_page = 25
    
    date_hierarchy = 'created_at'
    
    actions = ['mark_as_processing', 'mark_as_resolved', 'mark_outcome_valid', 'mark_outcome_invalid']
    
    def mark_as_processing(self, request, queryset):
        queryset.update(status='processing')
        self.message_user(request, f"{queryset.count()} disputes marked as processing.")
    mark_as_processing.short_description = "Mark selected disputes as processing"
    
    def mark_as_resolved(self, request, queryset):
        queryset.update(status='resolved')
        self.message_user(request, f"{queryset.count()} disputes marked as resolved.")
    mark_as_resolved.short_description = "Mark selected disputes as resolved"
    
    def mark_outcome_valid(self, request, queryset):
        queryset.update(outcome='valid')
        self.message_user(request, f"{queryset.count()} disputes marked as valid.")
    mark_outcome_valid.short_description = "Mark selected disputes as valid"
    
    def mark_outcome_invalid(self, request, queryset):
        queryset.update(outcome='invalid')
        self.message_user(request, f"{queryset.count()} disputes marked as invalid.")
    mark_outcome_invalid.short_description = "Mark selected disputes as invalid"
