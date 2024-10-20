# users/urls.py
from django.urls import path
from .views import SignUpView, LoginView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),# Accessible at /api/users/signup/
    path('login/', LoginView.as_view(), name='login'),# Accessible at /api/users/login/
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


]
