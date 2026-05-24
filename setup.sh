#!/bin/bash
# ===========================================
# EduPlatform — Установка и запуск
# Работает на любом WSL Ubuntu с нуля
# ===========================================

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo "======================================"
echo "  EduPlatform — Установка"
echo "======================================"

# --- 1. Системные зависимости ---
echo ""
echo "[1/5] Установка системных зависимостей..."
sudo apt-get update -qq
sudo apt-get install -y -qq python3 python3-pip python3-venv python3-dev \
    postgresql postgresql-contrib libpq-dev gcc curl

# Node.js — если не установлен
if ! command -v node &>/dev/null; then
    echo "  Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - -qq
    sudo apt-get install -y -qq nodejs
fi

echo "  Python: $(python3 --version)"
echo "  Node:   $(node --version)"
echo "  npm:    $(npm --version)"

# --- 2. PostgreSQL ---
echo ""
echo "[2/5] Настройка PostgreSQL..."
sudo service postgresql start

sudo -u postgres psql -c "CREATE USER edplatform_user WITH PASSWORD 'edplatform_pass';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE edplatform OWNER edplatform_user;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE edplatform TO edplatform_user;" 2>/dev/null || true

echo "  PostgreSQL готов"

# --- 3. Python окружение ---
echo ""
echo "[3/5] Установка Python-зависимостей..."
cd "$BACKEND"

rm -rf venv
python3 -m venv venv
source venv/bin/activate

pip install -q --upgrade pip
pip install -q -r requirements.txt

# --- 4. Миграции Django ---
echo ""
echo "[4/5] Создание таблиц базы данных..."

python manage.py makemigrations users
python manage.py makemigrations courses
python manage.py makemigrations activity_tracker
python manage.py makemigrations analytics
python manage.py makemigrations testing
python manage.py migrate

# Тестовые пользователи
python manage.py shell << 'PYEOF'
from users.models import User

users = [
    dict(username='admin',    email='admin@edu.ru',   password='admin123',   first_name='Администратор', last_name='Системы',  role='admin',   is_staff=True, is_superuser=True),
    dict(username='teacher1', email='teacher@edu.ru', password='teacher123', first_name='Иван',          last_name='Петров',   role='teacher'),
    dict(username='student1', email='student@edu.ru', password='student123', first_name='Мария',         last_name='Иванова',  role='student'),
]

for u in users:
    if not User.objects.filter(email=u['email']).exists():
        pw = u.pop('password')
        user = User(**u)
        user.set_password(pw)
        user.save()
        print(f"  Создан: {u['email']}")
    else:
        print(f"  Уже существует: {u['email']}")
PYEOF

deactivate

# --- 5. Frontend ---
echo ""
echo "[5/5] Установка Frontend-зависимостей..."
cd "$FRONTEND"
npm install --silent

echo ""
echo "======================================"
echo "  Установка завершена успешно!"
echo "======================================"
echo ""
echo "  Администратор: admin@edu.ru    / admin123"
echo "  Преподаватель: teacher@edu.ru  / teacher123"
echo "  Студент:       student@edu.ru  / student123"
echo ""
echo "  Запуск: ./start.sh"
echo ""