ARG PYTHON_VERSION=3.12-slim-bullseye

# ---- Builder stage: 의존성 설치 ----
FROM python:${PYTHON_VERSION} AS builder

RUN python -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH

# 빌드 도구 포함해서 설치 (gcc 필요)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libjpeg-dev \
    libcairo2 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt gunicorn

# ---- Runner stage: 빌드 도구 제외한 최종 이미지 ----
FROM python:${PYTHON_VERSION} AS runner

# 빌드된 venv만 복사 (gcc 등 빌드 도구는 포함되지 않음)
COPY --from=builder /opt/venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH

# 런타임에 필요한 시스템 라이브러리만 설치
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libjpeg-dev \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_DEBUG=0

RUN mkdir -p /backend
COPY ./ /backend
WORKDIR /backend

RUN DJANGO_SECRET_KEY=build-only-dummy-key python manage.py collectstatic --noinput && \
    chmod +x paracord_runner.sh

RUN adduser --disabled-password --no-create-home django-user && \
    touch /backend/django.log && \
    chown django-user:django-user /backend/django.log

USER django-user
CMD ["bash", "./paracord_runner.sh"]
