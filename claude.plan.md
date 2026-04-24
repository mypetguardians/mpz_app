# MPZ 작업 계획 & 진행 상태

## 🔴 다음 작업

### 1. 이벤트 페이지 — 남은 사항
- [ ] prod 서버 `backend/.env`에 EMAIL 앱 비밀번호 추가
- [ ] 센터 신규 등록 시 `center_type` 자동 세팅 로직 확인

### 2. 카카오 개발자 콘솔 (코드 X, 콘솔 작업)
- [ ] 공유: dev.mpz.kr / localhost:3001 도메인 등록
- [ ] 로그인: localhost:8000 Redirect URI 등록

### 3. SMS 인증
- [ ] 프로필 휴대폰 번호 수정 시 SMS 인증 절차 추가

### 4. AWS → Supabase 전면 이관 + 무중단 배포 (분석 진행 중)
- 호스팅 옵션 비용/장단점 조사 필요
- Supabase 미제공: Django/Next.js 커스텀 서버 호스팅
- 후보: Vercel(FE) + Fly.io/Railway/Render(BE) 또는 Edge Functions 재작성
- EC2 유지 가능성도 있음
- **무중단 배포(zero-downtime) 세팅 포함**

### 5. doggy-school 프로젝트
- repo: https://github.com/mypetguardians/doggy-school
- fork → clone → 분석 → Supabase 위에 배포
- DB: mpz prod/dev Supabase DB 확장 사용 (integration, 별도 DB 아님)

### 6. WebSocket 지원
- 원인: Railway → EC2 이관 시 WebSocket 지원 누락
- gunicorn은 HTTP만 처리, WebSocket은 Daphne 등 ASGI 서버 필요
- prod/로컬에서 무한 재연결 시도 발생 중

### 7. deploy.yml 고도화 (검토)
- [ ] GitHub Actions에서 빌드 테스트 먼저 → 실패 시 EC2 배포 안 함
- [ ] 또는 Actions에서 이미지 빌드 → Docker Registry push → EC2에서 pull만 (더 효율적)
- [ ] 시간 2배 문제 vs 안정성 트레이드오프 검토

### 8. 모니터링
- [ ] Freshping + Sentry + Slack 배포 알림
- [ ] **필수**: GitHub Actions 배포 성공/실패 Slack 알림 (에러 로그 포함) — 수동 체크 제거

### 9. Django Admin UI
- [ ] 모던 라이브러리 조사 (unfold/jazzmin/grappelli)
- [ ] 블로그, 공식문서, 리뷰 기반 선정 후 적용

---

## 🟢 환경변수 수령 (대표님/이전 개발사)
- [ ] FIREBASE_ADMIN_CREDENTIALS_JSON
- [ ] OPENAI_API_KEY
- [ ] LANGCHAIN_API_KEY

---

## 보안 검수
- [ ] OWASP Top 10 기준 크리티컬 수준 분류 및 점검
- [ ] XSS, CSRF, SQL Injection, 인증/인가 취약점 검토
- [ ] 환경변수/시크릿 노출 여부 확인
- [ ] **release-key.jks가 git에 올라가 있음** — git 추적 제거 + gitignore 추가 필요
- [ ] API 엔드포인트 권한 검증 (인증 없이 접근 가능한 API 점검)
- [ ] 크리티컬 → 긴급 수정, 중간 → 일정 내 수정, 낮음 → 백로그

---

## 테스트 시스템 구축
- [ ] Jest/Vitest + React Testing Library
- [ ] Backend: Django test / pytest

---

## 📊 데이터 분석/시각화

### 목표
- 퍼널 분석, 데이터 추론
- MAU / WAU / DAU 분석
- GA(Google Analytics) 사용 의사 있음

### 방향 (조사 필요)
- Google Analytics 4 연동
- 또는 자체 대시보드 설계/개발
- 또는 Mixpanel / Amplitude 등 전문 도구

---

## 🔵 AWS → Supabase 전면 이관 (상세)

### 현황
- DB: Supabase ✅
- Storage: Supabase ✅ (R2 이관 완료)
- 백엔드(Django): EC2 gunicorn
- 프론트엔드(Next.js): EC2 Docker
- Worker: EC2 Docker

### Supabase 제공 vs 미제공
| 제공 | 미제공 |
|------|--------|
| DB, Storage, Auth, Realtime, Edge Functions (Deno) | Django/Next.js 커스텀 서버 호스팅 |

### 호스팅 후보 (조사 필요)
- FE: Vercel / Cloudflare Pages
- BE: Fly.io / Railway / Render / Edge Functions 재작성
- 비용/장단점 비교 필요

---

## 📝 완료 이력

`history/` 폴더에서 날짜별 상세 확인 가능
