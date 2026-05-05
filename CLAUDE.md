# MPZ(마펫쯔) — 유기동물 입양 & 보호센터 관리 플랫폼

AWS EC2 + Supabase(DB + Storage) 인프라. 상세는 각 폴더별 CLAUDE.md 참고.

## 인프라

| 구분 | 도메인 | EC2 IP | Supabase |
|------|--------|--------|----------|
| dev | dev.mpz.kr / dev-api.mpz.kr / dev-school.mpz.kr | 52.79.128.129 (t2.medium) | djnjbimklqvzqgcrkrdf |
| prod | mpz.kr / api.mpz.kr / school.mpz.kr | 43.202.171.188 (t3.medium) | uytovxdqmlmhdzzpmwzk |

DNS: 가비아 (A 레코드를 EC2 IP로 매핑). Route 53 사용 안 함.

SSH: `ssh -i ~/.ssh/mpz-key.pem ubuntu@{IP}`

## Git

```
origin   → git@github.com:WaterMinCho/mpz_app.git (fork)
upstream → git@github.com:mypetguardians/mpz_app.git (조직, 배포 중심)
```

fork Actions는 비활성화됨. 조직 repo에서만 Actions 실행.

### 배포 흐름
```
fork dev → PR → upstream dev 머지 → dev 자동 배포
upstream dev → PR → upstream main 머지 → prod 자동 배포
```

### PR 명령어
- dev 배포: `gh pr create --repo mypetguardians/mpz_app --base dev --head WaterMinCho:dev`
- prod 배포: `gh pr create --repo mypetguardians/mpz_app --base main --head dev` (upstream 내부 PR)

### 주의
- fork에 직접 push해도 배포 안 됨 (Actions 비활성)
- Worker도 배포 시 `--force-recreate`로 재시작 (코드 반영 필수). 동기화 시간(03:00 KST)과 배포 시간 비중첩 전제

## Docker 컨테이너

backend(gunicorn), frontend(Next.js), **school-frontend**(강아지학교 Next.js standalone, 외부 GHCR 이미지), nginx, redis, **worker**(동기화 스케줄러)

`school-frontend` 이미지는 별도 레포(`mypetguardians/doggy-school`)의 GHA가 빌드/푸시한다. mpz_app 측 deploy.yml은 `school-frontend` 서비스를 빌드하지 않으며, 강아지학교 deploy 워크플로우가 EC2에서 `docker pull → retag → up --no-build --force-recreate school-frontend` 단계를 자체 수행한다. 환경변수는 `~/mpz_app/school/.env.${APP_ENV}` 파일로 마운트.

## Figma

- MCP 서버: `figma-dev` (figma-developer-mcp, PAT 기반, 프로젝트 로컬 스코프)
- 디자인 파일: https://www.figma.com/design/30IyUJvsyizlnUQ5urTx24/MPZ-기획?m=dev
- 파일 키: `30IyUJvsyizlnUQ5urTx24`
- UI 개발 시 Figma MCP 도구(`get_file`, `get_node`, `get_images`)로 디자인 참고

## 로컬 개발

### 최초 세팅
```bash
make setup          # venv 생성 + 의존성 설치
# 팀원에게 backend/.env.dev 파일 받기
make dev            # FE:3001 + BE:8000 동시 실행
```

### `make dev` 동작
- `backend/.env.dev` → `backend/.env` 복사 + 카카오 redirect_uri를 localhost로 자동 교체
- `frontend/.env.development.local` 생성 (API를 localhost:8000으로)
- 종료 시(Ctrl+C) 임시 파일 자동 정리
- 카카오 로그인, 센터 로그인, SMS 인증 모두 로컬에서 테스트 가능

### `make dev-fe`
- FE만 실행 (BE = dev-api.mpz.kr). 로그인 불가 (cross-domain 쿠키 제한)

## 주의사항

1. .env 파일은 gitignore — EC2에 직접 관리
2. NEXT_PUBLIC_* 환경변수는 Docker 빌드 시 커맨드라인 전달 필수

## 공통 개발 규칙

