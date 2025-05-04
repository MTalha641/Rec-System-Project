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
        # Calculate the timestamp for 24 hours ago
        time_threshold = timezone.now() - timedelta(hours=24)
        
        # Find all pending bookings older than 24 hours
        expired_bookings = Booking.objects.filter(
            status='pending',
            created_at__lt=time_threshold
        )
        
        # Update their status to expired
        count = expired_bookings.count()
        expired_bookings.update(status='expired')
        
        return Response({
            "message": f"{count} expired bookings have been updated.",
            "expired_count": count
        }, status=status.HTTP_200_OK)


class RenteeBookingRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # First check and update any expired bookings
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
        # First check and update any expired bookings
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
        # Get only bookings where the current user is the renter and the booking is approved
        user_reservations = Booking.objects.filter(
            user=request.user,
            status='approved'
        ).order_by('-created_at')
        
        # Format the data to include only what's needed
        reservations_data = [{
            "id": booking.id,
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
        
        # Verify that the user is the one who made the booking
        if booking.user != request.user:
            return Response({"message": "You can only cancel your own booking requests."}, status=status.HTTP_403_FORBIDDEN)
        
        # Verify that the booking is still in pending status
        if booking.status != 'pending':
            return Response({"message": "Only pending bookings can be canceled."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete the booking
        booking.delete()
        
        return Response({"message": "Booking request has been canceled successfully."}, status=status.HTTP_200_OK)


class BookingDeliveryDetailsView(APIView):
    """
    API endpoint to get consolidated details for a booking delivery.
    Requires the booking to be approved and paid.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            # Fetch the booking, related item, rentee, renter, and latest payment
            booking = Booking.objects.select_related(
                'item',
                'item__rentee', # Access rentee through the item
                'user' # Access the user who made the booking (renter)
            ).get(id=booking_id)

            # Authorization: Ensure the request user is the renter
            if booking.user != request.user:
                return Response(
                    {"message": "You are not authorized to view these delivery details."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Check if the booking is approved
            if booking.status != 'approved':
                 return Response(
                    {"message": "Booking is not approved for delivery yet."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Find the related payment (assuming one payment per booking for simplicity)
            # Fetch the most recent completed payment for this booking
            payment = Payment.objects.filter(
                booking=booking,
                status='completed'
            ).order_by('-created_at').first()

            if not payment:
                return Response(
                    {"message": "Completed payment for this booking not found."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # --- Origin Location Handling ---
            # Prioritize latitude/longitude on the Item model if they exist
            origin_latitude = getattr(booking.item, 'latitude', None)
            origin_longitude = getattr(booking.item, 'longitude', None)
            origin_address = getattr(booking.item.rentee, 'address', 'Rentee Location') # Fallback address

            # If lat/lon are not on Item, potentially check User (rentee) model
            # Add geocoding here if only address is available

            if origin_latitude is None or origin_longitude is None:
                # Handle missing origin coordinates - maybe return an error or default
                # For now, let's indicate it's missing but allow proceeding with address
                print(f"Warning: Origin coordinates missing for item {booking.item.id}")
                # return Response({"message": "Origin location coordinates missing."}, status=status.HTTP_400_BAD_REQUEST)


            # Prepare response data
            data = {
                "booking_id": booking.id,
                "item_title": booking.item.title,
                "rentee_name": booking.item.rentee.username,
                "origin_address": origin_address, # Use rentee's address or default
                "origin_location": {
                    "latitude": origin_latitude,
                    "longitude": origin_longitude,
                } if origin_latitude and origin_longitude else None,
                "destination_address": "Your Location", # Frontend knows this
                "booking_created_at": booking.created_at,
                "payment_status": payment.status,
                "payment_method": payment.payment_method,
                "payment_created_at": payment.created_at
                # Add other relevant fields as needed
            }

            return Response(data, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error fetching booking delivery details: {e}") # Log error
            return Response({"message": "An error occurred fetching delivery details."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
