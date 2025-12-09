"""
Railway에서 실행할 토큰 확인 스크립트
Railway CLI: railway run python check_tokens_railway.py
또는 Railway 대시보드에서 Django shell 접속 후 실행
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfehome.settings')
django.setup()

from user.models import User
from notifications.models import PushToken

print("\n" + "="*60)
print("푸시 토큰 등록 현황")
print("="*60)

# 모든 활성 토큰 조회
tokens = PushToken.objects.filter(is_active=True).select_related('user').order_by('-last_used', '-created_at')

if not tokens.exists():
    print("\n❌ 등록된 푸시 토큰이 없습니다.")
    print("\niOS 앱을 재시작하고 로그인한 후 다시 확인해주세요.")
else:
    print(f"\n✅ 총 {tokens.count()}개의 활성 토큰이 등록되어 있습니다.\n")
    
    # 플랫폼별로 그룹화
    by_platform = {}
    for token in tokens:
        platform = token.platform or "(알 수 없음)"
        if platform not in by_platform:
            by_platform[platform] = []
        by_platform[platform].append(token)
    
    # 플랫폼별 출력
    for platform, platform_tokens in by_platform.items():
        print(f"\n📱 {platform.upper()} 플랫폼: {len(platform_tokens)}개")
        print("-" * 60)
        for token in platform_tokens:
            print(f"  사용자: {token.user.username} (ID: {str(token.user.id)[:8]}...)")
            print(f"  토큰: {token.token[:50]}...")
            print(f"  등록일: {token.last_used or token.created_at}")
            print()

print("="*60)
