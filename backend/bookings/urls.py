from django.urls import path
from .views import (
    ConfirmBookingView, 
    RenteeBookingRequestsView, 
    RenterBookingListView, 
    UpdateBookingStatusView, 
    UserReservationsView, 
    CancelBookingView, 
    CheckAndUpdateExpiredBookingsView,
    BookingDeliveryDetailsView
)

urlpatterns = [
    path('confirm/', ConfirmBookingView.as_view(), name='confirm-booking'),
    path('incomingrequests/', RenteeBookingRequestsView.as_view(), name='owner-booking-requests'),
    path('myrequests/', RenterBookingListView.as_view(), name='renter-bookings'),
    path('update-status/<int:booking_id>/', UpdateBookingStatusView.as_view(), name='update-booking-status'),
    path('reservations/', UserReservationsView.as_view(), name='user-reservations'),
    path('cancel/<int:booking_id>/', CancelBookingView.as_view(), name='cancel-booking'),
    path('check-expired/', CheckAndUpdateExpiredBookingsView.as_view(), name='check-expired-bookings'),
    path('delivery-details/<int:booking_id>/', BookingDeliveryDetailsView.as_view(), name='booking-delivery-details'),
]
