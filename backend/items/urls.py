# items/urls.py

from django.urls import path
from .views import ItemViewSet

urlpatterns = [
    path('get/<int:pk>/', ItemViewSet.as_view({'get': 'retrieve'}), name='item-retrieve'),  
    path('getallitems/', ItemViewSet.as_view({'get': 'list'}), name='item-list'),
    path('create/', ItemViewSet.as_view({'post': 'create'}), name='item-create'),  # Create a new item
    path('update/<int:pk>/', ItemViewSet.as_view({'put': 'update'}), name='item-update'),  # Update an item
    path('delete/<int:pk>/', ItemViewSet.as_view({'delete': 'destroy'}), name='item-delete'),  # Delete an item
    
]
