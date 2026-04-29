# Backend — Django 5 + Django Ninja

## 스택
Django 5, Django Ninja (REST), Gunicorn + UvicornWorker, Supabase Storage (boto3 S3), Redis, Firebase FCM

## 주요 앱
- `animals/` — 동물 모델, 공공데이터 동기화
- `storage_service/` — Supabase Storage 클라이언트
- `centers/` — 보호센터 관리
- `adoptions/` — 입양 프로세스
- `user/` — 카카오 OAuth + JWT 인증
- `notifications/` — FCM + WebSocket

## 환경변수 (.env.dev / .env.prod)
DJANGO_SECRET_KEY, DATABASE_URL(Supabase 6543), REDIS_URL, KAKAO_*, STORAGE_*(S3 호환), FIREBASE_*, PUBLIC_DATA_SERVICE_KEY, SYNC_API_KEY, SMS_API_KEY

## 공공데이터 동기화
Worker 컨테이너에서 management command로 실행 (run_scheduler.py):

| 전략 | 스케줄 | 조회 범위 | 동작 |
|------|--------|----------|------|
| incremental | 매일 03:00 KST | 최근 2일 접수 | 신규 생성 + 업데이트 |
| status_sync | 매주 수/일 03:10 KST | 보호중 전체 | 기존 동물 상태 업데이트 + 보호종료 감지 (신규 생성 안 함) |
| full | 매월 1일 05:00 KST | 최근 90일 | 전체 재동기화 + 보호종료 감지 |

- SyncLog 모델로 이력 추적 + 컨테이너 재시작 시 중복 실행 방지
- status_sync는 `update_only=True` — 신규 동물 생성 차단, incremental이 담당
- 보호종료 감지: API에서 안 내려온 기존 "보호중" 동물 → 자동 전환
- 직접등록 동물(is_public_data=False)은 동기화 영향 받지 않음

## 이미지 업로드
`/v1/storage/upload` — base64 → Pillow 리사이징(profiles 512px, 일반 1080px) + EXIF 보정 → Supabase Storage

## Django Admin
- dev: `https://dev-api.mpz.kr/admin/` (admintest)
- prod: `https://api.mpz.kr/admin/` (mpzadmin)

## 카카오 로그인
KakaoButton → state에 frontend URL + returnpath 인코딩 → 백엔드 콜백에서 파싱 → 리다이렉트. JWT 쿠키 설정 시 samesite/secure 매칭 필수.

## FCM 푸시
- TTL + collapse_key로 밀린 알림 중복 방지
- 플랫폼별 헤더: iOS(apns-expiration/collapse-id), Android(ttl/collapse_key), Web(TTL/Topic)
- web 페이로드에 아이콘, 클릭 링크 포함

## 인증 패턴
- `get_authenticated_user(request)` 헬퍼 — 인증 체크 + 유저 반환 DI 패턴
- 에러 응답: `str(e)` 노출 금지 → `logger.exception()` + 제너릭 메시지
- JWT: ACCESS 2시간, REFRESH 30일 (쿠키 기반)

## Batch API 패턴
- `POST /v1/favorites/animals/batch-status` — 찜 상태 N콜→1콜
- `POST /v1/favorites/centers/batch-status` — 동일
- UUID 비교 시 `str()` 변환 필수 (values_list는 UUID 객체 반환)

## DB 연결
- `CONN_MAX_AGE=0` — pgbouncer 6543 경유이므로 Django가 연결 안 붙잡음
- UvicornWorker(async) + CONN_MAX_AGE > 0 = 연결 풀 고갈 위험

## BE 개발 규칙
1. **API 수정 시 실제 import 체인 확인** — 같은 이름의 파일이 여러 위치에 있을 수 있음. `urls.py` → `__init__.py` → 실제 로직 파일까지 추적
2. **동기화 전략 혼동 금지** — incremental(신규 생성 OK), status_sync(업데이트만, 신규 생성 금지), full(신규 생성 OK)
3. **직접등록 동물 보호** — 동기화 로직은 `is_public_data=True`만 처리. 직접등록(False)은 절대 건드리지 않음
4. **환경변수는 base64로 전달** — GitHub Secrets에 base64 인코딩으로 저장. deploy.yml에서 `base64 -d`로 디코딩. echo/printenv/sed는 JSON 특수문자를 깨뜨리므로 절대 사용 금지
5. **API 응답 필드 변경 시 프론트 SEO 확인** — sitemap/generateMetadata가 동물·센터 API에 의존. 이 API들이 느리거나 5xx 응답하면 검색 노출 저하
