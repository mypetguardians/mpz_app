# MPZ 작업 계획 & 진행 상태

## 🔴 대기 중

### Cloudflare 제거 (이전 개발사 요청)
- [ ] mpz.kr 도메인 Cloudflare 등록 해제 (또는 Bot Fight Mode OFF)
- [ ] Railway 관련 프로젝트 삭제
- 이전 개발사에 요청 완료, 처리 대기 중

### Google Search Console
- [ ] DNS TXT 레코드 등록 → 도메인 소유권 확인 → sitemap 제출

---

## 🔄 상시 (해당 페이지 작업 시 함께 적용)

### TopBar 콘텐츠 가림 수정
- TopBar(fixed) 아래 콘텐츠가 가려지는 페이지에 `pt-[54px]` 추가
- [x] event/centers
- [ ] 나머지 페이지 (작업 시 확인)

---

## 🟢 기능 작업

### SMS 인증 (대표님 의존)
- [ ] 프로필 휴대폰 번호 수정 시 SMS 인증 절차

### 모니터링
- [ ] Freshping + Sentry + Slack 배포 알림

### 환경변수 수령 (대표님)
- [ ] OPENAI_API_KEY
- [ ] LANGCHAIN_API_KEY

---

## 🔵 후순위
- Rate Limiting (API 요청 제한)
- 배포 롤백 전략 (migrate 실패 시 자동 복구)
- 무중단배포 개선 (Blue-Green 재설계)
- WebSocket (gunicorn → ASGI)
- doggy-school (fork → 분석 → Supabase 배포)
- AWS → Supabase 전면 이관
- Django Admin UI 교체
- 보안 검수
- 테스트 시스템

---

## ✅ 완료

### 2026-04-28 (코드 개선 + 인프라)
- [x] PetCard 540줄 → Compound Components 분해 (Props 변경 없음)
- [x] React.memo (AnimalCard, CenterCard 커스텀 비교)
- [x] useScrollVisibility Custom Hook 분리
- [x] TanStack Query 키 정규화 (JSON.stringify 제거)
- [x] BE 인증 DI 패턴 (get_authenticated_user 헬퍼)
- [x] BE 에러 응답 표준화 (str(e) 노출 제거)
- [x] JWT 만료 단축 (ACCESS 2시간, REFRESH 30일) + 자동 갱신
- [x] 동시 401 refresh 중복 방지 (refreshPromise 싱글턴)
- [x] auth:expired 자동 로그아웃
- [x] 이미지 로딩 9배 개선 (unoptimized: true)
- [x] 카카오 프로필 이미지 async 전환
- [x] 동기화 센터 N+1 캐싱
- [x] Nginx HTTP/2 + 보안 헤더 5종 + gzip
- [x] Docker 헬스체크 + 메모리 제한 + 로그 드라이버
- [x] Rolling 배포 (Blue-Green 실패 → 롤백)
- [x] FCM 리스너 분리 (page.tsx → FCMTokenListener)
- [x] Pydantic v2 model_config 전환
- [x] 느린 쿼리 로깅
- [x] Frontend Dockerfile non-root (nextjs user)
- [x] 배포 후 smoke test
- [x] prod 콘솔 전체 억제 (환영 메시지만)
- [x] 보호센터 상세 보호동물 무한스크롤
- [x] 검토 결과 반영 (메모리 상향, healthcheck, smoke test 강화)
- [x] dev+prod 배포 (PR #42~#60)

### 2026-04-27~28
- [x] 홈페이지 SEO h1 + 실시간 검색 + 통합검색
- [x] 동물/센터 Batch API + 이미지 경량화 + 마이그레이션
- [x] 검색 영역 hide/show + 버추얼 스크롤 + 필터 UI
- [x] CONN_MAX_AGE=0 + CenterCard 수정 + axios 로그
- 상세: history/2026-04-27-28.md

### 이전
`history/` 폴더에서 날짜별 상세 확인 가능
