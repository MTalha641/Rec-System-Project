from django.urls import path
from .views import NotificationViewSet

urlpatterns = [
    path('', NotificationViewSet.as_view({'get': 'list'}), name='notification-list'),
    
    path('create/', NotificationViewSet.as_view({'post': 'create'}), name='notification-create'),
    
    path('<int:pk>/', NotificationViewSet.as_view({'get': 'retrieve'}), name='notification-detail'),
    
    path('<int:pk>/delete/', NotificationViewSet.as_view({'delete': 'destroy'}), name='notification-delete'),
    
    path('unread/', NotificationViewSet.as_view({'get': 'unread'}), name='notification-unread'),
    
    path('mark-all-read/', NotificationViewSet.as_view({'post': 'mark_all_read'}), name='notification-mark-all-read'),
    
    path('<int:pk>/mark-read/', NotificationViewSet.as_view({'post': 'mark_read'}), name='notification-mark-read'),
    
    path('count-unread/', NotificationViewSet.as_view({'get': 'count_unread'}), name='notification-count-unread'),
] 