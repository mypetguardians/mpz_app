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

### SEO (네이버 서치어드바이저 + Google 공통 기준)

#### 완료
- [x] Google Search Console 인증 + sitemap 제출 (8,112 페이지)
- [x] 네이버 서치어드바이저 인증 + sitemap 제출
- [x] robots.txt (prod/dev 분기, sitemap 명시, 관리자 페이지 Disallow)
- [x] sitemap.xml (동적 — 정적페이지 + 동물 + 센터)
- [x] 전역 메타데이터 (title template, description, OG, Twitter)
- [x] 동물/센터 상세 generateMetadata (동적 OG + Twitter)
- [x] JSON-LD 구조화 데이터 (Organization, AnimalShelter, Thing)
- [x] 시맨틱 HTML (Container main, NavBar button, 접근성)
- [x] viewport meta (width=device-width)
- [x] SSR (Next.js App Router — 네이버 SPA 가이드 충족)
- [x] 커스텀 404 페이지
- [x] HTTPS 프로토콜
- [x] 반응형 웹 (모바일 우선)

#### P1 — canonical URL 설정 (중복 URL 방지, 네이버 핵심 권장)
- [ ] 전역 layout.tsx에 metadataBase 설정 (`https://mpz.kr`)
- [ ] 동물 상세 generateMetadata에 `alternates.canonical` 추가
- [ ] 센터 상세 generateMetadata에 `alternates.canonical` 추가
- [ ] 주요 공개 페이지 layout/page에 canonical 추가 (list/animal, list/center, community, matching 등)

#### P2 — 공개 페이지별 고유 메타데이터
- [ ] `/list/animal` — 고유 title + description (e.g. "입양 가능한 유기동물 | 마펫쯔")
- [ ] `/list/center` — 고유 title + description
- [ ] `/community` — 고유 title + description
- [ ] `/matching` — 고유 title + description
- [ ] `/event/centers` — 고유 title + description
- [ ] `/community/[id]` — 동적 메타데이터 (게시글 제목, 내용 요약)

#### P3 — robots.txt 강화
- [ ] 네이버 Yeti 명시 허용 규칙 추가 (User-agent: Yeti / Allow: /)
- [ ] favicon 경로 수집 허용 확인
- [ ] 로그인 필요 페이지 Disallow 추가 (/my/, /login/, /favorite/)

#### P4 — 파비콘 개선
- [ ] 전용 favicon.ico 제작 (현재 op-image.png 사용 중)
- [ ] 절대경로로 변경 (`https://mpz.kr/favicon.ico`)
- [ ] apple-touch-icon 추가

#### P5 — 기타 개선
- [ ] Core Web Vitals 점검 (PageSpeed Insights 측정 후 개선)
- [ ] 추가 접근성 (배경 오버레이 role, toast role="alert" 등)
- [ ] 네이버 웹마스터도구 URL 검사로 주요 페이지 SEO 점검
- [ ] sitemap lastmod를 실제 데이터 수정일로 반영 (현재 new Date() 고정)

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
- [x] SEO (Google/네이버 인증, 센터 OG, JSON-LD, 시맨틱 HTML, 접근성)
- [x] 지역 태그 스크롤 포커싱
- [x] env/시크릿 관리 연구 + 방향 결정
- [x] prod 배포 (PR #16)

### 이전
`history/` 폴더에서 날짜별 상세 확인 가능
