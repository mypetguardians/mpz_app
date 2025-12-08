#!/usr/bin/env python3
"""
VAPID 키 생성 스크립트

이 스크립트는 웹 푸시 알림을 위한 VAPID 키 쌍을 생성합니다.
생성된 공개 키는 프론트엔드의 .env.local에 NEXT_PUBLIC_VAPID_PUBLIC_KEY로 설정해야 합니다.
개인 키는 백엔드에서 사용할 수 있지만, 현재는 FCM 서버 키를 사용하므로 선택사항입니다.

사용법:
    python3 generate_vapid_keys.py

필요한 패키지:
    pip install pywebpush
    또는
    pip3 install pywebpush
"""

import sys

try:
    from pywebpush import webpush
except ImportError:
    print("=" * 70)
    print("오류: pywebpush 패키지가 설치되지 않았습니다.")
    print("=" * 70)
    print("\n📦 설치 방법:")
    print("\n1. 가상환경 사용 (권장):")
    print("   python3 -m venv venv")
    print("   source venv/bin/activate  # Windows: venv\\Scripts\\activate")
    print("   pip install pywebpush")
    print("\n2. 사용자 설치:")
    print("   pip install --user pywebpush")
    print("\n3. 온라인 도구 사용 (가장 간단) ⭐:")
    print("   - https://web-push-codelab.glitch.me/")
    print("   - https://vapidkeys.com/")
    print("\n4. Node.js 사용:")
    print("   npm install -g web-push")
    print("   web-push generate-vapid-keys")
    print("=" * 70)
    sys.exit(1)


def generate_vapid_keys():
    """VAPID 키 쌍을 생성합니다."""
    # pywebpush를 사용하여 VAPID 키 생성
    vapid_key = webpush.generate_vapid_keys()
    return {
        'publicKey': vapid_key['publicKey'],
        'privateKey': vapid_key['privateKey']
    }


if __name__ == '__main__':
    print("VAPID 키 생성 중...")
    keys = generate_vapid_keys()
    
    print("\n" + "="*60)
    print("생성된 VAPID 키:")
    print("="*60)
    print(f"\n공개 키 (Public Key):")
    print(f"{keys['publicKey']}")
    print(f"\n개인 키 (Private Key):")
    print(f"{keys['privateKey']}")
    print("\n" + "="*60)
    print("\n환경변수 설정:")
    print("="*60)
    print("\n프론트엔드 (.env.local):")
    print(f"NEXT_PUBLIC_VAPID_PUBLIC_KEY={keys['publicKey']}")
    print("\n백엔드 (.env) - 선택사항:")
    print(f"VAPID_PRIVATE_KEY={keys['privateKey']}")
    print("\n" + "="*60)
    print("\n참고: 공개 키는 프론트엔드에 반드시 설정해야 합니다.")
    print("개인 키는 백엔드에서 사용할 수 있지만, 현재는 FCM 서버 키를 사용합니다.")
    print("="*60 + "\n")
