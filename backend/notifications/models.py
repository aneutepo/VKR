from django.db import models
from users.models import User


class Notification(models.Model):
    TYPE_INFO    = 'info'
    TYPE_SUCCESS = 'success'
    TYPE_WARNING = 'warning'
    TYPE_DANGER  = 'danger'
    TYPE_CHOICES = [
        (TYPE_INFO,    'Информация'),
        (TYPE_SUCCESS, 'Успех'),
        (TYPE_WARNING, 'Предупреждение'),
        (TYPE_DANGER,  'Критическое'),
    ]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title      = models.CharField(max_length=200)
    message    = models.TextField()
    notif_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_INFO)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.notif_type}] {self.user} — {self.title}'
