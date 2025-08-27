# FCM (Firebase Cloud Messaging) 설정 가이드

## 1. Firebase 프로젝트 설정

### 1.1 Firebase Console에서 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 설정 → 클라우드 메시징 탭으로 이동

### 1.2 FCM 서버 키 획득

1. 프로젝트 설정 → 클라우드 메시징
2. 서버 키 복사 (이것이 `FCM_SERVER_KEY`)

### 1.3 프로젝트 ID 확인

1. 프로젝트 설정 → 일반
2. 프로젝트 ID 복사 (이것이 `FCM_PROJECT_ID`)

## 2. 환경변수 설정

### 2.1 .env 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```bash
# FCM Settings
FCM_SERVER_KEY=your-fcm-server-key-here
FCM_PROJECT_ID=your-firebase-project-id-here

# Firebase Admin SDK (선택사항)
FIREBASE_ADMIN_CREDENTIALS_PATH=path/to/firebase-adminsdk.json
```

### 2.2 환경변수 설정 방법

#### 방법 1: .env 파일 사용 (권장)

```bash
# .env 파일을 프로젝트 루트에 생성
echo "FCM_SERVER_KEY=your-actual-server-key" > .env
echo "FCM_PROJECT_ID=your-actual-project-id" >> .env
```

#### 방법 2: 시스템 환경변수 설정

```bash
# macOS/Linux
export FCM_SERVER_KEY="your-fcm-server-key"
export FCM_PROJECT_ID="your-firebase-project-id"

# Windows
set FCM_SERVER_KEY=your-fcm-server-key
set FCM_PROJECT_ID=your-firebase-project-id
```

#### 방법 3: Django settings.py에 직접 설정

```python
# settings.py
import os

FCM_SERVER_KEY = os.getenv('FCM_SERVER_KEY', 'your-fcm-server-key')
FCM_PROJECT_ID = os.getenv('FCM_PROJECT_ID', 'your-firebase-project-id')
```

## 3. Firebase Admin SDK 설정 (선택사항)

### 3.1 서비스 계정 키 생성

1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드

### 3.2 서비스 계정 키 파일 배치

```bash
# 프로젝트 내 안전한 위치에 배치
mkdir -p backend/firebase/
mv ~/Downloads/firebase-adminsdk-*.json backend/firebase/
```

### 3.3 환경변수에 경로 추가

```bash
echo "FIREBASE_ADMIN_CREDENTIALS_PATH=backend/firebase/firebase-adminsdk-*.json" >> .env
```

## 4. 의존성 설치

### 4.1 필요한 패키지 설치

```bash
pip install firebase-admin httpx
```

### 4.2 requirements.txt에 추가

```txt
firebase-admin>=6.0.0
httpx>=0.24.0
```

## 5. 설정 확인

### 5.1 환경변수 확인

```bash
python manage.py shell -c "import os; print('FCM_SERVER_KEY:', os.getenv('FCM_SERVER_KEY', 'Not set')); print('FCM_PROJECT_ID:', os.getenv('FCM_PROJECT_ID', 'Not set'))"
```

### 5.2 FCM 서비스 테스트

```bash
python manage.py shell -c "from notifications.utils import FCMPushNotificationService; service = FCMPushNotificationService(); print('FCM Service initialized:', service.fcm_server_key is not None)"
```

## 6. 보안 주의사항

### 6.1 .env 파일 보안

- `.env` 파일을 `.gitignore`에 추가
- 프로덕션 환경에서는 환경변수 사용
- FCM 서버 키는 절대 공개하지 않음

### 6.2 Firebase Admin SDK 보안

- 서비스 계정 키 파일을 안전하게 보관
- 프로덕션 환경에서는 환경변수로 경로 설정
- 키 파일을 버전 관리 시스템에 포함하지 않음

## 7. 문제 해결

### 7.1 FCM_SERVER_KEY 오류

```
FCM_SERVER_KEY 환경변수가 설정되지 않았습니다.
```

**해결방법**: 환경변수가 올바르게 설정되었는지 확인

### 7.2 인증 오류

```
HTTP 401: Unauthorized
```

**해결방법**: FCM 서버 키가 올바른지 확인

### 7.3 프로젝트 ID 오류

```
HTTP 400: Bad Request
```

**해결방법**: Firebase 프로젝트 ID가 올바른지 확인
