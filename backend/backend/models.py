# from django.db import models
# from django.contrib.auth.models import AbstractUser

# class User(AbstractUser):
#     role = models.CharField(max_length=20) # renter or rentee

# class Item(models.model):
#     owner = models.ForeignKey(User,n_delete=models.CASCADE)
#     name = models.CharField(max_length=100)
#     description = models.TextField()
#     category = models.CharField(max_length=100)
#     price = models.IntegerField()
#     available = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)  
#     updated_at = models.DateTimeField(auto_now=True)

# class Rental(models.model):
#     item = models.ForeignKey(Item, on_delete=models.CASCADE)  # Foreign key to the rented item
#     renter = models.ForeignKey(User, on_delete=models.CASCADE)  # Foreign key to the renter
#     start_date = models.DateField()  
#     end_date = models.DateField()  
#     total_amount = models.DecimalField(max_digits=10, decimal_places=2)  # Total rental amount
#     status = models.CharField(max_length=50, default="booked")  # Rental status (e.g., booked, returned, cancelled)
#     created_at = models.DateTimeField(auto_now_add=True)  # Auto timestamp for rental creation
#     updated_at = models.DateTimeField(auto_now=True) 


# class Payment(models.Model):
#     rental = models.ForeignKey(Rental, on_delete=models.CASCADE)  
#     amount = models.DecimalField(max_digits=10, decimal_places=2)  # Payment amount
#     payment_method = models.CharField(max_length=50)  # Payment method (e.g., Stripe, credit card)
#     payment_status = models.CharField(max_length=50, default="pending")  # Payment status (pending, completed)
#     payment_date = models.DateTimeField(auto_now_add=True) 


