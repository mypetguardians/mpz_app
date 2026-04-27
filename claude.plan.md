# MPZ 작업 계획 & 진행 상태

## 🔴 진행 중

### 1. 이미지 경량화 마이그레이션
- [x] 동기화 시 자동 경량화 (`_optimize_image`, 1080px JPEG 85%)
- [x] `migrate_images` 커맨드 구현 (병렬 20개, 실패 로그 JSON)
- [ ] dev 마이그레이션 실행 중 (15,281개)
- [ ] prod 마이그레이션 실행

### 2. 검색 콘솔 색인
- [x] Naver 서치어드바이저 → sitemap 제출 완료
- [ ] Google Search Console → DNS TXT 레코드 등록 + sitemap 제출

---

## 🟡 다음 작업

### SMS 인증
- [ ] 프로필 휴대폰 번호 수정 시 SMS 인증 절차 추가

### 모니터링
- [ ] Freshping + Sentry + Slack 배포 알림

---

## 🟢 환경변수 수령 (대표님)
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
- 데이터 분석/시각화

---

## ✅ 완료

### 2026-04-27~28
- [x] 홈페이지 SEO h1 태그 추가
- [x] 스크롤바 콘텐츠 영역 제한
- [x] 검색 영역 hide/show (스크롤 컨테이너 밖 분리)
- [x] 실시간 검색 + 통합검색 (search 파라미터)
- [x] 검색 결과 버추얼 스크롤
- [x] 동물 찜 Batch API + 검색 결과 batch 적용
- [x] 센터 찜 Batch API
- [x] 보호센터 무한스크롤 수정 (useVirtualizer)
- [x] CenterCard 겹침/인증마크 수정
- [x] 필터 UI 개선 (초기화, 품종 아이콘, SearchInput X버튼)
- [x] CONN_MAX_AGE=0 (dev+prod)
- [x] axios 요청/응답 로그
- [x] 카카오 프로필 이미지 경량화 (512px Supabase 업로드)
- [x] numberWithComma 유틸 함수
- [x] 코드 자체 검토 (FE/BE/인프라)
- [x] dev 배포 (PR #25~#31)

### 이전
`history/` 폴더에서 날짜별 상세 확인 가능
