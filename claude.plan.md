# MPZ 작업 계획 & 진행 상태

마펫쯔 + 강아지학교 통합·EC2 운영 체계 정착 후의 잔존/후순위 항목.
완료된 통합 작업 상세는 `history/2026-05-04-05.md` 참고.

---

## 🔴 운영자 셋업 (강아지학교 EC2 1차 배포 완료 위해)

doggy-school PR #55 머지됐으나 GitHub Secrets 미등록으로 첫 deploy 실패. 아래 셋업이 끝나야 `dev-school.mpz.kr` 정상 가동.
상세 절차는 `~/.claude/projects/-Users-jominsu-Documents-workspace/memory/runbook_school_ec2_first_deploy.md`.

- [ ] 가비아 DNS A 레코드 추가
  - `school.mpz.kr → 43.202.171.188`
  - `dev-school.mpz.kr → 52.79.128.129`
- [ ] Let's Encrypt 인증서 발급 (각 EC2에서)
  - `sudo certbot certonly --nginx -d school.mpz.kr`
  - `sudo certbot certonly --nginx -d dev-school.mpz.kr`
  - mpz_app PR #101 deploy가 정상 완료된 점 미루어 이미 발급됐을 가능성 — `sudo ls /etc/letsencrypt/live/`로 확인 우선
- [ ] mypetguardians/doggy-school 리포 GitHub Secrets 등록
  - `EC2_SSH_KEY` (mpz_app 동일 PEM)
  - `PROD_EC2_HOST=43.202.171.188` / `DEV_EC2_HOST=52.79.128.129`
  - `SUPABASE_ANON_KEY`, `KAKAO_JS_KEY`
  - `SCHOOL_FE_ENV_PROD_B64`, `SCHOOL_FE_ENV_DEV_B64` (server-only `.env` base64)
- [ ] doggy-school dev 브랜치에 빈 커밋 푸시로 재배포 트리거
- [ ] dev-school.mpz.kr HTTP 200 + 마펫쯔↔강아지학교 SSO 동작 검증

---

## 🟡 법적 처리 (대표님 의존)

PR #94/#97로 코드·UI 기본 골격은 완료. 운영 단계 결정 필요.

- [ ] 개인정보처리방침 v2 변호사 검토 — 마펫쯔 + 강아지학교 + Anthropic API(미국) + AWS(서울) + Supabase(미국) 처리 위탁 명시 정확성
- [ ] 이용약관 변호사 검토 — 단일 법인이지만 두 서비스 운영 표기 통일
- [ ] 통신판매업 신고 사업장으로 강아지학교 결제(PayApp 사용) 처리 가능 여부 확인 (단일 법인 가정상 추가 신고 불필요)

---

## 🟢 모니터링 (마펫쯔 + 강아지학교 공통)

- [ ] Sentry 통합 — 양 서비스 같은 프로젝트 또는 분리 결정 후 적용
- [ ] Freshping 업타임 (`mpz.kr`, `api.mpz.kr`, `dev.mpz.kr`, `dev-api.mpz.kr`, `school.mpz.kr`, `dev-school.mpz.kr`)
- [ ] Slack 알림 (배포 성공/실패, Sentry 에러 thresh, Freshping down)
- [ ] 통합 대시보드 (Grafana 또는 CloudWatch)

---

## 🟢 시스템 구축 (장기)

### TDD 인프라
- [ ] BE: pytest + Django TestCase (unit/integration/fixture) — 현재 일부 unit만 있음
- [ ] CI: PR 필수 통과 게이트
- [ ] FE: 강아지학교는 vitest + RTL 도입 완료. 마펫쯔 frontend는 미구축 상태

### Rate Limiting
- [ ] Redis throttling (로그인 5/min, API 60/min, SMS 5/min, AI 리포트 분리)
- [ ] 강아지학교 AI 리포트 엔드포인트는 Redis 미사용 — Vercel 시절 가정. EC2 통합 후 마펫쯔 Redis 공유 가능 여부 검토

### 보안 검수
- [ ] OWASP Top 10 점검
- [ ] 의존성 취약점 스캔 자동화 (Dependabot 또는 Snyk)
- [ ] 환경변수 노출 점검 (NEXT_PUBLIC_ 접두사 오용 여부 등)

### 배포 개선
- [ ] 무중단배포 재설계 (Blue-Green/Canary) — 현재는 force-recreate 약 5초 다운타임
- [ ] 배포 롤백 자동화 (smoke test 실패 시 이전 이미지로 자동 retag)

---

## 🔵 후순위

- WebSocket (ASGI) — 채팅/실시간 필요 시
- Django Admin UI 교체
- 데이터 분석/시각화

---

## 대표님 의존

- [ ] 환경변수 — `OPENAI_API_KEY`, `LANGCHAIN_API_KEY` (필요 시)
- [ ] 약관/처리방침 변호사 검토 의뢰

---

완료 항목은 `history/` 폴더에서 날짜별 상세 확인 가능.
가장 최근: `history/2026-05-04-05.md` — 마펫쯔↔강아지학교 통합 + EC2 전환 (PR #89-#101).
