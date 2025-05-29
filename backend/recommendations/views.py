from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from recommendations.hybrid import hybrid_recommendation_system
from django.utils import timezone
from .models import Recommendation 
from items.models import SearchHistory 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    user_id = request.user.id

    try:
        current_search_queries = SearchHistory.objects.filter(user=request.user) \
                                                    .order_by('-timestamp') \
                                                    .values_list('search_query', flat=True)[:50] 
        current_search_history = sorted(list(set(current_search_queries))) 


        latest_recommendation = None
        try:
            latest_recommendation = Recommendation.objects.filter(user_id=user_id).latest('created_at')

            if latest_recommendation.cached_search_history == current_search_history:
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
            pass 
        except Exception as e:
            print(f"Error during cache lookup/comparison for user {user_id}: {e}. Generating new recommendations.")
            pass 


        print(f"Generating new recommendations for user {user_id}...")
        recommendations_df = hybrid_recommendation_system(user_id)

        if recommendations_df.empty:
            message = 'No recommendations available for this user.'
            data = [] 
            print(f"No recommendations generated for user {user_id}. Storing empty set.")
        else:
            data = recommendations_df.to_dict('records')
            print(f"Recommendations generated for user {user_id}.")

        Recommendation.objects.update_or_create(
            user_id=user_id,
            defaults={
                'recommended_items': data,
                'algorithm_used': 'Hybrid',
                'cached_search_history': current_search_history, 
                'created_at': timezone.now() 
            }
        )
        print(f"New recommendations and search history snapshot cached for user {user_id}.")

        return Response({'success': True, 'recommendations': data, 'message': 'New recommendations generated.'})

    except Exception as e:
        print(f"An unexpected error occurred in get_recommendations view: {e}")
        return Response({'success': False, 'error': str(e)}, status=500)