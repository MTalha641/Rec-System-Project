from django.db import models
from users.models import User


class Item(models.Model):
    rentee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="items")
    title = models.CharField(max_length=255)
    price = models.IntegerField()  # Changed to IntegerField
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    sub_category = models.CharField(max_length=255)
    image = models.ImageField(upload_to="items/")
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    temporary_field1 = models.BooleanField(default=True)

    def __str__(self):
        return self.title
