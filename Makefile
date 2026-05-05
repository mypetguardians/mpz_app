.PHONY: dev dev-fe kill-all setup

FE_PORT  := 3001
BE_PORT  := 8000
ROOT_DIR := $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))
PYTHON   := $(ROOT_DIR)/backend/venv/bin/python

# ─────────────────────────────────────────────
# make dev  →  FE(3001) + BE(8000) 로컬 동시 실행
#              FE는 localhost:8000 백엔드 바라봄
#              카카오 redirect_uri 자동 localhost 교체
# ─────────────────────────────────────────────
dev: kill-all
	@if [ ! -f $(ROOT_DIR)/backend/.env.dev ]; then \
		echo "❌ backend/.env.dev 파일이 없습니다."; \
		echo "   팀원에게 .env.dev 파일을 받거나, .env.dev.example을 참고하세요."; \
		exit 1; \
	fi
	@if [ ! -f $(PYTHON) ]; then \
		echo "❌ Python venv가 없습니다. 먼저 setup을 실행하세요: make setup"; \
		exit 1; \
	fi
	@echo "🔧 Backend env 설정 중..."
	@cp $(ROOT_DIR)/backend/.env.dev $(ROOT_DIR)/backend/.env
	@if [ "$$(uname)" = "Darwin" ]; then \
		sed -i '' 's|NEXT_PUBLIC_KAKAO_REDIRECT_URI=.*|NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:$(BE_PORT)/v1/kakao/login/callback|' $(ROOT_DIR)/backend/.env; \
		sed -i '' 's|^SESSION_COOKIE_DOMAIN=.*|SESSION_COOKIE_DOMAIN=|' $(ROOT_DIR)/backend/.env; \
	else \
		sed -i 's|NEXT_PUBLIC_KAKAO_REDIRECT_URI=.*|NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:$(BE_PORT)/v1/kakao/login/callback|' $(ROOT_DIR)/backend/.env; \
		sed -i 's|^SESSION_COOKIE_DOMAIN=.*|SESSION_COOKIE_DOMAIN=|' $(ROOT_DIR)/backend/.env; \
	fi
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
# make setup  →  초기 환경 세팅 (최초 1회)
# ─────────────────────────────────────────────
setup:
	@echo "📦 Frontend 의존성 설치..."
	pnpm --prefix $(ROOT_DIR)/frontend install
	@echo "🐍 Backend venv 생성..."
	@if [ ! -d $(ROOT_DIR)/backend/venv ]; then \
		python3 -m venv $(ROOT_DIR)/backend/venv; \
	fi
	@echo "📦 Backend 의존성 설치..."
	$(ROOT_DIR)/backend/venv/bin/pip install -r $(ROOT_DIR)/backend/requirements.txt
	@echo "✅ 세팅 완료! backend/.env.dev 파일을 받은 후 make dev 실행하세요."

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
