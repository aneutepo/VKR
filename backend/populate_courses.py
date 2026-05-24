import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from courses.models import Course, Module, Enrollment
from testing.models import Test, Question, Answer

# Находим преподавателя
teacher = User.objects.filter(role='teacher').first()
if not teacher:
    teacher = User.objects.create_user(
        email='teacher@platform.ru',
        password='teacher123',
        first_name='Иван',
        last_name='Преподавателев',
        role='teacher'
    )
    print(f'Создан преподаватель: {teacher.email}')
else:
    print(f'Используем преподавателя: {teacher.email}')

# ─────────────────────────────────────────────
# Данные курсов
# ─────────────────────────────────────────────
COURSES = [
    {
        'title': 'Основы программирования на Python',
        'description': 'Курс охватывает базовые концепции программирования на языке Python: синтаксис, типы данных, управляющие конструкции, функции и основы объектно-ориентированного программирования. Подходит для начинающих без опыта программирования.',
        'modules': [
            {
                'title': 'Введение и синтаксис Python',
                'content': '''Python — это высокоуровневый язык программирования общего назначения, отличающийся простым и читаемым синтаксисом. Он широко применяется в веб-разработке, науке о данных, автоматизации и искусственном интеллекте.

Основные особенности Python:
— Динамическая типизация: тип переменной определяется автоматически при присваивании значения.
— Интерпретируемость: код выполняется построчно без предварительной компиляции.
— Кроссплатформенность: программы работают на Windows, Linux и macOS без изменений.

Переменные и типы данных:
Переменная создаётся простым присваиванием: x = 10. Python поддерживает следующие основные типы: int (целые числа), float (числа с плавающей точкой), str (строки), bool (логический тип), list (список), dict (словарь), tuple (кортеж), set (множество).

Пример кода:
name = "Студент"
age = 20
gpa = 4.5
is_active = True
print(f"Студент {name}, возраст {age}, средний балл {gpa}")

Операторы:
Арифметические: +, -, *, /, //, %, **
Сравнения: ==, !=, <, >, <=, >=
Логические: and, or, not

Условные конструкции:
if age >= 18:
    print("Совершеннолетний")
elif age >= 14:
    print("Подросток")
else:
    print("Ребёнок")

Циклы:
for i in range(10):
    print(i)

while condition:
    do_something()''',
                'tests': [
                    {
                        'title': 'Тест по теме «Введение и синтаксис»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Какой тип данных используется для хранения целых чисел в Python?',
                                'type': 'single',
                                'answers': [
                                    ('int', True),
                                    ('float', False),
                                    ('str', False),
                                    ('num', False),
                                ]
                            },
                            {
                                'text': 'Какой оператор используется для возведения в степень в Python?',
                                'type': 'single',
                                'answers': [
                                    ('**', True),
                                    ('^', False),
                                    ('^^', False),
                                    ('pow', False),
                                ]
                            },
                            {
                                'text': 'Что выведет команда print(10 // 3)?',
                                'type': 'single',
                                'answers': [
                                    ('3', True),
                                    ('3.33', False),
                                    ('4', False),
                                    ('1', False),
                                ]
                            },
                            {
                                'text': 'Какие из перечисленных типов данных являются встроенными в Python?',
                                'type': 'multiple',
                                'answers': [
                                    ('list', True),
                                    ('dict', True),
                                    ('array', False),
                                    ('tuple', True),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Функции и модули',
                'content': '''Функции в Python позволяют разбивать программу на логические блоки, которые можно повторно использовать. Объявление функции выполняется с помощью ключевого слова def.

Синтаксис функции:
def имя_функции(параметры):
    """Документация функции"""
    тело функции
    return результат

Пример:
def calculate_average(grades):
    """Вычисляет среднее значение списка оценок"""
    if not grades:
        return 0
    return sum(grades) / len(grades)

result = calculate_average([85, 92, 78, 95, 88])
print(f"Средний балл: {result:.1f}")

Аргументы функций:
— Позиционные аргументы: передаются в порядке объявления.
— Именованные аргументы: передаются с указанием имени параметра.
— Аргументы по умолчанию: имеют значение, используемое при отсутствии явного указания.
— *args и **kwargs: позволяют передавать произвольное количество аргументов.

Модули:
Модуль — это файл с расширением .py, содержащий код Python. Подключение модуля:
import math
from datetime import datetime

Стандартная библиотека Python включает сотни модулей: os, sys, json, re, datetime, math, random и другие.

Пакеты:
Пакет — это директория, содержащая несколько модулей и файл __init__.py. Пакеты позволяют организовывать большие проекты в иерархическую структуру.''',
                'tests': [
                    {
                        'title': 'Тест по теме «Функции и модули»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Какое ключевое слово используется для объявления функции в Python?',
                                'type': 'single',
                                'answers': [
                                    ('def', True),
                                    ('function', False),
                                    ('func', False),
                                    ('declare', False),
                                ]
                            },
                            {
                                'text': 'Что возвращает функция, если в ней отсутствует оператор return?',
                                'type': 'single',
                                'answers': [
                                    ('None', True),
                                    ('0', False),
                                    ('False', False),
                                    ('Ошибку', False),
                                ]
                            },
                            {
                                'text': 'Как правильно импортировать функцию sqrt из модуля math?',
                                'type': 'single',
                                'answers': [
                                    ('from math import sqrt', True),
                                    ('import sqrt from math', False),
                                    ('include math.sqrt', False),
                                    ('use math::sqrt', False),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Объектно-ориентированное программирование',
                'content': '''Объектно-ориентированное программирование (ООП) — это парадигма, основанная на понятиях «объект» и «класс». Объект — это экземпляр класса, который объединяет данные (атрибуты) и поведение (методы).

Основные принципы ООП:
1. Инкапсуляция — объединение данных и методов в единый класс, сокрытие деталей реализации.
2. Наследование — возможность создавать новые классы на основе существующих.
3. Полиморфизм — способность объектов разных классов реагировать на одинаковые сообщения по-разному.
4. Абстракция — выделение существенных характеристик объекта.

Пример класса:
class Student:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        self.grades = []

    def add_grade(self, grade):
        self.grades.append(grade)

    def get_average(self):
        if not self.grades:
            return 0
        return sum(self.grades) / len(self.grades)

    def __str__(self):
        return f"Студент {self.name}, средний балл: {self.get_average():.1f}"

student = Student("Алексей", 20)
student.add_grade(85)
student.add_grade(92)
print(student)

Наследование:
class GraduateStudent(Student):
    def __init__(self, name, age, research_topic):
        super().__init__(name, age)
        self.research_topic = research_topic

    def __str__(self):
        return f"{super().__str__()}, тема: {self.research_topic}"''',
                'tests': [
                    {
                        'title': 'Тест по теме «ООП в Python»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Какой метод вызывается автоматически при создании объекта класса?',
                                'type': 'single',
                                'answers': [
                                    ('__init__', True),
                                    ('__start__', False),
                                    ('__create__', False),
                                    ('__new__', False),
                                ]
                            },
                            {
                                'text': 'Какой принцип ООП описывает создание нового класса на основе существующего?',
                                'type': 'single',
                                'answers': [
                                    ('Наследование', True),
                                    ('Инкапсуляция', False),
                                    ('Полиморфизм', False),
                                    ('Абстракция', False),
                                ]
                            },
                            {
                                'text': 'Что обозначает параметр self в методах класса?',
                                'type': 'single',
                                'answers': [
                                    ('Ссылку на текущий экземпляр класса', True),
                                    ('Ссылку на родительский класс', False),
                                    ('Ссылку на модуль', False),
                                    ('Это обязательное ключевое слово Python', False),
                                ]
                            },
                        ]
                    }
                ]
            },
        ]
    },
    {
        'title': 'Основы веб-разработки: HTML и CSS',
        'description': 'Курс знакомит студентов с основами создания веб-страниц. Рассматриваются структура HTML-документа, семантическая разметка, стилизация с помощью CSS, работа с макетами и адаптивный дизайн. Курс рассчитан на начинающих разработчиков.',
        'modules': [
            {
                'title': 'Структура HTML-документа',
                'content': '''HTML (HyperText Markup Language) — стандартный язык разметки для создания веб-страниц. Браузер интерпретирует HTML-код и отображает его как визуальную страницу.

Базовая структура HTML-документа:
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Название страницы</title>
</head>
<body>
    <h1>Заголовок страницы</h1>
    <p>Текст абзаца</p>
</body>
</html>

Семантические теги HTML5:
— <header> — шапка страницы или раздела
— <nav> — навигационное меню
— <main> — основное содержимое страницы
— <section> — тематический раздел
— <article> — самостоятельный блок контента
— <aside> — боковая панель
— <footer> — подвал страницы

Основные теги:
Заголовки: <h1> — <h6> (от большего к меньшему)
Абзацы: <p>
Ссылки: <a href="url">текст</a>
Изображения: <img src="path" alt="описание">
Списки: <ul> (маркированный), <ol> (нумерованный), <li> (элемент)
Таблицы: <table>, <tr>, <td>, <th>
Формы: <form>, <input>, <button>, <select>, <textarea>

Атрибуты:
Атрибуты задают дополнительные параметры тегов. Например: class, id, href, src, alt, type, placeholder, required.''',
                'tests': [
                    {
                        'title': 'Тест по теме «Структура HTML»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Какой тег задаёт заголовок первого уровня в HTML?',
                                'type': 'single',
                                'answers': [
                                    ('<h1>', True),
                                    ('<title>', False),
                                    ('<header>', False),
                                    ('<heading>', False),
                                ]
                            },
                            {
                                'text': 'Какие из перечисленных тегов являются семантическими тегами HTML5?',
                                'type': 'multiple',
                                'answers': [
                                    ('<article>', True),
                                    ('<section>', True),
                                    ('<div>', False),
                                    ('<footer>', True),
                                ]
                            },
                            {
                                'text': 'Какой атрибут тега <img> задаёт альтернативный текст изображения?',
                                'type': 'single',
                                'answers': [
                                    ('alt', True),
                                    ('title', False),
                                    ('text', False),
                                    ('description', False),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Стилизация с помощью CSS',
                'content': '''CSS (Cascading Style Sheets) — язык описания внешнего вида HTML-документа. CSS позволяет отделить содержимое страницы от её оформления.

Способы подключения CSS:
1. Внешний файл: <link rel="stylesheet" href="style.css">
2. Внутренний блок: <style> в секции <head>
3. Встроенный стиль: атрибут style у тега

Синтаксис правила CSS:
селектор {
    свойство: значение;
}

Виды селекторов:
— Теговый: p { color: red; }
— Классовый: .highlight { background: yellow; }
— Идентификатор: #header { font-size: 24px; }
— Псевдоклассы: a:hover { color: blue; }
— Комбинированные: div > p, nav a

Блочная модель (Box Model):
Каждый элемент занимает прямоугольную область, состоящую из: content (содержимое), padding (внутренний отступ), border (граница), margin (внешний отступ).

Flexbox:
.container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

CSS Grid:
.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

Медиазапросы для адаптивного дизайна:
@media (max-width: 768px) {
    .container {
        flex-direction: column;
    }
}''',
                'tests': [
                    {
                        'title': 'Тест по теме «CSS»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Какой селектор CSS используется для выбора элемента по классу?',
                                'type': 'single',
                                'answers': [
                                    ('.classname', True),
                                    ('#classname', False),
                                    ('*classname', False),
                                    ('classname', False),
                                ]
                            },
                            {
                                'text': 'Из каких частей состоит блочная модель CSS?',
                                'type': 'multiple',
                                'answers': [
                                    ('content', True),
                                    ('padding', True),
                                    ('border', True),
                                    ('margin', True),
                                ]
                            },
                            {
                                'text': 'Какое свойство CSS используется для создания гибкого контейнера Flexbox?',
                                'type': 'single',
                                'answers': [
                                    ('display: flex', True),
                                    ('position: flex', False),
                                    ('layout: flex', False),
                                    ('flex: true', False),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Адаптивный дизайн и практика',
                'content': '''Адаптивный веб-дизайн (Responsive Web Design) — подход к разработке, при котором страница корректно отображается на экранах любого размера: от смартфонов до настольных мониторов.

Основные принципы адаптивного дизайна:
1. Гибкая сетка (Fluid Grid) — использование относительных единиц (%, em, rem, vw) вместо фиксированных пикселей.
2. Гибкие изображения — изображения масштабируются вместе с контейнером: img { max-width: 100%; }
3. Медиазапросы — применение разных стилей в зависимости от характеристик устройства.

Точки останова (Breakpoints):
— Мобильные устройства: до 576px
— Планшеты: 576px — 768px
— Ноутбуки: 768px — 992px
— Настольные ПК: от 992px

Подход Mobile First:
Рекомендуется проектировать сначала для мобильных устройств, а затем добавлять стили для больших экранов:

/* Базовые стили для мобильных */
.card { width: 100%; }

/* Планшеты */
@media (min-width: 576px) {
    .card { width: 50%; }
}

/* Десктоп */
@media (min-width: 992px) {
    .card { width: 33.33%; }
}

CSS-переменные:
:root {
    --primary-color: #6366f1;
    --font-size-base: 16px;
}

button {
    background: var(--primary-color);
}''',
                'tests': [
                    {
                        'title': 'Тест по теме «Адаптивный дизайн»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Что такое подход Mobile First?',
                                'type': 'single',
                                'answers': [
                                    ('Проектирование сначала для мобильных, затем для больших экранов', True),
                                    ('Разработка отдельного сайта для мобильных устройств', False),
                                    ('Запрет доступа с десктопных устройств', False),
                                    ('Оптимизация только под iOS', False),
                                ]
                            },
                            {
                                'text': 'Какое CSS-свойство гарантирует, что изображение не выйдет за пределы контейнера?',
                                'type': 'single',
                                'answers': [
                                    ('max-width: 100%', True),
                                    ('width: auto', False),
                                    ('overflow: hidden', False),
                                    ('display: block', False),
                                ]
                            },
                        ]
                    }
                ]
            },
        ]
    },
    {
        'title': 'Базы данных и язык SQL',
        'description': 'Курс посвящён основам реляционных баз данных и языку структурированных запросов SQL. Студенты освоят проектирование схем баз данных, написание запросов на выборку, вставку, обновление и удаление данных, а также работу с несколькими таблицами через JOIN.',
        'modules': [
            {
                'title': 'Введение в реляционные базы данных',
                'content': '''Реляционная база данных — это организованный набор структурированных данных, хранящихся в виде таблиц. Каждая таблица состоит из строк (записей) и столбцов (полей).

Ключевые понятия:
— Таблица (Relation) — основная единица хранения данных. Каждая таблица описывает один тип сущности.
— Строка (Row/Record/Tuple) — одна запись в таблице.
— Столбец (Column/Attribute/Field) — одно свойство сущности.
— Первичный ключ (Primary Key, PK) — уникальный идентификатор каждой строки. Не может быть NULL.
— Внешний ключ (Foreign Key, FK) — поле, ссылающееся на первичный ключ другой таблицы. Обеспечивает связи между таблицами.

Типы связей между таблицами:
1. Один к одному (1:1) — каждой записи в одной таблице соответствует ровно одна запись в другой.
2. Один ко многим (1:N) — одной записи соответствует несколько записей в другой таблице. Самый распространённый тип.
3. Многие ко многим (M:N) — реализуется через промежуточную связующую таблицу.

Нормализация:
Нормализация — процесс организации таблиц для уменьшения избыточности данных.
— 1НФ: каждое поле содержит атомарное (неделимое) значение.
— 2НФ: все неключевые атрибуты зависят от всего первичного ключа.
— 3НФ: неключевые атрибуты не зависят друг от друга.

Популярные СУБД:
— PostgreSQL — мощная открытая СУБД, поддерживает сложные типы данных.
— MySQL / MariaDB — широко используется в веб-разработке.
— SQLite — встроенная БД, не требует отдельного сервера.
— Microsoft SQL Server — корпоративное решение от Microsoft.''',
                'tests': [
                    {
                        'title': 'Тест по теме «Реляционные базы данных»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Что такое первичный ключ (Primary Key)?',
                                'type': 'single',
                                'answers': [
                                    ('Уникальный идентификатор каждой строки в таблице', True),
                                    ('Поле, ссылающееся на другую таблицу', False),
                                    ('Первое поле в таблице', False),
                                    ('Зашифрованный пароль к базе данных', False),
                                ]
                            },
                            {
                                'text': 'Какой тип связи реализуется через промежуточную таблицу?',
                                'type': 'single',
                                'answers': [
                                    ('Многие ко многим (M:N)', True),
                                    ('Один к одному (1:1)', False),
                                    ('Один ко многим (1:N)', False),
                                    ('Ноль ко многим (0:N)', False),
                                ]
                            },
                            {
                                'text': 'Какие из перечисленных систем являются реляционными СУБД?',
                                'type': 'multiple',
                                'answers': [
                                    ('PostgreSQL', True),
                                    ('MySQL', True),
                                    ('MongoDB', False),
                                    ('SQLite', True),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Основы SQL: выборка и фильтрация данных',
                'content': '''SQL (Structured Query Language) — стандартный язык для работы с реляционными базами данных. SQL-операторы делятся на группы: DDL (определение структуры), DML (манипуляция данными), DCL (управление доступом).

Оператор SELECT — выборка данных:
SELECT * FROM students;
SELECT name, age FROM students WHERE age > 18;
SELECT name, grade FROM students ORDER BY grade DESC;
SELECT name, grade FROM students LIMIT 10;

Фильтрация (WHERE):
Операторы сравнения: =, <>, <, >, <=, >=
Логические: AND, OR, NOT
Диапазон: BETWEEN 18 AND 25
Список: IN ('Москва', 'Санкт-Петербург')
Шаблон: LIKE 'Ив%' (начинается с «Ив»)
NULL: IS NULL, IS NOT NULL

Агрегатные функции:
COUNT(*) — количество строк
SUM(column) — сумма значений
AVG(column) — среднее значение
MAX(column) — максимум
MIN(column) — минимум

Группировка (GROUP BY):
SELECT course_id, AVG(score) as avg_score
FROM test_results
GROUP BY course_id
HAVING AVG(score) > 70;

Вставка, обновление, удаление:
INSERT INTO students (name, age) VALUES ('Алексей', 20);
UPDATE students SET age = 21 WHERE name = 'Алексей';
DELETE FROM students WHERE id = 5;

Создание таблицы:
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    age INTEGER CHECK (age >= 16),
    enrolled_at DATE DEFAULT CURRENT_DATE
);''',
                'tests': [
                    {
                        'title': 'Тест по теме «SQL-запросы»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Какой оператор SQL используется для выборки данных из таблицы?',
                                'type': 'single',
                                'answers': [
                                    ('SELECT', True),
                                    ('GET', False),
                                    ('FETCH', False),
                                    ('READ', False),
                                ]
                            },
                            {
                                'text': 'Какие агрегатные функции существуют в SQL?',
                                'type': 'multiple',
                                'answers': [
                                    ('COUNT', True),
                                    ('SUM', True),
                                    ('AVG', True),
                                    ('CONCAT', False),
                                ]
                            },
                            {
                                'text': 'Какой оператор SQL используется для фильтрации строк после группировки?',
                                'type': 'single',
                                'answers': [
                                    ('HAVING', True),
                                    ('WHERE', False),
                                    ('FILTER', False),
                                    ('GROUP FILTER', False),
                                ]
                            },
                            {
                                'text': 'Какой оператор добавляет новую запись в таблицу?',
                                'type': 'single',
                                'answers': [
                                    ('INSERT INTO', True),
                                    ('ADD TO', False),
                                    ('PUT INTO', False),
                                    ('CREATE ROW', False),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Объединение таблиц: JOIN',
                'content': '''JOIN — оператор SQL, позволяющий объединять строки из двух и более таблиц на основе условия связи между ними.

Виды JOIN:
1. INNER JOIN — возвращает только строки, для которых есть совпадение в обеих таблицах.
2. LEFT JOIN (LEFT OUTER JOIN) — возвращает все строки из левой таблицы и совпавшие из правой. Если совпадений нет — NULL.
3. RIGHT JOIN — аналогично LEFT, но для правой таблицы.
4. FULL JOIN — возвращает все строки из обеих таблиц.

Пример схемы:
Таблица students: id, name, course_id
Таблица courses: id, title, teacher_id
Таблица teachers: id, name

Запрос с INNER JOIN:
SELECT s.name AS student_name, c.title AS course_title
FROM students s
INNER JOIN courses c ON s.course_id = c.id;

Запрос с несколькими JOIN:
SELECT s.name, c.title, t.name AS teacher
FROM students s
INNER JOIN courses c ON s.course_id = c.id
INNER JOIN teachers t ON c.teacher_id = t.id
WHERE c.title LIKE '%Python%';

LEFT JOIN — студенты без курса:
SELECT s.name, c.title
FROM students s
LEFT JOIN courses c ON s.course_id = c.id
WHERE c.id IS NULL;

Подзапросы:
SELECT name FROM students
WHERE id IN (
    SELECT student_id FROM test_results WHERE score > 80
);

Представления (VIEW):
CREATE VIEW top_students AS
SELECT name, AVG(score) as avg_score
FROM students s
JOIN test_results tr ON s.id = tr.student_id
GROUP BY name
HAVING AVG(score) >= 90;''',
                'tests': [
                    {
                        'title': 'Тест по теме «JOIN и объединение таблиц»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Какой тип JOIN возвращает только строки с совпадениями в обеих таблицах?',
                                'type': 'single',
                                'answers': [
                                    ('INNER JOIN', True),
                                    ('LEFT JOIN', False),
                                    ('FULL JOIN', False),
                                    ('CROSS JOIN', False),
                                ]
                            },
                            {
                                'text': 'Что вернёт LEFT JOIN, если для строки из левой таблицы нет совпадения в правой?',
                                'type': 'single',
                                'answers': [
                                    ('Строку с NULL для полей правой таблицы', True),
                                    ('Строка не будет включена в результат', False),
                                    ('Ошибку выполнения запроса', False),
                                    ('Строку с нулями', False),
                                ]
                            },
                        ]
                    }
                ]
            },
        ]
    },
    {
        'title': 'Алгоритмы и структуры данных',
        'description': 'Курс охватывает фундаментальные алгоритмы и структуры данных, необходимые каждому программисту. Рассматриваются массивы, связные списки, стеки, очереди, деревья, алгоритмы сортировки и поиска, а также оценка сложности алгоритмов.',
        'modules': [
            {
                'title': 'Оценка сложности алгоритмов. O-нотация',
                'content': '''Сложность алгоритма описывает, как изменяется время выполнения или потребление памяти при увеличении объёма входных данных. Для оценки используется нотация «большого О» (Big O Notation).

Основные классы сложности (от лучшего к худшему):
— O(1) — константная сложность: время не зависит от размера входа. Пример: доступ к элементу массива по индексу.
— O(log n) — логарифмическая: типична для бинарного поиска.
— O(n) — линейная: перебор всех элементов массива.
— O(n log n) — типична для эффективных алгоритмов сортировки (QuickSort, MergeSort).
— O(n²) — квадратичная: пузырьковая сортировка, вложенные циклы.
— O(2ⁿ) — экспоненциальная: перебор всех подмножеств.

Примеры:
# O(1) — константная:
def get_first(arr):
    return arr[0]

# O(n) — линейная:
def find_max(arr):
    max_val = arr[0]
    for item in arr:
        if item > max_val:
            max_val = item
    return max_val

# O(n²) — квадратичная:
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(n - i - 1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]

Правила оценки:
1. Константы отбрасываются: O(2n) = O(n)
2. Менее значимые слагаемые отбрасываются: O(n² + n) = O(n²)
3. Оценка производится для наихудшего случая (Worst Case).''',
                'tests': [
                    {
                        'title': 'Тест по теме «Сложность алгоритмов»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Какова сложность доступа к элементу массива по индексу?',
                                'type': 'single',
                                'answers': [
                                    ('O(1)', True),
                                    ('O(n)', False),
                                    ('O(log n)', False),
                                    ('O(n²)', False),
                                ]
                            },
                            {
                                'text': 'Какова типичная сложность эффективных алгоритмов сортировки (QuickSort, MergeSort)?',
                                'type': 'single',
                                'answers': [
                                    ('O(n log n)', True),
                                    ('O(n)', False),
                                    ('O(n²)', False),
                                    ('O(log n)', False),
                                ]
                            },
                            {
                                'text': 'Как упрощается выражение O(3n² + 5n + 10) по правилам Big O?',
                                'type': 'single',
                                'answers': [
                                    ('O(n²)', True),
                                    ('O(3n²)', False),
                                    ('O(n² + n)', False),
                                    ('O(n)', False),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Массивы, стеки и очереди',
                'content': '''Массив — базовая структура данных, хранящая элементы одного типа в непрерывной области памяти. Доступ к элементу — O(1), поиск — O(n), вставка/удаление в середине — O(n).

Динамические массивы (Python list):
arr = [1, 2, 3, 4, 5]
arr.append(6)      # O(1) амортизировано
arr.insert(2, 10)  # O(n)
arr.pop()          # O(1)
arr.pop(0)         # O(n)

Стек (Stack) — структура данных по принципу LIFO (Last In, First Out): последний добавленный элемент извлекается первым. Операции: push (добавить), pop (извлечь), peek (посмотреть верхний элемент). Сложность: O(1) для всех операций.

Применение стека: история браузера, отмена действий (Ctrl+Z), вычисление выражений, рекурсия.

Реализация стека на Python:
class Stack:
    def __init__(self):
        self._data = []

    def push(self, item):
        self._data.append(item)

    def pop(self):
        if not self.is_empty():
            return self._data.pop()

    def peek(self):
        return self._data[-1] if not self.is_empty() else None

    def is_empty(self):
        return len(self._data) == 0

Очередь (Queue) — структура данных по принципу FIFO (First In, First Out): первый добавленный элемент извлекается первым. Операции: enqueue (добавить в конец), dequeue (извлечь из начала).

Применение очереди: обработка задач, принтер, BFS (обход графа в ширину).

from collections import deque
queue = deque()
queue.append(1)    # enqueue
queue.popleft()    # dequeue — O(1)''',
                'tests': [
                    {
                        'title': 'Тест по теме «Массивы, стеки, очереди»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'По какому принципу работает стек?',
                                'type': 'single',
                                'answers': [
                                    ('LIFO (Last In, First Out)', True),
                                    ('FIFO (First In, First Out)', False),
                                    ('FILO (First In, Last Out)', False),
                                    ('Random Access', False),
                                ]
                            },
                            {
                                'text': 'Какова сложность операции добавления элемента в конец динамического массива?',
                                'type': 'single',
                                'answers': [
                                    ('O(1) амортизировано', True),
                                    ('O(n)', False),
                                    ('O(log n)', False),
                                    ('O(n²)', False),
                                ]
                            },
                            {
                                'text': 'Где применяется структура данных «очередь»?',
                                'type': 'multiple',
                                'answers': [
                                    ('Обход графа в ширину (BFS)', True),
                                    ('Обработка задач принтера', True),
                                    ('Обход графа в глубину (DFS)', False),
                                    ('История браузера', False),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Алгоритмы сортировки и поиска',
                'content': '''Сортировка — одна из фундаментальных операций в программировании. Выбор алгоритма зависит от размера данных, наличия частичной упорядоченности и требований к памяти.

Пузырьковая сортировка (Bubble Sort):
Сложность: O(n²). Простая, но неэффективная. Сравнивает соседние элементы и меняет их местами.

Сортировка слиянием (Merge Sort):
Сложность: O(n log n). Рекурсивно делит массив пополам, сортирует части и сливает их.

def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

Быстрая сортировка (Quick Sort):
Сложность: O(n log n) в среднем, O(n²) в худшем случае. Выбирает опорный элемент (pivot) и разделяет массив на элементы меньше и больше pivot.

Линейный поиск (Linear Search):
Сложность: O(n). Перебирает все элементы последовательно.

Бинарный поиск (Binary Search):
Сложность: O(log n). Работает только на отсортированном массиве. Делит область поиска пополам на каждом шаге.

def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

Сравнение алгоритмов сортировки:
Bubble Sort: O(n²) / O(1) памяти
Merge Sort: O(n log n) / O(n) памяти
Quick Sort: O(n log n) средн. / O(log n) памяти
Tim Sort (Python): O(n log n) / O(n) памяти''',
                'tests': [
                    {
                        'title': 'Тест по теме «Сортировка и поиск»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Какое условие необходимо для применения бинарного поиска?',
                                'type': 'single',
                                'answers': [
                                    ('Массив должен быть отсортирован', True),
                                    ('Массив должен содержать только числа', False),
                                    ('Массив должен иметь чётное количество элементов', False),
                                    ('Массив должен быть в памяти целиком', False),
                                ]
                            },
                            {
                                'text': 'Какова сложность бинарного поиска?',
                                'type': 'single',
                                'answers': [
                                    ('O(log n)', True),
                                    ('O(n)', False),
                                    ('O(n log n)', False),
                                    ('O(1)', False),
                                ]
                            },
                            {
                                'text': 'Какие алгоритмы сортировки имеют среднюю сложность O(n log n)?',
                                'type': 'multiple',
                                'answers': [
                                    ('Merge Sort', True),
                                    ('Quick Sort', True),
                                    ('Bubble Sort', False),
                                    ('Tim Sort', True),
                                ]
                            },
                        ]
                    }
                ]
            },
        ]
    },
    {
        'title': 'Введение в машинное обучение',
        'description': 'Курс знакомит студентов с основными концепциями машинного обучения: типами задач, методами обучения, базовыми алгоритмами и метриками качества моделей. Рассматриваются линейная регрессия, классификация, кластеризация и оценка качества моделей.',
        'modules': [
            {
                'title': 'Основные понятия и типы задач машинного обучения',
                'content': '''Машинное обучение (Machine Learning, ML) — раздел искусственного интеллекта, в котором алгоритмы обучаются на данных без явного программирования правил. Вместо написания правил вручную система извлекает закономерности из примеров.

Типы машинного обучения:
1. Обучение с учителем (Supervised Learning) — алгоритм обучается на размеченных данных, где для каждого входа известен правильный ответ.
   — Регрессия: предсказание числового значения (цена квартиры, температура).
   — Классификация: предсказание категории (спам/не спам, диагноз).

2. Обучение без учителя (Unsupervised Learning) — данные не имеют меток, алгоритм ищет скрытые закономерности.
   — Кластеризация: разбиение объектов на группы (k-means, иерархическая кластеризация).
   — Снижение размерности: PCA, t-SNE.

3. Обучение с подкреплением (Reinforcement Learning) — агент обучается взаимодействуя со средой и получая награды или штрафы.

Основные понятия:
— Признаки (Features, X) — входные переменные, описывающие объект.
— Целевая переменная (Target, y) — то, что нужно предсказать.
— Обучающая выборка (Train set) — данные для обучения модели.
— Тестовая выборка (Test set) — данные для оценки качества модели.
— Переобучение (Overfitting) — модель хорошо запомнила обучающие данные, но плохо обобщается на новые.
— Недообучение (Underfitting) — модель слишком проста и не улавливает закономерности.

Процесс разработки ML-модели:
1. Сбор и подготовка данных
2. Разведочный анализ (EDA)
3. Предобработка данных (нормализация, кодирование)
4. Выбор модели и обучение
5. Оценка качества
6. Внедрение и мониторинг''',
                'tests': [
                    {
                        'title': 'Тест по теме «Основы машинного обучения»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'К какому типу задач машинного обучения относится предсказание цены квартиры?',
                                'type': 'single',
                                'answers': [
                                    ('Регрессия', True),
                                    ('Классификация', False),
                                    ('Кластеризация', False),
                                    ('Обучение с подкреплением', False),
                                ]
                            },
                            {
                                'text': 'Что такое переобучение (overfitting)?',
                                'type': 'single',
                                'answers': [
                                    ('Модель хорошо работает на обучающих данных, но плохо на новых', True),
                                    ('Модель обучалась слишком долго', False),
                                    ('Модель слишком проста', False),
                                    ('Данных для обучения было слишком много', False),
                                ]
                            },
                            {
                                'text': 'Какие типы задач относятся к обучению с учителем?',
                                'type': 'multiple',
                                'answers': [
                                    ('Регрессия', True),
                                    ('Классификация', True),
                                    ('Кластеризация', False),
                                    ('Снижение размерности', False),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Алгоритмы классификации и кластеризации',
                'content': '''Классификация — задача предсказания категории объекта на основе его признаков. Алгоритм обучается на размеченных примерах и затем классифицирует новые объекты.

Метод k ближайших соседей (k-NN):
Относит объект к классу, который преобладает среди k ближайших к нему объектов в пространстве признаков. Прост в понимании, не требует обучения, но медленен на больших данных.

Логистическая регрессия:
Несмотря на название — алгоритм классификации. Вычисляет вероятность принадлежности к классу через сигмоидную функцию. Хорошо интерпретируется, эффективен при линейной разделимости классов.

Дерево решений (Decision Tree):
Строит дерево правил «если-то» на основе обучающих данных. Легко интерпретируется, но склонно к переобучению.

Случайный лес (Random Forest):
Ансамбль деревьев решений. Каждое дерево обучается на случайной подвыборке данных и признаков. Усредняет предсказания деревьев, что снижает переобучение.

Метрики качества классификации:
— Accuracy (точность) = (TP + TN) / (TP + TN + FP + FN)
— Precision (точность) = TP / (TP + FP)
— Recall (полнота) = TP / (TP + FN)
— F1-score = 2 * Precision * Recall / (Precision + Recall)

Кластеризация — разбиение объектов на группы (кластеры) без заранее известных меток.

Алгоритм k-средних (k-means):
1. Выбрать k начальных центроидов случайно.
2. Назначить каждый объект ближайшему центроиду.
3. Пересчитать центроиды как средние значения кластеров.
4. Повторять шаги 2-3 до сходимости.

Метод Уорда (Ward):
Иерархический алгоритм кластеризации. На каждом шаге объединяет два кластера так, чтобы минимизировать прирост суммарной внутрикластерной дисперсии. Даёт хорошие результаты для компактных сферических кластеров.

Оценка качества кластеризации:
Силуэтный коэффициент (Silhouette Score) — мера того, насколько объект похож на свой кластер по сравнению с другими. Значение от -1 до 1; чем ближе к 1, тем лучше.''',
                'tests': [
                    {
                        'title': 'Тест по теме «Классификация и кластеризация»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Что измеряет силуэтный коэффициент в задаче кластеризации?',
                                'type': 'single',
                                'answers': [
                                    ('Качество разбиения объектов на кластеры', True),
                                    ('Скорость работы алгоритма', False),
                                    ('Количество итераций до сходимости', False),
                                    ('Размер обучающей выборки', False),
                                ]
                            },
                            {
                                'text': 'Какие шаги выполняет алгоритм k-means?',
                                'type': 'multiple',
                                'answers': [
                                    ('Назначение объектов ближайшему центроиду', True),
                                    ('Пересчёт центроидов', True),
                                    ('Построение дерева решений', False),
                                    ('Выбор начальных центроидов', True),
                                ]
                            },
                            {
                                'text': 'Какой диапазон значений имеет силуэтный коэффициент?',
                                'type': 'single',
                                'answers': [
                                    ('От -1 до 1', True),
                                    ('От 0 до 1', False),
                                    ('От 0 до 100', False),
                                    ('От -∞ до +∞', False),
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                'title': 'Метрики качества и оценка моделей',
                'content': '''Оценка качества модели — ключевой этап разработки системы машинного обучения. Недостаточно обучить модель — нужно убедиться, что она хорошо работает на новых, ранее не виденных данных.

Разделение данных:
Данные делятся на три части:
— Обучающая выборка (Train, ~70%) — для обучения модели.
— Валидационная выборка (Validation, ~15%) — для подбора гиперпараметров.
— Тестовая выборка (Test, ~15%) — для финальной оценки качества.

Кросс-валидация (Cross-Validation):
Метод оценки, при котором данные делятся на k частей (folds). Модель обучается на k-1 частях и оценивается на оставшейся. Процесс повторяется k раз. Итоговая оценка — среднее по всем запускам.

Метрики для регрессии:
— MAE (Mean Absolute Error) — средняя абсолютная ошибка.
— MSE (Mean Squared Error) — среднеквадратичная ошибка.
— RMSE (Root MSE) — корень из MSE, в тех же единицах, что и целевая переменная.
— R² (коэффициент детерминации) — доля дисперсии целевой переменной, объяснённая моделью. 1.0 — идеально.

Матрица ошибок (Confusion Matrix) для классификации:
             Предсказано +  Предсказано -
Реально +       TP              FN
Реально -       FP              TN

TP — истинно положительные (верно классифицированы как положительные)
TN — истинно отрицательные
FP — ложно положительные (ошибка первого рода)
FN — ложно отрицательные (ошибка второго рода)

ROC-кривая и AUC:
ROC-кривая отображает зависимость True Positive Rate от False Positive Rate при разных порогах классификации. AUC (Area Under Curve) — площадь под ROC-кривой. AUC = 0.5 соответствует случайному классификатору, AUC = 1.0 — идеальному.

Подбор гиперпараметров:
— Grid Search — перебор всех комбинаций параметров.
— Random Search — случайный перебор.
— Bayesian Optimization — умный поиск с учётом предыдущих результатов.''',
                'tests': [
                    {
                        'title': 'Тест по теме «Оценка качества моделей»',
                        'max_score': 100,
                        'passing_score': 60,
                        'questions': [
                            {
                                'text': 'Что означает значение AUC = 0.5?',
                                'type': 'single',
                                'answers': [
                                    ('Модель работает как случайный классификатор', True),
                                    ('Модель идеально классифицирует', False),
                                    ('Модель ошибается в 50% случаев', False),
                                    ('Недостаточно данных для оценки', False),
                                ]
                            },
                            {
                                'text': 'Какие метрики используются для оценки моделей регрессии?',
                                'type': 'multiple',
                                'answers': [
                                    ('MAE', True),
                                    ('RMSE', True),
                                    ('R²', True),
                                    ('F1-score', False),
                                ]
                            },
                            {
                                'text': 'Для чего используется кросс-валидация?',
                                'type': 'single',
                                'answers': [
                                    ('Для надёжной оценки качества модели при ограниченном объёме данных', True),
                                    ('Для ускорения обучения модели', False),
                                    ('Для увеличения объёма обучающей выборки', False),
                                    ('Для автоматического выбора алгоритма', False),
                                ]
                            },
                        ]
                    }
                ]
            },
        ]
    },
]


# ─────────────────────────────────────────────
# Создание курсов
# ─────────────────────────────────────────────
created_courses = 0
created_modules = 0
created_tests = 0
created_questions = 0

for course_data in COURSES:
    course, created = Course.objects.get_or_create(
        title=course_data['title'],
        defaults={
            'description': course_data['description'],
            'author': teacher,
            'status': 'published',
        }
    )
    if created:
        created_courses += 1
        print(f'✅ Курс: {course.title}')
    else:
        print(f'⏩ Курс уже существует: {course.title}')

    for order, module_data in enumerate(course_data['modules']):
        module, mod_created = Module.objects.get_or_create(
            course=course,
            title=module_data['title'],
            defaults={
                'content': module_data['content'],
                'order': order,
            }
        )
        if mod_created:
            created_modules += 1

        for test_data in module_data['tests']:
            test, test_created = Test.objects.get_or_create(
                module=module,
                title=test_data['title'],
                defaults={
                    'max_score': test_data['max_score'],
                    'passing_score': test_data['passing_score'],
                }
            )
            if test_created:
                created_tests += 1

            for q_order, q_data in enumerate(test_data['questions']):
                question, q_created = Question.objects.get_or_create(
                    test=test,
                    text=q_data['text'],
                    defaults={
                        'question_type': q_data['type'],
                        'order': q_order,
                    }
                )
                if q_created:
                    created_questions += 1
                    for answer_text, is_correct in q_data['answers']:
                        Answer.objects.create(
                            question=question,
                            text=answer_text,
                            is_correct=is_correct,
                        )

print('\n' + '='*50)
print(f'Готово!')
print(f'  Курсов создано:   {created_courses}')
print(f'  Модулей создано:  {created_modules}')
print(f'  Тестов создано:   {created_tests}')
print(f'  Вопросов создано: {created_questions}')
print('='*50)
