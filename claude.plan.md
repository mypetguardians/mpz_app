# MPZ 작업 계획 & 진행 상태

## 🔴 진행 중

### 1. 이미지 경량화 + 마이그레이션
- [x] 동기화 시 자동 경량화 (`_optimize_image`, 1080px JPEG 85%)
- [x] `migrate_images` 커맨드 구현
- [ ] 배포 + 기존 공공API URL 이미지 788개 마이그레이션 실행
- [ ] 기존 Supabase 이미지도 경량화 (14,600개) — 로드 시간 개선

### 2. 검색 콘솔 sitemap 제출 + 색인 요청
- [x] Naver 서치어드바이저 → sitemap 제출 완료
- [x] Google Search Console → 도메인 소유권 확인 필요 (DNS TXT 레코드)
- [ ] Google → sitemap 제출 + 주요 페이지 색인 요청
- 색인 소요: 수일~수주 대기

---

## 🟡 다음 작업

### SMS 인증
- [ ] 프로필 휴대폰 번호 수정 시 SMS 인증 절차 추가

### 모니터링
- [ ] Freshping + Sentry + Slack 배포 알림

---

## 🟢 환경변수 수령 (대표님)

- [x] FIREBASE_ADMIN_CREDENTIALS_JSON — 새 프로젝트 직접 생성 완료
- [ ] OPENAI_API_KEY
- [ ] LANGCHAIN_API_KEY

---

## 🔄 상시

### SEO
- [x] 홈페이지 `<h1>` 태그 추가 완료
- [ ] 색인 상태 주기적 확인 (`site:mpz.kr` Google/Naver)

---

## 🔵 후순위

- WebSocket (gunicorn → ASGI, 채팅/실시간용)
- doggy-school (fork → 분석 → Supabase 배포)
- AWS → Supabase 전면 이관
- Django Admin UI 교체
- 보안 검수 (release-key.jks)
- 테스트 시스템
- 데이터 분석/시각화

---

## ✅ 완료

### 2026-04-27~28
- [x] 홈페이지 SEO h1 태그 추가
- [x] 스크롤바 콘텐츠 영역 제한
- [x] 입양 목록 검색 영역 hide/show + 실시간 검색 + 통합검색
- [x] 보호센터 탭 무한스크롤 수정 (useVirtualizer 전환)
- [x] 찜 상태 Batch API (개별 N콜 → 1콜)
- [x] Batch API UUID 타입 불일치 수정
- [x] 필터 UI 개선 (초기화, 품종 아이콘, SearchInput X버튼)
- [x] CenterCard 겹침/인증마크 수정
- [x] CONN_MAX_AGE=0 (dev+prod, DB 연결 풀 안정화)
- [x] axios 요청/응답 로그 추가
- [x] numberWithComma 유틸 함수
- [x] 코드 자체 검토 (FE/BE/인프라)
- [x] dev 배포 (PR #25~#29)

### 2026-04-27
- [x] 목록 버추얼 스크롤 + 이미지 최적화 (PR #23, #24)
- [x] SEO og:title 이중 적용 수정
- [x] SEO 색인 현황 점검

### 이전
`history/` 폴더에서 날짜별 상세 확인 가능
