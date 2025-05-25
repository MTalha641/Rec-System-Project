from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    # Make email unique to prevent duplicates
    email = models.EmailField(unique=True)
    
    # Additional fields
    interests = models.JSONField(default=list, blank=True)
    userType = models.TextField(blank=True, null=True)
    
    # OTP fields
    otp_secret = models.CharField(max_length=64, blank=True, null=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    email_verified = models.BooleanField(default=True)  # Set to True for existing accounts
    
    # For legacy accounts that don't need verification
    bypass_otp = models.BooleanField(default=True)  # Set to True for existing accounts

    # Corrected __str__ method
    def __str__(self):
        return self.username

    groups = models.ManyToManyField(Group, related_name="custom_user_set", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="custom_user_permissions_set", blank=True)

