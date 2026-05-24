from django.urls import path
from . import views

urlpatterns = [
    path('logs/', views.ActivityLogListView.as_view()),
    path('log/', views.log_activity),
    path('metrics/', views.StudentMetricsListView.as_view()),
    path('my-metrics/', views.my_metrics),
]
