# disputes/views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied, ValidationError
from .models import Dispute
from .serializers import DisputeSerializer, DisputeCreateSerializer, DisputeResolveSerializer
from items.models import Item
from users.models import User
from .ai_service import analyze_dispute
from bookings.models import Booking
from condition_reports.models import ItemConditionReport

class DisputeListView(generics.ListAPIView):
    serializer_class = DisputeSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Dispute.objects.all()
        elif user.userType == 'owner':
            return Dispute.objects.filter(rental__product__owner=user)
        else:
            return Dispute.objects.filter(rental__rentee=user)

class DisputeDetailView(generics.RetrieveAPIView):
    serializer_class = DisputeSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Dispute.objects.all()
        elif user.userType == 'owner':
            return Dispute.objects.filter(rental__product__owner=user)
        else:
            return Dispute.objects.filter(rental__rentee=user)

class CreateDisputeView(generics.CreateAPIView):
    serializer_class = DisputeCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Get `rental_id` and `booking_id` from the URL
        # rental_id = self.kwargs.get('rental_id')
        booking_id = self.kwargs.get('booking_id')
        item_id = self.kwargs.get('item_id')

        # Validate the existence of the rental item and booking
        rental = get_object_or_404(Item, id=item_id)
        booking = get_object_or_404(Booking, id=booking_id)
        print(rental.rentee_id, booking.id)

        # Validate the existence of both checkout and return condition reports
        checkout_report = get_object_or_404(ItemConditionReport, booking=booking.id, report_type='checkout')
        return_report = get_object_or_404(ItemConditionReport, booking=booking.id, report_type='return')

        print(checkout_report.overall_condition, return_report.overall_condition)
        # Ensure the user is either the owner or renter
        user = self.request.user
        # print(user.id, rental.rentee_id)
        if user.id != rental.rentee_id:
            raise PermissionDenied("You don't have permission to create a dispute for this rental.")

        # Ensure a dispute doesn't already exist for this booking
        if Dispute.objects.filter(rental=rental, checkout_report=checkout_report, return_report=return_report).exists():
            raise ValidationError("A dispute already exists for this booking.")

        # Create the dispute
        dispute = serializer.save(
            rental=rental,
            filed_by=user,
            checkout_report=checkout_report.overall_condition,
            return_report=return_report.overall_condition,
            status='pending'
        )

        # Trigger AI analysis
        self.process_dispute_with_ai(dispute)

    def process_dispute_with_ai(self, dispute):
        # Call AI service to analyze the dispute
        result = analyze_dispute(dispute.checkout_report, dispute.return_report, dispute.description)

        # Update dispute with AI analysis results
        dispute.ai_analysis = result.get('analysis', '')
        dispute.outcome = result.get('outcome', 'none')
        dispute.at_fault = result.get('at_fault', 'none')
        dispute.status = 'resolved' if dispute.outcome == 'valid' else 'pending'
        dispute.save()

class ResolveDisputeView(generics.UpdateAPIView):
    serializer_class = DisputeResolveSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admin can manually resolve
    
    def get_queryset(self):
        return Dispute.objects.all()
    
    def perform_update(self, serializer):
        dispute = serializer.instance
        serializer.save(status='resolved')
        
        # If renter is at fault, increment fault count
        if serializer.validated_data.get('at_fault') == 'renter':
            renter = dispute.rental.renter
            renter.increment_fault()
            renter.save()

class UserDisputesView(generics.ListAPIView):
    """View for users to see their own disputes"""
    serializer_class = DisputeSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.userType == 'owner':
            return Dispute.objects.filter(rental__product__owner=user)
        else:
            return Dispute.objects.filter(rental__rentee=user)
