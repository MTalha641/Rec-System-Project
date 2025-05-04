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
    # Payment configuration
    path("config/", payment_config, name="payment-config"),
    
    # Credit card payment endpoint
    path("create-payment-intent/", create_payment_intent, name="create-payment-intent"),
    
    # Cash on delivery payment endpoint
    path("create-cash-payment/", create_cash_payment_legacy, name="create-cash-payment"),
    
    # Payment status update endpoint
    path("update-payment-status/", update_payment_status, name="update-payment-status"),
    
    # REST API endpoints for payments
    path("", payment_list, name="payment-list"),
    path("<int:pk>/", payment_detail, name="payment-detail"),
]
