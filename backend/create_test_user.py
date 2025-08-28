#!/usr/bin/env python3
"""
테스트 유저 생성 스크립트
"""

import os
import django
import sys

# Django 환경 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfehome.settings')
django.setup()

from django.contrib.auth import get_user_model
from user.models import Jwt

User = get_user_model()

def create_test_user():
    """테스트 유저 생성"""
    print("="*50)
    print("테스트 유저 생성")
    print("="*50)
    
    # 테스트 유저 정보
    test_username = "test_ai_user"
    test_email = "test_ai@example.com"
    test_password = "testpassword123!"
    test_nickname = "AI테스트유저"
    
    try:
        # 기존 테스트 유저 확인
        if User.objects.filter(username=test_username).exists():
            user = User.objects.get(username=test_username)
            print(f"✅ 기존 테스트 유저 발견: {test_username} (ID: {user.id})")
        else:
            # 새 테스트 유저 생성
            user = User.objects.create_user(
                username=test_username,
                email=test_email,
                password=test_password,
                nickname=test_nickname,
                user_type=User.UserTypeChoice.normal,
            )
            print(f"✅ 새 테스트 유저 생성: {test_username} (ID: {user.id})")
        
        print(f"유저 정보:")
        print(f"  - Username: {user.username}")
        print(f"  - Email: {user.email}")
        print(f"  - Nickname: {user.nickname}")
        print(f"  - User Type: {user.user_type}")
        print(f"  - Created: {user.date_joined}")
        
        return user
        
    except Exception as e:
        print(f"❌ 테스트 유저 생성 실패: {str(e)}")
        return None

def get_jwt_token_for_user(user):
    """사용자에 대한 JWT 토큰 생성"""
    from user.utils import get_access_token
    
    try:
        # JWT 토큰 생성을 위한 payload
        payload = {
            "user_id": str(user.id),
            "username": user.username,
            "email": user.email,
        }
        
        # JWT 토큰 생성
        access_token, exp = get_access_token(payload)
        
        print(f"✅ JWT 토큰 생성 성공")
        print(f"Access Token (처음 20자): {access_token[:20]}...")
        print(f"만료 시간: {exp}")
        
        return access_token
        
    except Exception as e:
        print(f"❌ JWT 토큰 생성 실패: {str(e)}")
        return None

def check_personality_test_status(user):
    """PersonalityTest 상태 확인"""
    from favorites.models import PersonalityTest
    
    try:
        personality_tests = PersonalityTest.objects.filter(user=user)
        
        if personality_tests.exists():
            print(f"✅ 기존 PersonalityTest 발견: {personality_tests.count()}개")
            for test in personality_tests:
                print(f"  - Test ID: {test.id}")
                print(f"  - Answers: {len(test.answers) if test.answers else 0}개")
                print(f"  - Created: {test.created_at}")
        else:
            print("📝 PersonalityTest 없음 - 새로 생성됩니다")
            
    except Exception as e:
        print(f"❌ PersonalityTest 확인 실패: {str(e)}")

if __name__ == "__main__":
    print("테스트 유저 생성 스크립트 시작")
    
    # 1. 테스트 유저 생성/확인
    user = create_test_user()
    if not user:
        sys.exit(1)
    
    print("\n")
    
    # 2. JWT 토큰 생성
    token = get_jwt_token_for_user(user)
    if not token:
        sys.exit(1)
    
    print("\n")
    
    # 3. PersonalityTest 상태 확인
    check_personality_test_status(user)
    
    print("\n" + "="*50)
    print("테스트 유저 준비 완료!")
    print("="*50)
    print(f"Username: {user.username}")
    print(f"Password: testpassword123!")
    print(f"JWT Token: {token}")
    print("="*50)
