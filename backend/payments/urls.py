from django.urls import path
from .views import (
    create_checkout_session, 
    payment_config,
    create_payment_intent,
    create_cash_payment,
    create_cash_payment_legacy,
    payment_list,
    payment_detail,
    update_payment_status
)

urlpatterns = [
    # Stripe integration endpoints
    path("create-checkout-session/", create_checkout_session, name="create-checkout-session"),
    path("config/", payment_config, name="payment-config"),
    path("create-payment-intent/", create_payment_intent, name="create-payment-intent"),
    
    # Cash payment endpoints
    path("create-cash-payment/", create_cash_payment, name="create-cash-payment"),
    path("create-cash-payment-legacy/", create_cash_payment_legacy, name="create-cash-payment-legacy"),
    
    # Manual payment status update (replaces webhook functionality)
    path("update-payment-status/", update_payment_status, name="update-payment-status"),
    
    # REST API endpoints for payments
    path("", payment_list, name="payment-list"),
    path("<int:pk>/", payment_detail, name="payment-detail"),
]
