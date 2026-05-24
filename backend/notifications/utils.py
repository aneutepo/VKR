from .models import Notification


def notify(user, title, message, notif_type=Notification.TYPE_INFO):
    Notification.objects.create(user=user, title=title, message=message, notif_type=notif_type)
