"""
공공데이터 동물 상태 동기화 서비스

기존에 가져온 공공데이터 동물들의 상태 변경을 감지하고 업데이트하는 전용 서비스입니다.
"""

import httpx
import xml.etree.ElementTree as ET
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Set
from urllib.parse import urlencode
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from asgiref.sync import sync_to_async
from .models import Animal, AnimalImage
from centers.models import Center
from .schemas.public_data import PublicDataAnimalOut


class PublicDataStatusSyncService:
    """공공데이터 동물 상태 동기화 전용 서비스"""
    
    BASE_URL = "https://apis.data.go.kr/1543061"
    
    def __init__(self, service_key: str):
        self.service_key = service_key
    
    async def sync_existing_animals_status(self) -> Dict:
        """기존 공공데이터 동물들의 상태를 동기화합니다."""
        print("🔄 기존 공공데이터 동물 상태 동기화 시작...")
        
        # 1. 우리 DB에 있는 모든 공공데이터 동물의 공고번호 수집
        existing_notice_numbers = await self._get_existing_notice_numbers()
        print(f"📊 기존 공공데이터 동물 수: {len(existing_notice_numbers)}개")
        
        if not existing_notice_numbers:
            return {
                'checked': 0,
                'updated': 0,
                'errors': 0,
                'message': '기존 공공데이터 동물이 없습니다.'
            }
        
        # 2. 공공데이터에서 해당 동물들의 현재 상태 조회
        updated_count = 0
        error_count = 0
        checked_count = 0
        
        # 배치로 처리 (한 번에 너무 많이 요청하지 않도록)
        batch_size = 100
        notice_batches = [existing_notice_numbers[i:i + batch_size] 
                         for i in range(0, len(existing_notice_numbers), batch_size)]
        
        for batch_index, notice_batch in enumerate(notice_batches):
            print(f"📦 배치 {batch_index + 1}/{len(notice_batches)} 처리 중... ({len(notice_batch)}개)")
            
            try:
                # 각 공고번호에 대해 공공데이터에서 현재 상태 조회
                for notice_number in notice_batch:
                    try:
                        current_status = await self._fetch_animal_current_status(notice_number)
                        checked_count += 1
                        
                        if current_status:
                            # 우리 DB의 동물과 상태 비교 및 업데이트
                            was_updated = await self._update_animal_status(notice_number, current_status)
                            if was_updated:
                                updated_count += 1
                        
                        # API 호출 제한을 위한 짧은 대기
                        import asyncio
                        await asyncio.sleep(0.1)  # 100ms 대기
                        
                    except Exception as e:
                        print(f"❌ 공고번호 {notice_number} 처리 오류: {e}")
                        error_count += 1
                        continue
                
            except Exception as e:
                print(f"❌ 배치 {batch_index + 1} 처리 오류: {e}")
                error_count += len(notice_batch)
                continue
        
        result = {
            'checked': checked_count,
            'updated': updated_count,
            'errors': error_count,
            'total_existing': len(existing_notice_numbers),
            'message': f'상태 동기화 완료: {checked_count}개 확인, {updated_count}개 업데이트, {error_count}개 오류'
        }
        
        print(f"✅ {result['message']}")
        return result
    
    async def _get_existing_notice_numbers(self) -> List[str]:
        """우리 DB에 있는 모든 공공데이터 동물의 공고번호를 가져옵니다."""
        notice_numbers = await sync_to_async(list)(
            Animal.objects.filter(
                is_public_data=True,
                public_notice_number__isnull=False
            ).exclude(
                public_notice_number=''
            ).values_list('public_notice_number', flat=True)
        )
        return notice_numbers
    
    async def _fetch_animal_current_status(self, notice_number: str) -> Optional[Dict]:
        """특정 공고번호의 동물 현재 상태를 공공데이터에서 조회합니다."""
        try:
            # 공공데이터 API에서 특정 공고번호로 검색
            # 주의: 공공데이터 API는 공고번호로 직접 검색하는 기능이 제한적이므로
            # 전체 데이터를 가져와서 필터링하는 방식 사용
            
            # 최근 6개월 데이터에서 검색 (상태가 변경될 가능성이 높은 기간)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=180)  # 6개월
            
            params = {
                'serviceKey': self.service_key,
                'bgnde': start_date.strftime('%Y%m%d'),
                'endde': end_date.strftime('%Y%m%d'),
                'pageNo': 1,
                'numOfRows': 1000,  # 한 번에 많이 가져오기
                '_type': '_xml'
            }
            
            url = f"{self.BASE_URL}/abandonmentPublicService_v2/abandonmentPublic_v2"
            query_string = urlencode(params)
            full_url = f"{url}?{query_string}"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(full_url)
                response.raise_for_status()
                
                # XML 파싱하여 해당 공고번호 찾기
                root = ET.fromstring(response.text)
                items = root.findall('.//item')
                
                for item in items:
                    item_notice_no = None
                    item_process_state = None
                    
                    for child in item:
                        if child.tag == 'noticeNo':
                            item_notice_no = child.text.strip() if child.text else ""
                        elif child.tag == 'processState':
                            item_process_state = child.text.strip() if child.text else ""
                    
                    # 해당 공고번호를 찾았으면 상태 정보 반환
                    if item_notice_no == notice_number:
                        return {
                            'notice_no': item_notice_no,
                            'process_state': item_process_state,
                            'found_in_recent_data': True
                        }
                
                # 최근 데이터에서 찾지 못한 경우, 더 오래된 데이터에서 검색
                return await self._fetch_from_older_data(notice_number)
                
        except Exception as e:
            print(f"❌ 공고번호 {notice_number} 상태 조회 오류: {e}")
            return None
    
    async def _fetch_from_older_data(self, notice_number: str) -> Optional[Dict]:
        """더 오래된 데이터에서 동물 상태를 검색합니다."""
        try:
            # 6개월 ~ 2년 전 데이터에서 검색
            end_date = datetime.now() - timedelta(days=180)
            start_date = end_date - timedelta(days=540)  # 추가 1.5년
            
            params = {
                'serviceKey': self.service_key,
                'bgnde': start_date.strftime('%Y%m%d'),
                'endde': end_date.strftime('%Y%m%d'),
                'pageNo': 1,
                'numOfRows': 1000,
                '_type': '_xml'
            }
            
            url = f"{self.BASE_URL}/abandonmentPublicService_v2/abandonmentPublic_v2"
            query_string = urlencode(params)
            full_url = f"{url}?{query_string}"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(full_url)
                response.raise_for_status()
                
                root = ET.fromstring(response.text)
                items = root.findall('.//item')
                
                for item in items:
                    item_notice_no = None
                    item_process_state = None
                    
                    for child in item:
                        if child.tag == 'noticeNo':
                            item_notice_no = child.text.strip() if child.text else ""
                        elif child.tag == 'processState':
                            item_process_state = child.text.strip() if child.text else ""
                    
                    if item_notice_no == notice_number:
                        return {
                            'notice_no': item_notice_no,
                            'process_state': item_process_state,
                            'found_in_older_data': True
                        }
                
                # 여전히 찾지 못한 경우
                return {
                    'notice_no': notice_number,
                    'process_state': None,
                    'not_found_in_public_data': True,
                    'possible_removed': True  # 공공데이터에서 제거되었을 가능성
                }
                
        except Exception as e:
            print(f"❌ 오래된 데이터에서 공고번호 {notice_number} 검색 오류: {e}")
            return None
    
    async def _update_animal_status(self, notice_number: str, status_info: Dict) -> bool:
        """동물의 상태를 업데이트합니다."""
        try:
            # 우리 DB에서 해당 동물 조회
            animal = await sync_to_async(
                lambda: Animal.objects.filter(public_notice_number=notice_number).first()
            )()
            
            if not animal:
                print(f"⚠️ 공고번호 {notice_number}에 해당하는 동물을 DB에서 찾을 수 없습니다.")
                return False
            
            updated = False
            
            # 공공데이터에서 제거된 경우 처리
            if status_info.get('not_found_in_public_data'):
                # 동물이 공공데이터에서 제거되었을 가능성
                # 모델 choices에 맞는 값으로 설정: '입양불가', '보호중' (기본값 유지)
                if animal.adoption_status != '입양불가':
                    animal.adoption_status = '입양불가'
                    updated = True
                    print(f"📝 공고번호 {notice_number}: 공공데이터에서 제거됨 - 입양상태를 '입양불가'로 변경")
                # protection_status는 변경하지 않음 (기존 상태 유지)
            else:
                # 정상적으로 상태 정보가 있는 경우
                current_process_state = status_info.get('process_state')
                if current_process_state:
                    # 상태 매핑
                    new_protection_status = self._map_protection_status(current_process_state)
                    new_adoption_status = self._map_adoption_status(current_process_state)
                    
                    # 보호 상태 업데이트
                    if animal.protection_status != new_protection_status:
                        old_status = animal.protection_status
                        animal.protection_status = new_protection_status
                        updated = True
                        print(f"📝 공고번호 {notice_number}: 보호상태 변경 {old_status} → {new_protection_status}")
                    
                    # 입양 상태 업데이트
                    if animal.adoption_status != new_adoption_status:
                        old_status = animal.adoption_status
                        animal.adoption_status = new_adoption_status
                        updated = True
                        print(f"📝 공고번호 {notice_number}: 입양상태 변경 {old_status} → {new_adoption_status}")
            
            # 업데이트된 경우 DB에 저장
            if updated:
                # updated_at은 자동으로 갱신되므로 별도 설정 불필요
                await sync_to_async(animal.save)()
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ 공고번호 {notice_number} 상태 업데이트 오류: {e}")
            return False
    
    def _map_protection_status(self, public_status: str) -> str:
        """공공데이터 process_state(처리상태)를 protection_status(보호상태)로 매핑
        
        공공데이터의 원본 상태를 모델의 보호상태로 정확히 매핑합니다.
        - '공고중'은 모델에 없으므로 '보호중'으로 변환
        - '기증', '안락사' 등은 그대로 해당 상태로 매핑
        - '종료(반환)', '종료(자연사)' 같은 형식도 처리
        
        Args:
            public_status: 공공데이터의 process_state 값
        
        Returns:
            str: protection_status 값 (보호중, 임시보호, 안락사, 자연사, 반환, 기증, 방사, 입양완료)
        """
        if not public_status:
            return '보호중'
        
        status = public_status.strip()
        
        # '종료(반환)', '종료(자연사)' 같은 괄호 형식 처리
        if status.startswith('종료(') and status.endswith(')'):
            inner_status = status[3:-1]  # '종료(' (3글자) 와 ')' (1글자) 제거
            if inner_status == '반환':
                status = '반환'
            elif inner_status == '자연사':
                status = '자연사'
            elif inner_status == '안락사':
                status = '안락사'
            elif inner_status == '방사':
                status = '방사'
            elif inner_status == '입양':
                status = '입양완료'
            elif inner_status == '기증':
                status = '기증'
        
        # '종료 입양', '종료 기증' 같은 공백 형식 처리
        if status.startswith('종료 '):
            inner_status = status[3:].strip()  # '종료 ' (3글자) 제거
            if inner_status == '입양':
                status = '입양완료'
            elif inner_status == '기증':
                status = '기증'
            elif inner_status == '반환':
                status = '반환'
            elif inner_status == '자연사':
                status = '자연사'
            elif inner_status == '안락사':
                status = '안락사'
            elif inner_status == '방사':
                status = '방사'
        
        # 공공데이터 process_state -> protection_status 매핑
        # 각 공공데이터 상태를 모델의 보호상태로 정확히 매핑
        protection_mapping = {
            '보호중': '보호중',      # 보호중 → 보호중
            '공고중': '보호중',      # 공고중 → 보호중 (모델에 '공고중'이 없으므로)
            '임시보호': '임시보호',  # 임시보호 → 임시보호
            '입양완료': '입양완료',  # 입양완료 → 입양완료
            '기증': '기증',          # 기증 → 기증
            '안락사': '안락사',      # 안락사 → 안락사
            '자연사': '자연사',      # 자연사 → 자연사
            '반환': '반환',          # 반환 → 반환
            '방사': '방사',          # 방사 → 방사
        }
        
        # 매핑된 값이 있으면 반환, 없으면 기본값 '보호중'
        return protection_mapping.get(status, '보호중')
    
    def _map_adoption_status(self, public_status: str) -> str:
        """공공데이터 process_state(처리상태)를 adoption_status(입양상태)로 매핑
        
        보호상태와 별도로 입양 가능 여부를 결정합니다.
        - 보호중/공고중/임시보호 → 입양가능
        - 입양완료/기증 → 입양완료
        - 안락사/자연사/반환/방사 → 입양불가
        
        Args:
            public_status: 공공데이터의 process_state 값
        
        Returns:
            str: adoption_status 값 (입양가능, 입양진행중, 입양완료, 입양불가)
        """
        if not public_status:
            return '입양가능'
        
        status = public_status.strip()
        
        # '종료(반환)', '종료(자연사)' 같은 괄호 형식 처리
        if status.startswith('종료(') and status.endswith(')'):
            inner_status = status[3:-1]  # '종료(' (3글자) 와 ')' (1글자) 제거
            if inner_status == '반환':
                status = '반환'
            elif inner_status == '자연사':
                status = '자연사'
            elif inner_status == '안락사':
                status = '안락사'
            elif inner_status == '방사':
                status = '방사'
            elif inner_status == '입양':
                status = '입양완료'
            elif inner_status == '기증':
                status = '기증'
        
        # '종료 입양', '종료 기증' 같은 공백 형식 처리
        if status.startswith('종료 '):
            inner_status = status[3:].strip()  # '종료 ' (3글자) 제거
            if inner_status == '입양':
                status = '입양완료'
            elif inner_status == '기증':
                status = '기증'
            elif inner_status == '반환':
                status = '반환'
            elif inner_status == '자연사':
                status = '자연사'
            elif inner_status == '안락사':
                status = '안락사'
            elif inner_status == '방사':
                status = '방사'
        
        adoption_mapping = {
            '보호중': '입양가능',    # 보호중 → 입양가능
            '공고중': '입양가능',    # 공고중 → 입양가능
            '임시보호': '입양가능',  # 임시보호 → 입양가능
            '입양완료': '입양완료',  # 입양완료 → 입양완료
            '기증': '입양완료',      # 기증 → 입양완료 (기증은 입양 완료로 간주)
            '안락사': '입양불가',    # 안락사 → 입양불가
            '자연사': '입양불가',    # 자연사 → 입양불가
            '반환': '입양불가',      # 반환 → 입양불가
            '방사': '입양불가',      # 방사 → 입양불가
        }
        return adoption_mapping.get(status, '입양가능')
        """공공데이터 process_state(처리상태)를 adoption_status(입양상태)로 매핑
        
        보호상태와 별도로 입양 가능 여부를 결정합니다.
        - 보호중/공고중/임시보호 → 입양가능
        - 입양완료/기증 → 입양완료
        - 안락사/자연사/반환/방사 → 입양불가
        
        Args:
            public_status: 공공데이터의 process_state 값
        
        Returns:
            str: adoption_status 값 (입양가능, 입양진행중, 입양완료, 입양불가)
        """
        adoption_mapping = {
            '보호중': '입양가능',    # 보호중 → 입양가능
            '공고중': '입양가능',    # 공고중 → 입양가능
            '임시보호': '입양가능',  # 임시보호 → 입양가능
            '입양완료': '입양완료',  # 입양완료 → 입양완료
            '기증': '입양완료',      # 기증 → 입양완료 (기증은 입양 완료로 간주)
            '안락사': '입양불가',    # 안락사 → 입양불가
            '자연사': '입양불가',    # 자연사 → 입양불가
            '반환': '입양불가',      # 반환 → 입양불가
            '방사': '입양불가',      # 방사 → 입양불가
        }
        return adoption_mapping.get(public_status.strip(), '입양가능')
    
    async def sync_recent_status_changes(self, days_back: int = 7) -> Dict:
        """최근 며칠간 등록되거나 업데이트된 동물들의 상태를 체크합니다."""
        print(f"🔄 최근 {days_back}일간 상태 변경 동기화 시작...")
        
        # 최근 등록된 동물들 (created_at 기준) + 최근 업데이트된 동물들 (updated_at 기준)
        recent_animals = await sync_to_async(list)(
            Animal.objects.filter(
                Q(is_public_data=True) &
                Q(public_notice_number__isnull=False) &
                (
                    Q(created_at__gte=timezone.now() - timedelta(days=days_back)) |
                    Q(updated_at__gte=timezone.now() - timedelta(days=days_back))
                )
            ).values_list('public_notice_number', flat=True).distinct()
        )
        
        if not recent_animals:
            # 최근 등록/업데이트가 없다면 최근 등록된 동물들 중 일부 체크
            sample_animals = await sync_to_async(list)(
                Animal.objects.filter(
                    is_public_data=True,
                    public_notice_number__isnull=False
                ).order_by('-created_at')[:100]  # 최근 등록된 100개
                .values_list('public_notice_number', flat=True)
            )
            recent_animals = sample_animals
        
        print(f"📊 체크할 동물 수: {len(recent_animals)}개")
        
        updated_count = 0
        error_count = 0
        
        for notice_number in recent_animals:
            try:
                current_status = await self._fetch_animal_current_status(notice_number)
                if current_status:
                    was_updated = await self._update_animal_status(notice_number, current_status)
                    if was_updated:
                        updated_count += 1
                
                # API 호출 제한
                import asyncio
                await asyncio.sleep(0.2)  # 200ms 대기
                
            except Exception as e:
                print(f"❌ 공고번호 {notice_number} 처리 오류: {e}")
                error_count += 1
        
        return {
            'checked': len(recent_animals),
            'updated': updated_count,
            'errors': error_count,
            'message': f'최근 상태 동기화 완료: {len(recent_animals)}개 확인, {updated_count}개 업데이트'
        }
