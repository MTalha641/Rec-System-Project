from django.contrib import admin
from .models import Item, SearchHistory, SavedItem

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    # Fields to display in the admin list view
    list_display = ('title', 'rentee', 'price', 'category', 'sub_category', 'location', 'created_at', 'temporary_field1')
    
    # Fields to filter by
    list_filter = ('category', 'sub_category', 'created_at', 'temporary_field1', 'rentee')
    
    # Fields to search by
    search_fields = ('title', 'description', 'location', 'address', 'rentee__username')
    
    # Fields to display in the detail view
    fields = ('rentee', 'title', 'price', 'location', 'address', 'category', 'sub_category', 'image', 'description', 'temporary_field1')
    
    # Read-only fields
    readonly_fields = ('created_at',)
    
    # Ordering
    ordering = ('-created_at',)
    
    # Items per page
    list_per_page = 25
    
    # Enable date hierarchy
    date_hierarchy = 'created_at'

@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    # Fields to display in the admin list view
    list_display = ('user', 'item', 'search_query', 'timestamp')
    
    # Fields to filter by
    list_filter = ('timestamp', 'user')
    
    # Fields to search by
    search_fields = ('user__username', 'item__title', 'search_query')
    
    # Read-only fields
    readonly_fields = ('timestamp',)
    
    # Ordering
    ordering = ('-timestamp',)
    
    # Items per page
    list_per_page = 50
    
    # Enable date hierarchy
    date_hierarchy = 'timestamp'

@admin.register(SavedItem)
class SavedItemAdmin(admin.ModelAdmin):
    # Fields to display in the admin list view
    list_display = ('user', 'item', 'saved_at')
    
    # Fields to filter by
    list_filter = ('saved_at', 'user', 'item__category')
    
    # Fields to search by
    search_fields = ('user__username', 'item__title')
    
    # Read-only fields
    readonly_fields = ('saved_at',)
    
    # Ordering
    ordering = ('-saved_at',)
    
    # Items per page
    list_per_page = 25
    
    # Enable date hierarchy
    date_hierarchy = 'saved_at'
