from rest_framework import serializers
from .models import Notification
from users.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 
            'recipient', 
            'sender', 
            'sender_details',
            'notification_type', 
            'message', 
            'reference_id', 
            'reference_type', 
            'is_read', 
            'created_at'
        ]
        read_only_fields = ['id', 'created_at'] 