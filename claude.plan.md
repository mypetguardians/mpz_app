# MPZ 작업 계획 & 진행 상태

## 🔴 다음 작업

### 약관 + 개인정보 처리방침 + 탈퇴 프로세스
- [ ] 이용약관 페이지 (`/terms`)
- [ ] 개인정보 처리방침 페이지 (`/privacy`)
- [ ] 회원가입 시 약관 동의 UI
- [ ] 회원 탈퇴 프로세스 구현 (아래 설계 기준)

#### 탈퇴 시 데이터 처리 설계 (현행법 기준)

**즉시 삭제/비식별화 (개인정보보호법 제21조)**
- 이름, 이메일, 전화번호, 프로필 사진, 주소 → 비식별화 (이름→"탈퇴회원", 이메일→해시)
- 카카오 연동 해제 (unlink API)
- Supabase Storage 개인 파일 삭제 (프로필, 포트폴리오 사진)
- 마펫쯔: `user_user.is_active=false`, `deleted_at` 기록
- 강아지학교: Supabase Auth 삭제 + `users` 비활성화
- 커뮤니티 게시글/댓글: 작성자명 "탈퇴회원"으로 교체, 콘텐츠는 유지 or 비활성화

**5년 보관 의무 (전자상거래법 제6조)**
- 계약/거래 기록: 주문(`orders`), 결제, 입양 신청(`adoptions`)
- 대금결제/재화공급 기록
- `data_retention_until = deleted_at + 5년` 설정
- 5년 후 배치 잡으로 완전 삭제

**3년 보관 의무 (전자상거래법)**
- 소비자 불만/분쟁 처리 기록

**탈퇴 프로세스 순서**
1. 사용자 확인 (비밀번호/재인증)
2. 진행 중 입양/주문 있으면 탈퇴 차단 (완료/취소 후 가능)
3. 개인정보 비식별화 (이름, 이메일, 전화번호, 사진)
4. 마펫쯔 유저 비활성화 (`is_active=false`, `deleted_at`)
5. 강아지학교 동기화 삭제
6. 카카오 연동 해제
7. JWT 쿠키 삭제 + 로그아웃

**User 테이블 추가 필드**
- `is_active` (boolean, default true)
- `deleted_at` (datetime, nullable)
- `data_retention_until` (datetime, nullable)

---

## 🟡 강아지학교 서비스 런칭

### 확정 사항
- **유저 마스터**: 마펫쯔 Django
- **Supabase 프로젝트**: 마펫쯔와 공유 (테이블 prefix `ds_`로 구분)
- **회원가입 동기화**: 실시간 (한쪽 가입 → 다른 쪽 즉시 동기화)
- **탈퇴**: 양쪽 동시 처리 (약관 완료 후)
- **강아지학교 BE**: Supabase 서버리스 유지 (Django로 합치지 않음)
- **데이터 연동**: 강아지학교 → 마펫쯔 API 호출 (게이트웨이 방식 아님, 직접 호출)

### 인증 통합 설계
- [ ] 마펫쯔 카카오 로그인 → 마펫쯔 JWT 발급 + 강아지학교 Supabase users 동기화
- [ ] 강아지학교 카카오 로그인 → Supabase Auth + 마펫쯔 API `/kakao/native/login` 동기화
- [ ] 쿠키 도메인 `.mpz.kr`로 통일 (마펫쯔 + 강아지학교 도메인 공유)
- [ ] 탈퇴 시 양쪽 동시 처리

### 서비스 배포
- [ ] Supabase 테이블 마이그레이션 (ds_ prefix, 마펫쯔 Supabase 프로젝트에 추가)
- [ ] Vercel 배포 (school.mpz.kr)
- [ ] Route 53 CNAME 레코드 추가 (school.mpz.kr → Vercel)
- [ ] 카카오 디벨로퍼 Redirect URI 추가 (school.mpz.kr)

### DB 스키마 (23개 테이블 → ds_ prefix로 마이그레이션)
- 인증: `ds_users` (auth.users FK)
- 커머스: `ds_categories`, `ds_products`, `ds_orders`, `ds_order_items`
- 강의: `ds_classes`, `ds_lessons`, `ds_subscriptions`, `ds_comments`
- 콘텐츠: `ds_contents`
- 포트폴리오: `ds_portfolios`, `ds_adoption_profiles`, `ds_adoption_photos`, `ds_pets`, `ds_pet_photos`
- 커뮤니티: `ds_community_posts`, `ds_community_comments`, `ds_community_categories`
- AI/Lab: `ds_pet_care_reports`, `ds_lab_feedback`
- 신청: `ds_crew_applications`, `ds_shelter_applications`, `ds_care_program_applications`

### Redis 스코프
- db0: 마펫쯔 (동기화 잠금, SMS 인증번호)
- db1: 강아지학교 (세션, 캐시)
- Rate Limiting은 공용

---

## 🟢 시스템 구축 (마펫쯔 + 강아지학교 공통)

### TDD 구축
- [ ] BE: pytest + Django TestCase (unit/integration/fixture)
- [ ] FE: Vitest + React Testing Library (component/hook/e2e)
- [ ] CI: GitHub Actions test 단계 + PR 필수 통과

### 모니터링
- [ ] Freshping (업타임) + Sentry (에러) + Slack (배포 알림)
- [ ] 마펫쯔 + 강아지학교 통합 대시보드

### 보안 검수
- [ ] OWASP Top 10 + 의존성 스캔 + 환경변수 점검

### Rate Limiting
- [ ] Redis throttling (로그인 5/min, API 60/min, SMS 5/min)

### 배포 개선
- [ ] 무중단배포 재설계 (Blue-Green/Canary)
- [ ] 배포 롤백 자동화

---

## 🔵 후순위

- WebSocket (ASGI) — 채팅/실시간 필요 시
- Django Admin UI 교체
- 데이터 분석/시각화

---

## 대표님 의존

- [ ] 환경변수 — OPENAI_API_KEY, LANGCHAIN_API_KEY
- [ ] 약관 초안 검토/승인

---

완료 항목은 `history/` 폴더에서 날짜별 상세 확인 가능
