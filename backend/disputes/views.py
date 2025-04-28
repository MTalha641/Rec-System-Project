# disputes/views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Dispute
from .serializers import DisputeSerializer, DisputeCreateSerializer, DisputeResolveSerializer
from items.models import Item
from users.models import User
from .ai_service import analyze_dispute

class DisputeListView(generics.ListAPIView):
    serializer_class = DisputeSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Dispute.objects.all()
        elif user.user_type == 'owner':
            return Dispute.objects.filter(rental__product__owner=user)
        else:
            return Dispute.objects.filter(rental__renter=user)

class DisputeDetailView(generics.RetrieveAPIView):
    serializer_class = DisputeSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Dispute.objects.all()
        elif user.user_type == 'owner':
            return Dispute.objects.filter(rental__product__owner=user)
        else:
            return Dispute.objects.filter(rental__renter=user)

class CreateDisputeView(generics.CreateAPIView):
    serializer_class = DisputeCreateSerializer
    
    def perform_create(self, serializer):
        rental_id = self.kwargs.get('rental_id')
        rental = get_object_or_404(Item, id=rental_id)
        
        # Check if user is either the owner or renter
        user = self.request.user
        if user != rental.product.owner and user != rental.renter:
            return Response({"error": "You don't have permission to create a dispute for this rental"},
                          status=status.HTTP_403_FORBIDDEN)
        
        # Check if a dispute already exists
        if Dispute.objects.filter(rental=rental).exists():
            return Response({"error": "A dispute already exists for this rental"},
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check if both checkout and return reports exist
        if not hasattr(rental, 'checkout_report') or not hasattr(rental, 'return_report'):
            return Response({"error": "Both checkout and return reports must exist to create a dispute"},
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create dispute
        dispute = serializer.save(
            rental=rental,
            filed_by=user,
            status='pending'
        )
        
        # Update rental status
        rental.status = 'disputed'
        rental.save()
        
        # Trigger AI analysis
        self.process_dispute_with_ai(dispute)
        
        return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)
    
    def process_dispute_with_ai(self, dispute):
        # Call AI service to analyze the dispute
        checkout_report = dispute.rental.checkout_report
        return_report = dispute.rental.return_report
        
        result = analyze_dispute(checkout_report, return_report, dispute.description)
        
        # Update dispute with AI analysis results
        dispute.ai_analysis = result['analysis']
        dispute.outcome = result['outcome']
        dispute.at_fault = result['at_fault']
        dispute.status = 'resolved'  # Auto-resolve based on AI analysis
        dispute.save()
        
        # If renter is at fault, increment fault count
        if result['at_fault'] == 'renter':
            renter = dispute.rental.renter
            renter.increment_fault()

class ResolveDisputeView(generics.UpdateAPIView):
    serializer_class = DisputeResolveSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admin can manually resolve
    
    def get_queryset(self):
        return Dispute.objects.all()
    
# dpisputes/views.py (continued)
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
        
        if user.user_type == 'owner':
            return Dispute.objects.filter(rental__product__owner=user)
        else:
            return Dispute.objects.filter(rental__renter=user)
            