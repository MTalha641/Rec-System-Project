from django.db import models
from users.models import User 
# Create your models here.
class Item(models.Model):
    # CATEGORY_CHOICES = [
    #     ('electronics', 'Electronics'),
    #     ('furniture', 'Furniture'),
    #     ('appliances', 'Appliances'),
    #     ('fitness', 'Fitness Equipment'),
    # ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    # category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    # condition = models.CharField(max_length=20, choices=[('new', 'New'), ('used', 'Used')])
    # location = models.CharField(max_length=255)
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    availability = models.BooleanField(default=True)
    owner = models.ForeignKey(User, related_name='items', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='items/')

    def __str__(self):
        return self.name

