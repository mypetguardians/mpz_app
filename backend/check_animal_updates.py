#!/usr/bin/env python
"""
공공데이터 동물 업데이트 확인 스크립트
실제로 업데이트된 동물 수를 확인합니다.
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfehome.settings')
django.setup()

from animals.models import Animal
from django.db.models import Count, Q

def check_updates():
    """동물 업데이트 상태 확인"""
    print("=" * 60)
    print("📊 공공데이터 동물 업데이트 상태 확인")
    print("=" * 60)
    
    # 전체 공공데이터 동물 수
    total_count = Animal.objects.filter(is_public_data=True).count()
    print(f"\n📊 전체 공공데이터 동물 수: {total_count}개")
    
    # 최근 업데이트된 동물 (24시간 이내)
    recent_24h = datetime.now() - timedelta(hours=24)
    recent_count = Animal.objects.filter(
        is_public_data=True,
        updated_at__gte=recent_24h
    ).count()
    print(f"🔄 최근 24시간 내 업데이트: {recent_count}개")
    
    # 최근 업데이트된 동물 (1시간 이내)
    recent_1h = datetime.now() - timedelta(hours=1)
    recent_1h_count = Animal.objects.filter(
        is_public_data=True,
        updated_at__gte=recent_1h
    ).count()
    print(f"🔄 최근 1시간 내 업데이트: {recent_1h_count}개")
    
    # 상태별 통계
    print("\n📊 보호상태별 동물 수:")
    status_counts = Animal.objects.filter(is_public_data=True).values('protection_status').annotate(count=Count('id')).order_by('-count')
    for status_info in status_counts:
        print(f"   {status_info['protection_status']}: {status_info['count']}개")
    
    # 입양상태별 통계
    print("\n📊 입양상태별 동물 수:")
    adoption_counts = Animal.objects.filter(is_public_data=True).values('adoption_status').annotate(count=Count('id')).order_by('-count')
    for status_info in adoption_counts:
        print(f"   {status_info['adoption_status']}: {status_info['count']}개")
    
    # 최근 업데이트된 동물 상세 정보
    print("\n🔄 최근 1시간 내 업데이트된 동물 상세:")
    recent_updated = Animal.objects.filter(
        is_public_data=True,
        updated_at__gte=recent_1h
    ).order_by('-updated_at')[:20]
    
    if recent_updated:
        for animal in recent_updated:
            time_diff = datetime.now() - animal.updated_at.replace(tzinfo=None)
            minutes_ago = int(time_diff.total_seconds() / 60)
            print(f"   - {animal.name} ({animal.public_notice_number})")
            print(f"     상태: {animal.protection_status} / {animal.adoption_status}")
            print(f"     업데이트: {minutes_ago}분 전 ({animal.updated_at.strftime('%Y-%m-%d %H:%M:%S')})")
            print()
    else:
        print("   최근 업데이트된 동물이 없습니다.")
    
    # 상태 변경 추적 (보호상태가 '안락사', '자연사', '반환', '방사'인 동물)
    print("\n📊 특별 상태 동물 수:")
    special_statuses = ['안락사', '자연사', '반환', '방사', '입양완료', '기증']
    for status in special_statuses:
        count = Animal.objects.filter(is_public_data=True, protection_status=status).count()
        if count > 0:
            print(f"   {status}: {count}개")
    
    print("\n" + "=" * 60)
    print("✅ 확인 완료!")
    print("=" * 60)

if __name__ == "__main__":
    check_updates()

