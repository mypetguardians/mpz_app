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
| prod | `43.202.171.188` | 운영 | t3.medium (2 vCPU, 4GB) |

```bash
# SSH 접속
ssh -i ~/.ssh/mpz-key.pem ubuntu@52.79.128.129   # dev
ssh -i ~/.ssh/mpz-key.pem ubuntu@43.202.171.188  # prod
```

**✅ 해결됨: EC2 아웃바운드 TCP(443, 80) 차단** — 새 VPC + EC2로 마이그레이션하여 해결됨. Docker 재빌드, R2 프록시, 외부 API 모두 정상.

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

### Git Remote 구조
```
origin    → git@github.com:WaterMinCho/mpz_app.git   (개인 fork, 작업용)
upstream  → git@github.com:mypetguardians/mpz_app.git (조직 원본 repo)
```

- PR은 cross-fork: `WaterMinCho/main` → `mypetguardians/main`
- PR 생성: `gh pr create --repo mypetguardians/mpz_app --base main --head WaterMinCho:main`

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

# 재빌드 (⚠️ NEXT_PUBLIC_* 환경변수 반드시 커맨드라인으로 전달)
NEXT_PUBLIC_API_BASE_URL=https://api.mpz.kr/v1/ NEXT_PUBLIC_KAKAO_CLIENT_ID=e87b92ff4188fc038238a9a22eb0bf35 APP_ENV=prod docker compose -f docker-compose.prod.yml up -d --build
NEXT_PUBLIC_API_BASE_URL=https://dev-api.mpz.kr/v1/ NEXT_PUBLIC_KAKAO_CLIENT_ID=e87b92ff4188fc038238a9a22eb0bf35 APP_ENV=dev docker compose -f docker-compose.prod.yml up -d --build

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

1. **git push는 SSH로**: `git remote set-url origin git@github.com:WaterMinCho/mpz_app.git` (HTTPS 401 에러)
2. **.env 파일은 gitignore**: EC2에 직접 업로드해야 함. CI/CD 파이프라인은 코드만 전송, env는 EC2에 이미 존재해야 함.
3. **docker compose vs docker-compose**: EC2에서는 `docker compose` (v2) 사용.
4. **마이그레이션**: 배포 후 반드시 `python manage.py migrate` 실행 (CI/CD에 포함됨).
5. **SMS**: Blink SMS relay 서비스 (`https://blink-production-37f6.up.railway.app`) 사용 중.
6. **Docker 빌드 시 NEXT_PUBLIC_* 환경변수**: `.env` 파일 방식은 안 먹힘. 반드시 커맨드라인으로 직접 전달해야 함.
7. **Nginx 재시작**: 컨테이너 재생성 후 nginx가 IP 캐시 문제로 502를 줄 수 있음. `docker compose restart nginx` 필요.
8. **로컬 개발**: 프론트엔드 포트 3001 사용, 백엔드는 dev-api.mpz.kr 연결 (`frontend/.env.local` 참고).

---

## 미완료 항목

### 🔴 우선 수정
- [ ] **dev 카카오 로그인 127.0.0.1:3000 리다이렉트 버그** — deploy.yml 수정 완료, dev에 push하면 재빌드로 해결 예상
- [ ] 로그아웃 쿠키 삭제 동작 검증 (dev/prod 실제 테스트)

### 🟡 인프라 정리
- [ ] 구 EC2 인스턴스 종료 + 구 VPC 삭제 + 테스트 EC2 종료
- [ ] 모니터링 구축 (Freshping + Sentry + GitHub Actions Slack 배포 알림)

### 🟡 기능 개선
- [ ] R2 `.bin` Content-Type 일괄 수정 (현재 proxy-image로 우회 중)
- [ ] 이미지 성능 최적화 (현재 `unoptimized: true` 상태 — 임시)
- [ ] Supabase Storage 이관 + 무중단 배포 시스템 구축

### 🟢 환경변수 수령 (대표님/이전 개발사)
- [ ] `FIREBASE_ADMIN_CREDENTIALS_JSON`
- [ ] `OPENAI_API_KEY`
- [ ] `LANGCHAIN_API_KEY`
- [ ] `PUBLIC_DATA_SERVICE_KEY`

### ✅ 최근 완료
- [x] prod 카카오 로그인 정상 동작 확인
- [x] local 카카오 로그인 localhost:3001 리다이렉트 정상
- [x] 로그아웃 쿠키 삭제 코드 수정 (samesite/secure 매칭)
- [x] deploy.yml NEXT_PUBLIC_KAKAO_CLIENT_ID 자동 매핑 추가

---

## 이미지 아키텍처 현황

R2에 이미지가 `.bin` 확장자로 저장됨 (`Content-Type: application/octet-stream`).
브라우저가 직접 fetch하면 이미지로 인식 못 함.

**현재 동작:** `/api/proxy-image` 라우트가 바이트 시그니처 감지 → 올바른 Content-Type으로 서빙 (EC2 아웃바운드 정상화로 동작 중)

관련 파일:
- `frontend/src/lib/getProxyImageUrl.ts` — 이미지 URL을 프록시로 변환
- `frontend/src/app/api/proxy-image/route.ts` — 서버사이드 이미지 프록시 (Content-Type 변환 포함)
- `frontend/src/components/ui/AnimalImage.tsx` — 이미지 렌더링 컴포넌트

---

## 카카오 로그인 아키텍처

### 웹 환경 (OAuth)
1. 프론트엔드(`KakaoButton.tsx`)가 redirect_uri를 동적 생성: `{API_BASE_URL}/kakao/login/callback`
2. state에 frontend URL 인코딩: `{uuid}_frontend_{encodeURIComponent(window.location.origin)}`
3. 백엔드 콜백(`kakao_api.py`)이 state에서 frontend URL 추출 → 허용 목록 검증 → 해당 URL로 리다이렉트
4. JWT를 쿠키에 설정 (samesite, secure, httponly)

### 네이티브 환경 (Capacitor)
- KakaoNativeLogin 플러그인 → 액세스 토큰 획득 → `/kakao/native/login` API 호출

### 로그아웃
- JWT DB 삭제 + 쿠키 삭제 (`set_cookie(max_age=0)`)
- 쿠키 삭제 시 samesite/secure/httponly 속성을 설정 시와 동일하게 매칭 필수
- Safari ITP 대응: Safari는 `SameSite=Lax` 사용
