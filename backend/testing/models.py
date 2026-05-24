from django.db import models
from users.models import User
from courses.models import Module


class Test(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='tests')
    title = models.CharField(max_length=255)
    max_score = models.FloatField(default=100)
    passing_score = models.FloatField(default=60)

    def __str__(self):
        return self.title


class Question(models.Model):
    TYPE_SINGLE   = 'single'
    TYPE_MULTIPLE = 'multiple'
    QUESTION_TYPES = [
        (TYPE_SINGLE,   'Один правильный ответ'),
        (TYPE_MULTIPLE, 'Несколько правильных ответов'),
    ]
    test          = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    text          = models.TextField('Текст вопроса')
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default=TYPE_SINGLE)
    order         = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text[:60]


class Answer(models.Model):
    question   = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text       = models.CharField('Текст ответа', max_length=500)
    is_correct = models.BooleanField('Правильный', default=False)

    def __str__(self):
        return f'{"✓" if self.is_correct else "✗"} {self.text[:40]}'


class TestResult(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_results')
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='results')
    score = models.FloatField(default=0)
    attempts = models.PositiveSmallIntegerField(default=1)
    passed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    def save(self, *args, **kwargs):
        self.passed = self.score >= self.test.passing_score
        super().save(*args, **kwargs)
        self._update_metrics()

    def _update_metrics(self):
        from activity_tracker.models import StudentMetrics
        from django.db.models import Avg
        course = self.test.module.course
        metrics, _ = StudentMetrics.objects.get_or_create(student=self.student, course=course)
        agg = TestResult.objects.filter(student=self.student, test__module__course=course).aggregate(Avg('score'))
        metrics.avg_test_score = agg['score__avg'] or 0
        metrics.test_attempts = TestResult.objects.filter(student=self.student, test__module__course=course).count()
        metrics.save()
