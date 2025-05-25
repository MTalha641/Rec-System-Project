from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from recommendations.hybrid import hybrid_recommendation_system
from django.utils import timezone # Import timezone
from datetime import timedelta # Import timedelta
from .models import Recommendation # Import your Recommendation model

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    try:
        user_id = request.user.id
        
        # Define the cache duration (3 days)
        CACHE_DURATION_DAYS = 3
        
        # 1. Check for existing, fresh recommendations in the database
        try:
            # Get the most recent recommendation for the user
            latest_recommendation = Recommendation.objects.filter(user_id=user_id).latest('created_at')
            
            # Check if the recommendation is still fresh (within CACHE_DURATION_DAYS)
            time_difference = timezone.now() - latest_recommendation.created_at
            
            if time_difference.days < CACHE_DURATION_DAYS:
                # Recommendations are fresh, return cached data
                print(f"Returning cached recommendations for user {user_id}")
                return Response({
                    'success': True,
                    'recommendations': latest_recommendation.recommended_items,
                    'message': 'Recommendations retrieved from cache.'
                })
        except Recommendation.DoesNotExist:
            # No previous recommendation for this user, proceed to generate
            print(f"No cached recommendations found for user {user_id}. Generating new ones.")
            pass # Continue to generate recommendations
        except Exception as e:
            # Log any other errors during cache lookup, but proceed to generate
            print(f"Error during cache lookup for user {user_id}: {e}. Generating new recommendations.")
            pass
            
        # 2. If no fresh cached recommendations, generate new ones
        print(f"Generating new recommendations for user {user_id}...")
        recommendations_df = hybrid_recommendation_system(user_id)

        if recommendations_df.empty:
            message = 'No recommendations available for this user.'
            
            # Store empty recommendations and explicitly update 'created_at'
            # This ensures that even if no recommendations are found, the timestamp is updated
            # to mark when this "empty" state was last computed.
            Recommendation.objects.update_or_create(
                user_id=user_id,
                defaults={
                    'recommended_items': [],
                    'algorithm_used': 'Hybrid',
                    'created_at': timezone.now() # <--- Crucial change: Manually set created_at
                }
            )
            
            return Response({
                'success': True,
                'recommendations': [],
                'message': message
            })

        data = recommendations_df.to_dict('records')

        # 3. Store the newly generated recommendations in the database (cache)
        # Use update_or_create to either update an existing entry or create a new one.
        # Explicitly setting 'created_at' to timezone.now() will ensure it gets updated
        # when an existing record is found and modified.
        Recommendation.objects.update_or_create(
            user_id=user_id,
            defaults={
                'recommended_items': data,
                'algorithm_used': 'Hybrid',
                'created_at': timezone.now() # <--- Crucial change: Manually set created_at
            }
        )
        print(f"New recommendations generated and cached for user {user_id}.")

        return Response({'success': True, 'recommendations': data})

    except Exception as e:
        print(f"An unexpected error occurred in get_recommendations view: {e}")
        return Response({'success': False, 'error': str(e)}, status=500)

# Your Recommendation model remains as you defined it
# from django.db import models
# from users.models import User
# # Create your models here.
# class Recommendation(models.Model):
#     user = models.ForeignKey(User, related_name='recommendations', on_delete=models.CASCADE)
#     recommended_items = models.JSONField()  # Store recommended item IDs or details
#     algorithm_used = models.CharField(max_length=50)  # e.g., 'Content-Based', 'Collaborative'
#     created_at = models.DateTimeField(auto_now_add=True) # auto_now_add is fine, but we'll override it on update

#     def __str__(self):
#         return f"Recommendation for {self.user.username}"