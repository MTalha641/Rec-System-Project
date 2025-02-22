from django.db import models
from users.models import User
from items.models import Item
# Create your models here.
class Review(models.Model):
<<<<<<< HEAD
    item = models.ForeignKey(Item, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='reviews', on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} for {self.item.name}"
=======
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    review = models.TextField(null=True, blank=True) 
    overall_score = models.FloatField(null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.rating} Stars"
>>>>>>> ec78a19527262ad4e08178b934d5c508a446979a
