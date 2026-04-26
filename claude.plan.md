# MPZ 작업 계획 & 진행 상태

## 🔴 다음 작업

### 1. 목록 성능 최적화
- [ ] 버추얼 스크롤: react-window 또는 @tanstack/react-virtual (DOM 가상화)
- [ ] 이미지 최적화: lazy loading, placeholder blur, 적절한 사이즈 요청, 뷰포트 밖 이미지 언로드

### 2. SMS 인증
- [ ] 프로필 휴대폰 번호 수정 시 SMS 인증 절차 추가

### 2. WebSocket 지원
- gunicorn → Daphne(ASGI) 전환
- 현재 FCM 웹 푸시로 알림 기능 대체 가능, WebSocket은 채팅/실시간 상태용

### 3. doggy-school 프로젝트
- fork → clone → 분석 → Supabase 위에 배포

---

## 🟢 환경변수 수령 (대표님/이전 개발사)

- [x] FIREBASE_ADMIN_CREDENTIALS_JSON — 새 프로젝트 직접 생성 완료
- [ ] OPENAI_API_KEY
- [ ] LANGCHAIN_API_KEY

---

## 🔄 상시

### SEO
- 완료 항목은 `history/2026-04-26.md` 참고
- [ ] 네이버/Google 색인 상태 모니터링 (서치어드바이저 + Search Console)

---

## 🔵 후순위

### AWS → Supabase 전면 이관 + 무중단 배포
### 모니터링
- [ ] Freshping + Sentry + Slack 배포 알림
### Django Admin UI
### 보안 검수
- [ ] release-key.jks git 추적 제거
### 테스트 시스템
### 데이터 분석/시각화

---

## ✅ 완료

### 2026-04-26
- [x] 불필요 코드/리소스 정리 (1,522줄 삭제)
- [x] Firebase 새 프로젝트 생성 + 웹 푸시 전체 구현
- [x] FCM TTL 1시간 + collapse_key
- [x] 알림 UI 개선 (toast 애니메이션, NotificationCard, 뱃지 실시간)
- [x] Auth 상태 깜빡임 해결 (6개 컴포넌트)
- [x] GPS 위치 확인 대기시간 단축
- [x] SEO 전면 강화 (canonical, 메타데이터, robots.txt, sitemap, 키워드, JSON-LD)
- [x] 입양 신청 분기 복원 (구독센터: 앱 내 신청, 비구독: 전화 연결)
- [x] 접근성 강화 (Toast/Modal/BottomSheet ARIA 속성)
- [x] GitHub Secrets 기반 BE 환경변수 관리 (base64 인코딩 + SCP)
- [x] 워커 버그 수정 (status_sync 데이터 오염 + 보호종료 감지 + 중복 실행 방지)
- [x] 워커 스케줄 조정 (status_sync 주 2회 수/일 03:10 KST)
- [x] Git 흐름 조직 repo 중심 전환 (fork Actions 비활성, 조직 Secrets 등록)
- [x] logout API 버그 수정 (cookie expires/max_age 충돌)
- [x] Docker 디스크 정리 (dev 79→61%, prod 83→55%)
- [x] 인수인계 문서 4개 현행화 (FE/BE/DB/서버)
- [x] 새 Git 배포 흐름 검증 (PR #19~#22)
- [x] prod 배포 (PR #16~#22)

### 이전

`history/` 폴더에서 날짜별 상세 확인 가능
