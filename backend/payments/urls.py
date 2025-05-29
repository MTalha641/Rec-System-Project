from django.urls import path
from .views import (
    payment_config,
    create_payment_intent,
    create_cash_payment_legacy,
    payment_list,
    payment_detail,
    update_payment_status
)

urlpatterns = [
    path("config/", payment_config, name="payment-config"),
    
    path("create-payment-intent/", create_payment_intent, name="create-payment-intent"),
    
    path("create-cash-payment/", create_cash_payment_legacy, name="create-cash-payment"),
    
    path("update-payment-status/", update_payment_status, name="update-payment-status"),
    
    path("", payment_list, name="payment-list"),
    path("<int:pk>/", payment_detail, name="payment-detail"),
]
