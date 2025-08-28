#!/usr/bin/env python3
"""
AI 동물 추천 API 테스트 스크립트 (JWT 토큰 포함)
"""

import requests
import json
from datetime import datetime

# API 기본 설정
BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/v1/auth/login"
API_ENDPOINT = f"{BASE_URL}/v1/ai/recommend"

# 테스트 유저 정보 (create_test_user.py로 생성된 유저)
TEST_USERNAME = "test_ai_user"
TEST_PASSWORD = "testpassword123!"

# 테스트 데이터
test_preferences = {
    "평소 성격은 어떤 편인가요?": "외향적이고 사교적인 편이에요",
    "반려동물에게 원하는 성격은?": "활발하고 친근한 성격이 좋아요",
    "새로운 환경에 적응하는 편인가요?": "빠르게 적응하는 편이에요",
    "스트레스 받을 때 어떻게 해결하나요?": "활동적인 것을 하며 해결해요",
    "당신의 생활 공간에 더 가까운 것은 어떤 편인가요?": "활발하고 넓은 공간을 좋아해요",
    "반려동물과 함께하는 시간을 어떻게 보내고 싶나요?": "산책이나 운동을 함께 하고 싶어요"
}

# 요청 데이터
request_data = {
    "preferences": test_preferences,
    "limit": 3
}

def login_and_get_token():
    """로그인 후 JWT 토큰 받기"""
    print("="*50)
    print("로그인 및 JWT 토큰 받기")
    print("="*50)
    
    login_data = {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"로그인 응답 코드: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            token = result.get("access_token") or result.get("token")
            if token:
                print("✅ 로그인 성공! JWT 토큰을 받았습니다.")
                print(f"Token (처음 20자): {token[:20]}...")
                return token
            else:
                print("❌ 토큰을 찾을 수 없습니다.")
                print(f"응답 데이터: {result}")
                return None
        else:
            print(f"❌ 로그인 실패: {response.status_code}")
            print(f"오류 내용: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 로그인 중 오류: {str(e)}")
        return None

def test_ai_recommendation(jwt_token):
    """AI 동물 추천 API 테스트"""
    print("="*50)
    print("AI 동물 추천 API 테스트 시작")
    print("="*50)
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt_token}"
    }
    
    print(f"API 엔드포인트: {API_ENDPOINT}")
    print(f"요청 데이터:")
    print(json.dumps(request_data, ensure_ascii=False, indent=2))
    print("-"*50)
    
    try:
        # API 호출
        response = requests.post(
            API_ENDPOINT,
            json=request_data,
            headers=headers,
            timeout=60  # AI 처리 시간을 고려하여 시간 증가
        )
        
        print(f"응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI API 호출 성공!")
            print(f"응답 데이터:")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
            # PersonalityTest 상태 확인
            if "personality_test_status" in result:
                test_status = result["personality_test_status"]
                print(f"\n📋 PersonalityTest 상태: {test_status.get('action', 'unknown')}")
                print(f"테스트 ID: {test_status.get('personality_test_id', 'N/A')}")
                print(f"메시지: {test_status.get('message', 'N/A')}")
            
            # AI 결과 확인
            if "data" in result:
                ai_data = result["data"]
                print(f"\n🤖 AI 결과:")
                if isinstance(ai_data, dict):
                    if "matching_reasons" in ai_data:
                        print(f"매칭 이유: {ai_data.get('matching_reasons', 'N/A')}")
                    if "animals" in ai_data:
                        animals = ai_data.get("animals", [])
                        print(f"추천 동물 수: {len(animals)}마리")
                        for i, animal in enumerate(animals[:3], 1):
                            print(f"  {i}. 이름: {animal.get('name', 'N/A')}")
                            print(f"     품종: {animal.get('breed', 'N/A')}")
                            print(f"     나이: {animal.get('age', 'N/A')}")
                else:
                    print(f"AI 결과 타입: {type(ai_data)}")
                    
        elif response.status_code == 401:
            print("❌ 인증 오류 (JWT 토큰 문제)")
            
        else:
            print(f"❌ API 호출 실패: {response.status_code}")
            print(f"오류 내용: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 서버 연결 실패 - Django 서버가 실행 중인지 확인하세요.")
    except requests.exceptions.Timeout:
        print("❌ 요청 시간 초과 (AI 처리 시간이 길 수 있습니다)")
    except Exception as e:
        print(f"❌ 예외 발생: {str(e)}")

def check_db_after_test():
    """테스트 후 DB 상태 확인"""
    print("="*50)
    print("DB 상태 확인 (PersonalityTest)")
    print("="*50)
    print("테스트 후 Django admin에서 PersonalityTest 테이블을 확인해보세요:")
    print(f"- Admin URL: {BASE_URL}/admin/")
    print("- PersonalityTest 모델에서 새로운 레코드가 생성되었는지 확인")
    print("- answers 필드에 preferences 데이터가 저장되었는지 확인")

def test_server_health():
    """서버 상태 확인"""
    print("="*50)
    print("서버 상태 확인")
    print("="*50)
    
    try:
        # 간단한 GET 요청으로 서버 상태 확인
        response = requests.get(f"{BASE_URL}/swagger/", timeout=5)
        if response.status_code == 200:
            print("✅ 서버가 정상적으로 실행 중입니다.")
            return True
        else:
            print(f"❌ 서버 응답 오류: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 서버 연결 실패: {str(e)}")
        return False

if __name__ == "__main__":
    print(f"테스트 시작 시간: {datetime.now().isoformat()}")
    print(f"테스트 유저: {TEST_USERNAME}")
    
    # 1. 서버 상태 확인
    if not test_server_health():
        exit(1)
    
    print("\n")
    
    # 2. 로그인 및 JWT 토큰 받기
    jwt_token = login_and_get_token()
    if not jwt_token:
        print("\n❌ 로그인 실패! 먼저 create_test_user.py를 실행하여 테스트 유저를 생성하세요.")
        print("실행 명령: python create_test_user.py")
        exit(1)
    
    print("\n")
    
    # 3. AI 동물 추천 API 테스트
    test_ai_recommendation(jwt_token)
    
    print("\n")
    
    # 4. DB 상태 확인 안내
    check_db_after_test()
    
    print(f"\n테스트 종료 시간: {datetime.now().isoformat()}")
    print("="*50)
    print("✅ 테스트 완료!")
    print("="*50)
