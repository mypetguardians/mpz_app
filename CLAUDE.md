# MPZ(마펫쯔) — 유기동물 입양 & 보호센터 관리 플랫폼

AWS EC2 + Supabase(DB + Storage) 인프라. 상세는 각 폴더별 CLAUDE.md 참고.

## 인프라

| 구분 | 도메인 | EC2 IP | Supabase |
|------|--------|--------|----------|
| dev | dev.mpz.kr / dev-api.mpz.kr | 52.79.128.129 (t2.small) | djnjbimklqvzqgcrkrdf |
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
