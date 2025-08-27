#!/usr/bin/env python3
"""
PersonalityTest DB 상태를 직접 확인하는 스크립트
"""

import os
import django
import sys

# Django 환경 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfehome.settings')
django.setup()

from favorites.models import PersonalityTest
from django.contrib.auth import get_user_model

User = get_user_model()

def check_personality_test_db():
    """PersonalityTest DB 상태 확인"""
    print("="*60)
    print("PersonalityTest DB 상태 확인")
    print("="*60)
    
    try:
        # 테스트 유저 찾기
        test_user = User.objects.get(username="test_ai_user")
        print(f"✅ 테스트 유저 발견: {test_user.username} (ID: {test_user.id})")
        
        # PersonalityTest 조회
        personality_tests = PersonalityTest.objects.filter(user=test_user)
        
        print(f"\n📊 PersonalityTest 레코드 수: {personality_tests.count()}개")
        
        if personality_tests.exists():
            print("\n" + "="*50)
            for i, test in enumerate(personality_tests, 1):
                print(f"🔍 PersonalityTest #{i}")
                print(f"  - ID: {test.id}")
                print(f"  - Test Type: {test.test_type}")
                print(f"  - Created: {test.created_at}")
                print(f"  - Completed: {test.completed_at}")
                print(f"  - Answers: {type(test.answers)} ({len(test.answers) if test.answers else 0} 항목)")
                
                if test.answers:
                    print("  - Answers 내용:")
                    for key, value in test.answers.items():
                        print(f"    * {key}: {value}")
                
                if hasattr(test, 'result') and test.result:
                    print(f"  - Result: 저장됨 ({len(str(test.result))} 문자)")
                else:
                    print("  - Result: 저장되지 않음")
                    
                print("-" * 50)
        else:
            print("❌ PersonalityTest 레코드가 없습니다.")
            print("AI API가 올바르게 호출되지 않았거나 저장에 실패했을 수 있습니다.")
            
        # 전체 PersonalityTest 통계
        total_tests = PersonalityTest.objects.count()
        print(f"\n📈 전체 PersonalityTest 레코드 수: {total_tests}개")
        
    except User.DoesNotExist:
        print("❌ test_ai_user를 찾을 수 없습니다.")
        print("먼저 create_test_user.py를 실행하여 테스트 유저를 생성하세요.")
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")

if __name__ == "__main__":
    check_personality_test_db()
