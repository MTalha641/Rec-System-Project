# disputes/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.DisputeListView.as_view(), name='dispute-list'),
    path('<int:pk>/', views.DisputeDetailView.as_view(), name='dispute-detail'),
    path('create/<int:booking_id>/<int:item_id>/', views.CreateDisputeView.as_view(), name='create-dispute'),
    path('<int:pk>/resolve/', views.ResolveDisputeView.as_view(), name='resolve-dispute'),
    path('my-disputes/', views.UserDisputesView.as_view(), name='my-disputes'),
    
    # Test endpoints for CLIP analysis
    path('test/clip-analysis/<int:booking_id>/', views.test_clip_analysis, name='test-clip-analysis'),
    path('test/enhanced-analysis/', views.test_enhanced_dispute_analysis, name='test-enhanced-analysis'),
    path('<int:dispute_id>/enable-enhanced/', views.enable_enhanced_analysis, name='enable-enhanced-analysis'),
]   