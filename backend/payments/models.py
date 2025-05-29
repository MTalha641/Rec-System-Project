from django.db import models
from django.utils.timezone import now
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import User
from bookings.models import Booking

PAYMENT_STATUS = (
    ('pending', 'Pending'),
    ('completed', 'Completed'),
    ('failed', 'Failed'),
    ('refunded', 'Refunded'),
    ('cancelled', 'Cancelled'),
)

PAYMENT_METHODS = (
    ('credit_card', 'Credit Card'),
    ('cash_on_delivery', 'Cash on Delivery'),
)

class Payment(models.Model):
    """Model for tracking payment transactions"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    booking = models.ForeignKey(
        Booking, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='PKR')
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS)
    
    stripe_payment_id = models.CharField(max_length=100, blank=True, null=True)
    
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    
    created_at = models.DateTimeField(default=now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment {self.id} - {self.status} - {self.amount} {self.currency}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

@receiver(post_save, sender=Payment)
def update_booking_on_payment_complete(sender, instance, **kwargs):
    """
    When a payment status is changed to 'completed', update the booking status.
    This replaces the webhook functionality.
    """
    if instance.status == 'completed' and instance.booking:
        booking = instance.booking
        booking.status = 'approved'
        booking.save(update_fields=['status']) 