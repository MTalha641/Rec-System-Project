from django.db import models
from django.conf import settings
from users.models import User

class Item(models.Model):
    rentee = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    price = models.IntegerField() 
    location = models.CharField(max_length=255) 
    address = models.CharField(max_length=255,default='') 
    category = models.CharField(max_length=255)
    sub_category = models.CharField(max_length=255)
    image = models.ImageField(upload_to="items/")
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    temporary_field1 = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, null=True, blank=True) 
    search_query = models.CharField(max_length=255, null=True, blank=True)  
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.item:
            return f"{self.user.username} searched for {self.item.title}"
        return f"{self.user.username} searched '{self.search_query}'"


class SavedItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_items')
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'item')
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} saved {self.item.title}"
