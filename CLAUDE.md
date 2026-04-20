# MPZ 프로젝트 Claude 참고 문서

## 프로젝트 개요

**MPZ(마펫쯔)** — 유기동물 입양 & 보호센터 관리 플랫폼
이전 개발사 소유 Railway/Neon 인프라 → 자체 AWS EC2 + Supabase로 마이그레이션 완료

---

## 인프라 구성

### EC2 서버

| 구분 | 퍼블릭 IP | 용도 | 스펙 |
|------|-----------|------|------|
| dev | `52.79.128.129` | 개발/테스트 | t2.small (1 vCPU, 2GB) |
| prod | `43.202.171.188` | 운영 | t2.medium (2 vCPU, 4GB) |

```bash
# SSH 접속
ssh -i ~/.ssh/mpz-key.pem ubuntu@52.79.128.129   # dev
ssh -i ~/.ssh/mpz-key.pem ubuntu@43.202.171.188  # prod
```

**⚠️ 미해결: EC2 아웃바운드 TCP(443, 80) 차단**
- `curl https://...` 모두 timeout. TCP 22(SSH) 아웃바운드는 정상.
- IGW 교체 완료했으나 여전히 차단. NACL/보안그룹/iptables 모두 이상 없음. 원인 미파악.
- **영향**: Docker Hub 접근 불가(재빌드 안 됨), R2 이미지 서버프록시 불가, OpenAI/Firebase 외부 API 불가
- CI/CD는 GitHub Actions가 EC2로 SSH 접속(인바운드)하는 방식으로 우회 가능.

### Supabase DB

| 구분 | 프로젝트 | 리전 |
|------|---------|------|
| dev | mpz-dev (`djnjbimklqvzqgcrkrdf`) | Seoul (ap-northeast-2) |
| prod | mpz-prod (`uytovxdqmlmhdzzpmwzk`) | Seoul (ap-northeast-2) |

- 연결: Transaction pooler, 포트 6543
- 직접 연결(pg_dump용): 포트 5432, `db.[project-ref].supabase.co`

### DNS (가비아)

| 도메인 | IP |
|--------|-----|
| `mpz.kr` / `api.mpz.kr` | `43.202.171.188` (prod) |
| `dev.mpz.kr` / `dev-api.mpz.kr` | `52.79.128.129` (dev) |

---

## 기술 스택

### Backend (Django)
- Django 5 + Django Ninja (REST API)
- Django Channels (WebSocket)
- Gunicorn + UvicornWorker
- Cloudflare R2 (이미지 스토리지)
- Firebase FCM (푸시 알림)
- OpenAI + LangChain (AI 동물 매칭)
- Redis (채널 레이어)

### Frontend (Next.js)
- Next.js 15 (App Router) + React 19 + TypeScript
- Capacitor 7 (iOS/Android/Web 단일 코드베이스)
- Tailwind CSS, Zustand, TanStack Query, Axios
- Kakao OAuth, Kakao Maps

### 인프라
- Docker Compose (`docker-compose.prod.yml`) — dev/prod 공용
- Nginx (SSL termination, 리버스 프록시)
- Let's Encrypt (Certbot) SSL
- GitHub Actions CI/CD

---

## 디렉토리 구조

```
mpz_app/
├── backend/               # Django 백엔드
│   ├── cfehome/           # 프로젝트 설정 (settings.py, urls.py, asgi.py)
│   ├── animals/           # 동물 모델, 공공데이터 동기화 API
│   ├── adoptions/         # 입양 신청/프로세스
│   ├── centers/           # 보호센터 관리
│   ├── user/              # 사용자 인증
│   ├── notifications/     # 알림 (FCM + WebSocket)
│   ├── ai/                # AI 매칭 서비스
│   ├── .env.dev           # dev 환경변수 (gitignore)
│   ├── .env.prod          # prod 환경변수 (gitignore)
│   └── Dockerfile
├── frontend/              # Next.js 프론트엔드
│   ├── src/app/           # App Router 페이지
│   ├── src/components/    # UI 컴포넌트
│   ├── src/hooks/         # Query/Mutation hooks
│   └── Dockerfile
├── nginx/
│   ├── dev.conf           # dev nginx 설정
│   └── prod.conf          # prod nginx 설정
├── docker-compose.prod.yml # dev/prod 공용 컴포즈 파일 (APP_ENV로 분기)
└── .github/workflows/
    └── deploy.yml         # CI/CD 파이프라인
```

---

## 배포 방법

### 자동 배포 (GitHub Actions)
```bash
git push origin main   # → Prod EC2 자동 배포
git push origin dev    # → Dev EC2 자동 배포
```

GitHub Secrets: `PROD_EC2_HOST`, `DEV_EC2_HOST`, `EC2_SSH_KEY`

### 수동 배포 (EC2에서)
```bash
cd ~/mpz_app

# 실행
APP_ENV=prod docker compose -f docker-compose.prod.yml up -d
APP_ENV=dev docker compose -f docker-compose.prod.yml up -d

# 재빌드
APP_ENV=prod docker compose -f docker-compose.prod.yml up -d --build

# 상태 확인
APP_ENV=prod docker compose -f docker-compose.prod.yml ps

# 로그
APP_ENV=prod docker compose -f docker-compose.prod.yml logs backend --tail=50
APP_ENV=prod docker compose -f docker-compose.prod.yml logs nginx --tail=20

# 마이그레이션
APP_ENV=prod docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

---

## 환경변수 구조 (backend/.env.dev / .env.prod)

```
DJANGO_SECRET_KEY, DJANGO_DEBUG, DJANGO_ENV_NAME
DATABASE_URL          # Supabase Transaction Pooler (포트 6543)
REDIS_URL             # redis://redis:6379

