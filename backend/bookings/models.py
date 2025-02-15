from django.db import models
from users.models import User
from items.models import Item
from django.utils.timezone import now

class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)  
    start_date = models.DateField()  
    end_date = models.DateField()  
    total_price = models.IntegerField(default=0)  
    created_at = models.DateTimeField(default=now)
    
