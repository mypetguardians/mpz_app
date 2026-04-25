# MPZ 작업 계획 & 진행 상태

## 🔴 다음 작업

### 1. Auth 상태 깜빡임(flash) 해결
- [ ] HomeHeader — isLoading 중 스켈레톤/placeholder 처리
- [ ] NavBar — 인증 필요 탭 로딩 보호
- [ ] MyPage/CenterPage — 프로필 영역 로딩 처리
- [ ] FavoriteLayout/ListLayout — TopBar 조건부 렌더링 로딩 보호
- 참고: PetSection, Banner, AnimalTab, Notifications는 이미 스켈레톤 적용됨

### 2. env/시크릿 관리 개선 (GitHub Secrets 통합)
- [ ] backend/.env.example 파일 git 커밋 (키만, 값 없이)
- [ ] Firebase JSON 별도 파일 마운트 (docker-compose volume)
- [ ] BE 환경변수 GitHub Secrets로 이관
- [ ] deploy.yml에서 .env 파일 자동 생성
- [ ] EC2 직접 .env 수정 패턴 폐기

### 3. SMS 인증
- [ ] 프로필 휴대폰 번호 수정 시 SMS 인증 절차 추가

### 4. WebSocket 지원
- 원인: gunicorn은 HTTP만 처리, WebSocket은 Daphne 등 ASGI 서버 필요
- prod/로컬에서 무한 재연결 시도 발생 중
- 현재 FCM 웹 푸시로 알림 기능은 대체 가능, WebSocket은 채팅/실시간 상태용

### 5. doggy-school 프로젝트
- repo: https://github.com/mypetguardians/doggy-school
- fork → clone → 분석 → Supabase 위에 배포
- DB: mpz prod/dev Supabase DB 확장 사용 (integration, 별도 DB 아님)

---

## 🟢 환경변수 수령 (대표님/이전 개발사)
- [x] FIREBASE_ADMIN_CREDENTIALS_JSON — 새 프로젝트(mypetguardians-a8ad3) 직접 생성
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
- EC2 유지 가능성도 있음

### 모니터링
- [ ] Freshping + Sentry + Slack 배포 알림
- [ ] **필수**: GitHub Actions 배포 성공/실패 Slack 알림 (에러 로그 포함)

### Django Admin UI
- [ ] 모던 라이브러리 조사 (unfold/jazzmin/grappelli)

### 보안 검수
- [ ] OWASP Top 10 기준 점검
- [ ] release-key.jks git 추적 제거

### 테스트 시스템 구축
- [ ] Jest/Vitest + React Testing Library
- [ ] Backend: Django test / pytest

### 데이터 분석/시각화
- GA4 / Mixpanel 등

---

## ✅ 완료

### 2026-04-26
- [x] 불필요 코드/리소스 정리 (views.py 14개, 패키지 6개, 스크립트 9개 등)
- [x] Firebase 새 프로젝트 생성 + dev 서버 환경변수 세팅
- [x] Firebase 웹 푸시 알림 구현 (포그라운드 toast + 백그라운드 브라우저 알림)
- [x] FCM TTL 1시간 + collapse_key 설정
- [x] 알림 UI 개선 (toast 애니메이션, NotificationCard 아이콘, 뱃지 실시간 업데이트)
- [x] GPS 위치 확인 대기시간 단축 (12초→5초)
- [x] env/시크릿 관리 연구 + 방향 결정 (GitHub Secrets 통합)

### 이전
`history/` 폴더에서 날짜별 상세 확인 가능
