# MPZ 작업 계획 & 진행 상태

## 🔴 다음 세션

### 1. deploy.yml 재설계
- 현재 상태: 코드 수정 완료, 커밋 대기
- `up -d --build --force-recreate` 한 줄로 통합
- CACHE_BUST를 .env에서 docker-compose로 전달
- nginx 별도 restart 제거 (resolver 자동 해결)
- 참고: backend 대기 로직(`sleep 5`)이 충분한지 검증 필요

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

### 7. 모니터링
- [ ] Freshping + Sentry + Slack 배포 알림
- [ ] **필수**: GitHub Actions 배포 성공/실패 Slack 알림 (에러 로그 포함) — 수동 체크 제거

### 8. Django Admin UI
- [ ] 모던 라이브러리 조사 (unfold/jazzmin/grappelli)
- [ ] 블로그, 공식문서, 리뷰 기반 선정 후 적용

---

## 🟢 환경변수 수령 (대표님/이전 개발사)
- [ ] FIREBASE_ADMIN_CREDENTIALS_JSON
- [ ] OPENAI_API_KEY
- [ ] LANGCHAIN_API_KEY

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

## 🔄 미커밋 변경사항
- HomeHeader 로고 img 태그 변경 (next/image → img)
- 홈 내 주변 기본 선택 + GPS 지역 판별 수정
- 주목받고 있는 아이들 region 필터 제거
- 책임비 필수 표시(*) 제거
- SocketProvider 재시도 원복
- deploy.yml 재설계 + docker-compose CACHE_BUST 추가

---

## 📝 결정 사항 로그

### 2026-04-22
- Cloudflare R2 → Supabase Storage 이관 결정 (R2 계정이 이전 개발사 소유, .bin Content-Type 문제)
- 동기화 Worker 컨테이너 분리 (배포 시 동기화 중단 방지)
- 동기화 전략 3종: incremental(매일), status_sync(매주), full(매월)

### 2026-04-23
- proxy-image 제거 (R2 이미지 0건, Supabase URL 직접 서빙)
- 이미지 업로드 시 자동 리사이징 (profiles 512px, 일반 1080px) + EXIF 보정
- Railway 레거시 코드/설정 전면 제거
- deploy.yml 복잡도 → 재설계 결정 (한 줄 통합 방향)
- GPS 지역 판별: 경기 우선 검사 버그 → 거리 순 비교로 수정
- 전문가 의견(상세 노출)과 센터 등록(DetailInfo)은 별개 — 구분 필수

### 2026-04-24
- AWS → Supabase 전면 이관 결정 (EC2 비용 절감 + 인프라 단순화)
- doggy-school 프로젝트 통합 예정 (기존 mpz DB 확장 사용)
- main 배포는 반드시 사용자 허락 후에만 진행
- 데이터 분석/시각화 도구 도입 결정 (GA 또는 자체 대시보드)

---

## ✅ 완료 (2026-04-22~24)
- [x] Supabase Storage 이관 + dev/prod 동기화 완료
- [x] Worker 컨테이너 분리 + 스케줄러 정상 동작
- [x] proxy-image 제거, R2 env 정리
- [x] 카카오 로그인 후 직전 페이지 복귀
- [x] breed+name 표시 (getDisplayBreedName 유틸)
- [x] 전문가 의견 섹션 주석 처리 (상세 + 필터)
- [x] 배너 반응형 (aspect-ratio), 커뮤니티/상담 비활성화
- [x] 입양/찜 탭 sticky 처리
- [x] 뒤로가기 router.back() 통일
- [x] 이미지 업로드 리사이징 + EXIF 보정
- [x] nginx/Django 업로드 제한 10MB
- [x] Django Admin 500 에러 수정 (FieldListFilter)
- [x] 동의서 upsert, 센터 책임비 필수값 제외
- [x] GPS 서울/경기 판별 수정, 내 주변 하이라이팅 분리
- [x] CLAUDE.md 3분할 경량화 (루트/backend/frontend)
- [x] HomeHeader 로고 표시 수정
- [x] 카카오 프로필 이미지 *.kakaocdn.net 와일드카드
- [x] nginx DNS resolver 추가 (502 방지)
- [x] dev 센터 계정 생성 (whalstn9 / 누텔라네강아지들)
- [x] prod admin 계정 재생성 (mpzadmin)
