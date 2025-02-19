from django.db.models import Avg
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Review
from .serializers import ReviewSerializer
from .utils import calculate_review_score

class ReviewAPI(APIView):
    """
    - POST: Submit a review (Authenticated users only)
    - GET (reviews/<item_id>/): Fetch reviews for an item
    - GET (reviews/<item_id>/?score=true): Fetch overall score (1-10)
    """

    def get(self, request, item_id=None):
        """
        - If `?score=true` is passed → Return overall score considering past reviews & ratings.
        - Otherwise, return all reviews for that item.
        """
        if "score" in request.GET:
            avg_score = Review.objects.filter(item_id=item_id).aggregate(Avg("overall_score"))["overall_score__avg"]
            return Response({"item_id": item_id, "overall_score": round(avg_score, 1) if avg_score else 0})

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
            rating = serializer.validated_data["rating"]
            review_text = serializer.validated_data["review"]
            item_id = serializer.validated_data["item"].id
            
            # ✅ Calculate overall score considering past reviews & ratings
            final_score = calculate_review_score(rating, review_text, item_id)
            
            review = serializer.save(overall_score=final_score)  # ✅ Store final weighted score

            return Response({
                "message": "Review submitted",
                "overall_score": final_score
            }, status=201)
        
        return Response(serializer.errors, status=400)
