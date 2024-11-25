from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class User(AbstractUser):
    # Add any additional fields if needed
    interests = models.JSONField(default=list, blank=True)

    def _str_(self):
        return self.username

    groups = models.ManyToManyField(Group, related_name="custom_user_set", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="custom_user_permissions_set",blank=True)