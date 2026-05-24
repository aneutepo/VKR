from django.db import models
from users.models import User


class Course(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('published', 'Опубликован'),
        ('archived', 'Архивирован'),
    ]

    title = models.CharField('Название курса', max_length=255)
    description = models.TextField('Описание', blank=True)
    author = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='authored_courses', limit_choices_to={'role': 'teacher'}
    )
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Курс'
        verbose_name_plural = 'Курсы'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField('Название модуля', max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    content = models.TextField('Учебный контент', blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.course.title} — {self.title}'


class ModuleCompletion(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='module_completions')
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='completions')
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'module']

    def __str__(self):
        return f'{self.student} завершил {self.module.title}'


class Enrollment(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='enrollments',
        limit_choices_to={'role': 'student'}
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateField(auto_now_add=True)
    progress = models.PositiveSmallIntegerField(default=0)

    class Meta:
        unique_together = ['student', 'course']
        verbose_name = 'Запись на курс'

    def __str__(self):
        return f'{self.student} → {self.course.title}'
