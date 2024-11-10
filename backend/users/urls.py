# users/urls.py
from django.urls import path
from .views import SignUpView, LoginView,get_user_details
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('getuserdetails/', get_user_details, name='user-detail'),

]
