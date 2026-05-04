# MPZ 작업 계획 & 진행 상태

마펫쯔 + 강아지학교 통합·EC2 운영 체계 정착 후의 잔존/후순위 항목.
완료된 통합 작업 상세는 `history/2026-05-04-05.md` 참고.

---

## 🔴 prod 공공데이터 재수집 (dev fix 검증 후)

dev에서 PR #93/#95/#99/#102로 worker 정상화 + status_sync/full state=None fix 적용 후, prod도 동일 손상 가능성 있음. main 머지 → prod 자동 배포로 worker 갱신 후 운영 작업.

- [ ] dev에서 manual full sync 한 번 더 실행 (`docker exec mpz_app-worker-1 python manage.py sync_public_data --strategy full --days 220`) — full state=None fix 반영해 종료 동물(반환/입양/자연사/안락사/기증) 정확한 분포 회복
- [ ] dev 결과 검증 (보호중 외 카테고리 동물 노출 확인) — 사용자 직접 검증 필요
- [ ] dev → main PR 생성 + 머지 → prod 자동 배포 (worker 새 코드 반영)
- [ ] prod 손상 데이터 식별 + 백업 dump
  - 4/22, 4/30 prod full + 5/3 prod status_sync 시점에 잘못 transition된 동물 — `protection_status='보호종료' AND adoption_status='기타' AND is_public_data=True` 식별 후 updated_at 분포 점검
- [ ] prod wipe + full --days 220 재수집 (dev와 동일 패턴)
- [ ] prod 검증 (월별 admission_date 분포, 보호중/종료 분포)

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

## 🟡 Breed 마스터 정규화 (품종 표기 통일)

공공 API의 `kindNm`이 통일되지 않음 — "포메라니언"(우리 마스터) vs "포메라니안"(공공), "슈나우저" vs "슈나우져", "래브라도" vs "라브라도" 등. 검색 시 매칭 누락. 영향 범위: 마펫쯔 BE/FE, 강아지학교(`breed`/`pet_breed`/`preferred_breed` 필드), 백오피스, 센터 직접등록 폼.

- [ ] **Stage 1** — `BreedAlias` 매핑 테이블 (즉시 가능, ~2일)
  - `BreedAlias(alias unique, canonical)` 모델 + 마이그
  - worker `_create_animal` 시 `kind_nm` → canonical 정규화 후 저장 + 미매칭 alias warning 로그
  - 백오피스에 Alias 관리 UI (운영자가 발견 시 추가)
- [ ] **Stage 2** — `Breed` 마스터 + FK (사용자 제안 정식안, 1-3개월)
  - `Breed(code unique, canonical_name, aliases JSONField, size_category, is_mix, public_kind_cd)` 모델
  - `Animal.breed = FK(Breed)` + `raw_breed CharField` (원본 보존)
  - 센터 직접등록 폼: CenterBreedList 폐기 → 마스터에서 동적 fetch (자유 입력 금지, 선택만)
  - 강아지학교 supabase 스키마도 동일 마스터 참조 (강아지학교 통합 안정화 후)
  - 백오피스: 미매칭 raw_breed 큐 + 매핑/신규 마스터 추가 UI

---

## 🟡 기타 worker 후속 fix

PR #93/#95/#99/#102로 큰 그림은 마무리. 작은 fix들 잔존:

- [ ] `_parse_weight` 사이니제크 — 999kg 초과 값은 None 반환 + warning 로그 (현재 numeric overflow로 errors=1 발생). 작은 fix.
- [ ] `status_sync` 정식 fix는 PR #99로 적용됐으나 `notice_edt(공고종료일)` 활용 보조 룰 추후 검토 — 시간 지나면서 장기 보호중 동물이 누적될 위험. 현재는 incremental + status_sync(state=None)로 충분하나 공공 API가 응답에서 빼버리는 옛 동물은 영원히 보호중 잔존 가능. 별도 archive 룰 검토.
- [ ] `_expire_missing_animals` 함수 자체는 services.py에 보존 (PR #99에서 자동 호출만 폐기). 향후 명시 호출용 management command가 필요해지면 PR #95의 SAFETY_RATIO 안전장치와 함께 활용 가능.

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
