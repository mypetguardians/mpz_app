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
Worker 컨테이너에서 management command로 실행:
- `sync_public_data --strategy incremental --days 2` (매일)
- `sync_public_data --strategy status_sync` (매주)
- `sync_public_data --strategy full --days 90` (매월)

SyncLog 모델로 이력 추적. admin에서 조회 가능.

## 이미지 업로드
`/v1/storage/upload` — base64 → Pillow 리사이징(profiles 512px, 일반 1080px) + EXIF 보정 → Supabase Storage

## Django Admin
- dev: `https://dev-api.mpz.kr/admin/` (admintest)
- prod: `https://api.mpz.kr/admin/` (mpzadmin)

## 카카오 로그인
KakaoButton → state에 frontend URL + returnpath 인코딩 → 백엔드 콜백에서 파싱 → 리다이렉트. JWT 쿠키 설정 시 samesite/secure 매칭 필수.
