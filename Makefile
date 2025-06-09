up:
	docker-compose up

build:
	docker-compose up --build

makemigrations:
	docker-compose run --rm backend sh -c "python manage.py makemigrations"