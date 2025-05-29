from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'rating', 'overall_score', 'created_at', 'review_preview')
    
    list_filter = ('rating', 'created_at', 'overall_score')
    
    search_fields = ('user__username', 'item__title', 'review')
    
    fields = ('user', 'item', 'rating', 'overall_score', 'review')
    
    readonly_fields = ('created_at',)
    
    ordering = ('-created_at',)
    
    list_per_page = 25
    
    date_hierarchy = 'created_at'
    
    def review_preview(self, obj):
        """Show a preview of the review text"""
        if obj.review:
            return obj.review[:50] + "..." if len(obj.review) > 50 else obj.review
        return "No review text"
    review_preview.short_description = "Review Preview"
