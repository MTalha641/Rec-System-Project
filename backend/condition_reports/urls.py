from django.urls import path
from .views import ItemConditionReportListCreateView, ItemConditionReportRetrieveUpdateDestroyView

urlpatterns = [
    path('', ItemConditionReportListCreateView.as_view(), name='item-condition-report-list-create'),
    path('<int:pk>/', ItemConditionReportRetrieveUpdateDestroyView.as_view(), name='item-condition-report-retrieve-update-destroy'),
]