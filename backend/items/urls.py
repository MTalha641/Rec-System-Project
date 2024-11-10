# items/urls.py

from django.urls import path
from .views import ItemListAPIView

urlpatterns = [
    path('getitems/', ItemListAPIView.as_view(), name='item-list'),  # API endpoint to get all items
]
