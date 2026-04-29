# MPZ(마펫쯔) — 유기동물 입양 & 보호센터 관리 플랫폼

AWS EC2 + Supabase(DB + Storage) 인프라. 상세는 각 폴더별 CLAUDE.md 참고.

## 인프라

| 구분 | 도메인 | EC2 IP | Supabase |
|------|--------|--------|----------|
| dev | dev.mpz.kr / dev-api.mpz.kr | 52.79.128.129 (t2.medium) | djnjbimklqvzqgcrkrdf |
| prod | mpz.kr / api.mpz.kr | 43.202.171.188 (t3.medium) | uytovxdqmlmhdzzpmwzk |

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
- Worker는 배포 시 재시작 안 함 (`--no-recreate`, 동기화 중단 방지). 워커 코드 변경 시 수동 재시작 필요

## Docker 컨테이너

backend(gunicorn), frontend(Next.js), nginx, redis, **worker**(동기화 스케줄러)

## Figma

- MCP 서버: `figma-dev` (figma-developer-mcp, PAT 기반, 프로젝트 로컬 스코프)
- 디자인 파일: https://www.figma.com/design/30IyUJvsyizlnUQ5urTx24/MPZ-기획?m=dev
- 파일 키: `30IyUJvsyizlnUQ5urTx24`
- UI 개발 시 Figma MCP 도구(`get_file`, `get_node`, `get_images`)로 디자인 참고

## 주의사항

1. .env 파일은 gitignore — EC2에 직접 관리
2. NEXT_PUBLIC_* 환경변수는 Docker 빌드 시 커맨드라인 전달 필수
3. 로컬 개발: `make dev` (FE:3001 + BE:8000)

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
11. **마펫쯔 + 강아지학교 멀티 서비스 체계** — 두 서비스가 Supabase DB를 공유하고 JWT를 호환. 신규 기능/인프라 작업 시 양쪽 서비스 영향 범위 반드시 확인. 공통 시스템(TDD, 모니터링, 보안, Rate Limiting)은 두 서비스에 동시 적용

## 워커 헬스체크 루틴
사용자가 "워커 확인", "워커 체크", "동기화 상태" 등을 요청하면 아래 순서로 확인:
1. `docker compose ps worker` — 컨테이너 상태 (Up/Exited)
2. `docker compose logs worker --tail=5` — 최근 로그 (에러 여부)
3. SyncLog 최근 5건 조회 — 전략별 마지막 실행 시간 + created/updated/deleted 수치
4. Animal 테이블 카운트 — 전체/공공/직접등록 수 + 보호중 수
5. 이상 징후 판단: created가 비정상적으로 많거나(>100), status=failed, 컨테이너 재시작 등
