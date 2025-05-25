# users/urls.py
from django.urls import path
from .views import RegisterView, LoginView, get_user_details, SendOTPView, VerifyOTPView, test_otp_debug
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/', RegisterView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('getuserdetails/', get_user_details, name='user-detail'),
    path('send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('test-otp-debug/', test_otp_debug, name='test-otp-debug'),
]
