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

### 확정 사항 (2026-05-04 코드 검증 + 사용자 결정 반영)
- **운영 주체**: 마펫쯔 단일 법인 (별도 사업자 분리 안 함) → 개인정보 제3자 제공 동의 불필요, 처리방침/약관 통합
- **유저 마스터**: 마펫쯔 Django (`backend/user/User`, PK = UUID via `common.BaseModel`, 마이그레이션 `user/migrations/0001_initial.py:94` 확인)
- **Supabase 프로젝트**: 이미 공유 중 (`djnjbimklqvzqgcrkrdf` — 마펫쯔 `DATABASE_URL`과 강아지학교 `NEXT_PUBLIC_SUPABASE_URL`이 동일 ref)
- **테이블 prefix**: `ds_` 폐기 — 마펫쯔는 `db_table` 명시(user, comments, posts 등), 강아지학교는 `public.products` 등 충돌 없는 이름 위주. **충돌 항목만 개별 리네임**
- **강아지학교 BE**: Supabase 서버리스 유지 (Django로 합치지 않음)
- **데이터 연동**: 강아지학교 → 마펫쯔 API 호출 (직접 호출)
- **인증**: 마펫쯔 JWT 단일 — Supabase Auth 폐기, JWT를 Authorization Bearer로 PostgREST에 전달
- **강아지학교 전용 프로필**: `user_school_profile` 1:1 테이블로 분리 (마펫쯔 user 테이블은 그대로 유지, 관심사 분리)
- **클라이언트 범위**: 강아지학교는 웹 전용 (모바일 앱 WebView 연동 없음) — `.mpz.kr` 쿠키 정책만 신경 쓰면 됨
- **Redis**: 강아지학교는 미사용 (Vercel → EC2 Redis 접근 불가). 마펫쯔 Redis 현행 유지

### 🔴 보안 갭 — JWT가 stateful이라 별도 처리 필요
`api/security.py:41`: 마펫쯔는 JWT signature·exp 검증 후 **DB의 `Jwt` 테이블 매칭까지** 확인 → logout 즉시 무효화. 그러나 강아지학교는 PostgREST로 직접 쿼리 → Supabase는 stateless 검증 → **마펫쯔에서 logout한 사용자가 강아지학교에서는 토큰 만료(2시간)까지 인증 유지됨**. 다음 중 하나로 해결:
- **(권장) 옵션 A**: JWT 만료시간을 **15분**으로 단축, refresh 토큰만 30일 유지. logout 갭을 짧게.
- 옵션 B: 마펫쯔에 `/v1/auth/verify` 엔드포인트 추가, 강아지학교 미들웨어가 매 요청 검증 (latency 추가)
- 옵션 C: 강아지학교 모든 DB 호출을 마펫쯔 API 경유로 (Supabase 직접 쿼리 포기, 가장 큰 리팩터)

### 🔴 Critical 통합 작업 (반드시 이 순서로)

**Phase 1: 마펫쯔 BE (다른 작업 전 선행)**
- [ ] JWT signing key 분리 — `settings.SECRET_KEY` 직접 사용 중지, `JWT_SIGNING_KEY = config("SUPABASE_JWT_SECRET")` 추가, `user/utils.py`의 3개 `jwt.encode/decode` 호출 + `api/security.py:34` 갱신 (Django SECRET_KEY는 세션·CSRF·해시에 그대로 유지)
- [ ] JWT payload에 `sub`, `role`, `aud` 추가 — `user_id`는 호환을 위해 유지. UUID는 이미 string 변환됨 (`utils.get_access_token`)
- [ ] **JWT 만료시간 단축**: `ACCESS_TOKEN_EXPIRATION_TIME = 15` (현재 120분 = 2시간)으로 변경, refresh 30일 유지
- [ ] `cfehome/settings.py:133` `SESSION_COOKIE_DOMAIN = '.mpz.kr'` (현재 `None`, 주석은 잘못됨)
- [ ] `CORS_ALLOWED_ORIGINS` env에 `https://school.mpz.kr`, `https://dev-school.mpz.kr` 추가
- [ ] `user/kakao_api.py:258` `allowed_origins` 리스트에 강아지학교 도메인 추가
- [ ] **새 `user_school_profile` 모델 생성** (강아지학교 전용 1:1 프로필) — Django 마이그레이션으로 추가:
  ```python
  class UserSchoolProfile(BaseModel):
      user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='school_profile')
      role = models.CharField(max_length=20, default='user')  # 'user' | 'admin'
      avatar_url = models.CharField(max_length=500, blank=True, null=True)
      class Meta:
          db_table = 'user_school_profile'
  ```
- [ ] 카카오 콜백 (`backend/user/kakao_api.py`)에서 강아지학교 전용 후처리: `UserSchoolProfile.objects.get_or_create(user=user, defaults={'role': 'user'})` 추가
- [ ] 회원 탈퇴 (`backend/user/api.py:delete_account`)에서 `user_school_profile`은 OneToOneField CASCADE로 자동 삭제됨 — 별도 처리 불필요

