from django.db import models
from django.contrib.auth.hashers import make_password
# Create your models here.

class User(models.Model):
    username = models.CharField(max_length=100,unique=True)
    email = models.EmailField(max_length=150, unique=True)
    password = models.CharField(max_length=128) 

    def __str__(self):
        return self.username
    
    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password)

                                
    


 