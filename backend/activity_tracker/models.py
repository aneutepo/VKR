from django.db import models
from users.models import User
from courses.models import Course, Module


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('view', 'Просмотр'),
        ('click', 'Клик'),
        ('test', 'Тест'),
        ('login', 'Вход'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    session_start = models.DateTimeField()
    session_end = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-session_start']

    def __str__(self):
        return f'{self.student} — {self.action_type}'


class StudentMetrics(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='metrics')
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    total_time_minutes = models.FloatField(default=0)
    session_count = models.PositiveIntegerField(default=0)
    avg_session_duration = models.FloatField(default=0)
    content_views = models.PositiveIntegerField(default=0)
    test_attempts = models.PositiveIntegerField(default=0)
    avg_test_score = models.FloatField(default=0)
    last_activity = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'course']
        verbose_name = 'Метрики студента'
