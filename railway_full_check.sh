#!/bin/bash
# Railway 전체 체크 및 테스트 스크립트

set -e

cd /Users/jhy20/mpz_fullstack

echo "=========================================="
echo "🚂 Railway iOS FCM 토큰 확인 및 테스트"
echo "=========================================="
echo ""

# 1. Railway 로그인 확인
echo "1️⃣ Railway 로그인 확인..."
if railway whoami > /dev/null 2>&1; then
    echo "✅ 로그인됨: $(railway whoami)"
else
    echo "❌ Railway에 로그인되어 있지 않습니다."
    echo ""
    echo "다음 명령어로 로그인하세요:"
    echo "   railway login"
    echo ""
    exit 1
fi
echo ""

# 2. 프로젝트 링크 확인
echo "2️⃣ 프로젝트 링크 확인..."
if railway status > /dev/null 2>&1; then
    echo "✅ 프로젝트가 링크되어 있습니다."
    railway status
else
    echo "⚠️  프로젝트가 링크되지 않았습니다."
    echo ""
    echo "사용 가능한 프로젝트 목록:"
    railway list
    echo ""
    echo "다음 명령어로 프로젝트를 링크하세요:"
    echo "   railway link"
    echo ""
    exit 1
fi
echo ""

# 3. 토큰 확인
echo "3️⃣ 푸시 토큰 등록 현황 확인..."
echo "------------------------------------------"
railway run python manage.py shell -c "
from notifications.models import PushToken
tokens = PushToken.objects.filter(is_active=True).select_related('user')
print('\n✅ 총', tokens.count(), '개의 활성 토큰')
ios_count = tokens.filter(platform='ios').count()
android_count = tokens.filter(platform='android').count()
web_count = tokens.filter(platform='web').count()
print(f'  iOS: {ios_count}개, Android: {android_count}개, Web: {web_count}개')
if ios_count > 0:
    print('\n등록된 iOS 토큰:')
    for token in tokens.filter(platform='ios'):
        print(f'  - {token.user.username}: {token.token[:50]}...')
"
echo ""

# 4. 환경 변수 확인
echo "4️⃣ FCM 환경 변수 확인..."
echo "------------------------------------------"
railway variables | grep -E "FCM|FIREBASE" || echo "FCM 관련 환경 변수를 찾을 수 없습니다."
echo ""

# 5. 테스트 알림 전송 (dry-run)
echo "5️⃣ 테스트 알림 전송 (dry-run 모드)..."
echo "------------------------------------------"
railway run python manage.py test_fcm --dry-run --title "테스트 알림" --body "iOS 알림 테스트입니다"
echo ""

# 6. 실제 테스트 알림 전송 여부 확인
echo "=========================================="
echo "실제 테스트 알림을 전송하시겠습니까?"
echo "=========================================="
read -p "전송하려면 'y'를 입력하세요: " -r response
echo ""

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "6️⃣ 테스트 알림 전송 중..."
    echo "------------------------------------------"
    railway run python manage.py test_fcm --title "테스트 알림" --body "iOS 알림 테스트입니다"
else
    echo "테스트 알림 전송을 건너뜁니다."
fi

echo ""
echo "=========================================="
echo "✅ 완료!"
echo "=========================================="
