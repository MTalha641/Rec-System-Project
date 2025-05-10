from rest_framework import serializers
from .models import ItemConditionReport
from users.serializers import UserSerializer  # Assuming you have a UserSerializer
from users.models import User  # Import the User model
from bookings.serializers import BookingSerializer  # Assuming you have a BookingSerializer
from bookings.models import Booking  # Import the Booking model

class ItemConditionReportSerializer(serializers.ModelSerializer):
    booking = BookingSerializer(read_only=True)
    reported_by = UserSerializer(read_only=True)
    reported_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='reported_by', write_only=True
    )
    booking_id = serializers.PrimaryKeyRelatedField(
        queryset=Booking.objects.all(), source='booking', write_only=True
    )

    class Meta:
        model = ItemConditionReport
        fields = [
            'id',
            'booking',
            'booking_id',
            'report_type',
            'reported_by',
            'reported_by_id',
            'overall_condition',
            'notes',
            'report_date',
            'checkout_image',
            'return_image',
            'checkout_damage_location',
            'checkout_damage_description',
            'return_damage_location',
            'return_damage_description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'report_date', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['reported_by'] = self.context['request'].user
        return super().create(validated_data)