"""
Скрипт заполнения БД тестовыми данными для проверки кластеризации.
Запуск: python manage.py shell < seed_data.py
  или:  python manage.py runscript seed_data  (если установлен django-extensions)

Создаёт:
  - 20 студентов с разными профилями активности
  - 1 курс с 3 модулями и 3 тестами
  - Записи студентов на курс
  - Метрики трёх групп: Проактивные / Средние / Апатичные
"""

import random
import datetime
from django.utils import timezone

random.seed(42)

# ── Преподаватель ──────────────────────────────────────────────────────────────
from users.models import User

teacher = User.objects.filter(role='teacher').first()
if not teacher:
    teacher = User(
        username='teacher_seed', email='teacher_seed@edu.ru',
        first_name='Алексей', last_name='Смирнов', role='teacher',
    )
    teacher.set_password('teacher123')
    teacher.save()
    print(f'  Создан преподаватель: {teacher.email}')
else:
    print(f'  Используем преподавателя: {teacher.email}')

# ── Курс ──────────────────────────────────────────────────────────────────────
from courses.models import Course, Module, Enrollment

course, created = Course.objects.get_or_create(
    title='Основы Python',
    defaults={
        'description': 'Курс для начинающих. Переменные, функции, ООП, файлы.',
        'author': teacher,
        'status': 'published',
    }
)
print(f'  {"Создан" if created else "Уже есть"} курс: {course.title}')

module_data = [
    ('Введение и синтаксис',  'Переменные, типы, условия, циклы'),
    ('Функции и модули',      'def, lambda, импорты, стандартная библиотека'),
    ('ООП и файлы',           'Классы, наследование, чтение/запись файлов'),
]
modules = []
for i, (title, desc) in enumerate(module_data):
    m, _ = Module.objects.get_or_create(
        course=course, order=i + 1,
        defaults={'title': title, 'description': desc, 'content': f'Учебный материал: {desc}'}
    )
    modules.append(m)
print(f'  Модулей: {len(modules)}')

# ── Тесты ─────────────────────────────────────────────────────────────────────
from testing.models import Test, TestResult

tests = []
for m in modules:
    t, _ = Test.objects.get_or_create(
        module=m,
        defaults={'title': f'Тест по теме «{m.title}»', 'max_score': 100, 'passing_score': 60}
    )
    tests.append(t)
print(f'  Тестов: {len(tests)}')

# ── Студенты с профилями активности ───────────────────────────────────────────
#
# Три чётко разделённых кластера (GKA+Ward должен их найти):
#
#  Проактивный (7 чел.) — много времени, много сессий, высокий балл
#  Средний     (8 чел.) — умеренная активность, средний балл
#  Апатичный   (5 чел.) — мало времени, почти не заходят, низкий балл
#
PROFILES = [
    # (first, last, total_time_min, sessions, views, test_attempts, avg_score)
    # --- Проактивные ---
    ('Анна',      'Белова',    320, 28, 55, 9, 91),
    ('Дмитрий',   'Козлов',    285, 24, 48, 8, 88),
    ('Екатерина', 'Новикова',  310, 27, 52, 9, 93),
    ('Артём',     'Волков',    295, 25, 50, 8, 86),
    ('Полина',    'Морозова',  340, 30, 60, 10, 95),
    ('Никита',    'Соколов',   270, 22, 44, 7, 84),
    ('Алина',     'Зайцева',   305, 26, 51, 9, 90),
    # --- Средние ---
    ('Максим',    'Попов',     145, 12, 22, 4, 68),
    ('Юлия',      'Лебедева',  160, 13, 25, 5, 71),
    ('Иван',      'Фёдоров',   130, 11, 20, 4, 65),
    ('Ксения',    'Михайлова', 175, 14, 28, 5, 73),
    ('Роман',     'Андреев',   120, 10, 18, 3, 62),
    ('Валерия',   'Алексеева', 155, 12, 24, 4, 69),
    ('Тимур',     'Яковлев',   165, 13, 26, 5, 72),
    ('Вера',      'Борисова',  140, 11, 21, 4, 66),
    # --- Апатичные ---
    ('Олег',      'Кузнецов',   28,  3,  5, 1, 34),
    ('Светлана',  'Тихонова',   15,  2,  3, 1, 28),
    ('Геннадий',  'Громов',     35,  3,  6, 1, 38),
    ('Наталья',   'Ершова',     20,  2,  4, 0, 22),
    ('Виктор',    'Сорокин',    42,  4,  7, 1, 41),
]

from activity_tracker.models import StudentMetrics, ActivityLog

created_count = 0
skipped_count = 0

for i, (first, last, total_time, sessions, views, attempts, avg_score) in enumerate(PROFILES):
    email = f'student{i+1:02d}@edu.ru'

    if User.objects.filter(email=email).exists():
        student = User.objects.get(email=email)
        skipped_count += 1
    else:
        student = User(
            username=email, email=email,
            first_name=first, last_name=last, role='student',
        )
        student.set_password('student123')
        student.save()
        created_count += 1

    # Запись на курс
    enrollment, _ = Enrollment.objects.get_or_create(
        student=student, course=course,
        defaults={'progress': min(int(avg_score), 100)}
    )

    # Метрики (прямая запись, минуя логи для скорости)
    metrics, _ = StudentMetrics.objects.get_or_create(student=student, course=course)
    # Добавляем небольшой случайный шум чтобы кластеры не были идеально ровными
    noise = lambda v, pct=0.08: max(0, v + random.uniform(-v * pct, v * pct))
    metrics.total_time_minutes  = round(noise(total_time), 1)
    metrics.session_count       = max(1, int(noise(sessions, 0.1)))
    metrics.content_views       = max(0, int(noise(views, 0.1)))
    metrics.test_attempts       = max(0, int(noise(attempts, 0.15)))
    metrics.avg_test_score      = round(min(100, noise(avg_score, 0.05)), 1)
    metrics.avg_session_duration = round(metrics.total_time_minutes / max(metrics.session_count, 1), 2)
    metrics.last_activity       = timezone.now() - datetime.timedelta(days=random.randint(0, 14))
    metrics.save()

    # Результаты тестов (по одному на каждый тест если были попытки)
    if attempts > 0:
        for test in tests:
            if not TestResult.objects.filter(student=student, test=test).exists():
                score = round(min(100, noise(avg_score, 0.1)), 1)
                # Сохраняем напрямую чтобы не триггерить пересчёт метрик повторно
                TestResult.objects.create(
                    student=student, test=test,
                    score=score, attempts=1,
                    passed=score >= test.passing_score,
                )

print(f'\n  Студентов создано:   {created_count}')
print(f'  Студентов пропущено: {skipped_count} (уже существуют)')

# ── Итог ──────────────────────────────────────────────────────────────────────
total_students = User.objects.filter(role='student').count()
total_metrics  = StudentMetrics.objects.filter(course=course).count()

print(f'\n  Всего студентов в БД: {total_students}')
print(f'  Метрик для курса «{course.title}»: {total_metrics}')
print(f'\n  Готово! Теперь в аналитике запусти кластеризацию для курса ID={course.id}')
print(f'  Логин любого студента: student01@edu.ru .. student20@edu.ru / student123')
