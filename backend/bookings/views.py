from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from items.models import Item
from datetime import datetime

class ConfirmBookingView(APIView):
    permission_classes = [IsAuthenticated]  # Require authentication

    def post(self, request):
        item_id = request.data.get("item_id")  # Get item ID from request body
        start_date = request.data.get("start_date")  # Get start date
        end_date = request.data.get("end_date")  # Get end date

        if not item_id or not start_date or not end_date:
            return Response({"message": "Missing required fields (item_id, start_date, end_date)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = Item.objects.get(id=item_id)  # Fetch item
        except Item.DoesNotExist:
            return Response({"message": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        # Convert string dates to actual date objects
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        if start_date > end_date:
            return Response({"message": "Start date cannot be after end date."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if item is already booked in the selected date range
        overlapping_bookings = Booking.objects.filter(
            item=item,
            start_date__lt=end_date,  # Overlapping start date
            end_date__gt=start_date    # Overlapping end date
        )

        if overlapping_bookings.exists():
            return Response({"message": "This item is already booked for the selected dates."}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate total price based on per-day cost
        total_days = (end_date - start_date).days + 1
        total_price = item.price * total_days  # Multiply per-day price by total days

        # Create the booking
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
