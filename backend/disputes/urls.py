# disputes/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.DisputeListView.as_view(), name='dispute-list'),
    path('<int:pk>/', views.DisputeDetailView.as_view(), name='dispute-detail'),
    path('create/<int:rental_id>/<int:booking_id>/<int:item_id>/', views.CreateDisputeView.as_view(), name='create-dispute'),
    path('<int:pk>/resolve/', views.ResolveDisputeView.as_view(), name='resolve-dispute'),
    path('my-disputes/', views.UserDisputesView.as_view(), name='my-disputes'),
]