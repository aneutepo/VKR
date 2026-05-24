from rest_framework import generics, permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import ActivityLog, StudentMetrics
from users.views import IsTeacherOrAdmin


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ['student']


class StudentMetricsSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = StudentMetrics
        fields = '__all__'


class ActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return ActivityLog.objects.filter(student=user)
        return ActivityLog.objects.all()


class StudentMetricsListView(generics.ListAPIView):
    serializer_class = StudentMetricsSerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        qs = StudentMetrics.objects.all().select_related('student', 'course')
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_metrics(request):
    qs = StudentMetrics.objects.filter(student=request.user).select_related('course')
    return Response(StudentMetricsSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def log_activity(request):
    serializer = ActivityLogSerializer(data=request.data)
    if serializer.is_valid():
        log = serializer.save(student=request.user)
        _update_metrics(request.user, log)
        return Response(ActivityLogSerializer(log).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _update_metrics(student, log):
    if not log.course:
        return
    metrics, _ = StudentMetrics.objects.get_or_create(student=student, course=log.course)
    logs = ActivityLog.objects.filter(student=student, course=log.course)
    metrics.session_count = logs.count()
    total_secs = sum(l.duration_seconds for l in logs)
    metrics.total_time_minutes = round(total_secs / 60, 2)
    metrics.avg_session_duration = round(metrics.total_time_minutes / max(metrics.session_count, 1), 2)
    metrics.content_views = logs.filter(action_type='view').count()
    metrics.test_attempts = logs.filter(action_type='test').count()
    metrics.last_activity = timezone.now()
    metrics.save()
