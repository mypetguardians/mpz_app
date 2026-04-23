# MPZ 프로젝트 Claude 참고 문서

## 프로젝트 개요

**MPZ(마펫쯔)** — 유기동물 입양 & 보호센터 관리 플랫폼
자체 AWS EC2 + Supabase(DB + Storage) 인프라 운영 중

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

### Supabase (DB + Storage)

| 구분 | 프로젝트 | 리전 |
|------|---------|------|
| dev | mpz-dev (`djnjbimklqvzqgcrkrdf`) | Seoul (ap-northeast-2) |
| prod | mpz-prod (`uytovxdqmlmhdzzpmwzk`) | Seoul (ap-northeast-2) |

- DB 연결: Transaction pooler, 포트 6543
- Storage 버킷: `animal-images` (dev/prod 각각)
- Storage S3 엔드포인트: `https://{project-ref}.supabase.co/storage/v1/s3`

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
- Supabase Storage (이미지 스토리지, S3 호환 boto3)
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
- Worker 컨테이너 (공공데이터 동기화 스케줄러, 배포와 독립)

---

## 디렉토리 구조

```
mpz_app/
├── backend/               # Django 백엔드
│   ├── cfehome/           # 프로젝트 설정 (settings.py, urls.py, asgi.py)
│   ├── animals/           # 동물 모델, 공공데이터 동기화
│   │   └── management/commands/  # sync_public_data, run_scheduler, cleanup_invalid_animals
│   ├── storage_service/   # Supabase Storage 클라이언트 (S3 호환)
│   ├── adoptions/         # 입양 신청/프로세스
│   ├── centers/           # 보호센터 관리
│   ├── user/              # 사용자 인증
│   ├── notifications/     # 알림 (FCM + WebSocket)
│   ├── ai/                # AI 매칭 서비스
│   ├── paracord_runner.sh # 웹서버 엔트리포인트 (gunicorn)
│   ├── worker_entrypoint.sh # 워커 엔트리포인트 (스케줄러)
│   ├── .env.dev           # dev 환경변수 (gitignore)
│   ├── .env.prod          # prod 환경변수 (gitignore)
│   └── Dockerfile
├── frontend/              # Next.js 프론트엔드
│   ├── src/app/           # App Router 페이지
│   ├── src/components/    # UI 컴포넌트
│   ├── src/hooks/         # Query/Mutation hooks
│   ├── src/lib/           # 유틸리티 (animal-utils, auth, filter 등)
│   └── Dockerfile
├── nginx/
│   ├── dev.conf           # dev nginx 설정
│   └── prod.conf          # prod nginx 설정
├── docker-compose.prod.yml # dev/prod 공용 컴포즈 (backend, worker, frontend, nginx, redis)
└── .github/workflows/
    └── deploy.yml         # CI/CD (worker 재시작 제외)
```

---

## Docker 컨테이너 구성

| 서비스 | 역할 | 배포 시 재시작 |
|--------|------|--------------|
| backend | 웹서버 (gunicorn) | ✅ 재시작 |
| frontend | Next.js SSR | ✅ 재시작 |
| nginx | 리버스 프록시 | ✅ 재시작 |
| redis | 캐시/채널 레이어 | ✅ 재시작 |
| **worker** | **공공데이터 동기화 스케줄러** | **❌ 재시작 안 함** |

Worker는 배포 시 재시작하지 않아 진행 중인 동기화가 중단되지 않음.
Worker 코드 변경 시: `APP_ENV=prod docker compose -f docker-compose.prod.yml up -d --force-recreate worker`

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
git push origin main   # → Prod EC2 자동 배포 (worker 제외)
git push origin dev    # → Dev EC2 자동 배포 (worker 제외)
```

GitHub Secrets: `PROD_EC2_HOST`, `DEV_EC2_HOST`, `EC2_SSH_KEY`

### 수동 배포 (EC2에서)
```bash
cd ~/mpz_app

# 실행
APP_ENV=prod docker compose -f docker-compose.prod.yml up -d
APP_ENV=dev docker compose -f docker-compose.prod.yml up -d

# 상태 확인
APP_ENV=prod docker compose -f docker-compose.prod.yml ps

# 로그
APP_ENV=prod docker compose -f docker-compose.prod.yml logs backend --tail=50
APP_ENV=prod docker compose -f docker-compose.prod.yml logs worker --tail=50

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

# Supabase Storage (S3 호환)
STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_BUCKET
STORAGE_ENDPOINT, STORAGE_PUBLIC_BASE_URL, STORAGE_REGION

# Cloudflare R2 (레거시 — 마이그레이션 완료 후 제거 예정)
R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_BASE_URL

# Firebase
FIREBASE_ADMIN_CREDENTIALS_JSON  # JSON 문자열
FCM_PROJECT_ID=mpz-app-b2e01

# AI
OPENAI_API_KEY, LANGCHAIN_API_KEY, LANGCHAIN_TRACING_V2, LANGCHAIN_PROJECT

# 공공데이터
PUBLIC_DATA_SERVICE_KEY          # 농림축산검역본부 API 키 (data.go.kr Decoding 키)
SYNC_API_KEY                     # 동기화 HTTP 엔드포인트 인증 키

