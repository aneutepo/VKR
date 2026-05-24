from django.urls import path
from . import views

urlpatterns = [
    path('cluster/', views.run_clustering),
    path('latest/', views.latest_clustering),
    path('history/', views.clustering_history),
    path('distribution/', views.pattern_distribution),
    path('settings/', views.algorithm_settings),
    path('export/', views.export_csv),
]
