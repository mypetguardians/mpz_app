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
upstream → git@github.com:mypetguardians/mpz_app.git (조직)
```

PR: `gh pr create --repo mypetguardians/mpz_app --base main --head WaterMinCho:main`

## 배포

- `git push origin main` → prod 자동 배포
- `git push origin dev` → dev 자동 배포
- Worker는 배포 시 재시작 안 함 (동기화 중단 방지)

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

1. **main 배포 금지** — 반드시 사용자 허락 후에만 `git push origin main`
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
15. **입양 문의 임시 전화 연결** — 구독 센터도 현재 전화 연결로 동작 중 (앱 내 입양 신청 절차는 임시 비활성). 복원 시 `list/animal/[id]/_components/AnimalDetailClient.tsx`의 `handleAdoptionClick` 참고
16. **코드 제거 대신 주석 처리** — 임시로 비활성화하는 코드는 삭제하지 말고 주석 처리. 복원 시 주석 해제만으로 가능하도록
17. **코드 수정 시 ESLint/빌드 검증** — import 추가/제거, 컴포넌트 prop 변경 등 코드 수정 시 미사용 import/변수가 없는지 확인. push 전에 `pnpm run build` 또는 `npx tsc --noEmit`으로 빌드 통과 검토. EC2에서 빌드 실패하면 서비스 다운 위험
18. **BE API 수정 시 실제 import 체인 확인** — `centers/api.py`(레거시)와 `centers/api/center_api.py`(실제 사용) 같이 파일명만 보고 판단하지 말 것. `urls.py` → `__init__.py` → 실제 로직 파일까지 추적
19. **UX 라이팅 가이드 참고** — 사용자 대면 문구 작성 시 `frontend/WRITING_GUIDE.md` 참고. 해요체, 기술용어 미노출, 레벨별 톤 준수
20. **Docker env_file 갱신 시 down+up 필수** — `docker compose restart`로는 env_file 변경 미반영. 반드시 `docker compose down && up -d` 또는 `--force-recreate` 사용
21. **Firebase 웹 config는 공개 키** — Service Worker에 하드코딩된 Firebase config(apiKey 등)는 보안 이슈 아님. GitHub secret alert은 false positive로 dismiss
22. **Auth 상태 깜빡임 방지** — isAuthenticated 기반 조건부 렌더링 시 반드시 isLoading 상태 체크. 로딩 중에는 스켈레톤/placeholder 표시, 초기값(로그인 버튼 등) 노출 금지
23. **FCM 토큰 플랫폼 분기** — Capacitor 네이티브(ios/android)는 기존 FCM, 웹 브라우저는 Firebase JS SDK. `detectPlatform()`과 `getWebFCMToken()` 내 이중 체크로 분기. 네이티브 앱에서 웹 푸시 로직 절대 안 탐
24. **QueryClientProvider 순서 주의** — useQueryClient/useQuery는 QueryClientProvider 하위에서만 사용 가능. SocketProvider 등 상위 Provider에서 직접 사용 시 에러 발생 → CustomEvent 기반 통신으로 우회

## SEO

- `robots.ts`: dev 환경 전체 크롤링 차단, prod만 허용
- `sitemap.ts`: 정적 페이지 + 동물/센터 상세 동적 생성 (24h 캐시)
- `layout.tsx`: 전역 메타데이터 (OG, Twitter, JSON-LD Organization)
- 동물 상세: `generateMetadata`로 동적 OG (품종, 나이, 사진)
- dev 환경은 SEO 미적용 (robots Disallow + sitemap 빈 배열)
