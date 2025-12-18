#!/usr/bin/env python
"""
공공데이터 동기화 실행 스크립트
실제로 공공데이터를 가져와서 업데이트하고 결과를 확인합니다.
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfehome.settings')
django.setup()

from django.conf import settings
from animals.services import PublicDataService
from animals.status_sync_service import PublicDataStatusSyncService
from animals.models import Animal

async def run_sync():
    """공공데이터 동기화 실행"""
    service_key = getattr(settings, 'PUBLIC_DATA_SERVICE_KEY', None)
    
    if not service_key:
        print("❌ PUBLIC_DATA_SERVICE_KEY가 설정되지 않았습니다.")
        return
    
    print("=" * 60)
    print("🔄 공공데이터 동기화 시작")
    print("=" * 60)
    
    # 증분 동기화: 최근 30일 데이터
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    bgnde = start_date.strftime('%Y%m%d')
    endde = end_date.strftime('%Y%m%d')
    
    print(f"📅 동기화 기간: {bgnde} ~ {endde}")
    print(f"📊 동기화 전 동물 수: {Animal.objects.filter(is_public_data=True).count()}개")
    
    # 공공데이터 서비스 초기화
    public_data_service = PublicDataService(service_key)
    
    # 동물 데이터 가져오기
    print("\n📥 공공데이터 가져오는 중...")
    animals_data = await public_data_service.fetch_abandoned_animals(
        bgnde=bgnde,
        endde=endde,
        upkind="417000",  # 개
        state="protect",
        page_no=1,
        num_of_rows=1000,
        is_initial_sync=False
    )
    
    if not animals_data:
        print("⚠️ 가져올 데이터가 없습니다.")
        return
    
    print(f"✅ {len(animals_data)}개 동물 데이터 가져옴")
    
    # 동물 데이터 처리
    print("\n🔄 동물 데이터 처리 중...")
    result = await public_data_service.process_abandoned_animals(animals_data)
    
    print("\n" + "=" * 60)
    print("📊 동기화 결과")
    print("=" * 60)
    print(f"✅ 생성된 동물: {result['created']}개")
    print(f"🔄 업데이트된 동물: {result['updated']}개")
    print(f"❌ 오류 발생: {result['errors']}개")
    print(f"📦 전체 처리: {result['total']}개")
    
    # 증분 동기화 후 상태 체크
    print("\n🔄 최근 등록된 동물들의 상태 체크 중...")
    status_sync_service = PublicDataStatusSyncService(service_key)
    status_check_result = await status_sync_service.sync_recent_status_changes(days_back=7)
    
    if status_check_result:
        print(f"✅ 추가 상태 업데이트: {status_check_result.get('updated', 0)}개")
        print(f"📦 체크한 동물: {status_check_result.get('checked', 0)}개")
    
    # 최종 통계
    print("\n" + "=" * 60)
    print("📊 최종 통계")
    print("=" * 60)
    total_public_animals = Animal.objects.filter(is_public_data=True).count()
    print(f"📊 전체 공공데이터 동물 수: {total_public_animals}개")
    
    # 상태별 통계
    print("\n📊 상태별 동물 수:")
    from django.db.models import Count
    status_counts = Animal.objects.filter(is_public_data=True).values('protection_status').annotate(count=Count('id')).order_by('-count')
    for status_info in status_counts:
        print(f"   {status_info['protection_status']}: {status_info['count']}개")
    
    # 최근 업데이트된 동물 확인
    print("\n🔄 최근 1시간 내 업데이트된 동물:")
    recent_updated = Animal.objects.filter(
        is_public_data=True,
        updated_at__gte=datetime.now() - timedelta(hours=1)
    ).order_by('-updated_at')[:10]
    
    if recent_updated:
        for animal in recent_updated:
            print(f"   - {animal.name} ({animal.public_notice_number}): {animal.protection_status} → {animal.updated_at.strftime('%Y-%m-%d %H:%M:%S')}")
    else:
        print("   최근 업데이트된 동물이 없습니다.")
    
    print("\n" + "=" * 60)
    print("✅ 동기화 완료!")
    print("=" * 60)

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_sync())

