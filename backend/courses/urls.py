from django.urls import path
from . import views

urlpatterns = [
    path('', views.CourseListCreateView.as_view()),
    path('<int:pk>/', views.CourseDetailView.as_view()),
    path('<int:course_pk>/modules/', views.ModuleListCreateView.as_view()),
    path('modules/<int:pk>/', views.ModuleDetailView.as_view()),
    path('enrollments/', views.EnrollmentListCreateView.as_view()),
    path('my/', views.my_courses),
    path('completions/', views.my_completions),
    path('modules/<int:pk>/complete/', views.complete_module),
]
