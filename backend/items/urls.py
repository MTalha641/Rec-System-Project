# items/urls.py

from django.urls import path
from .views import ItemViewSet

urlpatterns = [
    # path('getitems/', ItemListAPIView.as_view(), name='item-list'),  # API endpoint to get all items
   path('create/', ItemViewSet.as_view({'post': 'create'}), name='item-create'),
    
]
