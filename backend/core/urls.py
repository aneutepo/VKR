from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/activity/', include('activity_tracker.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/testing/', include('testing.urls')),
    path('api/notifications/', include('notifications.urls')),
]
