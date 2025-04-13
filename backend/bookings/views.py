from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from items.models import Item
from datetime import datetime

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


class RenteeBookingRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rentee = request.user
        bookings = Booking.objects.filter(item__rentee=rentee, status='pending').order_by('-created_at')

        data = [{
            "booking_id": b.id,
            "item_title": b.item.title,
            "renter_name": b.user.username,
            "start_date": b.start_date,
            "end_date": b.end_date,
            "total_price": b.total_price,
            "status": b.status
        } for b in bookings]

        return Response(data, status=status.HTTP_200_OK)


class RenterBookingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        renter = request.user
        bookings = Booking.objects.filter(user=renter).order_by('-created_at')

        data = [{
            "booking_id": b.id,
            "item_title": b.item.title,
            "rentee_name": b.item.rentee.username,
            "start_date": b.start_date,
            "end_date": b.end_date,
            "total_price": b.total_price,
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
