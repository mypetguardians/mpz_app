# MPZ 작업 계획 & 진행 상태

## 🔴 다음 작업

### 1. 이벤트 페이지 ✅
- [x] 센터 신규 등록 시 `center_type` 자동 세팅 (public_reg_no 유무로 save 시 자동 판별)

### 2. 카카오 개발자 콘솔 ✅
- [x] 로그인 Redirect URI: localhost:8000 추가, 불필요 URI 정리
- [x] JS SDK 도메인: dev.mpz.kr, localhost:3001 추가, 불필요 도메인 정리
- [x] JS 키 Redirect URI: localhost:8000 추가, 불필요 URI 정리

### 3. SMS 인증
- [ ] 프로필 휴대폰 번호 수정 시 SMS 인증 절차 추가

### 4. Firebase 확인 + 웹 푸시 알림
- [ ] 대표님께 Firebase 프로젝트(`mpz-app-b2e01`) 계정 소유 확인
- [ ] `FIREBASE_ADMIN_CREDENTIALS_JSON` 서비스 계정 키 수령 → env 세팅
- [ ] 웹 푸시: Service Worker + FCM Web Push + VAPID 키 세팅
- [ ] 네이티브/웹 분기 처리 (Capacitor 네이티브 vs Web Push API)

### 5. WebSocket 지원
- 원인: Railway → EC2 이관 시 WebSocket 지원 누락
- gunicorn은 HTTP만 처리, WebSocket은 Daphne 등 ASGI 서버 필요
- prod/로컬에서 무한 재연결 시도 발생 중

### 6. deploy.yml 고도화 ✅
- [x] GitHub Actions에서 Docker 이미지 빌드 → GHCR push → EC2에서 pull만
- [x] prod 적용 완료 (PR #15)

### 7. doggy-school 프로젝트
- repo: https://github.com/mypetguardians/doggy-school
- fork → clone → 분석 → Supabase 위에 배포
- DB: mpz prod/dev Supabase DB 확장 사용 (integration, 별도 DB 아님)

---

## 🟢 환경변수 수령 (대표님/이전 개발사)
- [ ] FIREBASE_ADMIN_CREDENTIALS_JSON
- [ ] OPENAI_API_KEY
- [ ] LANGCHAIN_API_KEY

---

## 🔄 상시

### 웹 표준화 · SEO 작업 및 보완
- [x] sitemap.xml / robots.txt (prod 정상 동작 확인)
- [ ] **Google Search Console 등록** — 사이트 소유권 인증 + sitemap 제출
- [ ] **네이버 서치어드바이저 등록** — 사이트 등록 + sitemap 제출
- [ ] 소유권 인증 메타태그 삽입 (Google/Naver 각각 발급 → layout.tsx에 추가)
- [ ] 시맨틱 HTML 태그 점검 (header, main, section, article, nav 등)
- [ ] 접근성 (div onClick → button, aria-label, 키보드 네비게이션)
- [ ] 동적 메타데이터: 센터 상세 페이지별 OG (동물 상세는 완료)
- [ ] Core Web Vitals 점검 (LCP, CLS, INP)

---

## 🔵 후순위

### AWS → Supabase 전면 이관 + 무중단 배포
- 호스팅 옵션 비용/장단점 조사 필요
- Supabase 미제공: Django/Next.js 커스텀 서버 호스팅
- 후보: Vercel(FE) + Fly.io/Railway/Render(BE) 또는 Edge Functions 재작성
- EC2 유지 가능성도 있음
- **무중단 배포(zero-downtime) 세팅 포함**

### 모니터링
- [ ] Freshping + Sentry + Slack 배포 알림
- [ ] **필수**: GitHub Actions 배포 성공/실패 Slack 알림 (에러 로그 포함) — 수동 체크 제거

### Django Admin UI
- [ ] 모던 라이브러리 조사 (unfold/jazzmin/grappelli)
- [ ] 블로그, 공식문서, 리뷰 기반 선정 후 적용

### 보안 검수
- [ ] OWASP Top 10 기준 크리티컬 수준 분류 및 점검
- [ ] XSS, CSRF, SQL Injection, 인증/인가 취약점 검토
- [ ] 환경변수/시크릿 노출 여부 확인
- [ ] **release-key.jks가 git에 올라가 있음** — git 추적 제거 + gitignore 추가 필요
- [ ] API 엔드포인트 권한 검증 (인증 없이 접근 가능한 API 점검)
- [ ] 크리티컬 → 긴급 수정, 중간 → 일정 내 수정, 낮음 → 백로그

### 테스트 시스템 구축
- [ ] Jest/Vitest + React Testing Library
- [ ] Backend: Django test / pytest

### 데이터 분석/시각화
- 퍼널 분석, 데이터 추론
- MAU / WAU / DAU 분석
- GA(Google Analytics) 사용 의사 있음
- 후보: Google Analytics 4 / Mixpanel / Amplitude / 자체 대시보드

---

## 📝 완료 이력

`history/` 폴더에서 날짜별 상세 확인 가능
