from django.db import models
from django.utils import timezone
from users.models import User
from bookings.models import Booking

class ItemConditionReport(models.Model):
    """Model for tracking item condition at checkout and return."""
    REPORT_TYPE_CHOICES = (
        ('checkout', 'Checkout'),
        ('return', 'Return'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='item_condition_reports')
    report_type = models.CharField(max_length=10, choices=REPORT_TYPE_CHOICES)
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE)
    overall_condition = models.CharField(max_length=100)
    notes = models.TextField()
    report_date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    checkout_image = models.ImageField(upload_to='condition_reports/', blank=True, null=True)
    return_image = models.ImageField(upload_to='condition_reports/', blank=True, null=True)
    checkout_damage_location = models.CharField(max_length=100, blank=True)
    checkout_damage_description = models.TextField(blank=True)
    return_damage_location = models.CharField(max_length=100, blank=True)
    return_damage_description = models.TextField(blank=True)

    class Meta:
        unique_together = ('booking', 'report_type')

    def __str__(self):
        return f"{self.get_report_type_display()} condition for {self.booking.item.title} - {self.report_date.strftime('%Y-%m-%d')}"