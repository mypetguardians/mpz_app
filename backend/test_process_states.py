#!/usr/bin/env python
"""
공공데이터에서 가져오는 process_state 값 확인
"""
import os
import sys
import django
import asyncio

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfehome.settings')
django.setup()

from django.conf import settings
from animals.services import PublicDataService
from collections import Counter

async def check_process_states():
    service_key = getattr(settings, 'PUBLIC_DATA_SERVICE_KEY', None)
    if not service_key:
        print("❌ PUBLIC_DATA_SERVICE_KEY가 설정되지 않았습니다.")
        return
    
    public_data_service = PublicDataService(service_key)
    
    # 최근 7일 데이터 가져오기
    from datetime import datetime, timedelta
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    bgnde = start_date.strftime('%Y%m%d')
    endde = end_date.strftime('%Y%m%d')
    
    print(f"📅 조회 기간: {bgnde} ~ {endde}")
    print("📥 공공데이터 가져오는 중...\n")
    
    animals_data = await public_data_service.fetch_abandoned_animals(
        bgnde=bgnde,
        endde=endde,
        upkind="417000",  # 개
        state=None,  # 모든 상태
        page_no=1,
        num_of_rows=1000,
        is_initial_sync=False
    )
    
    if not animals_data:
        print("⚠️ 가져올 데이터가 없습니다.")
        return
    
    print(f"✅ {len(animals_data)}개 동물 데이터 가져옴\n")
    
    # process_state 값 분포 확인
    process_states = [animal.process_state for animal in animals_data if animal.process_state]
    state_counter = Counter(process_states)
    
    print("=" * 60)
    print("📊 process_state 값 분포")
    print("=" * 60)
    for state, count in state_counter.most_common():
        print(f"  {state}: {count}개")
    
    print(f"\n총 {len(process_states)}개 동물의 process_state 확인됨")
    print(f"빈 process_state: {len(animals_data) - len(process_states)}개")
    
    # 매핑된 보호상태 확인
    print("\n" + "=" * 60)
    print("📊 매핑된 보호상태 분포")
    print("=" * 60)
    protection_states = []
    adoption_states = []
    
    for animal in animals_data:
        if animal.process_state and animal.process_state.strip():
            prot_status = public_data_service._map_protection_status(animal.process_state)
            adopt_status = public_data_service._map_adoption_status(animal.process_state)
            protection_states.append(prot_status)
            adoption_states.append(adopt_status)
    
    prot_counter = Counter(protection_states)
    adopt_counter = Counter(adoption_states)
    
    print("\n보호상태:")
    for state, count in prot_counter.most_common():
        print(f"  {state}: {count}개")
    
    print("\n입양상태:")
    for state, count in adopt_counter.most_common():
        print(f"  {state}: {count}개")

if __name__ == "__main__":
    asyncio.run(check_process_states())

