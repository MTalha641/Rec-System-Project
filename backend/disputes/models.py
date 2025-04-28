# disputes/models.py
from django.db import models
from users.models import User
from items.models import Item

class Dispute(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('processing', 'Under Investigation'),
        ('resolved', 'Resolved'),
    )
    
    OUTCOME_CHOICES = (
        ('none', 'Not Determined'),
        ('valid', 'Valid Dispute'),
        ('invalid', 'Invalid Dispute'),
    )
    
    AT_FAULT_CHOICES = (
        ('none', 'Not Determined'),
        ('renter', 'Renter At Fault'),
        ('owner', 'Owner At Fault'),
        ('both', 'Both At Fault'),
        ('neither', 'Neither At Fault'),
    )
    
    rental = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='disputes')
    filed_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_disputes')
    description = models.TextField()
    evidence = models.FileField(upload_to='dispute_evidence/', blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES, default='none')
    at_fault = models.CharField(max_length=20, choices=AT_FAULT_CHOICES, default='none')
    
    ai_analysis = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Dispute for {self.rental} by {self.filed_by.username}"