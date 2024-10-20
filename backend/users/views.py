from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, LoginSerializer

class SignUpView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(email=email)  # Fetch the user by email
            if user.check_password(password):  # Use the check_password method
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    "message": "Login successful", 
                    "username": user.username,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "error": "Invalid credentials"
                }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({
                "error": "Invalid credentials"
            }, status=status.HTTP_400_BAD_REQUEST)
