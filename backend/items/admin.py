from django.contrib import admin
from .models import Item, SearchHistory, SavedItem

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'rentee', 'price', 'category', 'sub_category', 'location', 'created_at', 'temporary_field1')
    
    list_filter = ('category', 'sub_category', 'created_at', 'temporary_field1', 'rentee')
    
    search_fields = ('title', 'description', 'location', 'address', 'rentee__username')
    
    fields = ('rentee', 'title', 'price', 'location', 'address', 'category', 'sub_category', 'image', 'description', 'temporary_field1')
    
    readonly_fields = ('created_at',)
    
    ordering = ('-created_at',)
    
    list_per_page = 25
    
    date_hierarchy = 'created_at'

@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'search_query', 'timestamp')
    
    list_filter = ('timestamp', 'user')
    
    search_fields = ('user__username', 'item__title', 'search_query')
    
    readonly_fields = ('timestamp',)
    
    ordering = ('-timestamp',)
    
    list_per_page = 50
    
    date_hierarchy = 'timestamp'

@admin.register(SavedItem)
class SavedItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'saved_at')
    
    list_filter = ('saved_at', 'user', 'item__category')
    
    search_fields = ('user__username', 'item__title')
    
    readonly_fields = ('saved_at',)
    
    ordering = ('-saved_at',)
    
    list_per_page = 25
    
    date_hierarchy = 'saved_at'
