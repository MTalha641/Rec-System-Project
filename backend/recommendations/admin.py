from django.contrib import admin
from .models import Recommendation

@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    # Fields to display in the admin list view
    list_display = ('id', 'user', 'algorithm_used', 'created_at', 'recommended_items_count')
    
    # Fields to filter by
    list_filter = ('algorithm_used', 'created_at')
    
    # Fields to search by
    search_fields = ('user__username', 'user__email', 'algorithm_used')
    
    # Fields to display in the detail view
    fields = ('user', 'recommended_items', 'algorithm_used')
    
    # Read-only fields
    readonly_fields = ('created_at',)
    
    # Ordering
    ordering = ('-created_at',)
    
    # Items per page
    list_per_page = 25
    
    # Enable date hierarchy
    date_hierarchy = 'created_at'
    
    def recommended_items_count(self, obj):
        """Show the count of recommended items"""
        if obj.recommended_items:
            if isinstance(obj.recommended_items, list):
                return len(obj.recommended_items)
            elif isinstance(obj.recommended_items, dict):
                return len(obj.recommended_items.get('items', []))
        return 0
    recommended_items_count.short_description = "Items Count"
