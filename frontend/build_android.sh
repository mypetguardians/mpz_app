#!/bin/zsh
set -e

echo "🚀 Android 패키징 시작 (Capacitor + Next.js)..."

FRONTEND_DIR="/Users/jhy20/mpz_fullstack/frontend"
ANDROID_DIR="$FRONTEND_DIR/android"
APK_DEBUG_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
AAB_RELEASE_PATH="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"

cd "$FRONTEND_DIR"

echo "📦 의존성 설치 (npm ci 우선, 실패 시 npm install)"
if command -v npm >/dev/null 2>&1; then
	if npm ci >/dev/null 2>&1; then
		echo "✅ npm ci 완료"
	else
		echo "⚠️ npm ci 실패, npm install 시도"
		npm install
	fi
else
	echo "❌ npm 을 찾을 수 없습니다. Node.js/npm 설치 후 다시 시도하세요."
	exit 1
fi

echo "🧱 Next.js 프로덕션 빌드 (next build)"
if npm run -s build; then
	echo "✅ Next.js 빌드 완료"
else
	echo "❌ Next.js 빌드 실패"
	exit 1
fi

echo "🔗 Capacitor 동기화 (Android)"
if ! command -v npx >/dev/null 2>&1; then
	echo "❌ npx 를 찾을 수 없습니다. Node.js/npm 설치 후 다시 시도하세요."
	exit 1
fi

if [ ! -d "$ANDROID_DIR" ]; then
	echo "📁 Android 플랫폼 초기화 (npx cap add android)"
	npx cap add android
fi

echo "🔄 npx cap sync android"
npx cap sync android

echo "🛠 Android SDK 라이선스/패키지 확인 및 자동 처리"
# sdkmanager 탐색 및 SDK 루트 설정
SDK_ROOT_DEFAULT="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$SDK_ROOT_DEFAULT}"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
SDKMANAGER=""
if [ -x "$SDK_ROOT_DEFAULT/cmdline-tools/latest/bin/sdkmanager" ]; then
	SDKMANAGER="$SDK_ROOT_DEFAULT/cmdline-tools/latest/bin/sdkmanager"
elif [ -x "$SDK_ROOT_DEFAULT/cmdline-tools/bin/sdkmanager" ]; then
	SDKMANAGER="$SDK_ROOT_DEFAULT/cmdline-tools/bin/sdkmanager"
elif command -v sdkmanager >/dev/null 2>&1; then
	SDKMANAGER="$(command -v sdkmanager)"
fi

if [ -n "$SDKMANAGER" ]; then
	echo "✔ sdkmanager 발견: $SDKMANAGER"
	echo "✔ 라이선스 수락"
	yes | "$SDKMANAGER" --licenses --sdk_root="$ANDROID_SDK_ROOT" >/dev/null || true
	echo "✔ 필요한 패키지 설치 (platforms;android-35, build-tools;34.0.0, platform-tools)"
	"$SDKMANAGER" --sdk_root="$ANDROID_SDK_ROOT" "platforms;android-35" "build-tools;34.0.0" "platform-tools" >/dev/null || true
else
	echo "⚠️ sdkmanager 를 찾지 못했습니다. Android Studio의 SDK Manager에서 아래 항목을 설치/라이선스 수락하세요:"
	echo "   - Android SDK Platform 35"
	echo "   - Android SDK Build-Tools 34"
	echo "   - Android SDK Platform-Tools"
fi

echo "🏗️ Gradle 빌드 실행 (assembleDebug)"
cd "$ANDROID_DIR"

if [ ! -f "gradlew" ]; then
	echo "⚙️ Gradle Wrapper 생성"
	if command -v gradle >/dev/null 2>&1; then
		gradle wrapper
	else
		echo "⚠️ gradle 명령을 찾지 못했습니다. Android Studio/SDK 설치를 확인하세요."
	fi
fi

echo "🧰 Gradle 메모리 설정 적용 (환경변수)"
export GRADLE_OPTS="-Xmx4g -XX:MaxMetaspaceSize=1024m ${GRADLE_OPTS}"
export JAVA_TOOL_OPTIONS="-Xmx4g -XX:MaxMetaspaceSize=1024m ${JAVA_TOOL_OPTIONS}"

./gradlew assembleDebug

if [ -f "$APK_DEBUG_PATH" ]; then
	echo "✅ 디버그 APK 빌드 성공: $APK_DEBUG_PATH"
	du -h "$APK_DEBUG_PATH" | awk '{print "📊 파일 크기:", $1}'
	# 편의상 프로젝트 루트로 복사
	PROJECT_ROOT="/Users/jhy20/mpz_fullstack"
	DEST_APK="$PROJECT_ROOT/MPZ-debug.apk"
	cp "$APK_DEBUG_PATH" "$DEST_APK"
	echo "📁 사본 복사: $DEST_APK"
else
	echo "❌ 디버그 APK를 찾을 수 없습니다. Gradle 로그를 확인하세요."
	exit 1
fi

echo ""
echo "🔐 릴리스 번들(AAB) 빌드 시도 (서명 설정 필요할 수 있음)"
echo "   - 릴리스 서명 설정 전: ./gradlew bundleRelease 실행 시 실패할 수 있습니다."
echo "   - 서명 키 설정 방법: android/app/keystore 및 signingConfigs 설정 필요"
./gradlew bundleRelease || true

if [ -f "$AAB_RELEASE_PATH" ]; then
	echo "✅ 릴리스 AAB 빌드 성공: $AAB_RELEASE_PATH"
	du -h "$AAB_RELEASE_PATH" | awk '{print "📊 파일 크기:", $1}'
else
	echo "ℹ️ 릴리스 AAB를 찾을 수 없습니다. 서명 설정 후 다시 시도하세요."
fi

echo ""
echo "📲 기기 설치 안내 (디버그 APK):"
echo "   adb install \"$APK_DEBUG_PATH\""

echo ""
echo "🎉 완료"


