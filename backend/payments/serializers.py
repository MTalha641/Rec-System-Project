from rest_framework import serializers
from .models import Payment
from users.serializers import UserSerializer
from bookings.serializers import BookingSerializer

class PaymentSerializer(serializers.ModelSerializer):
    """
    Standard serializer for Payment model
    """
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'booking', 'amount', 'currency', 
            'status', 'payment_method', 'created_at', 'updated_at'
        ]

class PaymentDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Payment model with nested user and booking data
    """
    user = UserSerializer(read_only=True)
    booking = BookingSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'booking', 'amount', 'currency', 
            'status', 'payment_method', 'stripe_payment_id', 
            'stripe_payment_intent', 'delivery_address', 
            'phone_number', 'created_at', 'updated_at'
        ]

class PaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating payments
    """
    class Meta:
        model = Payment
        fields = [
            'user', 'booking', 'amount', 'currency', 
            'payment_method', 'delivery_address', 'phone_number'
        ]
        
    def validate(self, data):
        """
        Validate payment data
        """
        if data.get('amount', 0) <= 0:
            raise serializers.ValidationError("Payment amount must be greater than zero")
            
        payment_method = data.get('payment_method')
        if payment_method == 'cash' and not data.get('delivery_address'):
            raise serializers.ValidationError("Delivery address is required for cash payments")
            
        if payment_method == 'cash' and not data.get('phone_number'):
            raise serializers.ValidationError("Phone number is required for cash payments")
            
        return data 