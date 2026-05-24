#!/bin/bash
# Заполнение БД тестовыми студентами и метриками для проверки кластеризации
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"

echo "======================================"
echo "  EduPlatform — Тестовые данные"
echo "======================================"

sudo service postgresql start 2>/dev/null || true

cd "$BACKEND"
source venv/bin/activate

echo ""
python manage.py shell < seed_data.py
echo ""
echo "  Запускай ./start.sh и проверяй аналитику!"
echo "======================================"

deactivate
