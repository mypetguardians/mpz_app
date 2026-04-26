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

## 개발 규칙

1. **직접 push로 배포 금지** — 반드시 PR 머지를 통해서만 배포. fork push는 배포 트리거 안 됨
2. **sleep/시간 기반 대기 금지** — `sleep 5` 같은 시간 기반 대기 대신 상태 확인 기반(`until`, polling)으로 동기적 처리
3. **전문가 의견 vs 센터 등록 구분** — "전문가 관련 주석 처리" 요청 시 상세 페이지(SubscriberDetails)만 해당. 센터 입력 폼(DetailInfo)은 별개 기능
4. **주석 처리 시 import/변수 정리** — 코드 주석 처리 시 관련 import와 미사용 변수도 같이 주석 처리 (ESLint 빌드 에러 방지)
5. **유의사항 발생 시 이 파일에 기록** — 사용자가 주의/자제/유의를 주면 여기에 추가하여 반복 실수 방지
6. **배포 후 수동 체크 금지** — 모니터링/Slack 알림 세팅 전까지는 불가피하지만, 모니터링 구축 시 반드시 배포 알림 자동화
7. **Co-Authored-By 금지** — 커밋 메시지에 Claude Co-Authored-By 줄 넣지 않음. contributor 목록에 Claude가 표시되면 안 됨
8. **작업 완료 시 정리** — claude.plan.md에서 완료 항목 제거 → history/ 폴더에 날짜별 파일로 이동 (예: history/2026-04-22-24.md)
9. **계정/키값/시크릿 코드에 기록 금지** — git에 올라가는 파일(history, claude.plan.md, CLAUDE.md 등)에 비밀번호, API 키, 시크릿 절대 기록하지 않음. 별도 문서로만 관리
10. **공통 컴포넌트 우선 사용** — 새 페이지/기능 개발 시 기존 공통 컴포넌트(CustomInput, BigButton, TopBar, Container 등)를 반드시 우선 사용. 직접 HTML 작성 최소화
11. **flex gap 사용 금지** — 웹뷰 일정 버전에서 flex gap 미지원. margin(ml, mt 등) 또는 space-y/space-x 또는 grid gap 사용
12. **/dev 페이지 prod 접근 금지** — dev/layout.tsx에서 prod 환경 차단. 디자인 팔레트, 테스트 페이지 등은 /dev/ 하위에 생성
13. **UI 구성 전 디자인 팔레트 참고** — 새 페이지/컴포넌트 개발 시 `/dev/palette` 페이지의 컬러, 타이포그래피, 컴포넌트, 간격 규격을 반드시 참고하여 일관성 유지
14. **Tailwind 예약어와 커스텀 토큰 충돌 주의** — 커스텀 색상/변수명이 Tailwind 예약어(lg, xl, sm 등)와 겹치면 예기치 않은 스타일 오염 발생. font-size 지정 시 `text-[18px]` 같은 고정값 사용 권장
15. **입양 문의 분기 처리** — 구독 센터: 앱 내 입양 신청 절차(절차 안내 모달 → 신청 폼), 비구독 센터: 전화 연결 바텀시트. `list/animal/[id]/_components/AnimalDetailClient.tsx`의 `handleAdoptionClick` 참고
16. **코드 제거 대신 주석 처리** — 임시로 비활성화하는 코드는 삭제하지 말고 주석 처리. 복원 시 주석 해제만으로 가능하도록
17. **코드 수정 시 ESLint/빌드 검증** — import 추가/제거, 컴포넌트 prop 변경 등 코드 수정 시 미사용 import/변수가 없는지 확인. push 전에 `pnpm run build` 또는 `npx tsc --noEmit`으로 빌드 통과 검토. EC2에서 빌드 실패하면 서비스 다운 위험
18. **BE API 수정 시 실제 import 체인 확인** — 같은 이름의 파일이 여러 위치에 있을 수 있음. `urls.py` → `__init__.py` → 실제 로직 파일까지 추적
19. **UX 라이팅 가이드 참고** — 사용자 대면 문구 작성 시 `frontend/WRITING_GUIDE.md` 참고. 해요체, 기술용어 미노출, 레벨별 톤 준수
20. **Docker env_file 갱신 시 down+up 필수** — `docker compose restart`로는 env_file 변경 미반영. 반드시 `docker compose down && up -d` 또는 `--force-recreate` 사용
21. **Firebase 웹 config는 공개 키** — 브라우저용 Firebase config(apiKey 등)는 보안 이슈 아님. GitHub secret alert은 false positive
22. **Auth 상태 깜빡임 방지** — 인증 상태 기반 조건부 렌더링 시 반드시 로딩 상태 체크 먼저. 로딩 중에는 스켈레톤 표시
23. **FCM 플랫폼 분기** — Capacitor 네이티브와 웹 브라우저의 푸시 로직 완전 분리. 네이티브에서 웹 푸시 로직 절대 안 탐
24. **Provider 하위에서만 hooks 사용** — React Context 기반 hooks는 해당 Provider 하위에서만 호출 가능. Provider 바깥이면 이벤트 기반으로 우회
25. **환경변수 변경 시 여러 곳 동기화** — NEXT_PUBLIC_* 등은 Dockerfile, CI/CD, docker-compose 등 관련된 모든 곳에 반영 필수
29. **BE 환경변수는 base64로 전달** — GitHub Secrets에 base64 인코딩으로 저장(BE_ENV_DEV_B64, BE_ENV_PROD_B64). deploy.yml에서 `base64 -d`로 디코딩 후 SCP 전송. echo/printenv/sed는 JSON 특수문자(`\n`, `+`, `/`)를 깨뜨리므로 절대 사용 금지
26. **검색엔진 색인은 대기 필요** — SEO 코드 작업 후 실제 검색 노출까지 수일~수주 소요. 수집 요청 후 기다려야 함
27. **워커 동기화 전략 구분** — incremental(신규 생성 OK), status_sync(업데이트만, 신규 생성 금지), full(신규 생성 OK). 전략별 역할 혼동 금지
28. **직접등록 동물 보호** — 동기화 로직은 `is_public_data=True`만 처리. 직접등록(False)은 절대 건드리지 않음

