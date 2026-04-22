.PHONY: dev dev-fe kill-all

FE_PORT  := 3001
BE_PORT  := 8000
ROOT_DIR := $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))
PYTHON   := $(ROOT_DIR)/backend/venv/bin/python

# ─────────────────────────────────────────────
# make dev  →  FE(3001) + BE(8000) 로컬 동시 실행
#              FE는 localhost:8000 백엔드 바라봄
# ─────────────────────────────────────────────
dev: kill-all
	@echo "🔧 Backend env 설정 중..."
	@cp $(ROOT_DIR)/backend/.env.dev $(ROOT_DIR)/backend/.env
	@printf 'NEXT_PUBLIC_API_BASE_URL=http://localhost:$(BE_PORT)/v1/\n' > $(ROOT_DIR)/frontend/.env.development.local
	@echo "🐍 Django 백엔드 :$(BE_PORT) 시작..."
	@echo "⚛️  Next.js 프론트엔드 :$(FE_PORT) 시작..."
	@trap 'echo "\n🛑 종료 중..."; \
	       kill $$(jobs -p) 2>/dev/null; \
	       lsof -ti -sTCP:LISTEN -i:$(FE_PORT) | xargs kill -9 2>/dev/null; \
	       lsof -ti -sTCP:LISTEN -i:$(BE_PORT) | xargs kill -9 2>/dev/null; \
	       rm -f $(ROOT_DIR)/frontend/.env.development.local $(ROOT_DIR)/backend/.env; \
	       echo "✅ 정리 완료"' EXIT INT TERM; \
	 (cd $(ROOT_DIR)/backend && $(PYTHON) manage.py runserver $(BE_PORT) 2>&1 | sed 's/^/[BE] /') & \
	 pnpm --prefix $(ROOT_DIR)/frontend run dev; \
	 wait

# ─────────────────────────────────────────────
# make dev-fe  →  FE만 실행 (BE = dev-api.mpz.kr)
# ─────────────────────────────────────────────
dev-fe: _kill-fe
	pnpm --prefix $(ROOT_DIR)/frontend run dev

# ─────────────────────────────────────────────
# Docker (기존)
# ─────────────────────────────────────────────
up:
	docker-compose up

build:
	docker-compose up --build

makemigrations:
	docker-compose run --rm backend sh -c "python manage.py makemigrations"

# ─────────────────────────────────────────────
# 내부 타겟
# ─────────────────────────────────────────────
kill-all: _kill-fe _kill-be

_kill-fe:
	-@lsof -ti -sTCP:LISTEN -i:$(FE_PORT) | xargs kill -9 2>/dev/null; true

_kill-be:
	-@lsof -ti -sTCP:LISTEN -i:$(BE_PORT) | xargs kill -9 2>/dev/null; true
