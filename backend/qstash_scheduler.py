"""
QStash 스케줄러 설정

공공데이터 API를 매일 새벽 2시에 자동으로 호출하는 스케줄러입니다.
"""

import os
import requests
from datetime import datetime, timedelta
from django.conf import settings


class QStashScheduler:
    """QStash 스케줄러 클래스"""
    
    def __init__(self):
        self.qstash_token = os.getenv('QSTASH_TOKEN')
        self.qstash_url = os.getenv('QSTASH_URL', 'https://qstash.upstash.io/v2/publish')
        self.api_base_url = os.getenv('API_BASE_URL', 'https://your-domain.com')
        
    def schedule_public_data_sync(self, cron_expression: str = "0 2 * * *"):
        """
        공공데이터 동기화 스케줄 등록
        
        Args:
            cron_expression: Cron 표현식 (기본값: 매일 새벽 2시)
        """
        if not self.qstash_token:
            print("QStASH_TOKEN이 설정되지 않았습니다.")
            return False
            
        headers = {
            'Authorization': f'Bearer {self.qstash_token}',
            'Content-Type': 'application/json'
        }
        
        # API 엔드포인트 URL
        target_url = f"{self.api_base_url}/v1/animals/public-data/sync"
        
        # qstash에 스케줄 등록
        payload = {
            "url": target_url,
            "cron": cron_expression,
            "headers": {
                "Content-Type": "application/json"
            }
        }
        
        try:
            response = requests.post(
                f"{self.qstash_url}/schedules",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"공공데이터 동기화 스케줄이 등록되었습니다: {cron_expression}")
                return True
            else:
                print(f"스케줄 등록 실패: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"스케줄 등록 중 오류 발생: {e}")
            return False
    
    def schedule_immediate_sync(self):
        """즉시 공공데이터 동기화 실행"""
        if not self.qstash_token:
            print("QSTASH_TOKEN이 설정되지 않았습니다.")
            return False
            
        headers = {
            'Authorization': f'Bearer {self.qstash_token}',
            'Content-Type': 'application/json'
        }
        
        # API 엔드포인트 URL
        target_url = f"{self.api_base_url}/v1/animals/public-data/sync"
        
        # qstash에 즉시 실행 요청
        payload = {
            "url": target_url,
            "headers": {
                "Content-Type": "application/json"
            }
        }
        
        try:
            response = requests.post(
                f"{self.qstash_url}/publish",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                print("공공데이터 동기화가 즉시 실행되도록 요청되었습니다.")
                return True
            else:
                print(f"즉시 실행 요청 실패: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"즉시 실행 요청 중 오류 발생: {e}")
            return False


def setup_qstash_scheduler():
    """qstash 스케줄러 설정"""
    scheduler = QStashScheduler()
    
    # 매일 새벽 2시에 실행되는 스케줄 등록
    success = scheduler.schedule_public_data_sync("0 2 * * *")
    
    if success:
        print("✅ qstash 스케줄러 설정이 완료되었습니다.")
        print("📅 매일 새벽 2시에 공공데이터 동기화가 자동으로 실행됩니다.")
    else:
        print("❌ qstash 스케줄러 설정에 실패했습니다.")
        print("🔧 환경 변수를 확인하고 다시 시도해주세요.")


if __name__ == "__main__":
    setup_qstash_scheduler()
