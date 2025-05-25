from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from utils.otp import generate_otp_secret, generate_totp, verify_totp, send_otp_email, test_otp_flow
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # New users need OTP verification (existing users have bypass_otp=True by default)
            user.bypass_otp = False
            user.email_verified = False
            user.save()
            
            # Generate and send OTP for new users
            user.otp_secret = generate_otp_secret()
            otp = generate_totp(user.otp_secret)
            user.otp_created_at = timezone.now()
            user.save()
            
            # Try to send OTP email
            email_sent = send_otp_email(user.email, otp)
            
            return Response({
                "message": "Registration successful. Please verify your email with the OTP sent.",
                "user_id": user.id,
                "email": user.email,
                "requires_otp": True,
                "otp": otp,  # Always include OTP for debugging
                "email_sent": email_sent,
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(email=email, password=password)
            
            if user:
                # Check if user can bypass OTP (existing users) or is already verified
                if user.bypass_otp or user.email_verified:
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                        "user": {
                            "id": user.id,
                            "email": user.email,
                            "username": user.username,
                            "user_type": user.userType,
                            "interests": user.interests,
                        }
                    })
                else:
                    # User needs to verify OTP first
                    return Response({
                        "message": "Please verify your email with OTP before logging in.",
                        "user_id": user.id,
                        "email": user.email,
                        "requires_otp": True
                    }, status=status.HTTP_403_FORBIDDEN)
                    
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# OTP ENDPOINTS
class SendOTPView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Use filter().first() to handle potential duplicates, get the most recent user
            user = User.objects.filter(email=email).order_by('-date_joined').first()
            
            if not user:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Generate new OTP
            if not user.otp_secret:
                user.otp_secret = generate_otp_secret()
            
            otp = generate_totp(user.otp_secret)
            user.otp_created_at = timezone.now()
            user.save()
            
            # Send OTP email
            email_sent = send_otp_email(user.email, otp)
            
            if email_sent:
                return Response({"message": "OTP sent successfully", "otp": otp}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Failed to send OTP email", "otp": otp}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access
    
    def post(self, request):
        # Debug logging
        print("=== OTP VERIFICATION DEBUG ===")
        print("Request data:", request.data)
        
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        print(f"Extracted email: '{email}'")
        print(f"Extracted OTP: '{otp}'")
        print(f"OTP type: {type(otp)}")
        print(f"OTP length: {len(str(otp)) if otp else 'None'}")
        
        if not email or not otp:
            print("ERROR: Missing email or OTP")
            return Response({"error": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Use filter().first() to handle potential duplicates, get the most recent user
            user = User.objects.filter(email=email).order_by('-date_joined').first()
            
            if not user:
                print(f"ERROR: User not found for email: {email}")
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            print(f"Found user: {user.username} (ID: {user.id})")
            print(f"User OTP secret: {user.otp_secret}")
            print(f"User OTP created at: {user.otp_created_at}")
            
            # Check if OTP is expired (5 minutes)
            if user.otp_created_at and timezone.now() - user.otp_created_at > timedelta(minutes=5):
                print("ERROR: OTP has expired")
                return Response({"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify OTP
            print(f"Verifying OTP: secret='{user.otp_secret}', token='{otp}'")
            otp_valid = verify_totp(user.otp_secret, otp)
            print(f"OTP verification result: {otp_valid}")
            
            if otp_valid:
                user.email_verified = True
                user.otp_secret = None  # Clear OTP secret after verification
                user.otp_created_at = None
                user.save()
                
                print("SUCCESS: OTP verified, user updated")
                
                # Generate tokens for login after verification
                refresh = RefreshToken.for_user(user)
                return Response({
                    "message": "Email verified successfully",
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "user_type": user.userType,
                        "interests": user.interests,
                    }
                }, status=status.HTTP_200_OK)
            else:
                print("ERROR: Invalid OTP")
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"EXCEPTION in VerifyOTPView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_details(request):
    try:
        user = request.user
        print("User object:", user)
        print("User ID:", user.id)
        print("User PK:", user.pk)
        
        serializer = UserSerializer(user)
        print("Serialized data:", serializer.data)
        
        return Response(serializer.data)
    except Exception as e:
        print("Error in get_user_details:", str(e))
        return Response(
            {"error": "Failed to fetch user details"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def test_otp_debug(request):
    """Debug endpoint to test OTP generation and verification"""
    
    email = request.data.get('email')
    if not email:
        return Response({"error": "Email required for testing"}, status=400)
    
    try:
        # Find user
        user = User.objects.filter(email=email).order_by('-date_joined').first()
        if not user:
            return Response({"error": "User not found"}, status=404)
        
        # Test OTP flow
        test_results = test_otp_flow()
        
        # Get user's current OTP info
        user_info = {
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'otp_secret': user.otp_secret,
            'otp_created_at': user.otp_created_at,
            'email_verified': user.email_verified,
            'bypass_otp': user.bypass_otp
        }
        
        # Generate current OTP for user if they have a secret
        current_user_otp = None
        if user.otp_secret:
            current_user_otp = generate_totp(user.otp_secret)
        
        return Response({
            'test_results': test_results,
            'user_info': user_info,
            'current_user_otp': current_user_otp
        })
        
    except Exception as e:
        import traceback
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=500)
