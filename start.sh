#!/bin/bash
# ===========================================
# EduPlatform — Запуск
# ===========================================

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo "======================================"
echo "  Запуск EduPlatform"
echo "======================================"

# PostgreSQL
sudo service postgresql start 2>/dev/null
echo "  PostgreSQL запущен"

# Backend
echo "  Запуск Django на http://localhost:8000 ..."
cd "$BACKEND"
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
deactivate
cd "$ROOT"

sleep 2

# Frontend
echo "  Запуск React на http://localhost:3000 ..."
cd "$FRONTEND"
npm start &
FRONTEND_PID=$!
cd "$ROOT"

echo ""
echo "======================================"
echo "  Приложение запущено!"
echo "======================================"
echo "  http://localhost:3000  — интерфейс"
echo "  http://localhost:8000/admin — Django Admin"
echo ""
echo "  Ctrl+C — остановить"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait