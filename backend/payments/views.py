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
from .models import Payment, PAYMENT_STATUS
from .serializers import PaymentSerializer, PaymentDetailSerializer, PaymentCreateSerializer
from bookings.models import Booking

User = get_user_model()

# Load Stripe API key from environment variable
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
# Convert to DRF view for proper authentication handling
@api_view(['POST']) # Use api_view decorator and specify POST method
@permission_classes([IsAuthenticated]) # Ensure user is authenticated via DRF
@csrf_exempt # Keep csrf_exempt if needed, though often handled by DRF auth
def update_payment_status(request):
    """Update payment status"""
    try:
        payment_id = request.data.get('payment_id')
        status_value = request.data.get('status', 'completed')
        
        if not payment_id:
            return Response(
                {"error": "Payment ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Use .select_related('user') for efficiency if needed
            payment = Payment.objects.get(id=payment_id) 
            
            # request.user should now be correctly populated by DRF
            if payment.user != request.user:
                return Response(
                    {"error": "You are not authorized to update this payment"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Validate status value against choices if necessary
            valid_statuses = [status[0] for status in PAYMENT_STATUS]
            if status_value not in valid_statuses:
                 return Response(
                    {"error": f"Invalid status value. Must be one of: {valid_statuses}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                 )

            payment.status = status_value
            # Use update_fields for efficiency, especially with signals
            payment.save(update_fields=['status', 'updated_at']) 
            
            # Consider returning the serialized payment object
            serializer = PaymentSerializer(payment) # Or PaymentDetailSerializer
            return Response({
                "success": True,
                "message": f"Payment status updated to {status_value}",
                "payment": serializer.data
            })
            
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        # Log the exception for debugging on the server
        print(f"Error in update_payment_status: {e}") 
        # Consider more specific error handling
        return Response(
            {"error": "An internal server error occurred."}, # Avoid exposing internal details
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
                            "currency": "AED",  # Pakistani Rupees
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_config(request):
    """Return Stripe publishable key"""
    return Response({
        'publishableKey': STRIPE_PUBLISHABLE_KEY
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    """Create a PaymentIntent for credit card payments"""
    try:
        data = request.data
        amount = data.get('amount', 1000)  # Amount in smallest currency unit (paisa)
        currency = data.get('currency', 'aed')
        email = data.get('email')
        user_id = data.get('user_id')
        booking_id = data.get('booking_id')
        
        if not all([amount, email, user_id, booking_id]):
            return Response(
                {"error": "Missing required fields"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        metadata = {
            'booking_id': booking_id,
            'user_id': user_id,
            'email': email,
        }
        
        # Create a PaymentIntent with the amount and currency
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            metadata=metadata,
            automatic_payment_methods={
                'enabled': True,
            },
        )
        
        # Create Payment record in database
        try:
            user = User.objects.get(id=user_id)
            payment_amount = amount / 100  # Convert to main currency unit
            
            payment = Payment.objects.create(
                user=user,
                amount=payment_amount,
                currency=currency.upper(),
                status='pending',
                payment_method='credit_card',
                stripe_payment_id=intent.id,
            )
            
            try:
                booking = Booking.objects.get(id=booking_id)
                payment.booking = booking
                payment.save()
            except Booking.DoesNotExist:
                pass
                
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'clientSecret': intent.client_secret,
            'id': payment.id
        })
        
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_cash_payment_legacy(request):
    """Create a cash on delivery payment"""
    try:
        data = request.data
        user_id = data.get('user_id')
        booking_id = data.get('booking_id')
        amount = data.get('amount')
        address = data.get('address')
        phone_number = data.get('phone_number')
        
        if not all([user_id, booking_id, amount, address, phone_number]):
            return Response(
                {"error": "Missing required fields"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            booking = Booking.objects.get(id=booking_id)
            
            payment = Payment.objects.create(
                user=user,
                booking=booking,
                amount=amount,
                currency='AED',
                status='completed',
                payment_method='cash_on_delivery',
                address=address,
                phone_number=phone_number
            )
            
            # Update booking status
            booking.status = 'approved'
            booking.save()
            
            return Response({
                'success': True,
                'payment': {
                    'id': payment.id,
                    'amount': payment.amount,
                    'status': payment.status,
                    'payment_method': payment.payment_method
                }
            })
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
