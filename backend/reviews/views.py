<<<<<<< HEAD
from django.shortcuts import render

# Create your views here.
=======
from django.db.models import Avg
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Review
from .serializers import ReviewSerializer
from .utils import calculate_overall_score

class ReviewAPI(APIView):
    """
    - POST: Submit a review (Authenticated users only)
    - GET (reviews/<item_id>/?score=true): Fetch overall score (1-5)
    """

    def get(self, request, item_id=None):
        """
        - If `?score=true` is passed → Return dynamically calculated overall score.
        - Otherwise, return all reviews for that item.
        """
        if "score" in request.GET:
            overall_score = calculate_overall_score(item_id)
            return Response({"item_id": item_id, "overall_score": overall_score})

        reviews = Review.objects.filter(item_id=item_id).order_by("-created_at")
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Submit a new review (Authenticated users only)"""
        self.permission_classes = [IsAuthenticated]
        self.check_permissions(request)

        data = request.data.copy()
        data["user"] = request.user.id  

        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save()  # ✅ Just store the review, no score calculation here
            return Response({"message": "Review submitted successfully"}, status=201)
        
        return Response(serializer.errors, status=400)
>>>>>>> ec78a19527262ad4e08178b934d5c508a446979a
