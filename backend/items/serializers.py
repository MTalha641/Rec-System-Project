from rest_framework import serializers
from .models import Item
from .models import SearchHistory
class ItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)  # Use ImageField for handling images

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
            "image",  # Full URL for image
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class SearchHistorySerializer(serializers.ModelSerializer):
     class Meta:
        model = SearchHistory
        fields = ['id', 'user', 'item', 'timestamp']
        read_only_fields = ['id', 'timestamp']
   
