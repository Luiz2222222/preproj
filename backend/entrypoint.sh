#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn portal_tcc.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
