# disputes/serializers.py
from rest_framework import serializers
from .models import Dispute
from items.serializers import ItemSerializer
from users.serializers import UserSerializer

class DisputeSerializer(serializers.ModelSerializer):
    rental = ItemSerializer(read_only=True)
    filed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Dispute
        fields = '__all__'
        read_only_fields = ['filed_by', 'status', 'outcome', 'at_fault', 'ai_analysis', 'admin_notes']
    
    def create(self, validated_data):
        validated_data['filed_by'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)

class DisputeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ['description', 'evidence']

class DisputeResolveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ['outcome', 'at_fault', 'admin_notes']