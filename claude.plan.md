# MPZ 작업 계획 & 진행 상태

## 🔴 다음 작업

### 1. env/시크릿 관리 개선 (GitHub Secrets 통합)

- [ ] backend/.env.example 파일 git 커밋 (키만, 값 없이)
- [ ] Firebase JSON 별도 파일 마운트 (docker-compose volume)
- [ ] BE 환경변수 GitHub Secrets로 이관
- [ ] deploy.yml에서 .env 파일 자동 생성
- [ ] EC2 직접 .env 수정 패턴 폐기

### 2. SMS 인증

- [ ] 프로필 휴대폰 번호 수정 시 SMS 인증 절차 추가

### 3. WebSocket 지원

- gunicorn → Daphne(ASGI) 전환
- 현재 FCM 웹 푸시로 알림 기능 대체 가능, WebSocket은 채팅/실시간 상태용

### 4. doggy-school 프로젝트

- fork → clone → 분석 → Supabase 위에 배포

---

## 🟢 환경변수 수령 (대표님/이전 개발사)

- [x] FIREBASE_ADMIN_CREDENTIALS_JSON — 새 프로젝트 직접 생성 완료
- [ ] OPENAI_API_KEY
- [ ] LANGCHAIN_API_KEY

---

## 🔄 상시

### SEO
- 완료 항목은 `history/2026-04-26.md` 참고
- [ ] 파비콘 전용 ico 제작 + apple-touch-icon (디자인 필요)
- [ ] 네이버/Google 색인 상태 모니터링 (서치어드바이저 + Search Console)

---

## 🔵 후순위

### AWS → Supabase 전면 이관 + 무중단 배포

### 모니터링

- [ ] Freshping + Sentry + Slack 배포 알림

### Django Admin UI

### 보안 검수

- [ ] release-key.jks git 추적 제거

### 테스트 시스템

### 데이터 분석/시각화

---

## ✅ 완료

### 2026-04-26
- [x] 불필요 코드/리소스 정리 (1,522줄 삭제)
- [x] Firebase 새 프로젝트 생성 + 웹 푸시 전체 구현
- [x] FCM TTL 1시간 + collapse_key
- [x] 알림 UI 개선 (toast 애니메이션, NotificationCard, 뱃지 실시간)
- [x] Auth 상태 깜빡임 해결 (6개 컴포넌트)
- [x] GPS 위치 확인 대기시간 단축
- [x] SEO 기초 (Google/네이버 인증, 센터 OG, JSON-LD, 시맨틱 HTML, 접근성)
- [x] SEO 전면 강화 (canonical, 페이지별 메타, robots.txt, sitemap lastmod, 키워드, SiteNavigationElement)
- [x] 입양 신청 분기 복원 (구독센터: 앱 내 신청, 비구독: 전화 연결)
- [x] 접근성 강화 (Toast/Modal/BottomSheet ARIA 속성)
- [x] 지역 태그 스크롤 포커싱
- [x] env/시크릿 관리 연구 + 방향 결정
- [x] prod 배포 (PR #16, #17)

### 이전

`history/` 폴더에서 날짜별 상세 확인 가능
