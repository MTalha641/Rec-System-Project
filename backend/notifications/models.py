from django.db import models
from users.models import User

class Notification(models.Model):
    # Notification types
    NOTIFICATION_TYPES = (
        ('approval', 'Approval'),
        ('rejection', 'Rejection'),
        ('completion', 'Completion'),
        ('request', 'Request'),
        ('general', 'General'),
    )
    
    # The user who should receive this notification
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    # The user who triggered the notification (optional, can be null for system notifications)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='sent_notifications')
    
    # Notification type
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    
    # Descriptive message
    message = models.TextField()
    
    # Optional reference to related object (polymorphic relationship)
    # For example, a booking ID, an item ID, etc.
    reference_id = models.PositiveIntegerField(null=True, blank=True)
    reference_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Status flags
    is_read = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']  # Newest first
        
    def __str__(self):
        return f"{self.notification_type} notification for {self.recipient.username}" 