# 기타
SMS_API_KEY                      # Blink SMS relay 서비스 키
FRONTEND_URL, CORS_ALLOWED_ORIGINS
```

---

## 공공데이터 동기화

### 아키텍처
- 농림축산검역본부 API → Worker 컨테이너에서 Django management command로 실행
- 이미지는 공공 API에서 다운로드 → Supabase Storage에 업로드 → URL을 DB에 저장
- `SyncLog` 모델로 실행 이력 추적 (admin 페이지에서 조회 가능)

### 동기화 전략

| 전략 | 스케줄 | 공공 API 조회 범위 | 이미지 처리 |
|------|--------|------------------|------------|
| incremental | 매일 03:00 KST | 어제~오늘 | 다운로드 + 업로드 |
| status_sync | 매주 일 04:00 KST | 보호중 전체 | 스킵 (상태만 업데이트) |
| full | 매월 1일 05:00 KST | 전체 (최근 90일) | 다운로드 + 업로드 |

### 수동 실행
```bash
# worker 컨테이너에서 실행 (배포 영향 없음)
APP_ENV=prod docker compose -f docker-compose.prod.yml exec worker python manage.py sync_public_data --strategy incremental --days 2
APP_ENV=prod docker compose -f docker-compose.prod.yml exec worker python manage.py sync_public_data --strategy full --days 204
```

### HTTP 엔드포인트 (레거시, 수동 트리거용)
- `GET /v1/animals/public-data/sync`
- 인증: `X-API-Key: {SYNC_API_KEY}` 헤더

---

## Django Admin

| 환경 | URL | 계정 |
|------|-----|------|
| dev | `https://dev-api.mpz.kr/admin/` | admintest |
| prod | `https://api.mpz.kr/admin/` | mpzadmin |

---

## 주요 주의사항

1. **git push는 SSH로**: `git remote set-url origin git@github.com:WaterMinCho/mpz_app.git`
2. **.env 파일은 gitignore**: EC2에 직접 관리. CI/CD는 코드만 전송.
3. **docker compose** (v2) 사용.
4. **마이그레이션**: 배포 시 CI/CD에서 자동 실행.
5. **SMS**: Blink SMS relay (`https://blink-production-37f6.up.railway.app`) 사용 중.
6. **Docker 빌드 시 NEXT_PUBLIC_* 환경변수**: `.env` 파일 방식은 안 먹힘. 커맨드라인으로 직접 전달.
7. **Nginx 재시작**: 컨테이너 재생성 후 `docker compose restart nginx` 필요.
8. **로컬 개발**: `make dev`로 FE(3001)+BE(8000) 동시 실행.
9. **Worker 재시작 주의**: 동기화 진행 중 worker를 재시작하면 중단됨. `--force-recreate` 필요 시 동기화 완료 확인 후 진행.

---

## 이미지 아키텍처

### 현재 (Supabase Storage)
- 공공데이터 이미지: 공공 API → 다운로드 → Supabase Storage 업로드 → public URL 저장
- 센터 직접 업로드: 프론트엔드 → `/v1/storage/upload` API → Supabase Storage
- URL 형식: `https://{project-ref}.supabase.co/storage/v1/object/public/animal-images/{key}`

### 레거시 (Cloudflare R2)
- 일부 이미지가 아직 R2 URL(`pub-xxx.r2.dev`)이거나 공공 API 원본 URL(`openapi.animal.go.kr`)
- `/api/proxy-image` 프록시가 Content-Type 변환 처리 (R2 `.bin` 확장자 대응)

관련 파일:
- `backend/storage_service/services.py` — StorageClient (S3 호환 boto3)
- `frontend/src/lib/getProxyImageUrl.ts` — 이미지 URL 프록시 변환
- `frontend/src/components/ui/AnimalImage.tsx` — 이미지 렌더링 컴포넌트

---

## 카카오 로그인 아키텍처

### 웹 환경 (OAuth)
1. 프론트엔드(`KakaoButton.tsx`)가 redirect_uri를 동적 생성: `{API_BASE_URL}/kakao/login/callback`
2. state에 frontend URL 인코딩: `{uuid}_frontend_{encodeURIComponent(window.location.origin)}`
3. 백엔드 콜백(`kakao_api.py`)이 state에서 frontend URL 추출 → 허용 목록 검증 → 리다이렉트
4. JWT를 쿠키에 설정 (samesite, secure, httponly)

### 네이티브 환경 (Capacitor)
- KakaoNativeLogin 플러그인 → 액세스 토큰 획득 → `/kakao/native/login` API 호출

### 로그아웃
- JWT DB 삭제 + 쿠키 삭제 (`set_cookie(max_age=0)`)
- 쿠키 삭제 시 samesite/secure/httponly 속성을 설정 시와 동일하게 매칭 필수
- Safari ITP 대응: Safari는 `SameSite=Lax` 사용

---

## 미완료 항목

### 🔄 진행 중
- [ ] prod 공공데이터 동기화 진행 중

### 🟡 인프라/서비스
- [ ] proxy-image 제거 판단 (Supabase 이관 완료 후)
- [ ] 모니터링 구축 (Freshping + Sentry + Slack 배포 알림)
- [ ] 카카오 공유 — dev.mpz.kr / localhost:3001 도메인 등록 (카카오 개발자 콘솔)

### 🟢 환경변수 수령 (대표님/이전 개발사)
- [ ] `FIREBASE_ADMIN_CREDENTIALS_JSON`
- [ ] `OPENAI_API_KEY`
- [ ] `LANGCHAIN_API_KEY`

### ✅ 완료
- [x] Cloudflare R2 → Supabase Storage 코드 이관
- [x] 공공데이터 동기화 + 이미지 Supabase 업로드 (dev 완료)
- [x] Worker 컨테이너 분리 (배포 시 동기화 중단 방지)
- [x] 동기화 전략 개선 (incremental/status_sync/full)
- [x] Django admin UI 정적 파일 수정 (static_files named volume)
- [x] Railway 레거시 코드/설정 제거
- [x] dev/prod admin 계정 생성
- [x] breed+name 조합 표시 (getDisplayBreedName 유틸)
- [x] React key 중복 경고 해결
- [x] 카카오 로그인/로그아웃 정상 동작
