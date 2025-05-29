from django.contrib import admin
from .models import Recommendation

@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'algorithm_used', 'created_at', 'recommended_items_count')
    
    list_filter = ('algorithm_used', 'created_at')
    
    search_fields = ('user__username', 'user__email', 'algorithm_used')
    
    fields = ('user', 'recommended_items', 'algorithm_used')
    
    readonly_fields = ('created_at',)
    
    ordering = ('-created_at',)
    
    list_per_page = 25
    
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
