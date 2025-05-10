from rest_framework import generics, permissions
from .models import ItemConditionReport
from .serializers import ItemConditionReportSerializer

class ItemConditionReportListCreateView(generics.ListCreateAPIView):
    queryset = ItemConditionReport.objects.all()
    serializer_class = ItemConditionReportSerializer
    permission_classes = [permissions.IsAuthenticated]  # Only authenticated users can access

    def get_queryset(self):
        """Optionally filter by booking."""
        booking_id = self.request.query_params.get('booking_id', None)
        queryset = super().get_queryset()
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)
        return queryset

    def get_serializer_context(self):
        """Pass the request to the serializer context."""
        return {'request': self.request}

class ItemConditionReportRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ItemConditionReport.objects.all()
    serializer_class = ItemConditionReportSerializer
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can access