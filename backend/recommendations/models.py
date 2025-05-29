from django.db import models
from users.models import User
class Recommendation(models.Model):
    user = models.ForeignKey(User, related_name='recommendations', on_delete=models.CASCADE)
    recommended_items = models.JSONField()  
    algorithm_used = models.CharField(max_length=50)  
    cached_search_history= models.JSONField(null=True, blank=True,default=list)  
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Recommendation for {self.user.username}"
