from django.urls import path
from .views import NotificationViewSet

urlpatterns = [
    # List all notifications for the current user
    path('', NotificationViewSet.as_view({'get': 'list'}), name='notification-list'),
    
    # Create a new notification (typically only used by the system or admin)
    path('create/', NotificationViewSet.as_view({'post': 'create'}), name='notification-create'),
    
    # Get details of a specific notification
    path('<int:pk>/', NotificationViewSet.as_view({'get': 'retrieve'}), name='notification-detail'),
    
    # Delete a notification
    path('<int:pk>/delete/', NotificationViewSet.as_view({'delete': 'destroy'}), name='notification-delete'),
    
    # Get only unread notifications
    path('unread/', NotificationViewSet.as_view({'get': 'unread'}), name='notification-unread'),
    
    # Mark all notifications as read
    path('mark-all-read/', NotificationViewSet.as_view({'post': 'mark_all_read'}), name='notification-mark-all-read'),
    
    # Mark a specific notification as read
    path('<int:pk>/mark-read/', NotificationViewSet.as_view({'post': 'mark_read'}), name='notification-mark-read'),
    
    # Get count of unread notifications
    path('count-unread/', NotificationViewSet.as_view({'get': 'count_unread'}), name='notification-count-unread'),
] 