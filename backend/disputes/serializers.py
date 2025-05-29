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
        read_only_fields = [
            'filed_by', 
            'status', 
            'outcome', 
            'at_fault', 
            'ai_analysis', 
            'admin_notes', 
            'checkout_report', 
            'return_report'
        ]

    def create(self, validated_data):
        validated_data['filed_by'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)


class DisputeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ['description', 'evidence']

    def validate(self, data):
        return data


class DisputeResolveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ['outcome', 'at_fault', 'admin_notes']

    def update(self, instance, validated_data):
        instance.outcome = validated_data.get('outcome', instance.outcome)
        instance.at_fault = validated_data.get('at_fault', instance.at_fault)
        instance.admin_notes = validated_data.get('admin_notes', instance.admin_notes)
        instance.status = 'resolved' 
        instance.save()
        return instance