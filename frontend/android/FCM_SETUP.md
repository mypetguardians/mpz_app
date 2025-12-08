# 안드로이드 FCM 푸시 알림 설정 완료

## ✅ 완료된 작업

1. **Firebase BOM 및 Cloud Messaging 의존성 추가**

   - `app/build.gradle`에 Firebase BOM (34.6.0) 추가
   - Firebase Cloud Messaging 라이브러리 추가

2. **Google Services 플러그인 업데이트**

   - 프로젝트 수준 `build.gradle`에서 Google Services 플러그인 버전 업데이트 (4.4.4)
   - 앱 수준 `build.gradle`에서 자동으로 플러그인 적용

3. **AndroidManifest.xml 설정**

   - FCM 권한 추가 (`POST_NOTIFICATIONS`, `RECEIVE`)
   - Firebase Messaging Service 등록
   - 알림 채널 및 아이콘 메타데이터 설정

4. **커스텀 FCM 서비스 클래스 생성**
   - `MpzFirebaseMessagingService.java` 생성
   - FCM 토큰 수신 및 푸시 알림 처리

## 📱 다음 단계

### 1. FCM 토큰을 JavaScript로 전달하기

현재 안드로이드에서 FCM 토큰을 받을 수 있지만, JavaScript로 전달하는 기능이 필요합니다.

**옵션 A: Capacitor Push Notifications 플러그인 사용 (권장)**

```bash
cd frontend
npm install @capacitor/push-notifications
npx cap sync android
```

그 다음 프론트엔드에서:

```typescript
import { PushNotifications } from "@capacitor/push-notifications";

// 토큰 등록
PushNotifications.register();

PushNotifications.addListener("registration", (token) => {
  console.log("FCM 토큰:", token.value);
  // 백엔드로 토큰 전송
  registerPushToken({ token: token.value, platform: "android" });
});
```

**옵션 B: 커스텀 Capacitor 플러그인 생성**

`MpzFirebaseMessagingService.java`를 수정하여 Capacitor Bridge를 통해 토큰을 전달할 수 있습니다.

### 2. 프론트엔드에서 안드로이드 토큰 등록

`usePushToken.tsx`를 수정하여 안드로이드 플랫폼에서 FCM 토큰을 등록하도록 합니다:

```typescript
// 안드로이드에서 FCM 토큰 가져오기
if (Capacitor.getPlatform() === "android") {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    await registerPushToken.mutateAsync({
      token: token.value,
      platform: "android",
    });
  });
}
```

### 3. 테스트

1. **앱 빌드 및 실행**

   ```bash
   cd frontend
   npx cap sync android
   npx cap open android
   ```

2. **FCM 토큰 확인**

   - 앱 실행 후 Logcat에서 `MpzFCMService` 태그로 필터링
   - "새로운 FCM 토큰" 로그 확인

3. **백엔드에서 테스트 알림 전송**
   - 백엔드 API를 통해 등록된 토큰으로 테스트 알림 전송

## 🔧 설정 확인 사항

### Google Services JSON 파일

- ✅ `android/app/google-services.json` 파일이 올바른 위치에 있는지 확인
- ✅ 프로젝트 ID가 `mpz-app-b2e01`인지 확인

### Gradle 동기화

- Android Studio에서 "Sync Project with Gradle Files" 실행
- 모든 의존성이 올바르게 다운로드되었는지 확인

### 권한 확인

- Android 13 (API 33) 이상에서는 런타임에 알림 권한을 요청해야 합니다
- `MainActivity.java`에서 권한 요청 코드 추가 필요할 수 있음

## 📝 참고사항

1. **알림 채널**

   - Android 8.0 이상에서는 알림 채널이 필수입니다
   - `MpzFirebaseMessagingService`에서 자동으로 생성됩니다

2. **백그라운드 알림**

   - 앱이 백그라운드에 있을 때는 FCM이 자동으로 알림을 표시합니다
   - 포그라운드에서는 `onMessageReceived`에서 커스텀 처리가 필요합니다

3. **토큰 갱신**
   - FCM 토큰은 앱 재설치, 데이터 삭제, 앱 복원 시 갱신됩니다
   - `onNewToken` 메서드에서 항상 최신 토큰을 백엔드로 전송해야 합니다

## 🐛 문제 해결

### 토큰을 받을 수 없어요

- Google Services JSON 파일이 올바른 위치에 있는지 확인
- Gradle 동기화 후 다시 빌드
- Firebase Console에서 Android 앱이 올바르게 등록되었는지 확인

### 알림이 표시되지 않아요

- AndroidManifest.xml의 권한이 올바르게 설정되었는지 확인
- Android 13 이상에서는 런타임 권한 요청 필요
- 알림 채널이 올바르게 생성되었는지 확인

### 빌드 오류가 발생해요

- Google Services 플러그인이 올바르게 적용되었는지 확인
- `google-services.json` 파일이 올바른 형식인지 확인
- Gradle 캐시 삭제 후 다시 빌드