1. **직접 push로 배포 금지** — 반드시 PR 머지를 통해서만 배포
2. **sleep/시간 기반 대기 금지** — 상태 확인 기반(`until`, polling)으로 동기적 처리
3. **Co-Authored-By 금지** — 커밋 메시지에 Claude Co-Authored-By 줄 넣지 않음
4. **계정/키값/시크릿 코드에 기록 금지** — git에 올라가는 파일에 비밀번호, API 키, 시크릿 절대 기록하지 않음
5. **코드 제거 대신 주석 처리** — 임시 비활성화 코드는 삭제하지 말고 주석 처리. 관련 import/변수도 같이 정리 (ESLint 빌드 에러 방지)
6. **유의사항 발생 시 이 파일에 기록** — 사용자가 주의/자제/유의를 주면 여기에 추가
7. **배포 후 수동 체크 금지** — 모니터링 구축 시 배포 알림 자동화
8. **plan 완료 → 즉시 history로 이동** — claude.plan.md에 완료 항목 남기지 않음. history/에 문제 원인·수정·교훈까지 상세 기록 후 plan에서 제거
9. **환경변수 변경 시 여러 곳 동기화** — Dockerfile, CI/CD, docker-compose 등 관련된 모든 곳에 반영
10. **Docker env_file 갱신 시 down+up 필수** — `docker compose restart`로는 env_file 변경 미반영
11. **마펫쯔 + 강아지학교 멀티 서비스 체계** — 두 서비스가 **같은 Supabase 프로젝트(dev: `djnjbimklqvzqgcrkrdf`, prod: `uytovxdqmlmhdzzpmwzk`)** 를 공유하고 마펫쯔 JWT를 단일 인증 체계로 사용. 신규 기능/인프라 작업 시 양쪽 서비스 영향 범위 반드시 확인. 공통 시스템(TDD, 모니터링, 보안, Rate Limiting)은 두 서비스에 동시 적용
    - **공유 DB 충돌 방지**: 마펫쯔 Django 모델은 `db_table` 명시 의무 (없으면 자동 `<app>_<model>` 패턴이 강아지학교와 충돌 가능). 이미 점유 중인 테이블: `user`, `comments`, `posts`, `favorites`, `system_tags`, `post_likes`, `adoption*`, `centers*` 등
    - **공유 스키마 변경 PR**: 양쪽 영향 가능한 스키마 변경 시 PR 제목에 `[shared-schema]` 라벨, 양쪽 서비스 담당자 confirm 필수
    - **JWT signing key 분리**: `settings.JWT_SIGNING_KEY = config("SUPABASE_JWT_SECRET")`. Django `SECRET_KEY`와 다른 변수. JWT 서명용으로만 사용 (세션·CSRF·해시는 SECRET_KEY 그대로)
    - **JWT는 stateful**: `api/security.py`가 `Jwt` DB 테이블 매칭 검증. 강아지학교는 PostgREST stateless 검증이라 갭 존재 — `ACCESS_TOKEN_EXPIRATION_TIME = 15분`으로 단축해 갭 최소화
    - **쿠키 도메인**: `SESSION_COOKIE_DOMAIN = '.mpz.kr'` 필수. `None`이면 강아지학교에서 쿠키 못 읽음
12. **EC2 파일 수정 시 절대 덮어쓰기 금지** — `cat >>`(append)와 `cat >`(overwrite)를 절대 혼동하지 않음. EC2의 .env 등 설정 파일 수정 시 반드시 `cat` 또는 `head`로 기존 내용 먼저 확인하고, append 전후로 `wc -l`로 줄 수 검증. 실수 시 서비스 전체 장애 유발
13. **사용자에게 확인 요청하지 않음** — PR 머지 여부, 배포 상태 등 직접 확인 가능한 것은 gh CLI나 SSH로 직접 확인. 사용자에게 "해줘", "확인해줘" 질문 금지
14. **실수 발생 시 즉시 복구 → 원인 기록** — 실수를 변명하지 말고, 복구 먼저 하고 CLAUDE.md에 재발 방지 규칙 추가
15. **새 파일 추가 시 git add 확인 필수** — 특히 assets, JSON 등 비코드 파일은 자동 추적 안 됨. 커밋 전 `git status`로 Untracked files 반드시 확인
16. **Dockerfile 패키지 매니저 일관성** — Dockerfile이 `npm ci`면 `package-lock.json` 필수 유지. pnpm으로 패키지 추가/제거 시 `npm install --package-lock-only`로 lock 파일 동기화

## 워커 헬스체크 루틴
사용자가 "워커 확인", "워커 체크", "동기화 상태" 등을 요청하면 아래 순서로 확인:
1. `docker compose ps worker` — 컨테이너 상태 (Up/Exited)
2. `docker compose logs worker --tail=5` — 최근 로그 (에러 여부)
3. **워커 코드 갱신 검증** — `docker exec mpz_app-worker-1 grep -c update_only /backend/animals/services.py` 결과 ≥ 4. 0이면 옛 이미지로 동작 중 (재배포 트리거 또는 backend 이미지로 즉시 retag 필요)
4. SyncLog 최근 5건 조회 — 전략별 마지막 실행 시간 + created/updated/deleted 수치
5. Animal 테이블 카운트 — 전체/공공/직접등록 수 + 보호중 수
6. **누적 기준점 검증** — `Animal.objects.filter(is_public_data=True).aggregate(Min('admission_date'))` 결과가 2025-10-01인지 확인. 그 이후 날짜면 누적 손실 의심
7. 이상 징후 판단:
   - `status_sync` 전략에서 created > 50 → 워커 패치 누락 (즉시 손상 데이터 식별 + 워커 갱신)
   - `incremental` created > 100 → 비정상 (정상은 0~10건/일)
   - status=failed, 컨테이너 재시작 등
