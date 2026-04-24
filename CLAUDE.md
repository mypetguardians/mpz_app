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
