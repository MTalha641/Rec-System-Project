from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from items.models import Item
from datetime import datetime, timedelta
from django.utils import timezone
from payments.models import Payment

class ConfirmBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        item_id = request.data.get("item_id")
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")

        if not item_id or not start_date or not end_date:
            return Response({"message": "Missing required fields (item_id, start_date, end_date)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = Item.objects.get(id=item_id)
        except Item.DoesNotExist:
            return Response({"message": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        if start_date > end_date:
            return Response({"message": "Start date cannot be after end date."}, status=status.HTTP_400_BAD_REQUEST)

        overlapping_bookings = Booking.objects.filter(
            item=item,
            start_date__lt=end_date,
            end_date__gt=start_date
        )

        if overlapping_bookings.exists():
            return Response({"message": "This item is already booked for the selected dates."}, status=status.HTTP_400_BAD_REQUEST)

        total_days = (end_date - start_date).days + 1
        total_price = item.price * total_days

        booking = Booking.objects.create(
            user=request.user,
            item=item,
            start_date=start_date,
            end_date=end_date,
            total_price=total_price
        )

        return Response({
            "message": "Item successfully booked!",
            "booking_id": booking.id,
            "item_id": item.id,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "total_days": total_days,
            "per_day_price": item.price,
            "total_price": total_price
        }, status=status.HTTP_201_CREATED)


class CheckAndUpdateExpiredBookingsView(APIView):
    """
    API endpoint to check and update the status of bookings that are more than 24 hours old
    and still in pending status to mark them as expired.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        time_threshold = timezone.now() - timedelta(hours=24)
        
        expired_bookings = Booking.objects.filter(
            status='pending',
            created_at__lt=time_threshold
        )
        
        count = expired_bookings.count()
        expired_bookings.update(status='expired')
        
        return Response({
            "message": f"{count} expired bookings have been updated.",
            "expired_count": count
        }, status=status.HTTP_200_OK)


class RenteeBookingRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        time_threshold = timezone.now() - timedelta(hours=24)
        Booking.objects.filter(
            status='pending',
            created_at__lt=time_threshold
        ).update(status='expired')

        rentee = request.user
        bookings = Booking.objects.filter(item__rentee=rentee).order_by('-created_at')

        data = [{
            "booking_id": b.id,
            "item_title": b.item.title,
            "item_id": b.item.id,
            "image_url": b.item.image.url if b.item.image else None,
            "renter_name": b.user.username,
            "created_at": b.created_at,
            "status": b.status
        } for b in bookings]

        return Response(data, status=status.HTTP_200_OK)


class RenterBookingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        time_threshold = timezone.now() - timedelta(hours=24)
        Booking.objects.filter(
            status='pending',
            created_at__lt=time_threshold
        ).update(status='expired')

        renter = request.user
        bookings = Booking.objects.filter(user=renter).order_by('-created_at')

        data = [{
            "booking_id": b.id,
            "item_title": b.item.title,
            "item_id": b.item.id,
            "image_url": b.item.image.url if b.item.image else None,
            "rentee_name": b.item.rentee.username,
            "created_at": b.created_at,
            "status": b.status
        } for b in bookings]

        return Response(data, status=status.HTTP_200_OK)


class UpdateBookingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.item.rentee != request.user:
            return Response({"message": "Only the item rentee can change the booking status."}, status=status.HTTP_403_FORBIDDEN)

        status_value = request.data.get("status")
        if status_value not in ["approved", "rejected"]:
            return Response({"message": "Invalid status. Use 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = status_value
        booking.save()

        return Response({
            "message": f"Booking has been {status_value}.",
            "booking_id": booking.id,
            "status": booking.status
        }, status=status.HTTP_200_OK)


class UserReservationsView(APIView):
    """
    API endpoint to get all approved bookings for the current user as a renter
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_reservations = Booking.objects.filter(
            user=request.user,
            status='approved'
        ).order_by('-created_at')
        print(user_reservations)

        reservations_data = [{
            "id": booking.id,
            'item_id':booking.item_id,
            "item_name": booking.item.title,
            "owner_name": booking.item.rentee.username,
            "image_url": booking.item.image.url if booking.item.image else None,
            "start_date": booking.start_date,
            "end_date": booking.end_date,
            "total_price": booking.total_price
        } for booking in user_reservations]
        
        return Response(reservations_data, status=status.HTTP_200_OK)


class CancelBookingView(APIView):
    """
    API endpoint to cancel a booking request
    Only allows users to cancel their own requests that are still pending
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if booking.user != request.user:
            return Response({"message": "You can only cancel your own booking requests."}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status != 'pending':
            return Response({"message": "Only pending bookings can be canceled."}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.delete()
        
        return Response({"message": "Booking request has been canceled successfully."}, status=status.HTTP_200_OK)


class BookingDeliveryDetailsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.select_related(
                'item',
                'item__rentee',
                'user' 
            ).get(id=booking_id)

            print(f"DEBUG - User requesting delivery details: {request.user.username}")
            print(f"DEBUG - User type: {request.user.userType}")
            print(f"DEBUG - Booking renter: {booking.user.username}")
            print(f"DEBUG - Booking ID: {booking_id}")

            if booking.status != 'approved':
                 return Response(
                    {"message": "Booking is not approved for delivery yet."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            payment = Payment.objects.filter(
                booking=booking,
                status='completed'
            ).order_by('-created_at').first()

            if not payment:
                return Response(
                    {"message": "Completed payment for this booking not found."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            item_location = booking.item.location
            origin_address = booking.item.address or 'Sender Location'  

            try:
                if item_location and ',' in item_location:
                    origin_latitude, origin_longitude = map(float, item_location.split(','))
                else:
                    origin_latitude, origin_longitude = None, None
                    print(f"Warning: Item location format incorrect for item {booking.item.id}: {item_location}")
            except (ValueError, Exception) as e:
                print(f"Error parsing item location coordinates: {e}")
                origin_latitude, origin_longitude = None, None

            data = {
                "booking_id": booking.id,
                "item_title": booking.item.title,
                "rentee_name": booking.item.rentee.username,
                "origin_address": origin_address,
                "origin_location": {
                    "latitude": origin_latitude,
                    "longitude": origin_longitude,
                } if origin_latitude is not None and origin_longitude is not None else None,
                "destination_address": "Your Location",
                "booking_created_at": booking.created_at,
                "payment_status": payment.status,
                "payment_method": payment.payment_method,
                "payment_created_at": payment.created_at,
                "delivery_status": getattr(booking, 'delivery_status', 'pending'),
                "return_status": getattr(booking, 'return_status', 'not_started'),
            }

            return Response(data, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error fetching booking delivery details: {e}") 
            return Response({"message": "An error occurred fetching delivery details."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PendingDeliveriesView(APIView):
    """
    API endpoint to get all pending deliveries - bookings that are approved and have completed payments
    but haven't been delivered yet. This is used by vendors/delivery personnel.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            print(f"DEBUG - User requesting pending deliveries: {request.user.username}")
            print(f"DEBUG - User type: {getattr(request.user, 'userType', 'Unknown')}")

            approved_bookings = Booking.objects.filter(
                status='approved'
            ).select_related('item', 'item__rentee', 'user')

            bookings_with_payments = []
            for booking in approved_bookings:
                payment = Payment.objects.filter(
                    booking=booking,
                    status='completed'
                ).order_by('-created_at').first()
                
                if payment:
                    delivery_status = getattr(booking, 'delivery_status', 'pending')
                    return_status = getattr(booking, 'return_status', 'not_started')
                    if (return_status in ['pending', 'in_return']) or (delivery_status not in ['in_delivery', 'delivered'] and return_status == 'not_started'):
                        item_location = booking.item.location
                        origin_address = booking.item.address or "Item Location"
                        
                        try:
                            if item_location and ',' in item_location:
                                lat, lng = map(float, item_location.split(','))
                                location_data = {"latitude": lat, "longitude": lng}
                            else:
                                location_data = None
                        except Exception:
                            location_data = None
                        
                        bookings_with_payments.append({
                            "id": booking.id,
                            "rentee_name": booking.item.rentee.username,
                            "rider_name": booking.user.username,
                            "item_title": booking.item.title,
                            "origin_address": origin_address,
                            "origin_location": location_data,
                            "destination_address": "Customer Location",
                            "payment_status": payment.status,
                            "payment_method": payment.payment_method,
                            "booking_created_at": booking.created_at.isoformat(),
                            "delivery_status": delivery_status,
                            "return_status": return_status
                        })
            
            if not bookings_with_payments:
                print("DEBUG - No pending deliveries found, returning test data")

                bookings_with_payments = [
                    {
                        "id": 999,
                        "rentee_name": "Test Owner",
                        "rider_name": "Test Customer",
                        "item_title": "Test Product",
                        "origin_address": "123 Test Street",
                        "origin_location": {"latitude": 24.8607, "longitude": 67.0011},
                        "destination_address": "456 Customer Ave",
                        "payment_status": "completed",
                        "payment_method": "card",
                        "booking_created_at": "2023-01-01T12:00:00Z"
                    }
                ]
            
            return Response(bookings_with_payments, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error fetching pending deliveries: {e}")
            return Response({"message": "An error occurred fetching pending deliveries."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateDeliveryStatusView(APIView):
    """
    API endpoint to update the delivery status of a booking
    """
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, booking_id):
        try:
            print(f"DEBUG - User updating delivery status: {request.user.username}")
            print(f"DEBUG - User type: {getattr(request.user, 'userType', 'Unknown')}")
            print(f"DEBUG - Booking ID: {booking_id}")
            print(f"DEBUG - Requested status: {request.data.get('status')}")
            
            booking = Booking.objects.get(id=booking_id)
            
            requested_status = request.data.get('status')
            if not requested_status:
                return Response({"message": "Status is required."}, status=status.HTTP_400_BAD_REQUEST)
                
            if requested_status not in ['pending', 'in_delivery', 'delivered']:
                return Response({"message": "Invalid status. Use 'pending', 'in_delivery', or 'delivered'."}, 
                               status=status.HTTP_400_BAD_REQUEST)
        
            booking.delivery_status = requested_status
            booking.save()
            
            return Response({
                "message": f"Delivery status updated to {requested_status}.",
                "booking_id": booking.id,
                "status": booking.delivery_status
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error updating delivery status: {e}")
            return Response({"message": "An error occurred updating the delivery status."}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InitiateReturnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        booking.return_status = 'pending'
        booking.delivery_status = 'pending'
        booking.save()

        return Response({
            "message": "Return initiated. Waiting for owner/rider to accept.",
            "booking_id": booking.id,
            "delivery_status": booking.delivery_status,
            "return_status": booking.return_status
        }, status=status.HTTP_200_OK)


class AcceptReturnView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if booking.return_status != 'pending':
            return Response({"message": "Return is not pending or already in progress."}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.return_status = 'in_return'
        booking.delivery_status = 'in_delivery'
        booking.save()
        
        return Response({
            "message": "Return accepted. Return delivery in progress.",
            "booking_id": booking.id,
            "delivery_status": booking.delivery_status,
            "return_status": booking.return_status
        }, status=status.HTTP_200_OK)


class LatestItemBookingView(APIView):
    """
    API endpoint to get the latest booking for a specific item.
    This is used when filing disputes as an item owner.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, item_id):
        try:
            item = Item.objects.get(id=item_id)
            
            if item.rentee != request.user:
                return Response({"message": "You are not the owner of this item."}, status=status.HTTP_403_FORBIDDEN)

            latest_booking = Booking.objects.filter(
                item=item,
                status__in=['approved', 'completed']
            ).order_by('-created_at').first()
            
            if not latest_booking:
                return Response({"message": "No bookings found for this item."}, status=status.HTTP_404_NOT_FOUND)
            
            booking_data = {
                "id": latest_booking.id,
                "user_id": latest_booking.user.id,
                "user_name": latest_booking.user.username,
                "start_date": latest_booking.start_date,
                "end_date": latest_booking.end_date,
                "status": latest_booking.status,
                "total_price": latest_booking.total_price,
                "delivery_status": latest_booking.delivery_status,
                "return_status": latest_booking.return_status
            }
            
            return Response(booking_data, status=status.HTTP_200_OK)
            
        except Item.DoesNotExist:
            return Response({"message": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
