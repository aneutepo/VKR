import csv
from django.http import HttpResponse
from rest_framework import permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import BehaviorPattern, ClusteringSession, ClusteringResult, AlgorithmSettings
from .clustering import run_hybrid_clustering, get_recommendation
from activity_tracker.models import StudentMetrics
from courses.models import Course
from users.views import IsTeacherOrAdmin


class ClusteringResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    pattern_name = serializers.CharField(source='pattern.name', read_only=True)
    pattern_color = serializers.CharField(source='pattern.color', read_only=True)

    class Meta:
        model = ClusteringResult
        fields = ['id', 'student', 'student_name', 'pattern', 'pattern_name',
                  'pattern_color', 'silhouette_coefficient', 'analyzed_at',
                  'recommendation', 'feature_vector']


class ClusteringSessionSerializer(serializers.ModelSerializer):
    results = ClusteringResultSerializer(many=True, read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = ClusteringSession
        fields = ['id', 'course', 'course_title', 'n_clusters',
                  'silhouette_score', 'created_at', 'results']


def _ensure_patterns():
    defaults = [
        {'name': 'Проактивный', 'description': 'Высокая вовлечённость', 'avg_engagement_threshold': 0.75, 'color': '#22C55E'},
        {'name': 'Средний', 'description': 'Умеренная активность', 'avg_engagement_threshold': 0.45, 'color': '#F59E0B'},
        {'name': 'Апатичный', 'description': 'Низкая активность, группа риска', 'avg_engagement_threshold': 0.15, 'color': '#EF4444'},
    ]
    return [BehaviorPattern.objects.get_or_create(name=d['name'], defaults=d)[0] for d in defaults]


@api_view(['POST'])
@permission_classes([IsTeacherOrAdmin])
def run_clustering(request):
    course_id = request.data.get('course_id')
    n_clusters = int(request.data.get('n_clusters', 3))

    try:
        course = Course.objects.get(pk=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Курс не найден'}, status=404)

    metrics_qs = StudentMetrics.objects.filter(course=course).select_related('student')
    if metrics_qs.count() < 2:
        return Response({'error': 'Нужно минимум 2 студента с метриками'}, status=400)

    patterns = _ensure_patterns()
    results_map, global_silhouette = run_hybrid_clustering(metrics_qs, n_clusters)

    session = ClusteringSession.objects.create(
        course=course, initiated_by=request.user,
        n_clusters=n_clusters, silhouette_score=global_silhouette,
    )

    apathetic_students = []
    for student_id, data in results_map.items():
        pattern = patterns[data['pattern_index'] % len(patterns)]
        ClusteringResult.objects.create(
            session=session, student_id=student_id, pattern=pattern,
            silhouette_coefficient=data['silhouette'],
            recommendation=get_recommendation(pattern.name),
            feature_vector=data['features'],
        )
        if pattern.name == 'Апатичный':
            apathetic_students.append(student_id)

    # Уведомляем преподавателя о студентах группы риска
    from notifications.utils import notify
    from users.models import User as UserModel
    if apathetic_students:
        names = ', '.join(
            UserModel.objects.filter(id__in=apathetic_students).values_list('last_name', flat=True)
        )
        notify(
            user=request.user,
            title='Обнаружены студенты группы риска',
            message=f'По курсу «{course.title}» выявлены студенты с низкой активностью (паттерн «Апатичный»): {names}. Рекомендуется принять корректирующие меры.',
            notif_type='danger',
        )
    else:
        notify(
            user=request.user,
            title=f'Кластеризация завершена — {course.title}',
            message=f'Анализ завершён успешно. Силуэтный коэффициент: {round(global_silhouette, 3)}. Студентов в группе риска не обнаружено.',
            notif_type='success',
        )

    return Response(ClusteringSessionSerializer(session).data, status=201)


@api_view(['GET'])
@permission_classes([IsTeacherOrAdmin])
def latest_clustering(request):
    course_id = request.query_params.get('course_id')
    session = ClusteringSession.objects.filter(course_id=course_id).order_by('-created_at').first()
    if not session:
        return Response({'error': 'Кластеризация ещё не запускалась'}, status=404)
    return Response(ClusteringSessionSerializer(session).data)


@api_view(['GET'])
@permission_classes([IsTeacherOrAdmin])
def clustering_history(request):
    course_id = request.query_params.get('course_id')
    qs = ClusteringSession.objects.filter(course_id=course_id) if course_id else ClusteringSession.objects.all()
    return Response(ClusteringSessionSerializer(qs, many=True).data)


class AlgorithmSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlgorithmSettings
        fields = ['n_clusters', 'min_silhouette_threshold',
                  'recalculation_interval_days', 'min_students_for_clustering', 'updated_at']
        read_only_fields = ['updated_at']


@api_view(['GET', 'PATCH'])
@permission_classes([IsTeacherOrAdmin])
def algorithm_settings(request):
    settings = AlgorithmSettings.get()
    if request.method == 'PATCH':
        ser = AlgorithmSettingsSerializer(settings, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)
    return Response(AlgorithmSettingsSerializer(settings).data)


@api_view(['GET'])
@permission_classes([IsTeacherOrAdmin])
def export_csv(request):
    course_id = request.query_params.get('course_id')
    session = ClusteringSession.objects.filter(course_id=course_id).order_by('-created_at').first() if course_id else None

    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'attachment; filename="analytics_report.csv"'
    response.write('﻿')  # BOM для корректного открытия в Excel

    writer = csv.writer(response)
    writer.writerow(['Студент', 'Паттерн', 'Силуэтный коэффициент', 'Рекомендация', 'Дата анализа'])

    if session:
        for r in session.results.select_related('student', 'pattern'):
            writer.writerow([
                r.student.full_name,
                r.pattern.name if r.pattern else '—',
                round(r.silhouette_coefficient, 3),
                r.recommendation,
                r.analyzed_at.strftime('%d.%m.%Y'),
            ])

    return response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pattern_distribution(request):
    course_id = request.query_params.get('course_id')
    session = ClusteringSession.objects.filter(course_id=course_id).order_by('-created_at').first() if course_id else None
    if not session:
        return Response([])
    dist = {}
    for r in session.results.all().select_related('pattern'):
        name = r.pattern.name if r.pattern else 'Неизвестно'
        color = r.pattern.color if r.pattern else '#6366f1'
        dist.setdefault(name, {'name': name, 'count': 0, 'color': color})
        dist[name]['count'] += 1
    return Response(list(dist.values()))