# 카카오
KAKAO_SOCIAL_LOGIN_CLIENT_ID/SECRET
NEXT_PUBLIC_KAKAO_REDIRECT_URI

# Cloudflare R2
R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_BASE_URL

# Firebase
FIREBASE_ADMIN_CREDENTIALS_JSON  # JSON 문자열
FCM_PROJECT_ID=mpz-app-b2e01

# AI
OPENAI_API_KEY, LANGCHAIN_API_KEY, LANGCHAIN_TRACING_V2, LANGCHAIN_PROJECT

# 공공데이터
PUBLIC_DATA_SERVICE_KEY          # 농림축산검역본부 API 키
SYNC_API_KEY                     # 동기화 엔드포인트 인증 키 (PUBLIC_DATA_SERVICE_KEY와 별개)

# 기타
SMS_API_KEY                      # Blink SMS relay 서비스 키
FRONTEND_URL, CORS_ALLOWED_ORIGINS
```

---

## 공공데이터 동기화

- 농림축산검역본부 API → Django `animals` 앱에서 동기화
- 동기화 엔드포인트: `POST /v1/animals/sync-public-data`
- 인증: `X-API-Key: {SYNC_API_KEY}` 헤더
- `SyncLog` 모델로 실행 이력 추적 (`sync_logs` 테이블)
- 스케줄러: Supabase Cron (pg_cron + pg_net) — EC2와 독립적

---

## 주요 주의사항

1. **EC2 아웃바운드 TCP 불가**: EC2에서 `curl https://...` 모두 timeout. Docker 재빌드(`--build`) 불가. R2/외부 API 서버사이드 호출 불가. (→ 미해결 항목 참고)
2. **git push는 SSH로**: `git remote set-url origin git@github.com:WaterMinCho/mpz_app.git` (HTTPS 401 에러)
3. **.env 파일은 gitignore**: EC2에 직접 업로드해야 함. CI/CD 파이프라인은 코드만 전송, env는 EC2에 이미 존재해야 함.
4. **docker compose vs docker-compose**: EC2에서는 `docker compose` (v2) 사용.
5. **마이그레이션**: 배포 후 반드시 `python manage.py migrate` 실행 (CI/CD에 포함됨).
6. **SMS**: Blink SMS relay 서비스 (`https://blink-production-37f6.up.railway.app`) 사용 중.

---

## 미완료 항목

### 🔴 최우선 (이미지 미노출)
- [ ] **EC2 아웃바운드 TCP 443 원인 파악 및 해결** — 해결되면 Docker 재빌드, R2 프록시, 외부 API 모두 정상화
- [ ] **R2 `.bin` Content-Type 문제** — Cloudflare 대시보드에서 기존 객체 Content-Type 일괄 수정(image/jpeg)하거나, 백엔드 업로드 코드 수정

### 🟡 배포/인프라
- [ ] **Docker 재빌드 정상화** — EC2 아웃바운드 해결 후 `docker compose up -d --build` 가능
- [ ] **dev EC2 JS 패치 상태** — 현재 컨테이너 내부 JS 수동 패치 중. 재빌드 전까지 컨테이너 재시작 금지
- [ ] 카카오 로그인 동작 확인 (dev/prod)
- [ ] 모니터링 구축 (Freshping + Sentry + GitHub Actions Slack 배포 알림)

### 🟢 기타
- [ ] 이미지 성능 최적화 (현재 `unoptimized: true` 상태 — 임시)
- [ ] EC2 → Supabase Storage 이관 검토
- [ ] prod → dev Supabase 데이터 복제
- [ ] `FIREBASE_ADMIN_CREDENTIALS_JSON` — 대표님/이전 개발사에서 수령 필요
- [ ] `OPENAI_API_KEY` — 대표님에게 수령 필요
- [ ] `LANGCHAIN_API_KEY` — 대표님에게 수령 필요
- [ ] `PUBLIC_DATA_SERVICE_KEY` — 대표님에게 수령 필요
- [ ] `SYNC_API_KEY` — 직접 생성 가능: `openssl rand -hex 32`

---

## 이미지 아키텍처 현황

R2에 이미지가 `.bin` 확장자로 저장됨 (`Content-Type: application/octet-stream`).
브라우저가 직접 fetch하면 이미지로 인식 못 함.

**원래 설계:** `/api/proxy-image` 라우트가 바이트 시그니처 감지 → 올바른 Content-Type으로 서빙
**현재 문제:** EC2 아웃바운드 443 차단 → proxy가 R2 fetch 실패

관련 파일:
- `frontend/src/lib/getProxyImageUrl.ts` — 이미지 URL을 프록시로 변환
- `frontend/src/app/api/proxy-image/route.ts` — 서버사이드 이미지 프록시 (Content-Type 변환 포함)
- `frontend/src/components/ui/AnimalImage.tsx` — 이미지 렌더링 컴포넌트
