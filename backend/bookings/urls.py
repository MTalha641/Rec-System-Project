from django.urls import path
from django.urls import path
from .views import ConfirmBookingView, RenteeBookingRequestsView, RenterBookingListView, UpdateBookingStatusView

urlpatterns = [
    path('confirm/', ConfirmBookingView.as_view(), name='confirm-booking'),
    path('incomingrequests/', RenteeBookingRequestsView.as_view(), name='owner-booking-requests'),
    path('myrequests/', RenterBookingListView.as_view(), name='renter-bookings'),
    path('update-status/<int:booking_id>/', UpdateBookingStatusView.as_view(), name='update-booking-status'),
]
