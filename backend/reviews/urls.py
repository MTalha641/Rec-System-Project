from django.urls import path
from .views import ReviewAPI

urlpatterns = [
    path("submit/", ReviewAPI.as_view(), name="submit-review"),  # POST: Submit a review
    path("getreview/<int:item_id>/", ReviewAPI.as_view(), name="list-reviews"),  # GET: Fetch reviews for an item
    path("getrating/<int:item_id>/?average=true", ReviewAPI.as_view(), name="item-rating"),  # GET: Fetch average rating
]
