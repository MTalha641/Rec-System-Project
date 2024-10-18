# users/urls.py
from django.urls import path
from .views import SignUpView, LoginView

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),# Accessible at /api/users/signup/
    path('login/', LoginView.as_view(), name='login'),# Accessible at /api/users/login/
]
