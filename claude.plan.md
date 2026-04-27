# MPZ 작업 계획 & 진행 상태

## 🔴 진행 중

### 1. prod 배포 + 이미지 마이그레이션
- [x] dev 배포 완료 (PR #25~#31)
- [x] dev 이미지 마이그레이션 완료 (15,281개, 실패 0)
- [ ] prod PR 생성 (upstream dev → main)
- [ ] prod 이미지 마이그레이션 실행

### 2. Google Search Console
- [ ] DNS TXT 레코드 등록 → 도메인 소유권 확인 → sitemap 제출

---

## 🟡 코드 품질 개선 (검토 결과 기반)

### P0 — 즉시
- [ ] Home 페이지 SSR 전환 (FCP -40%, SEO 개선)
- [ ] PetCard 540줄 → Compound Components 분해
- [ ] 카카오 로그인 이미지 async 전환 (동기 블로킹 I/O)
- [ ] 동기화 센터 N+1 캐싱 (1000콜→수십콜)
- [ ] Docker 로그 드라이버 설정 (디스크 부족 방지)

### P1 — 이번 주
- [ ] React.memo 적용 (AnimalCard, CenterCard)
- [ ] useScrollVisibility Custom Hook 분리
- [ ] TanStack Query 키 정규화 (캐시 히트율 개선)
- [ ] BE 인증 로직 DI 패턴 추상화
- [ ] BE 에러 응답 표준화 (str(e) 노출 제거)
- [ ] JWT 토큰 만료 단축 (365일→1시간~1일)
- [ ] 배치 API 스키마 분리 (animal_ids→center_ids)
- [ ] Nginx gzip + HTTP/2 + 보안 헤더
- [ ] Docker 헬스체크 + 메모리 제한

### P2 — 다음 주
- [ ] Server Actions 검색 이관
- [ ] FCM 리스너 전용 컴포넌트 분리
- [ ] Pydantic v2 model_config 전환
- [ ] Rate Limiting 도입
- [ ] 느린 쿼리 로깅
- [ ] Frontend Dockerfile non-root
- [ ] 배포 롤백 전략 + smoke test

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
- WebSocket (gunicorn → ASGI)
- doggy-school (fork → 분석 → Supabase 배포)
- AWS → Supabase 전면 이관
- Django Admin UI 교체
- 보안 검수
- 테스트 시스템

---

## ✅ 완료

### 2026-04-27~28
- [x] 홈페이지 SEO h1 태그
- [x] 스크롤바 콘텐츠 영역 제한
- [x] 검색 영역 hide/show (sticky + opacity + 누적 delta)
- [x] 실시간 검색 + 통합검색 (search 파라미터)
- [x] 검색 결과 버추얼 스크롤
- [x] 동물/센터 찜 Batch API (N콜→1콜)
- [x] Batch API UUID 타입 수정
- [x] 보호센터 무한스크롤 수정
- [x] CenterCard 겹침/인증마크 수정
- [x] 필터 UI 개선 (초기화, 품종, SearchInput X버튼)
- [x] CONN_MAX_AGE=0 (dev+prod)
- [x] 이미지 경량화 (동기화 자동 + 카카오 프로필 + 마이그레이션)
- [x] fallback 이미지 border-radius 통일
- [x] axios 요청/응답 로그
- [x] numberWithComma 유틸
- [x] 코드 자체 검토 2차 (2026 트렌드 기준)
- [x] dev 배포 (PR #25~#31)

### 이전
`history/` 폴더에서 날짜별 상세 확인 가능
