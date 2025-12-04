#!/bin/zsh
set -e

echo "🚀 iOS 패키징 시작 (Capacitor + Next.js)..."

FRONTEND_DIR="/Users/jhy20/mpz_fullstack/frontend"
IOS_DIR="$FRONTEND_DIR/ios"
WEB_BUILD_DIR="$FRONTEND_DIR/.next"
IOS_APP_DIR="$IOS_DIR/App"
XCODE_PROJECT="$IOS_APP_DIR/App.xcodeproj"
XCODE_WORKSPACE="$IOS_APP_DIR/App.xcworkspace"
BUILD_DIR="$IOS_APP_DIR/build"
IPA_OUTPUT_DIR="$BUILD_DIR/ipa"

cd "$FRONTEND_DIR"

# 의존성 설치 (node_modules가 없을 때만)
if [ ! -d "node_modules" ]; then
	echo "📦 의존성 설치 (node_modules 없음)"
	if command -v npm >/dev/null 2>&1; then
		npm install
	else
		echo "❌ npm 을 찾을 수 없습니다. Node.js/npm 설치 후 다시 시도하세요."
		exit 1
	fi
else
	echo "⏭️  의존성 설치 스킵 (node_modules 존재)"
fi

export NEXT_TELEMETRY_DISABLED=1
export NEXT_DISABLE_SOURCEMAP="${NEXT_DISABLE_SOURCEMAP:-1}"

echo "🧱 Next.js 프로덕션 빌드 (next build)"
rm -rf "$WEB_BUILD_DIR"
if npm run -s build; then
	echo "✅ Next.js 빌드 완료"
else
	echo "❌ Next.js 빌드 실패"
	exit 1
fi

if [ "$NEXT_DISABLE_SOURCEMAP" = "1" ]; then
	echo "🧹 소스맵 제거 (IPA 용량 최적화)"
	find "$WEB_BUILD_DIR" -name "*.map" -delete || true
fi

echo "🧹 타입 파일 제거 (Capacitor 빌드에 불필요)"
# Next.js가 생성한 타입 파일들은 개발 시에만 필요하고 앱 빌드에는 불필요
# 이 파일들이 Capacitor sync 시 타입 에러를 일으킬 수 있음
if [ -d "$WEB_BUILD_DIR/types" ]; then
	rm -rf "$WEB_BUILD_DIR/types"
	echo "✅ 타입 파일 제거 완료"
fi

echo "🔗 Capacitor 동기화 (iOS)"
if ! command -v npx >/dev/null 2>&1; then
	echo "❌ npx 를 찾을 수 없습니다. Node.js/npm 설치 후 다시 시도하세요."
	exit 1
fi

if [ ! -d "$IOS_DIR" ]; then
	echo "📁 iOS 플랫폼 초기화 (npx cap add ios)"
	npx cap add ios
fi

echo "🔄 npx cap sync ios"
npx cap sync ios

# Capacitor sync 후에도 타입 파일이 복사되었는지 확인하고 제거
IOS_PUBLIC_TYPES="$IOS_APP_DIR/App/public/types"
if [ -d "$IOS_PUBLIC_TYPES" ]; then
	echo "🧹 iOS public 디렉토리의 타입 파일 제거"
	rm -rf "$IOS_PUBLIC_TYPES"
	echo "✅ 타입 파일 제거 완료"
fi

echo "🍎 CocoaPods 의존성 설치"
cd "$IOS_APP_DIR"

if ! command -v pod >/dev/null 2>&1; then
	echo "❌ CocoaPods를 찾을 수 없습니다. 다음 명령어로 설치하세요:"
	echo "   sudo gem install cocoapods"
	exit 1
fi

echo "📦 pod install 실행"
if pod install; then
	echo "✅ CocoaPods 의존성 설치 완료"
else
	echo "❌ CocoaPods 의존성 설치 실패"
	echo "   Podfile을 확인하고 수동으로 'pod install'을 실행해보세요"
	exit 1
fi

if [ ! -d "$XCODE_WORKSPACE" ]; then
	echo "❌ Xcode workspace를 찾을 수 없습니다: $XCODE_WORKSPACE"
	exit 1
fi

echo "🏗️ Xcode 빌드 준비"
# 빌드 디렉토리 정리
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Xcode Command Line Tools 확인
if ! command -v xcodebuild >/dev/null 2>&1; then
	echo "❌ xcodebuild를 찾을 수 없습니다. Xcode Command Line Tools를 설치하세요:"
	echo "   xcode-select --install"
	exit 1
fi

