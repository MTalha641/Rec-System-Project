from django.db import models
from users.models import User
from items.models import Item
# Create your models here.
class Booking(models.Model):
    STATUS_CHOICES = [
        ('booked', 'Booked'),
        ('in_use', 'In Use'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled'),
    ]

    item = models.ForeignKey(Item, related_name='bookings', on_delete=models.CASCADE)
    renter = models.ForeignKey(User, related_name='bookings', on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='')

    def __str__(self):
        return f"{self.renter.username} - {self.item.name}"
