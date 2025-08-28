#!/usr/bin/env python3
"""
AI 동물 추천 API 테스트 스크립트 (직접 JWT 토큰 사용)
"""

import requests
import json
from datetime import datetime

# API 기본 설정
BASE_URL = "http://localhost:8000"
API_ENDPOINT = f"{BASE_URL}/v1/ai/recommend"

# 직접 생성한 JWT 토큰 (create_test_user.py에서 생성됨)
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjM2NDg0Njc5MjQsInVzZXJfaWQiOiIxYWY4NDQzYi0wZmVhLTQ5N2EtOWRjZC1mNDY1ODlkZmMxMmMiLCJ1c2VybmFtZSI6InRlc3RfYWlfdXNlciIsImVtYWlsIjoidGVzdF9haUBleGFtcGxlLmNvbSJ9.2ZTBqlnEeEHnuHZWek54EZ9B1EzJZiOUP7MaUZ9JB44"

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

def test_ai_recommendation():
    """AI 동물 추천 API 테스트"""
    print("="*60)
    print("AI 동물 추천 API 테스트 시작")
    print("="*60)
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JWT_TOKEN}"
    }
    
    print(f"API 엔드포인트: {API_ENDPOINT}")
    print(f"테스트 유저: test_ai_user")
    print(f"JWT 토큰 (처음 20자): {JWT_TOKEN[:20]}...")
    print(f"\n요청 데이터:")
    print(json.dumps(request_data, ensure_ascii=False, indent=2))
    print("-"*60)
    
    try:
        # API 호출
        print("🚀 AI API 호출 중...")
        response = requests.post(
            API_ENDPOINT,
            json=request_data,
            headers=headers,
            timeout=600  # AI 처리 시간을 고려하여 시간 증가
        )
        
        print(f"응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI API 호출 성공!")
            print(f"\n응답 데이터:")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
            # PersonalityTest 상태 확인
            if "personality_test_status" in result:
                test_status = result["personality_test_status"]
                print(f"\n" + "="*50)
                print("📋 PersonalityTest DB 저장 상태")
                print("="*50)
                print(f"작업: {test_status.get('action', 'unknown')}")
                print(f"테스트 ID: {test_status.get('personality_test_id', 'N/A')}")
                print(f"메시지: {test_status.get('message', 'N/A')}")
            
            # AI 결과 확인
            if "data" in result:
                ai_data = result["data"]
                print(f"\n" + "="*50)
                print("🤖 AI 추천 결과")
                print("="*50)
                
                if isinstance(ai_data, dict):
                    if "matching_reasons" in ai_data:
                        print(f"매칭 이유:\n{ai_data.get('matching_reasons', 'N/A')}")
                        
                    if "animals" in ai_data:
                        animals = ai_data.get("animals", [])
                        print(f"\n추천 동물 수: {len(animals)}마리")
                        for i, animal in enumerate(animals[:3], 1):
                            print(f"\n  🐕 {i}번째 추천:")
                            print(f"     이름: {animal.get('name', 'N/A')}")
                            print(f"     품종: {animal.get('breed', 'N/A')}")
                            print(f"     나이: {animal.get('age', 'N/A')}")
                            print(f"     성별: {animal.get('gender', 'N/A')}")
                            print(f"     크기: {animal.get('size', 'N/A')}")
                else:
                    print(f"AI 결과 타입: {type(ai_data)}")
                    print(f"Raw 응답: {ai_data}")
                    
        elif response.status_code == 401:
            print("❌ 인증 오류 (JWT 토큰 문제)")
            print("JWT 토큰이 만료되었거나 잘못되었습니다.")
            
        else:
            print(f"❌ API 호출 실패: {response.status_code}")
            print(f"오류 내용: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 서버 연결 실패 - Django 서버가 실행 중인지 확인하세요.")
    except requests.exceptions.Timeout:
        print("❌ 요청 시간 초과 (AI 처리 시간이 길 수 있습니다)")
    except Exception as e:
        print(f"❌ 예외 발생: {str(e)}")

def test_server_health():
    """서버 상태 확인"""
    print("="*50)
    print("서버 상태 확인")
    print("="*50)
    
    try:
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
    
    # 1. 서버 상태 확인
    if not test_server_health():
        exit(1)
    
    print("\n")
    
    # 2. AI 동물 추천 API 테스트
    test_ai_recommendation()
    
    print(f"\n" + "="*60)
    print("📊 DB 확인 방법")
    print("="*60)
    print("테스트 후 Django admin에서 확인할 사항:")
    print(f"1. Admin URL: {BASE_URL}/admin/")
    print("2. PersonalityTest 모델에서 새로운 레코드 확인")
    print("3. answers 필드에 preferences 데이터가 저장되었는지 확인")
    print("4. result 필드에 AI 추천 결과가 저장되었는지 확인")
    
    print(f"\n테스트 종료 시간: {datetime.now().isoformat()}")
    print("="*60)
    print("✅ 테스트 완료!")
    print("="*60)
