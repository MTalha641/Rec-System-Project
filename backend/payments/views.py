# import stripe
# from django.conf import settings
# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt

# stripe.api_key = settings.STRIPE_SECRET_KEY

# @csrf_exempt
# def create_checkout_session(request):
#     if request.method == "POST":
#         try:
#             session = stripe.checkout.Session.create(
#                 payment_method_types=["card"],
#                 line_items=[
#                     {
#                         "price_data": {
#                             "currency": "usd",
#                             "product_data": {"name": "Demo Payment"},
#                             "unit_amount": 5000,  # $50.00 in cents
#                         },
#                         "quantity": 1,
#                     },
#                 ],
#                 mode="payment",
#                 success_url="https://your-frontend.com/success",
#                 cancel_url="https://your-frontend.com/cancel",
#             )
#             return JsonResponse({"sessionId": session.id})
#         except Exception as e:
#             return JsonResponse({"error": str(e)}, status=500)

import stripe
import json
import os
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer, PaymentDetailSerializer, PaymentCreateSerializer
from bookings.models import Booking

User = get_user_model()

# Load Stripe API key from environment variable instead of settings
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')

# New REST API endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_list(request):
    """
    List all payments for the current user
    """
    user = request.user
    payments = Payment.objects.filter(user=user)
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_detail(request, pk):
    """
    Retrieve a payment by ID
    """
    try:
        payment = Payment.objects.get(pk=pk)
        
        # Check if user is authorized to view this payment
        if payment.user != request.user:
            return Response(
                {"error": "You are not authorized to view this payment"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {"error": "Payment not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

# Manual payment status update endpoint (replaces webhook functionality)
@csrf_exempt
@require_POST
def update_payment_status(request):
    """Update a payment status manually, replacing webhook functionality"""
    try:
        data = json.loads(request.body)
        payment_id = data.get('payment_id')
        status_value = data.get('status', 'completed')
        
        if not payment_id:
            return JsonResponse({"error": "Payment ID is required"}, status=400)
            
        try:
            payment = Payment.objects.get(id=payment_id)
            payment.status = status_value
            payment.save()
            
            # Booking status update is handled by the signal in models.py
            
            return JsonResponse({
                "success": True,
                "payment_id": payment.id,
                "status": payment.status
            })
        except Payment.DoesNotExist:
            return JsonResponse({"error": "Payment not found"}, status=404)
            
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# Existing Stripe integration
@csrf_exempt
def create_checkout_session(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            amount = data.get('amount', 1000)  # Default to 10.00 if not provided
            product_name = data.get('product_name', 'Rental Payment')
            customer_email = data.get('email', None)
            user_id = data.get('user_id', None)
            booking_id = data.get('booking_id', None)
            
            # Create metadata for tracking the transaction
            metadata = {
                'product_id': data.get('product_id', ''),
                'booking_id': booking_id or '',
                'user_id': user_id or '',
            }
            
            # Define frontend URL from environment variable or fallback
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:8000')
            
            checkout_params = {
                "payment_method_types": ["card"],
                "line_items": [
                    {
                        "price_data": {
                            "currency": "pkr",  # Pakistani Rupees
                            "product_data": {"name": product_name},
                            "unit_amount": amount,  # Amount in cents
                        },
                        "quantity": 1,
                    },
                ],
                "mode": "payment",
                "success_url": f"{frontend_url}/payment-success",
                "cancel_url": f"{frontend_url}/payment-cancel",
                "metadata": metadata,
            }
            
            # Add customer email if provided
            if customer_email:
                checkout_params["customer_email"] = customer_email
                
            session = stripe.checkout.Session.create(**checkout_params)
            
            # Create Payment record in database
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    # Convert amount from smallest unit (paisa) to PKR
                    payment_amount = amount / 100
                    
                    payment = Payment.objects.create(
                        user=user,
                        amount=payment_amount,
                        currency='PKR',
                        status='pending',
                        payment_method='stripe',
                        stripe_payment_id=session.id,
                    )
                    
                    if booking_id:
                        try:
                            booking = Booking.objects.get(id=booking_id)
                            payment.booking = booking
                            
                            # Update booking status to approved directly
                            # (since we're not using webhooks for status updates)
                            booking.status = 'approved'
                            booking.save()
                            
                            payment.save()
                        except Booking.DoesNotExist:
                            pass
                except User.DoesNotExist:
                    pass
            
            return JsonResponse({
                "sessionId": session.id,
                "url": session.url
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def payment_config(request):
    """Return Stripe publishable key to the frontend"""
    return JsonResponse({
        'publishableKey': STRIPE_PUBLISHABLE_KEY
    })

@csrf_exempt
def create_payment_intent(request):
    """Create a PaymentIntent for use with the Stripe mobile SDK"""
    try:
        data = json.loads(request.body)
        amount = data.get('amount', 1000)
        currency = data.get('currency', 'pkr')
        email = data.get('email', None)
        user_id = data.get('user_id', None)
        booking_id = data.get('booking_id', None)
        
        metadata = {
            'booking_id': booking_id or '',
            'user_id': user_id or '',
            'email': email or '',
        }
        
        # Create a PaymentIntent with the amount and currency
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            metadata=metadata
        )
        
        # Create Payment record in database
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                # Convert amount from smallest unit to main currency
                payment_amount = amount / 100
                
                payment = Payment.objects.create(
                    user=user,
                    amount=payment_amount,
                    currency=currency.upper(),
                    status='pending',
                    payment_method='stripe',
                    stripe_payment_intent=intent.id,
                )
                
                if booking_id:
                    try:
                        booking = Booking.objects.get(id=booking_id)
                        payment.booking = booking
                        
                        # Update booking status to approved directly
                        # (since we're not using webhooks for status updates)
                        booking.status = 'approved'
                        booking.save()
                        
                        payment.save()
                    except Booking.DoesNotExist:
                        pass
            except User.DoesNotExist:
                pass
        
        return JsonResponse({
            'clientSecret': intent.client_secret,
            'id': intent.id
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_cash_payment(request):
    """Create a Cash on Delivery payment record using DRF"""
    serializer = PaymentCreateSerializer(data=request.data)
    
    if serializer.is_valid():
        # Make sure the user is only creating payments for themselves
        if str(serializer.validated_data['user'].id) != str(request.user.id):
            return Response(
                {"error": "You can only create payments for yourself"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create the payment
        payment = serializer.save(status='pending')
        
        # Update booking status if present
        if payment.booking:
            payment.booking.status = 'approved'
            payment.booking.save()
        
        # Return the created payment
        return Response(
            PaymentDetailSerializer(payment).data, 
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Legacy method for non-DRF approach
@csrf_exempt
def create_cash_payment_legacy(request):
    """Create a Cash on Delivery payment record (legacy method)"""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            booking_id = data.get('booking_id')
            amount = data.get('amount', 0)
            address = data.get('address', '')
            phone_number = data.get('phone_number', '')
            
            if not user_id or not booking_id:
                return JsonResponse({"error": "User ID and Booking ID are required"}, status=400)
            
            try:
                user = User.objects.get(id=user_id)
                booking = Booking.objects.get(id=booking_id)
                
                # Create payment record
                payment = Payment.objects.create(
                    user=user,
                    booking=booking,
                    amount=amount,
                    currency='PKR',
                    status='pending',
                    payment_method='cash',
                    delivery_address=address,
                    phone_number=phone_number
                )
                
                # Update booking status
                booking.status = 'approved'
                booking.save()
                
                # Serialize the response
                serializer = PaymentSerializer(payment)
                return JsonResponse({
                    "success": True,
                    "payment": serializer.data
                })
                
            except User.DoesNotExist:
                return JsonResponse({"error": "User not found"}, status=404)
            except Booking.DoesNotExist:
                return JsonResponse({"error": "Booking not found"}, status=404)
                
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)
