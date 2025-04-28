# users/serializers.py
from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password, check_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [ 'username', 'email', 'password', 'userType', 'interests']
        extra_kwargs = {
            'password': {'write_only': True} 
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])  
        user = User(**validated_data)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()  # Or use 'email' if you prefer
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)  # Change to .get(email=email) if using email for login
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        if not user.check_password(password):
            raise serializers.ValidationError("Incorrect password.")

        attrs['user'] = user
        return attrs