**Phase 2: Supabase DB**
- [ ] **사전 확인 필요**: dev Supabase에 강아지학교 테이블이 이미 적용됐는지 SQL Editor에서 확인 (`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;`). 정황상 미적용 추정.
- [ ] 강아지학교 마이그레이션 자체를 새로 작성 (단일 PR로 통합) — 기존 23개 파일은 dev에 적용 전이라면 통합 후 한번에 push 권장
- [ ] **모든 `auth.users` FK 12곳을 `public."user"`로 변경**
  - `001_initial:8, 69, 149, 165` / `005:9, 28, 72, 113, 137` / `008:9, 29` / `010:59`
- [ ] **comments 테이블 충돌 해결** (필수): 강아지학교 `public.comments`를 `public.lesson_comments`로 리네임. 마펫쯔 `comments` 앱이 이미 점유 (`backend/comments/models.py:14 db_table='comments'`)
- [ ] `categories` → `product_categories`로 리네임 (미래 충돌 예방)
- [ ] `auth.users INSERT → public.users` 트리거(`on_auth_user_created`) 제거 — 마펫쯔 user 사용
- [ ] `upsert_user_profile` RPC 제거 (callback 사라지면 호출처 없음)
- [ ] RLS의 `is_admin()` 함수 재작성: `EXISTS (SELECT 1 FROM public.user_school_profile WHERE user_id = auth.uid() AND role = 'admin')`
- [ ] **`006_portfolio_community_rls.sql`의 인라인 admin 체크 14곳도 `user_school_profile` JOIN으로 변경**
- [ ] storage RLS `003_storage.sql`의 `is_admin()` 16곳 정리 (admin 정책은 `WITH CHECK (false)` + service_role만 통과 또는 위 새 함수로 변경)

**Phase 3: 강아지학교 코드**
- [ ] `lib/supabase/client.ts`, `server.ts`, `middleware.ts` — Supabase Auth 세션 storage 대신 우리 `access` 쿠키를 Authorization 헤더로 전달
- [ ] `app/(auth)/login/page.tsx` — `supabase.auth.signInWithOAuth` 제거, `${MPZ_API}/v1/kakao/login?frontend=https://school.mpz.kr` 리다이렉트로 교체
- [ ] `app/auth/callback/` 디렉토리 삭제 (마펫쯔 BE가 콜백 처리)
- [ ] `app/(auth)/logout/route.ts` — `supabase.auth.signOut()` 제거, `.mpz.kr` 도메인 쿠키 삭제 + 마펫쯔 `/v1/auth/logout` keep-alive 호출(실패 무시)
- [ ] `src/middleware.ts` — JWT 만료 감지 시 `/v1/auth/refresh-token` 호출 + Set-Cookie 헤더 forwarding 로직 추가 (Edge Runtime: `jose` 사용, `jsonwebtoken` 금지)
- [ ] **`supabase.auth.getUser()` 46곳 처리 전략 결정 후 일괄 마이그레이션** — 옵션 A(JWT 직접 검증 헬퍼) 권장. `mypage/portfolio/actions.ts` 한 파일에만 16번 호출

**Phase 4: 배포**
- [ ] Vercel: `school.mpz.kr` (production) + `dev-school.mpz.kr` (preview alias)
  - 주의: Vercel 자동 preview URL(`*.vercel.app`)은 `.mpz.kr` 쿠키 못 읽음 → 인증 테스트 불가
- [ ] Route 53 CNAME (`school.mpz.kr` → Vercel)
- [ ] 카카오 디벨로퍼 Redirect URI 검증 (마펫쯔 BE 콜백만 등록되어 있으면 됨)
- [ ] Vercel 환경변수: `NEXT_PUBLIC_MPZ_API_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` 등

**Phase 5: 모니터링** (마펫쯔 + 강아지학교 공통)
- [ ] Sentry 통합 (양쪽 같은 프로젝트 또는 별도)
- [ ] Freshping 업타임 (`mpz.kr`, `api.mpz.kr`, `school.mpz.kr`)
- [ ] Slack 알림 (배포/에러)

### 🟢 탈퇴 동기화 (양쪽 동시 처리)
- [ ] 마펫쯔 `delete_account` 시 강아지학교 사이드 데이터 정리 (orders/portfolios CASCADE 활용)
- [ ] **`orders` 테이블은 5년 보관 의무 (전자상거래법 제6조)** — `ON DELETE RESTRICT` 유지, soft delete 패턴 (`is_active=false`, `deleted_at`) + 5년 후 배치 잡 삭제
- [ ] 강아지학교 사이드 탈퇴 UI는 마펫쯔 마이페이지로 위임

### 🟢 법적 처리 (마펫쯔 단일 법인 전제)
- [ ] **개인정보처리방침 v2** — 마펫쯔 + 강아지학교 + Anthropic API(미국, AI 리포트) + Vercel(미국, 호스팅) 모두 명시. 변호사 검토.
- [ ] **수집 동의 갱신** — 카카오 가입 시 "마펫쯔 + 강아지학교 동시 가입" 단일 동의 (같은 법인이라 별도 제3자 제공 동의 불필요)
- [ ] **약관 통합 또는 양쪽 명시** — `claude.plan.md` 최상단 약관 작업과 통합
- [ ] **운영주체 표시** — 두 서비스 모두 푸터에 동일 사업자 정보. 강아지학교를 "마펫쯔 강아지학교" 또는 "강아지학교 by 마펫쯔" 표기로 통일
- [ ] **통신판매업 신고** — 마펫쯔 신고 사업장으로 강아지학교 결제도 처리 (단일 법인이라 추가 신고 불필요)

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
