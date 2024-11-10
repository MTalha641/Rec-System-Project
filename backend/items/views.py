from django.shortcuts import render

# Create your views here.


# items/views.py

from rest_framework import generics
from .models import Item
from .serializers import ItemSerializer

class ItemListAPIView(generics.ListAPIView):
    queryset = Item.objects.all()  # Queryset to get all items
    serializer_class = ItemSerializer  # Use the ItemSerializer
