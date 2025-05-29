from django.urls import path
from .views import ReviewAPI

urlpatterns = [
    path("submit/", ReviewAPI.as_view(), name="submit-review"),  
    path("getreview/<int:item_id>/", ReviewAPI.as_view(), name="list-reviews"),  
    path("getoverallscore/<int:item_id>/", ReviewAPI.as_view(), name="item-rating"),
]