## 워커 헬스체크 루틴
사용자가 "워커 확인", "워커 체크", "동기화 상태" 등을 요청하면 아래 순서로 확인:
1. `docker compose ps worker` — 컨테이너 상태 (Up/Exited)
2. `docker compose logs worker --tail=5` — 최근 로그 (에러 여부)
3. SyncLog 최근 5건 조회 — 전략별 마지막 실행 시간 + created/updated/deleted 수치
4. Animal 테이블 카운트 — 전체/공공/직접등록 수 + 보호중 수
5. 이상 징후 판단: created가 비정상적으로 많거나(>100), status=failed, 컨테이너 재시작 등

## SEO

- `robots.ts`: dev 전체 차단, prod 허용 + 네이버 Yeti 명시 + 비공개 페이지 Disallow
- `sitemap.ts`: 정적 6페이지 + 동물/센터 동적 생성 (24h 캐시, lastmod=updated_at)
- `layout.tsx`: 전역 메타 (OG, Twitter, JSON-LD Organization + WebSite + SiteNavigationElement)
- 동물/센터/커뮤니티 상세: `generateMetadata`로 동적 OG + canonical
- 공개 페이지 5개: 각 폴더 layout.tsx에 고유 title/description/canonical
- `metadataBase`: `https://mpz.kr` (canonical 상대경로 자동 해석)
- dev 환경은 SEO 미적용 (robots Disallow + sitemap 빈 배열)
- 상세 규칙은 `frontend/CLAUDE.md`의 SEO 규칙 섹션 참고
