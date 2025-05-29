from rest_framework import serializers
from .models import Item, SearchHistory, SavedItem

class ItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)  

    class Meta:
        model = Item
        fields = [
            "id",
            "rentee",
            "title",
            "price",
            "location",
            "category",
            "sub_category",
            "image",  
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class SearchHistorySerializer(serializers.ModelSerializer):
     class Meta:
        model = SearchHistory
        fields = ['id', 'user', 'item', 'timestamp']
        read_only_fields = ['id', 'timestamp']
   

class SavedItemSerializer(serializers.ModelSerializer):
    item_details = ItemSerializer(source='item', read_only=True)
    
    class Meta:
        model = SavedItem
        fields = ['id', 'user', 'item', 'item_details', 'saved_at']
        read_only_fields = ['id', 'saved_at']
   
