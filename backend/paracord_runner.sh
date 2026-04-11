#!/bin/bash
RUN_PORT="8000"

python manage.py collectstatic --noinput

python manage.py migrate --no-input

gunicorn cfehome.asgi:application \
  -k uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:$RUN_PORT