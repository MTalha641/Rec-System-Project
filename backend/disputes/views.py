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
from django.utils import timezone

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
        dispute.ai_outcome = result.get('outcome', 'none')
        dispute.ai_at_fault = result.get('at_fault', 'none')
        dispute.ai_confidence_score = result.get('confidence_score', 0.0)
    
    # Store additional analysis metrics for debugging/review
        dispute.total_evidence_score = result.get('total_evidence_score', 0.0)
        dispute.context_difference = result.get('context_difference', 0.0)
    
    # Set legacy fields for backward compatibility
        dispute.outcome = dispute.ai_outcome
        dispute.at_fault = dispute.ai_at_fault
    
    # Enhanced auto-resolution logic based on AI service thresholds
        confidence_score = dispute.ai_confidence_score
        total_evidence = result.get('total_evidence_score', 0.0)
        outcome = dispute.ai_outcome
    
    # Auto-resolve cases with high confidence AND clear outcomes
        if confidence_score >= 0.8 and outcome in ['valid', 'invalid']:
            dispute.status = 'resolved'
            dispute.resolution_method = 'auto_ai_high_confidence'
    
    # Auto-resolve very strong evidence cases even with moderate confidence
        elif confidence_score >= 0.6 and total_evidence > 0.5 and outcome == 'valid':
            dispute.status = 'resolved'
            dispute.resolution_method = 'auto_ai_strong_evidence'
    
    # Auto-resolve very weak evidence cases with decent confidence
        elif confidence_score >= 0.6 and total_evidence < 0.3 and outcome == 'invalid':
            dispute.status = 'resolved'
            dispute.resolution_method = 'auto_ai_weak_evidence'
    
    # All other cases require manual review
        else:
            dispute.status = 'pending'
            dispute.resolution_method = 'manual_review_required'
        
        # Add specific reason for manual review
            if confidence_score < 0.6:
                dispute.review_reason = 'low_confidence'
            elif 0.3 <= total_evidence <= 0.5:
                dispute.review_reason = 'moderate_evidence_ambiguous'
            else:
                dispute.review_reason = 'complex_case'
        dispute.save()
    
    # Log the decision for monitoring
        print(f"Dispute {dispute.id}: {outcome} (confidence: {confidence_score:.2f}, "
          f"evidence: {total_evidence:.2f}) -> {dispute.status}")
    
        return result

class ResolveDisputeView(generics.UpdateAPIView):
    serializer_class = DisputeResolveSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admin can manually resolve
    
    def get_queryset(self):
        return Dispute.objects.all()
    
    def perform_update(self, serializer):
        dispute = serializer.instance
        
        # Save admin decision as ground truth
        dispute.admin_outcome = serializer.validated_data.get('outcome', dispute.ai_outcome)
        dispute.admin_at_fault = serializer.validated_data.get('at_fault', dispute.ai_at_fault)
        dispute.admin_reviewed = True
        dispute.admin_reviewed_by = self.request.user
        dispute.admin_reviewed_at = timezone.now()
        dispute.status = 'resolved'
        
        # Update legacy fields
        dispute.outcome = dispute.admin_outcome
        dispute.at_fault = dispute.admin_at_fault
        
        dispute.save()
        
        # If renter is at fault, increment fault count
        if dispute.admin_at_fault == 'renter':
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

# New view for metrics calculation
class DisputeMetricsView(APIView):
    """View for calculating and displaying AI metrics"""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        from .metrics import DisputeMetricsCalculator
        
        # Get query parameters
        days_back = request.query_params.get('days_back')
        if days_back:
            try:
                days_back = int(days_back)
            except ValueError:
                days_back = None
        
        calculator = DisputeMetricsCalculator()
        metrics = calculator.calculate_comprehensive_metrics(days_back)
        
        return Response(metrics)

class ExportMetricsView(APIView):
    """View for exporting metrics report"""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
        from .metrics import DisputeMetricsCalculator
        
        days_back = request.data.get('days_back')
        if days_back:
            try:
                days_back = int(days_back)
            except ValueError:
                days_back = None
        
        calculator = DisputeMetricsCalculator()
        filepath = calculator.export_metrics_report(days_back=days_back)
        
        return Response({
            'message': 'Metrics report exported successfully',
            'filepath': filepath
        })
