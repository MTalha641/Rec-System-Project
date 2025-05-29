from django.db import models
from users.models import User

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('approval', 'Approval'),
        ('rejection', 'Rejection'),
        ('completion', 'Completion'),
        ('request', 'Request'),
        ('general', 'General'),
    )
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='sent_notifications')
    
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    
    message = models.TextField()
    
    reference_id = models.PositiveIntegerField(null=True, blank=True)
    reference_type = models.CharField(max_length=50, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']  
        
    def __str__(self):
        return f"{self.notification_type} notification for {self.recipient.username}" 