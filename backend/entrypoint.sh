#!/bin/bash
set -e

echo "Aguardando banco de dados..."
python manage.py check --database default

echo "Aplicando migrations..."
python manage.py migrate --noinput

echo "Coletando arquivos estaticos..."
python manage.py collectstatic --noinput

echo "Iniciando Gunicorn..."
exec gunicorn portal_tcc.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120
