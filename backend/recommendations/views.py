from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from recommendations.hybrid import hybrid_recommendation_system
from django.utils import timezone
from .models import Recommendation # Import your Recommendation model
from items.models import SearchHistory # Import your SearchHistory model

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    user_id = request.user.id

    try:
        # --- Step 1: Get current user's search history snapshot ---
        # Define how you want to represent the search history for comparison.
        # This example uses a sorted list of unique queries.
        # You might need a more sophisticated method depending on your data.
        current_search_queries = SearchHistory.objects.filter(user=request.user) \
                                                    .order_by('-timestamp') \
                                                    .values_list('search_query', flat=True)[:50] # Limit for performance
        current_search_history = sorted(list(set(current_search_queries))) # Unique and sorted for consistency


        # --- Step 2: Check for existing, matching recommendations in the database ---
        latest_recommendation = None
        try:
            latest_recommendation = Recommendation.objects.filter(user_id=user_id).latest('created_at')

            # Compare the stored snapshot with the current snapshot
            # JSONField values are automatically converted to Python objects (list/dict),
            # so direct comparison should work if content is structured similarly.
            if latest_recommendation.cached_search_history == current_search_history:
                # Recommendations are fresh based on search history, return cached data
                print(f"Returning cached recommendations for user {user_id} (search history matched).")
                return Response({
                    'success': True,
                    'recommendations': latest_recommendation.recommended_items,
                    'message': 'Recommendations retrieved from cache based on search history.'
                })
            else:
                print(f"Cached recommendations for user {user_id} are stale (search history changed). Generating new ones.")

        except Recommendation.DoesNotExist:
            print(f"No previous recommendation found for user {user_id}. Generating new ones.")
            pass # No existing recommendation, proceed to generate
        except Exception as e:
            # Log any other errors during cache lookup, but proceed to generate
            print(f"Error during cache lookup/comparison for user {user_id}: {e}. Generating new recommendations.")
            pass # Continue to generate recommendations


        # --- Step 3: If no fresh cached recommendations, generate new ones ---
        print(f"Generating new recommendations for user {user_id}...")
        recommendations_df = hybrid_recommendation_system(user_id)

        if recommendations_df.empty:
            message = 'No recommendations available for this user.'
            data = [] # Explicitly set to empty list for storing
            print(f"No recommendations generated for user {user_id}. Storing empty set.")
        else:
            data = recommendations_df.to_dict('records')
            print(f"Recommendations generated for user {user_id}.")

        # --- Step 4: Store the newly generated recommendations and the current search history snapshot ---
        Recommendation.objects.update_or_create(
            user_id=user_id,
            defaults={
                'recommended_items': data,
                'algorithm_used': 'Hybrid',
                'cached_search_history': current_search_history, # Store the new snapshot
                'created_at': timezone.now() # Update timestamp to reflect when this set was computed
            }
        )
        print(f"New recommendations and search history snapshot cached for user {user_id}.")

        return Response({'success': True, 'recommendations': data, 'message': 'New recommendations generated.'})

    except Exception as e:
        print(f"An unexpected error occurred in get_recommendations view: {e}")
        return Response({'success': False, 'error': str(e)}, status=500)