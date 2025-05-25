from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    # Fields to display in the admin list view
    list_display = ('user', 'item', 'rating', 'overall_score', 'created_at', 'review_preview')
    
    # Fields to filter by
    list_filter = ('rating', 'created_at', 'overall_score')
    
    # Fields to search by
    search_fields = ('user__username', 'item__title', 'review')
    
    # Fields to display in the detail view
    fields = ('user', 'item', 'rating', 'overall_score', 'review')
    
    # Read-only fields
    readonly_fields = ('created_at',)
    
    # Ordering
    ordering = ('-created_at',)
    
    # Items per page
    list_per_page = 25
    
    # Enable date hierarchy
    date_hierarchy = 'created_at'
    
    def review_preview(self, obj):
        """Show a preview of the review text"""
        if obj.review:
            return obj.review[:50] + "..." if len(obj.review) > 50 else obj.review
        return "No review text"
    review_preview.short_description = "Review Preview"
