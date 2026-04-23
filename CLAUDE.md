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
