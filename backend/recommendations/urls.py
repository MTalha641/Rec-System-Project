from django.urls import path
from .views import get_recommendations

urlpatterns = [
    path('getrecommendation/', get_recommendations, name='get_recommendations'),
]
