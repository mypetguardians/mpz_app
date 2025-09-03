# QStash 공공 데이터 API 설정 가이드

## 1. 환경 변수 설정

`.env` 파일에 다음 변수들을 설정하세요:

```bash
# QStash 설정
QSTASH_TOKEN=your_qstash_token_here
QSTASH_URL=https://qstash.upstash.io/v2/publish

# API 기본 URL
API_BASE_URL=https://mpzfullstack-production.up.railway.app

# 헤더 기반 API 키 (QStash에서 API 호출 시 사용)
PUBLIC_DATA_API_KEY=your_api_key_here

# 공공데이터 서비스 키
PUBLIC_DATA_SERVICE_KEY=your_public_data_service_key_here
```

## 2. QStash 토큰 발급

1. [Upstash Console](https://console.upstash.com/)에 로그인
2. QStash 서비스 선택
3. "Create Token" 클릭
4. 토큰 복사 후 `QSTASH_TOKEN`에 설정

## 3. API 키 설정

간단한 헤더 기반 인증을 사용합니다. 원하는 API 키를 설정하세요:

```bash
# 예시: 강력한 랜덤 키 생성
PUBLIC_DATA_API_KEY="mpz_public_data_2024_secure_key_xyz123"
```

**보안 권장사항:**

- 최소 32자 이상의 랜덤 문자열 사용
- 특수문자, 숫자, 대소문자 조합
- 정기적으로 키 교체

## 4. 스케줄 등록 실행

### 방법 1: Python 스크립트 사용

```bash
cd backend
python qstash_public_data_setup.py
```

### 방법 2: 간단한 셸 스크립트 사용

```bash
cd backend
chmod +x qstash_simple_setup.sh
./qstash_simple_setup.sh
```

### 방법 3: QStash 대시보드에서 직접 등록

1. [QStash Console](https://console.upstash.com/) 접속
2. "Schedules" 탭 클릭
3. "Create Schedule" 버튼 클릭
4. 다음 정보 입력:

```
Name: Public Data Sync - Daily
URL: https://mpzfullstack-production.up.railway.app/v1/animals/public-data/sync
Method: GET
Cron: 0 2 * * *
Headers:
  upstash-forward-x-api-key: your_api_key_here
  upstash-forward-content-type: application/json
```

**중요**: QStash에서는 `upstash-forward-*` 접두사를 사용하여 헤더를 전달합니다.

### QStash 헤더 규칙

- `X-API-Key` → `upstash-forward-x-api-key`
- `Content-Type` → `upstash-forward-content-type`
- `Authorization` → `upstash-forward-authorization`

QStash는 중간 프록시 역할을 하며, `upstash-forward-*` 헤더를 통해 원본 요청의 헤더를 그대로 전달합니다.

## 5. 등록되는 스케줄

### 매일 증분 동기화 (새벽 2시)

- **목적**: 최근 데이터만 가져와서 새 동물 추가
- **전략**: incremental
- **Cron**: `0 2 * * *`

### 주간 상태 체크 (일요일 새벽 3시)

- **목적**: 전체 데이터를 가져와서 상태 변경 확인
- **전략**: status_check
- **Cron**: `0 3 * * 0`

### 월간 전체 동기화 (매월 1일 새벽 4시)

- **목적**: 모든 데이터를 새로 가져와서 완전 동기화
- **전략**: full
- **Cron**: `0 4 1 * *`

## 6. 수동 실행

특정 전략으로 즉시 동기화를 실행하려면:

```python
from qstash_public_data_setup import QStashPublicDataScheduler

scheduler = QStashPublicDataScheduler()

# 증분 동기화
scheduler.setup_immediate_sync("incremental")

# 전체 동기화
scheduler.setup_immediate_sync("full")

# 상태 체크
scheduler.setup_immediate_sync("status_check")
```

## 7. 모니터링

QStash 대시보드에서 다음을 확인할 수 있습니다:

- 스케줄 실행 상태
- 실행 로그
- 실패한 작업 재시도
- 성능 메트릭

## 8. 문제 해결

### 토큰 오류

```
❌ QSTASH_TOKEN이 설정되지 않았습니다.
```

→ `.env` 파일에 `QSTASH_TOKEN` 설정 확인

### 권한 오류

```
❌ 관리자 권한이 필요합니다
```

→ `ADMIN_JWT_TOKEN`이 유효한 관리자 토큰인지 확인

### API URL 오류

```
❌ 요청 실패: 404
```

→ `API_BASE_URL`이 올바른지 확인

## 9. 고급 설정

### 커스텀 스케줄

특정 시간에 동기화를 실행하려면:

```python
# 매주 월요일 오전 9시
scheduler._make_request(url, cron="0 9 * * 1")

# 매일 오후 6시
scheduler._make_request(url, cron="0 18 * * *")
```

### 지연 실행

특정 시간 후에 실행하려면:

```python
# 5분 후 실행
scheduler._make_request(url, delay=300)
```
