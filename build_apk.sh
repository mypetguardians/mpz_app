#!/bin/zsh
echo "🚀 안드로이드 APK 빌드 시작..."

# 프로젝트 경로 설정
PROJECT_PATH="/Users/jhy20/mpz_fullstack/android/MPZApp"

if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ 프로젝트 폴더를 찾을 수 없습니다: $PROJECT_PATH"
    echo "Android Studio에서 새 프로젝트를 먼저 생성해주세요."
    exit 1
fi

cd "$PROJECT_PATH"

# Gradle 래퍼 확인 및 생성
if [ ! -f "gradlew" ]; then
    echo "⚙️ Gradle 래퍼 생성 중..."
    gradle wrapper
fi

# 디버그 APK 빌드
echo "🔨 디버그 APK 빌드 중..."
./gradlew assembleDebug

# 빌드 결과 확인
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "✅ APK 빌드 성공!"
    echo "📱 APK 파일 위치: $APK_PATH"
    
    # 파일 크기 확인
    FILE_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "📊 파일 크기: $FILE_SIZE"
    
    # 설치 가능한 기기 확인
    echo "🔍 연결된 안드로이드 기기:"
    adb devices
    
    # APK 설치 옵션
    echo ""
    echo "📲 APK를 설치하려면 다음 명령어를 실행하세요:"echo "adb install $APK_PATH"
else
    echo "❌ APK 빌드 실패. gradlew assembleDebug 결과를 확인하세요."
    ./gradlew assembleDebug --stacktrace
fi

echo ""
echo "🎉 완료! APK 파일: $APK_PATH"
