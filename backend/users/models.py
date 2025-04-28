from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class User(AbstractUser):
    # Add any additional fields if needed
    interests = models.JSONField(default=list, blank=True)
    userType = models.TextField(blank=True, null=True)
    fault_count = models.PositiveIntegerField(default = 0)
    is_banned = models.BooleanField(default=False)
    # Corrected __str__ method
    def __str__(self):
        return self.username
    
    def increment_fault(self):
        self.fault_count += 1
        if self.fault_count >= 3:
            self.is_banned = True
        self.save()

    
    groups = models.ManyToManyField(Group, related_name="custom_user_set", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="custom_user_permissions_set",blank=True)