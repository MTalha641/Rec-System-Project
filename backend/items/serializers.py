# items/serializers.py

from rest_framework import serializers
from .models import Item

class ItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField()  # Include the image field in the serialized data

    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'image']  # Specify fields to include in the response
