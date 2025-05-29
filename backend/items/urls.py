from django.urls import path
from .views import ItemViewSet, SavedItemViewSet

urlpatterns = [
    path('get/<int:pk>/', ItemViewSet.as_view({'get': 'retrieve'}), name='item-retrieve'),  
    path('getallitems/', ItemViewSet.as_view({'get': 'list'}), name='item-list'),
    path('create/', ItemViewSet.as_view({'post': 'create'}), name='item-create'),  
    path('update/<int:pk>/', ItemViewSet.as_view({'put': 'update'}), name='item-update'),  
    path('delete/<int:pk>/', ItemViewSet.as_view({'delete': 'destroy'}), name='item-delete'), 
    path('excludemyitems/', ItemViewSet.as_view({'get': 'exclude_my_items'}), name='exclude-my-items'),
    path('myitems/', ItemViewSet.as_view({'get': 'my_items'}), name='my-items'),  
    path('search/', ItemViewSet.as_view({'get': 'search_items'}), name='search_items'),
    
    path('saved-items/', SavedItemViewSet.as_view({'get': 'list', 'post': 'create'}), name='saved-items'),
    path('saved-items/<int:pk>/', SavedItemViewSet.as_view({'delete': 'destroy'}), name='saved-item-detail'),
    path('saved-items/<int:pk>/unsave/', SavedItemViewSet.as_view({'delete': 'unsave'}), name='unsave-item'),
    path('saved-items/toggle/', SavedItemViewSet.as_view({'post': 'toggle'}), name='toggle-saved'),
    path('saved-items/check/', SavedItemViewSet.as_view({'get': 'check'}), name='check-saved'),
]