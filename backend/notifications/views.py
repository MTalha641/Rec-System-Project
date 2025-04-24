from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view returns a list of all the notifications
        for the currently authenticated user.
        """
        user = self.request.user
        return Notification.objects.filter(recipient=user)
    
    def create(self, request, *args, **kwargs):
        """
        Create a new notification.
        Only admin users or the system should typically create notifications.
        """
        # Set the recipient from the request data
        # Add additional validation if needed
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """
        Get only unread notifications for the current user
        """
        unread_notifications = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        )
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all notifications as read for the current user
        """
        Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        
        return Response({"status": "All notifications marked as read"})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark a specific notification as read
        """
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response({"status": "Notification marked as read"})
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def count_unread(self, request):
        """
        Get the count of unread notifications for the current user
        """
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        return Response({"unread_count": count})

def create_notification(recipient, notification_type, message, sender=None, reference_id=None, reference_type=None):
    """
    Helper function to create notifications from other apps
    This can be imported and used in signals or views in other apps
    """
    notification = Notification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        message=message,
        reference_id=reference_id,
        reference_type=reference_type
    )
    return notification 