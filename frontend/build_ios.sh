#!/bin/zsh
set -e

echo "🚀 iOS 패키징 시작 (Capacitor + Next.js)..."

# ============================================
# 경로 설정
# ============================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"
IOS_DIR="$FRONTEND_DIR/ios"
WEB_BUILD_DIR="$FRONTEND_DIR/.next"
IOS_APP_DIR="$IOS_DIR/App"
XCODE_WORKSPACE="$IOS_APP_DIR/App.xcworkspace"
BUILD_DIR="$IOS_APP_DIR/build"

# ============================================
# 색상 정의
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# 유틸리티 함수
# ============================================
print_success() {
    echo "${GREEN}✅ $1${NC}"
}

print_error() {
    echo "${RED}❌ $1${NC}"
}

print_warning() {
    echo "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        print_error "$1을(를) 찾을 수 없습니다."
        if [ -n "$2" ]; then
            echo "   설치 방법: $2"
        fi
        exit 1
    fi
}

# ============================================
# 사전 체크
# ============================================
echo ""
echo "📋 사전 체크 중..."
check_command "node" "https://nodejs.org 에서 Node.js 설치"
check_command "npm" "Node.js와 함께 자동 설치됨"
check_command "npx" "npm install -g npx"
check_command "pod" "sudo gem install cocoapods"
check_command "xcodebuild" "xcode-select --install"

print_success "모든 필수 도구가 설치되어 있습니다."

# ============================================
# Node.js 의존성 설치
# ============================================
echo ""
echo "📦 Node.js 의존성 확인 중..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    print_info "node_modules가 없습니다. 의존성을 설치합니다..."
    npm install
    print_success "의존성 설치 완료"
else
    print_info "node_modules가 이미 존재합니다. 스킵..."
fi

# ============================================
# Next.js 빌드
# ============================================
echo ""
echo "🏗️  Next.js 프로덕션 빌드 시작..."

export NEXT_TELEMETRY_DISABLED=1
export NEXT_DISABLE_SOURCEMAP=1

# 기존 빌드 디렉토리 제거
rm -rf "$WEB_BUILD_DIR"

# Next.js 빌드
if npm run build; then
    print_success "Next.js 빌드 완료"
else
    print_error "Next.js 빌드 실패"
    exit 1
fi

# 빌드 최적화
echo ""
print_info "빌드 최적화 중..."

# 소스맵 제거 (용량 절감)
find "$WEB_BUILD_DIR" -name "*.map" -delete 2>/dev/null || true
print_success "소스맵 파일 제거 완료"

# 타입 파일 제거 (Capacitor에 불필요)
if [ -d "$WEB_BUILD_DIR/types" ]; then
    rm -rf "$WEB_BUILD_DIR/types"
    print_success "타입 파일 제거 완료"
fi

# ============================================
# Capacitor Sync
# ============================================
echo ""
echo "🔄 Capacitor iOS 동기화..."

# iOS 플랫폼이 없으면 추가
if [ ! -d "$IOS_DIR" ]; then
    print_warning "iOS 플랫폼이 없습니다. 추가 중..."
    npx cap add ios
fi

# Capacitor sync 전에 빌드 디렉토리 완전 제거
# (Xcode 빌드 시스템이 인식하지 못하는 디렉토리는 삭제할 수 없어서 에러 발생)
if [ -d "$IOS_APP_DIR/build" ]; then
    print_info "기존 빌드 디렉토리 제거 중..."
    rm -rf "$IOS_APP_DIR/build"
    print_success "빌드 디렉토리 정리 완료"
fi

# Capacitor sync
npx cap sync ios
print_success "Capacitor 동기화 완료"

# Sync 후 불필요한 타입 파일 제거
IOS_PUBLIC_TYPES="$IOS_APP_DIR/App/public/types"
if [ -d "$IOS_PUBLIC_TYPES" ]; then
    rm -rf "$IOS_PUBLIC_TYPES"
    print_success "iOS 타입 파일 정리 완료"
fi

# ============================================
# CocoaPods 설치
# ============================================
echo ""
echo "📦 CocoaPods 의존성 설치..."
cd "$IOS_APP_DIR"

if pod install; then
    print_success "CocoaPods 의존성 설치 완료"
else
    print_error "CocoaPods 설치 실패"
    exit 1
fi

# ============================================
# Xcode Workspace 확인
# ============================================
if [ ! -d "$XCODE_WORKSPACE" ]; then
    print_error "Xcode workspace를 찾을 수 없습니다: $XCODE_WORKSPACE"
    exit 1
fi

# ============================================
# 빌드 옵션 선택
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 빌드 타겟 선택"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1) 시뮬레이터 (빠른 테스트용)"
echo "  2) 실제 기기 (코드 서명 필요)"
echo "  3) Archive (TestFlight/App Store 배포용)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "선택 [1-3, 기본값: 1]: "
read BUILD_TYPE
BUILD_TYPE=${BUILD_TYPE:-1}

SCHEME="App"
CONFIGURATION="Release"

