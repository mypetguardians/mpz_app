# MPZ 작업 계획 & 진행 상태

## 🔴 다음 작업

### SMS 인증
- [ ] 프로필 휴대폰 번호 수정 시 SMS 인증 절차
- 알리고(aligo) 추천 (가격 대비 성능, 국내 특화)
- BE: SMS 발송 API + 인증번호 생성/검증 (Redis TTL로 만료 관리)
- FE: 인증번호 입력 UI + 타이머 + 재발송

---

## 🟡 강아지학교 서비스 런칭

### 서비스 배포
- [ ] doggy-school fork → 코드베이스 분석 (구조, 의존성, DB 스키마)
- [ ] Supabase에 강아지학교 테이블 추가 (마펫쯔 DB 공유)
  - 같은 Supabase 프로젝트 내 스키마 분리 또는 테이블 prefix로 구분
  - User 테이블은 마펫쯔와 공유 (한 계정으로 두 서비스 이용)
- [ ] Docker Compose에 강아지학교 컨테이너 추가 또는 별도 Compose 구성
- [ ] Nginx 라우팅 (doggy.mpz.kr 또는 서브패스)

### JWT 인증 공유 (핵심)
- [ ] 마펫쯔 ↔ 강아지학교 SSO 설계
  - 동일 JWT secret 공유 → 한쪽에서 발급한 토큰을 다른 쪽에서 검증
  - 또는 Supabase Auth 통합 (두 서비스 모두 Supabase JWT 사용)
- [ ] refresh token 정책 통일 (현재 마펫쯔: ACCESS 2h / REFRESH 30d)
- [ ] 카카오 로그인 세션이 강아지학교에서도 유효하도록 쿠키 도메인 설정 (.mpz.kr)

### 인프라 결정
- [ ] AWS(서버) + Supabase(DB) 현행 유지 vs Supabase 전면 이관
  - 현행: EC2에서 Docker 운영, DB/Storage만 Supabase → 제어력 높음, 비용 예측 가능
  - 전면 이관: Supabase Edge Functions + Supabase Auth → 운영 간소화, 하지만 커스텀 제약
  - 강아지학교 추가 시 EC2 리소스(t3.medium) 충분한지 확인 필요
  - **판단 시점**: 강아지학교 코드 분석 후 리소스 요구사항 파악 시

### Redis 캐시 스코프 정의
- [ ] 현재 사용: 동기화 잠금(SyncLog), Celery 브로커
- [ ] 추가 검토 대상:
  - API 응답 캐시 (동물 목록, 센터 목록 — staleTime과 중복 여부)
  - SMS 인증번호 저장 (TTL 3분)
  - Rate Limiting 카운터 (IP별/유저별)
  - 세션 저장 (JWT 방식이면 불필요)
  - 강아지학교와 Redis 인스턴스 공유 vs 분리 (DB 번호로 구분 가능: db0=마펫쯔, db1=강아지학교)

---

## 🟢 시스템 구축 (마펫쯔 + 강아지학교 공통)

### TDD 구축
- [ ] BE 테스트: pytest + Django TestCase
  - unit: 서비스 로직, 유틸 함수
  - integration: API 엔드포인트 (인증, 찜, 동기화)
  - fixture: 테스트 데이터 팩토리 (factory_boy)
- [ ] FE 테스트: Vitest + React Testing Library
  - component: PetCard, CenterCard, SearchInput 등 공통 컴포넌트
  - hook: useGetAnimals, useBatchFavorites 등 커스텀 훅
  - e2e: Playwright (로그인 → 목록 → 상세 → 뒤로가기 플로우)
- [ ] CI 파이프라인: GitHub Actions에 test 단계 추가
  - PR 머지 전 테스트 필수 통과 (required check)
  - 커버리지 리포트 (codecov 또는 PR 코멘트)

### 모니터링
- [ ] 업타임: Freshping (무료, 1분 간격 HTTP 체크)
- [ ] 에러 추적: Sentry (FE + BE, source map 연동)
  - FE: Next.js Sentry SDK (@sentry/nextjs)
  - BE: Django Sentry SDK (sentry-sdk[django])
- [ ] 배포 알림: GitHub Actions → Slack webhook
  - 성공/실패 + 커밋 요약 + 소요 시간
- [ ] 로그 모니터링: Docker json-file 로그 → 필요 시 Loki/Grafana 검토
- [ ] 마펫쯔 + 강아지학교 통합 대시보드

### 보안 검수
- [ ] OWASP Top 10 기본 점검
  - XSS: React 기본 방어 + dangerouslySetInnerHTML 검색
  - CSRF: Django middleware + SameSite cookie
  - SQL Injection: Django ORM 사용으로 기본 방어, raw query 검색
  - 인증/인가: JWT 만료, refresh 로직, 권한 체크
- [ ] 의존성 취약점: dependabot (GitHub), npm audit, pip-audit
- [ ] release-key.jks 관리 (Capacitor 빌드용, 유출 방지)
- [ ] 환경변수 노출 점검 (NEXT_PUBLIC_* 중 민감 정보 없는지)
- [ ] HTTPS 강제 + HSTS (이미 적용, 재확인)

### Rate Limiting
- [ ] Redis 기반 throttling (django-ratelimit 또는 Django Ninja 미들웨어)
- [ ] 적용 대상:
  - 로그인/SMS 발송: 분당 5회
  - API 일반: 분당 60회 (인증 유저), 분당 20회 (비인증)
  - 동기화 API: IP 화이트리스트

### 배포 개선
- [ ] 무중단배포 재설계
  - Blue-Green: 이전 시도에서 Docker Compose alias 충돌로 502 → 근본 원인 해결 필요
  - Canary: 트래픽 비율 제어 가능하면 더 안전
  - 현재 Rolling은 동작하지만 순간 다운타임 있음
- [ ] 배포 롤백: 이전 이미지 태그 보관 → 실패 시 즉시 롤백 스크립트
- [ ] DB 마이그레이션 실패 시 자동 복구 (migrate → 실패 → 이전 컨테이너 유지)

---

## 🔵 후순위

- **WebSocket (ASGI)**: gunicorn → Daphne/Uvicorn ASGI 전환. 채팅/실시간 알림 필요 시. 현재 FCM으로 알림 대체 완료
- **Django Admin UI 교체**: django-unfold 또는 커스텀 Admin. 현재 기본 Admin 사용 중
- **데이터 분석/시각화**: 입양 통계, 사용자 행동 분석. 서비스 안정화 후

---

## 대표님 의존

- [ ] 환경변수 수령 — OPENAI_API_KEY, LANGCHAIN_API_KEY

---

완료 항목은 `history/` 폴더에서 날짜별 상세 확인 가능
