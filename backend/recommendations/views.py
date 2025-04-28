from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .hybrid import hybrid_recommendation_system


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    try:
        user_id = request.user.id

        # Fetch recommendations for the user
        recommendations = hybrid_recommendation_system(user_id)

        if recommendations.empty:
            return Response({
                'success': True,
                'recommendations': [],
                'message': 'No recommendations available for this user.'
            })

        data = recommendations.to_dict('records')

        return Response({'success': True, 'recommendations': data})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

