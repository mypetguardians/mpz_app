#!/bin/bash
RUN_PORT="8000"

python manage.py collectstatic --noinput

python manage.py migrate --no-input

python manage.py runserver 0.0.0.0:$RUN_PORT