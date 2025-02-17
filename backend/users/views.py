from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, LoginSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

class SignUpView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the user
        refresh = RefreshToken.for_user(user)

        # Return user data and tokens
        return Response({
            "message": "User created successfully",
            "username": user.username,
            "email": user.email,
            "userType": user.userType,  # Include user_type in the response
            "interests": user.interests,  # Include interests in the response
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')  
        password = request.data.get('password')  

        try:
          
            user = User.objects.get(email=email) 
           
            if user.check_password(password):
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)

                # Return tokens and user information
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

# Getting user details
@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Ensure the user is authenticated
def get_user_details(request):
    user = request.user  # Get the currently logged-in user
    serializer = UserSerializer(user)  # Serialize the user data
    return Response(serializer.data)  # Return the serialized user data
