from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserListCreateView.as_view(), name='user-list-create'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('<int:pk>/reset-password/', views.reset_password, name='reset-password'),
    path('me/', views.my_profile, name='my-profile'),
    path('me/change-password/', views.change_password, name='change-password'),
    path('students/', views.StudentListView.as_view(), name='student-list'),
    path('register/', views.StudentRegisterView.as_view(), name='student-register'),
]
