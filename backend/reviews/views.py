from django.db.models import Avg
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Review
from .serializers import ReviewSerializer
from .utils import analyze_sentiment

class ReviewAPI(APIView):
    """
    Handles:
    - POST: Submit a review (Authenticated users only)
    - GET (reviews/<item_id>/): Fetch reviews for an item
    - GET (reviews/<item_id>/?average=true): Fetch an item's average rating
    """

    def get(self, request, item_id=None):
        """
        - If `?average=true` is passed → Return the average rating.
        - Otherwise, return reviews for that item.
        """
        if "average" in request.GET:
            avg_rating = Review.objects.filter(item_id=item_id).aggregate(Avg("rating"))["rating__avg"]
            return Response({"item_id": item_id, "average_rating": round(avg_rating, 1) if avg_rating else 0})

        reviews = Review.objects.filter(item_id=item_id).order_by("-created_at")
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Submit a new review (Authenticated users only)"""
        self.permission_classes = [IsAuthenticated]  # Ensure authentication
        self.check_permissions(request)

        data = request.data.copy()  # Copy request data
        data["user"] = request.user.id  # Assign authenticated user automatically

        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            review_text = serializer.validated_data["review"]  # Fixed field name
            sentiment = analyze_sentiment(review_text)
            serializer.save(sentiment=sentiment)  # Save review with sentiment

            return Response({"message": "Review submitted", "sentiment": sentiment}, status=201)
        return Response(serializer.errors, status=400)
