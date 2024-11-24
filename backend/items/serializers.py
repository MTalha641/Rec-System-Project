from rest_framework import serializers
from .models import Item

class ItemSerializer(serializers.ModelSerializer):
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
        read_only_fields = ["id", "created_at", "rentee"]
