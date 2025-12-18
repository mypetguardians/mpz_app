#!/usr/bin/env python
"""
11월 데이터 동기화 스크립트
"""
import os
import sys
import django
import asyncio
from datetime import datetime
from asgiref.sync import sync_to_async

# 출력 버퍼링 비활성화
sys.stdout.reconfigure(line_buffering=True) if hasattr(sys.stdout, 'reconfigure') else None

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfehome.settings')
django.setup()

from django.conf import settings
from animals.services import PublicDataService
from animals.models import Animal
from django.db.models import Count

async def sync_november():
    print('🚀 스크립트 시작', flush=True)
    service_key = getattr(settings, 'PUBLIC_DATA_SERVICE_KEY', None)
    if not service_key:
        print('❌ Key not found', flush=True)
        return
    print(f'✅ Service Key 확인됨: {service_key[:20]}...', flush=True)
    
    # 11월 1일 ~ 11월 30일
    bgnde = '20251101'
    endde = '20251130'
    
    print('=' * 60)
    print('🔄 11월 데이터 동기화 시작')
    print('=' * 60)
    print(f'📅 동기화 기간: {bgnde} ~ {endde}')
    
    before = await sync_to_async(lambda: Animal.objects.filter(is_public_data=True).count())()
    print(f'📊 동기화 전 공공데이터 동물 수: {before:,}개')
    
    service = PublicDataService(service_key)
    
    print('\n📥 공공데이터 가져오는 중...')
    print('⏳ API 호출 중... (시간이 걸릴 수 있습니다)')
    try:
        animals_data = await service.fetch_abandoned_animals(
            bgnde=bgnde,
            endde=endde,
            upkind='417000',
            state=None,
            page_no=1,
            num_of_rows=1000,
            is_initial_sync=False
        )
        
        if not animals_data:
            print('\n⚠️ 가져올 데이터가 없습니다.')
            return
        
        print(f'\n✅ 총 {len(animals_data):,}개 동물 데이터 가져옴')
        
        print('\n🔄 동물 데이터 처리 중... (1000개 단위로 배치 처리)')
        result = await service.process_abandoned_animals(animals_data, batch_size=1000)
    except Exception as e:
        print(f'\n❌ 오류 발생: {e}')
        import traceback
        traceback.print_exc()
        return
    
    print('\n' + '=' * 60)
    print('📊 동기화 결과')
    print('=' * 60)
    print(f'✅ 생성된 동물: {result["created"]:,}개')
    print(f'🔄 업데이트된 동물: {result["updated"]:,}개')
    if result.get('deleted', 0) > 0:
        print(f'🗑️  삭제된 동물: {result["deleted"]:,}개')
    print(f'❌ 오류 발생: {result["errors"]:,}개')
    print(f'📦 전체 처리: {result["total"]:,}개')
    
    after = await sync_to_async(lambda: Animal.objects.filter(is_public_data=True).count())()
    print(f'\n📊 동기화 후 공공데이터 동물 수: {after:,}개')
    print(f'📈 증가: {after - before:,}개')
    
    # 상태별 분포
    print('\n📊 보호상태별 분포:')
    protection = await sync_to_async(
        lambda: list(Animal.objects.filter(is_public_data=True).values('protection_status').annotate(count=Count('id')).order_by('-count'))
    )()
    for p in protection:
        print(f'  {p["protection_status"]}: {p["count"]:,}개')
    
    print('\n' + '=' * 60)
    print('✅ 11월 데이터 동기화 완료!')
    print('=' * 60)

if __name__ == "__main__":
    asyncio.run(sync_november())

