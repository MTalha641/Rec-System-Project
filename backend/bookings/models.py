from django.db import models
from users.models import User
from items.models import Item
from django.utils.timezone import now

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    DELIVERY_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_delivery', 'In Delivery'),
        ('delivered', 'Delivered'),
    ]

    RETURN_STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('pending', 'Pending'),
        ('in_return', 'In Return'),
        ('returned', 'Returned'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)  
    item = models.ForeignKey(Item, on_delete=models.CASCADE)  
    start_date = models.DateField()  
    end_date = models.DateField()  
    total_price = models.IntegerField(default=0)  
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        null=True,  
        blank=True  
    )
    delivery_status = models.CharField(
        max_length=20,
        choices=DELIVERY_STATUS_CHOICES,
        default='pending',
        null=True,
        blank=True
    )
    return_status = models.CharField(
        max_length=20,
        choices=RETURN_STATUS_CHOICES,
        default='not_started',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(default=now)

