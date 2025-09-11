"""
QStash 공공 데이터 API 스케줄 설정

이 스크립트는 공공 데이터 동기화를 위한 다양한 QStash 스케줄을 등록합니다.
"""

import os
import requests
from datetime import datetime, timedelta
from django.conf import settings


class QStashPublicDataScheduler:
    """QStash 공공 데이터 스케줄러 클래스"""
    
    def __init__(self):
        self.qstash_token = os.getenv('QSTASH_TOKEN')
        self.qstash_url = os.getenv('QSTASH_URL', 'https://qstash.upstash.io/v2/publish')
        self.api_base_url = os.getenv('API_BASE_URL', 'https://your-domain.com')
        self.api_key = os.getenv('PUBLIC_DATA_API_KEY')  # 헤더 기반 API 키
        
    def _make_request(self, url: str, cron: str = None, delay: int = None):
        """QStash 요청 생성"""
        if not self.qstash_token:
            print("❌ QSTASH_TOKEN이 설정되지 않았습니다.")
            return False
            
        headers = {
            'Authorization': f'Bearer {self.qstash_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "url": url,
            "headers": {
                "X-API-Key": self.api_key,
                "Content-Type": "application/json"
            }
        }
        
        if cron:
            payload["cron"] = cron
        if delay:
            payload["delay"] = f"{delay}s"
        
        try:
            endpoint = f"{self.qstash_url}/schedules" if cron else f"{self.qstash_url}/publish"
            response = requests.post(endpoint, json=payload, headers=headers)
            
            if response.status_code in [200, 201]:
                return True
            else:
                print(f"❌ 요청 실패: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ 요청 중 오류 발생: {e}")
            return False
    
    def setup_daily_incremental_sync(self):
        """매일 새벽 2시 증분 동기화 (최근 데이터만)"""
        url = f"{self.api_base_url}/v1/animals/public-data/sync"
        cron = "0 2 * * *"  # 매일 새벽 2시
        
        print("📅 매일 증분 동기화 스케줄 등록 중...")
        success = self._make_request(url, cron=cron)
        
        if success:
            print("✅ 매일 새벽 2시 증분 동기화 스케줄이 등록되었습니다.")
            print("   - 목적: 최근 데이터만 가져와서 새 동물 추가")
            print("   - 전략: incremental (기본값)")
        else:
            print("❌ 매일 증분 동기화 스케줄 등록에 실패했습니다.")
        
        return success
    
    def setup_weekly_status_check(self):
        """주말 새벽 3시 상태 체크 동기화"""
        url = f"{self.api_base_url}/v1/animals/public-data/sync?sync_strategy=status_check"
        cron = "0 3 * * 0"  # 매주 일요일 새벽 3시
        
        print("📅 주간 상태 체크 동기화 스케줄 등록 중...")
        success = self._make_request(url, cron=cron)
        
        if success:
            print("✅ 주간 상태 체크 동기화 스케줄이 등록되었습니다.")
            print("   - 목적: 전체 데이터를 가져와서 상태 변경 확인")
            print("   - 전략: status_check")
        else:
            print("❌ 주간 상태 체크 동기화 스케줄 등록에 실패했습니다.")
        
        return success
    
    def setup_monthly_full_sync(self):
        """매월 1일 새벽 4시 전체 동기화"""
        url = f"{self.api_base_url}/v1/animals/public-data/sync?sync_strategy=full"
        cron = "0 4 1 * *"  # 매월 1일 새벽 4시
        
        print("📅 월간 전체 동기화 스케줄 등록 중...")
        success = self._make_request(url, cron=cron)
        
        if success:
            print("✅ 월간 전체 동기화 스케줄이 등록되었습니다.")
            print("   - 목적: 모든 데이터를 새로 가져와서 완전 동기화")
            print("   - 전략: full")
        else:
            print("❌ 월간 전체 동기화 스케줄 등록에 실패했습니다.")
        
        return success
    
    def setup_immediate_sync(self, strategy: str = "incremental"):
        """즉시 동기화 실행"""
        url = f"{self.api_base_url}/v1/animals/public-data/sync?sync_strategy={strategy}"
        
        print(f"🚀 즉시 {strategy} 동기화 실행 중...")
        success = self._make_request(url)
        
        if success:
            print(f"✅ 즉시 {strategy} 동기화가 실행되도록 요청되었습니다.")
        else:
            print(f"❌ 즉시 {strategy} 동기화 실행 요청에 실패했습니다.")
        
        return success
    
    def setup_all_schedules(self):
        """모든 스케줄을 한번에 등록"""
        print("🚀 QStash 공공 데이터 API 스케줄 설정을 시작합니다...\n")
        
        results = []
        
        # 1. 매일 증분 동기화
        results.append(self.setup_daily_incremental_sync())
        print()
        
        # 2. 주간 상태 체크
        results.append(self.setup_weekly_status_check())
        print()
        
        # 3. 월간 전체 동기화
        results.append(self.setup_monthly_full_sync())
        print()
        
        # 결과 요약
        success_count = sum(results)
        total_count = len(results)
        
        print("=" * 50)
        print("📊 스케줄 등록 결과 요약")
        print("=" * 50)
        print(f"✅ 성공: {success_count}/{total_count}")
        print(f"❌ 실패: {total_count - success_count}/{total_count}")
        
        if success_count == total_count:
            print("\n🎉 모든 스케줄이 성공적으로 등록되었습니다!")
            print("\n📋 등록된 스케줄:")
            print("   • 매일 새벽 2시: 증분 동기화 (최근 데이터)")
            print("   • 매주 일요일 새벽 3시: 상태 체크 동기화")
            print("   • 매월 1일 새벽 4시: 전체 동기화")
        else:
            print("\n⚠️  일부 스케줄 등록에 실패했습니다.")
            print("🔧 환경 변수를 확인하고 다시 시도해주세요.")
        
        return success_count == total_count


def main():
    """메인 실행 함수"""
    scheduler = QStashPublicDataScheduler()
    
    # 환경 변수 확인
    required_vars = ['QSTASH_TOKEN', 'API_BASE_URL', 'PUBLIC_DATA_API_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ 필수 환경 변수가 설정되지 않았습니다:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n🔧 .env 파일에 다음 변수들을 설정해주세요:")
        print("   QSTASH_TOKEN=your_qstash_token")
        print("   API_BASE_URL=https://your-domain.com")
        print("   PUBLIC_DATA_API_KEY=your_api_key")
        return
    
    # 모든 스케줄 등록
    scheduler.setup_all_schedules()


if __name__ == "__main__":
    main()
