# Set the python version as a build-time argument
ARG PYTHON_VERSION=3.12-slim-bullseye
FROM python:${PYTHON_VERSION}

# Create a virtual environment
RUN python -m venv /opt/venv

# Set the virtual environment as the current location
ENV PATH=/opt/venv/bin:$PATH

# Upgrade pip
RUN pip install --upgrade pip

# Set Python-related environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install os dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libjpeg-dev \
    libcairo2 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create and set the working directory
RUN mkdir -p /backend

# Copy requirements and install dependencies
COPY requirements.txt /tmp/requirements.txt
COPY ./ /backend

WORKDIR /backend

# Set environment variables
ARG DJANGO_SECRET_KEY
ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}

ARG DJANGO_DEBUG=0
ENV DJANGO_DEBUG=${DJANGO_DEBUG}

# Install requirements
RUN pip install -r /tmp/requirements.txt
RUN pip install gunicorn

# Run initial commands
RUN python manage.py collectstatic --noinput

RUN chmod +x paracord_runner.sh

# Clean up
RUN apt-get remove --purge -y \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 사용자 설정
RUN adduser \
    --disabled-password \
    --no-create-home \
    django-user

USER django-user

CMD ["bash", "./paracord_runner.sh"]