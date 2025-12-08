# Firebase 설정 가이드

이 디렉토리에는 Firebase Admin SDK 설정 파일이 포함되어 있습니다.

## 파일 구조

- `firebase-adminsdk.json`: Firebase 서비스 계정 자격증명 파일
- `__init__.py`: Firebase Admin SDK 자동 초기화 코드
- `generate_vapid_keys.py`: VAPID 키 생성 스크립트

## Firebase Admin SDK 설정

### 1. 자격증명 파일 위치

Firebase Admin SDK는 다음 순서로 자격증명을 찾습니다:

1. 환경변수 `FIREBASE_ADMIN_CREDENTIALS_JSON` (JSON 문자열)
2. 환경변수 `FIREBASE_ADMIN_CREDENTIALS_PATH` (파일 경로)
3. 기본 경로: `backend/firebase/firebase-adminsdk.json`

### 2. 환경변수 설정

**옵션 1: 파일 경로 사용 (권장)**

```bash
FIREBASE_ADMIN_CREDENTIALS_PATH=backend/firebase/firebase-adminsdk.json
```

**옵션 2: JSON 문자열 사용**

```bash
FIREBASE_ADMIN_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### 3. 자동 초기화

`backend/firebase/__init__.py`가 import되면 자동으로 Firebase Admin SDK가 초기화됩니다.
Django settings.py에서 `import firebase`를 통해 초기화됩니다.

## VAPID 키 생성

웹 푸시 알림을 사용하려면 VAPID 키가 필요합니다.

### 방법 1: 온라인 도구 사용 (가장 간단) ⭐

다음 온라인 도구를 사용하면 별도 설치 없이 바로 키를 생성할 수 있습니다:

- **https://web-push-codelab.glitch.me/** (권장)
- **https://vapidkeys.com/**

생성된 공개 키(Public Key)를 복사하여 프론트엔드 `.env.local`에 설정하세요.

### 방법 2: Python 스크립트 사용

```bash
cd backend

# 가상환경 생성 및 활성화 (처음 한 번만)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install pywebpush

# VAPID 키 생성
python3 firebase/generate_vapid_keys.py
```

### 방법 3: Node.js 사용

```bash
npm install -g web-push
web-push generate-vapid-keys
```

### 방법 4: Python 직접 실행

```bash
pip install pywebpush
python3 -c "from pywebpush import webpush; keys = webpush.generate_vapid_keys(); print('Public Key:', keys['publicKey']); print('Private Key:', keys['privateKey'])"
```

## 환경변수 설정

### 프론트엔드 (.env.local)

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### 백엔드 (.env)

```env
# Firebase Admin SDK (선택사항 - 파일 경로 사용 시 불필요)
FIREBASE_ADMIN_CREDENTIALS_PATH=backend/firebase/firebase-adminsdk.json

# 또는 JSON 문자열로 직접 설정
# FIREBASE_ADMIN_CREDENTIALS_JSON='{"type":"service_account",...}'

# FCM 서버 키 (레거시 방식, 여전히 사용 가능)
FCM_SERVER_KEY=your_fcm_server_key_here
FCM_PROJECT_ID=mpz-app-b2e01
```

## FCM 서버 키 가져오기

Firebase Console에서 FCM 서버 키를 가져올 수 있습니다:

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (mpz-app-b2e01)
3. 프로젝트 설정 → 클라우드 메시징
4. 서버 키 복사

**참고**: FCM 서버 키는 레거시 방식이며, Firebase Admin SDK를 사용하는 것이 권장됩니다.

## 보안 주의사항

⚠️ **중요**:

- `firebase-adminsdk.json` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 포함되어 있는지 확인하세요
- 프로덕션 환경에서는 환경변수로 자격증명을 관리하세요

## 테스트

Firebase Admin SDK가 제대로 초기화되었는지 확인:

```bash
python manage.py shell
>>> import firebase_admin
>>> from firebase_admin import credentials
>>> print("Firebase 초기화 성공!")
```

## 문제 해결

### Firebase Admin SDK 초기화 실패

1. `firebase-admin` 패키지가 설치되어 있는지 확인:

   ```bash
   pip install firebase-admin
   ```

2. 자격증명 파일 경로가 올바른지 확인

3. 자격증명 파일의 권한 확인 (읽기 가능해야 함)

### VAPID 키 오류

- VAPID 공개 키는 Base64 URL-safe 형식이어야 합니다
- 프론트엔드에서 `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 환경변수가 설정되어 있는지 확인
- 브라우저 콘솔에서 VAPID 키 관련 오류 확인
