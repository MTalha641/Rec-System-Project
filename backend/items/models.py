from django.db import models
from django.conf import settings
from users.models import User

class Item(models.Model):
    rentee = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    price = models.IntegerField()  # Changed to IntegerField
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    sub_category = models.CharField(max_length=255)
    image = models.ImageField(upload_to="items/")
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    temporary_field1 = models.BooleanField(default=True)



class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    item = models.CharField(max_length=255) 
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} searched for {self.item}"




    def __str__(self):
        return self.title
