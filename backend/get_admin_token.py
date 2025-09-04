#!/usr/bin/env python3
"""
관리자 JWT 토큰 발급 스크립트

이 스크립트는 관리자 계정으로 로그인하여 JWT 토큰을 발급받습니다.
"""

import requests
import json
import os

def get_admin_token():
    """관리자 JWT 토큰 발급"""
    
    # API 기본 URL
    api_base_url = "https://mpzfullstack-production.up.railway.app"
    
    # 관리자 계정 정보 (실제 정보로 교체하세요)
    admin_username = input("관리자 사용자명을 입력하세요: ")
    admin_password = input("관리자 비밀번호를 입력하세요: ")
    
    # 로그인 API 호출
    login_url = f"{api_base_url}/v1/user/login"
    
    payload = {
        "username": admin_username,
        "password": admin_password
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("🔐 관리자 계정으로 로그인 중...")
        response = requests.post(login_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'access_token' in data:
                token = data['access_token']
                print("✅ JWT 토큰이 성공적으로 발급되었습니다!")
                print(f"🔑 토큰: {token}")
                print("\n📋 이 토큰을 QStash 스케줄 등록 시 사용하세요:")
                print(f"   Authorization: Bearer {token}")
                
                # 토큰을 파일에 저장
                with open('admin_token.txt', 'w') as f:
                    f.write(token)
                print("\n💾 토큰이 'admin_token.txt' 파일에 저장되었습니다.")
                
                return token
            else:
                print("❌ 응답에 access_token이 없습니다.")
                print(f"응답: {data}")
                return None
                
        else:
            print(f"❌ 로그인 실패: {response.status_code}")
            print(f"응답: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 로그인 중 오류 발생: {e}")
        return None

def test_token(token):
    """토큰 유효성 테스트"""
    if not token:
        return False
        
    api_base_url = "https://mpzfullstack-production.up.railway.app"
    test_url = f"{api_base_url}/v1/animals/public-data/status"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print("🧪 토큰 유효성 테스트 중...")
        response = requests.get(test_url, headers=headers)
        
        if response.status_code == 200:
            print("✅ 토큰이 유효합니다!")
            return True
        else:
            print(f"❌ 토큰 테스트 실패: {response.status_code}")
            print(f"응답: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 토큰 테스트 중 오류 발생: {e}")
        return False

if __name__ == "__main__":
    print("🚀 관리자 JWT 토큰 발급 시작...\n")
    
    # 토큰 발급
    token = get_admin_token()
    
    if token:
        print("\n" + "="*50)
        # 토큰 유효성 테스트
        test_token(token)
        
        print("\n📋 다음 단계:")
        print("1. 위의 토큰을 복사하세요")
        print("2. QStash 대시보드에서 스케줄 등록 시 사용하세요")
        print("3. 또는 qstash_curl_commands.sh 스크립트의 ADMIN_JWT_TOKEN 변수에 설정하세요")
    else:
        print("\n❌ 토큰 발급에 실패했습니다.")
        print("🔧 관리자 계정 정보를 확인하고 다시 시도해주세요.")