echo "🔍 사용 가능한 시뮬레이터 확인"
xcrun simctl list devices available | grep -i "iphone" | head -5 || true

echo ""
echo "📱 빌드 옵션 선택:"
echo "   1) 시뮬레이터용 빌드 (Simulator)"
echo "   2) 실제 기기용 빌드 (Device) - 서명 필요"
echo -n "선택 (1 또는 2, 기본값: 1): "
read BUILD_TYPE
BUILD_TYPE=${BUILD_TYPE:-1}

SCHEME="App"
CONFIGURATION="Debug"

if [ "$BUILD_TYPE" = "1" ]; then
	echo "📱 시뮬레이터용 빌드 시작..."
	
	# 시뮬레이터 SDK 사용
	SDK="iphonesimulator"
	DESTINATION="generic/platform=iOS Simulator"
	
	# xcodebuild로 빌드
	xcodebuild clean build \
		-workspace "$XCODE_WORKSPACE" \
		-scheme "$SCHEME" \
		-configuration "$CONFIGURATION" \
		-sdk "$SDK" \
		-destination "$DESTINATION" \
		-derivedDataPath "$BUILD_DIR/DerivedData" \
		CODE_SIGN_IDENTITY="" \
		CODE_SIGNING_REQUIRED=NO \
		CODE_SIGNING_ALLOWED=NO
	
	APP_PATH=$(find "$BUILD_DIR/DerivedData" -name "App.app" -type d | head -1)
	
	if [ -n "$APP_PATH" ] && [ -d "$APP_PATH" ]; then
		echo "✅ 시뮬레이터용 앱 빌드 성공: $APP_PATH"
		du -sh "$APP_PATH" | awk '{print "📊 파일 크기:", $1}'
		echo ""
		echo "📲 시뮬레이터에 설치하려면:"
		echo "   xcrun simctl install booted \"$APP_PATH\""
		echo "   xcrun simctl launch booted com.mpz.app"
	else
		echo "❌ 앱 빌드 결과를 찾을 수 없습니다."
		exit 1
	fi
	
elif [ "$BUILD_TYPE" = "2" ]; then
	echo "📱 실제 기기용 빌드 시작..."
	echo "⚠️  실제 기기 빌드는 코드 서명이 필요합니다."
	
	# 실제 기기 SDK 사용
	SDK="iphoneos"
	
	# 개발 팀 ID 확인 (필요시)
	echo -n "개발 팀 ID (Team ID, 선택사항): "
	read TEAM_ID
	
	BUILD_ARGS=(
		-workspace "$XCODE_WORKSPACE"
		-scheme "$SCHEME"
		-configuration "$CONFIGURATION"
		-sdk "$SDK"
		-derivedDataPath "$BUILD_DIR/DerivedData"
	)
	
	if [ -n "$TEAM_ID" ]; then
		BUILD_ARGS+=(
			DEVELOPMENT_TEAM="$TEAM_ID"
		)
	fi
	
	xcodebuild clean build "${BUILD_ARGS[@]}"
	
	APP_PATH=$(find "$BUILD_DIR/DerivedData" -name "App.app" -type d | head -1)
	
	if [ -n "$APP_PATH" ] && [ -d "$APP_PATH" ]; then
		echo "✅ 실제 기기용 앱 빌드 성공: $APP_PATH"
		du -sh "$APP_PATH" | awk '{print "📊 파일 크기:", $1}'
		
		# IPA 생성 (선택사항)
		echo -n "IPA 파일을 생성하시겠습니까? (y/N): "
		read CREATE_IPA
		if [ "$CREATE_IPA" = "y" ] || [ "$CREATE_IPA" = "Y" ]; then
			mkdir -p "$IPA_OUTPUT_DIR/Payload"
			cp -r "$APP_PATH" "$IPA_OUTPUT_DIR/Payload/"
			cd "$IPA_OUTPUT_DIR"
			zip -r "App.ipa" Payload
			echo "✅ IPA 파일 생성 완료: $IPA_OUTPUT_DIR/App.ipa"
			du -sh "$IPA_OUTPUT_DIR/App.ipa" | awk '{print "📊 IPA 파일 크기:", $1}'
		fi
		
		echo ""
		echo "📲 실제 기기에 설치하려면:"
		echo "   - Xcode에서 기기를 연결하고 직접 설치"
		echo "   - 또는 ios-deploy 사용: ios-deploy --bundle \"$APP_PATH\""
	else
		echo "❌ 앱 빌드 결과를 찾을 수 없습니다."
		exit 1
	fi
else
	echo "❌ 잘못된 선택입니다."
	exit 1
fi

echo ""
echo "🎉 완료"