# 빌드 디렉토리 정리
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# ============================================
# 1. 시뮬레이터 빌드
# ============================================
if [ "$BUILD_TYPE" = "1" ]; then
    echo ""
    echo "📱 시뮬레이터용 빌드 시작..."
    
    SDK="iphonesimulator"
    DESTINATION="generic/platform=iOS Simulator"
    
    xcodebuild clean build \
        -workspace "$XCODE_WORKSPACE" \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -sdk "$SDK" \
        -destination "$DESTINATION" \
        -derivedDataPath "$BUILD_DIR/DerivedData" \
        CODE_SIGN_IDENTITY="" \
        CODE_SIGNING_REQUIRED=NO \
        CODE_SIGNING_ALLOWED=NO \
        | xcpretty || xcodebuild clean build \
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
        echo ""
        print_success "시뮬레이터용 앱 빌드 완료"
        echo "📍 위치: $APP_PATH"
        du -sh "$APP_PATH" | awk -v blue="$BLUE" -v nc="$NC" '{print blue "📊 크기: " $1 nc}'
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🚀 시뮬레이터 실행 방법"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1️⃣  부팅된 시뮬레이터에 설치:"
        echo "   xcrun simctl install booted \"$APP_PATH\""
        echo ""
        echo "2️⃣  앱 실행:"
        echo "   xcrun simctl launch booted com.mpz.app"
        echo ""
        echo "3️⃣  또는 Xcode에서:"
        echo "   - Xcode 열기"
        echo "   - 시뮬레이터 선택 후 Cmd+R"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        print_error "앱 빌드 결과를 찾을 수 없습니다."
        exit 1
    fi

# ============================================
# 2. 실제 기기 빌드
# ============================================
elif [ "$BUILD_TYPE" = "2" ]; then
    echo ""
    echo "📱 실제 기기용 빌드 시작..."
    print_warning "코드 서명이 필요합니다."
    
    SDK="iphoneos"
    
    echo ""
    echo -n "개발 팀 ID (선택사항): "
    read TEAM_ID
    
    BUILD_ARGS=(
        clean build
        -workspace "$XCODE_WORKSPACE"
        -scheme "$SCHEME"
        -configuration "$CONFIGURATION"
        -sdk "$SDK"
        -derivedDataPath "$BUILD_DIR/DerivedData"
    )
    
    if [ -n "$TEAM_ID" ]; then
        BUILD_ARGS+=(DEVELOPMENT_TEAM="$TEAM_ID")
    fi
    
    xcodebuild "${BUILD_ARGS[@]}" \
        | xcpretty || xcodebuild "${BUILD_ARGS[@]}"
    
    APP_PATH=$(find "$BUILD_DIR/DerivedData" -name "App.app" -type d | head -1)
    
    if [ -n "$APP_PATH" ] && [ -d "$APP_PATH" ]; then
        echo ""
        print_success "실제 기기용 앱 빌드 완료"
        echo "📍 위치: $APP_PATH"
        du -sh "$APP_PATH" | awk -v blue="$BLUE" -v nc="$NC" '{print blue "📊 크기: " $1 nc}'
        
        echo ""
        echo -n "IPA 파일을 생성하시겠습니까? [y/N]: "
        read CREATE_IPA
        
        if [ "$CREATE_IPA" = "y" ] || [ "$CREATE_IPA" = "Y" ]; then
            IPA_DIR="$BUILD_DIR/ipa"
            mkdir -p "$IPA_DIR/Payload"
            cp -r "$APP_PATH" "$IPA_DIR/Payload/"
            cd "$IPA_DIR"
            zip -qr "MPZ.ipa" Payload
            rm -rf Payload
            
            echo ""
            print_success "IPA 파일 생성 완료"
            echo "📍 위치: $IPA_DIR/MPZ.ipa"
            du -sh "$IPA_DIR/MPZ.ipa" | awk -v blue="$BLUE" -v nc="$NC" '{print blue "📊 크기: " $1 nc}'
        fi
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🚀 기기 설치 방법"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1️⃣  Xcode 사용:"
        echo "   - 기기를 Mac에 연결"
        echo "   - Xcode에서 기기 선택 후 Cmd+R"
        echo ""
        echo "2️⃣  ios-deploy 사용:"
        echo "   ios-deploy --bundle \"$APP_PATH\""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        print_error "앱 빌드 결과를 찾을 수 없습니다."
        exit 1
    fi

# ============================================
# 3. Archive (배포용)
# ============================================
elif [ "$BUILD_TYPE" = "3" ]; then
    echo ""
    echo "📦 Archive 빌드 시작 (배포용)..."
    print_warning "유효한 프로비저닝 프로파일과 인증서가 필요합니다."
    
    echo ""
    echo -n "개발 팀 ID: "
    read TEAM_ID
    
    if [ -z "$TEAM_ID" ]; then
        print_error "배포용 빌드에는 팀 ID가 필수입니다."
        exit 1
    fi
    
    ARCHIVE_PATH="$BUILD_DIR/MPZ.xcarchive"
    
    xcodebuild clean archive \
        -workspace "$XCODE_WORKSPACE" \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -archivePath "$ARCHIVE_PATH" \
        DEVELOPMENT_TEAM="$TEAM_ID" \
        | xcpretty || xcodebuild clean archive \
        -workspace "$XCODE_WORKSPACE" \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -archivePath "$ARCHIVE_PATH" \
        DEVELOPMENT_TEAM="$TEAM_ID"
    
    if [ -d "$ARCHIVE_PATH" ]; then
        echo ""
        print_success "Archive 생성 완료"
        echo "📍 위치: $ARCHIVE_PATH"
        du -sh "$ARCHIVE_PATH" | awk -v blue="$BLUE" -v nc="$NC" '{print blue "📊 크기: " $1 nc}'
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🚀 배포 방법"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1️⃣  Xcode Organizer 사용:"
        echo "   - Xcode → Window → Organizer"
        echo "   - Archive 선택 → Distribute App"
        echo ""
        echo "2️⃣  또는 다음 명령어로 IPA 생성:"
        echo "   xcodebuild -exportArchive \\"
        echo "     -archivePath \"$ARCHIVE_PATH\" \\"
        echo "     -exportPath \"$BUILD_DIR/export\" \\"
        echo "     -exportOptionsPlist ExportOptions.plist"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        print_error "Archive 생성 실패"
        exit 1
    fi

else
    print_error "잘못된 선택입니다."
    exit 1
fi

# ============================================
# 완료
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "빌드 완료! 🎉"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"