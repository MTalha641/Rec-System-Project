from django.urls import path
from .views import (
    ConfirmBookingView, 
    RenteeBookingRequestsView, 
    RenterBookingListView, 
    UpdateBookingStatusView, 
    UserReservationsView, 
    CancelBookingView, 
    CheckAndUpdateExpiredBookingsView,
    BookingDeliveryDetailsView,
    PendingDeliveriesView,
    UpdateDeliveryStatusView,
    InitiateReturnView,
    AcceptReturnView,
    LatestItemBookingView
)

urlpatterns = [
    path('confirm/', ConfirmBookingView.as_view(), name='confirm_booking'),
    path('incomingrequests/', RenteeBookingRequestsView.as_view(), name='incoming_booking_requests'),
    path('myrequests/', RenterBookingListView.as_view(), name='my_booking_requests'),
    path('update-status/<int:booking_id>/', UpdateBookingStatusView.as_view(), name='update_booking_status'),
    path('reservations/', UserReservationsView.as_view(), name='user_reservations'),
    path('cancel/<int:booking_id>/', CancelBookingView.as_view(), name='cancel_booking'),
    path('check-expired/', CheckAndUpdateExpiredBookingsView.as_view(), name='check_expired_bookings'),
    path('delivery-details/<int:booking_id>/', BookingDeliveryDetailsView.as_view(), name='delivery_details'),
    path('pending-deliveries/', PendingDeliveriesView.as_view(), name='pending_deliveries'),
    path('update-delivery-status/<int:booking_id>/', UpdateDeliveryStatusView.as_view(), name='update_delivery_status'),
    path('initiate-return/<int:booking_id>/', InitiateReturnView.as_view(), name='initiate_return'),
    path('accept-return/<int:booking_id>/', AcceptReturnView.as_view(), name='accept_return'),
    path('item/<int:item_id>/latest/', LatestItemBookingView.as_view(), name='latest_item_booking'),
]
