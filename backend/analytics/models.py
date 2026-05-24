from django.db import models
from users.models import User
from courses.models import Course


class AlgorithmSettings(models.Model):
    """Singleton — одна строка с глобальными настройками алгоритма."""
    n_clusters                   = models.PositiveSmallIntegerField(default=3)
    min_silhouette_threshold     = models.FloatField(default=0.3)
    recalculation_interval_days  = models.PositiveSmallIntegerField(default=7)
    min_students_for_clustering  = models.PositiveSmallIntegerField(default=2)
    updated_at                   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Настройки алгоритма'

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f'AlgorithmSettings (k={self.n_clusters}, interval={self.recalculation_interval_days}д)'


class BehaviorPattern(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    avg_engagement_threshold = models.FloatField(default=0)
    color = models.CharField(max_length=7, default='#3B82F6')

    def __str__(self):
        return self.name


class ClusteringSession(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='clustering_sessions')
    initiated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    n_clusters = models.PositiveSmallIntegerField(default=3)
    silhouette_score = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class ClusteringResult(models.Model):
    session = models.ForeignKey(ClusteringSession, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    pattern = models.ForeignKey(BehaviorPattern, on_delete=models.SET_NULL, null=True)
    silhouette_coefficient = models.FloatField(default=0)
    analyzed_at = models.DateTimeField(auto_now_add=True)
    recommendation = models.TextField(blank=True)
    feature_vector = models.JSONField(default=list)

    def __str__(self):
        return f'{self.student} → {self.pattern}'
