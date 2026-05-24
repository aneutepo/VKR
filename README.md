# EduPlatform — Запуск в WSL Ubuntu

## Первый запуск (один раз)

Открой WSL Ubuntu и выполни:

```bash
cd ~/edplatform
chmod +x setup.sh start.sh
./setup.sh
```

Скрипт автоматически:
- Запустит PostgreSQL и создаст базу данных
- Создаст виртуальное окружение Python и установит зависимости
- Применит миграции Django
- Создаст тестовых пользователей
- Установит npm-пакеты для React

## Запуск (каждый раз)

```bash
./start.sh
```

Открой в браузере: **http://localhost:3000**

## Тестовые пользователи

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@edu.ru | admin123 |
| Преподаватель | teacher@edu.ru | teacher123 |
| Студент | student@edu.ru | student123 |

## Структура проекта

```
edplatform/
├── setup.sh              # Установка (запустить один раз)
├── start.sh              # Запуск проекта
├── backend/
│   ├── .env              # Настройки БД и секретный ключ
│   ├── manage.py
│   ├── core/             # Настройки Django, маршруты
│   ├── users/            # Пользователи, роли, JWT
│   ├── courses/          # Курсы, модули, записи
│   ├── activity_tracker/ # Логи активности, метрики
│   ├── analytics/        # GKA + K-means кластеризация
│   └── testing/          # Тесты и результаты
└── frontend/
    └── src/
        ├── api/          # Axios клиент
        ├── context/      # AuthContext
        └── pages/        # Страницы по ролям
```

## Открыть в VS Code

```bash
code ~/edplatform
```
# VKR
