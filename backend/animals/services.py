import httpx
import xml.etree.ElementTree as ET
from datetime import datetime, date
from typing import List, Dict, Optional
from django.conf import settings
from django.utils import timezone
from .models import Animal, AnimalImage
from centers.models import Center
from .schemas.public_data import PublicDataAnimalOut


class PublicDataService:
    """공공데이터 API 서비스"""
    
    BASE_URL = "https://apis.data.go.kr/1543061"
    
    def __init__(self, service_key: str):
        self.service_key = service_key
    
    async def fetch_abandoned_animals(
        self,
        bgnde: str,  # 구조날짜 시작 (YYYYMMDD)
        endde: str,  # 구조날짜 종료 (YYYYMMDD)
        upkind: str = "417000",  # 개
        state: Optional[str] = None,  # 상태 (notice: 공고중, protect: 보호중)
        page_no: int = 1,
        num_of_rows: int = 1000,
        is_initial_sync: bool = False  # 초기 동기화 여부
    ) -> List[PublicDataAnimalOut]:
        """유기동물 목록 조회"""
        all_animals = []
        
        if is_initial_sync:
            # 초기 동기화: 전체 데이터를 가져옴
            current_page = 1
            while True:
                params = {
                    'serviceKey': self.service_key,
                    'bgnde': bgnde,
                    'endde': endde,
                    'upkind': upkind,
                    'pageNo': current_page,
                    'numOfRows': num_of_rows,
                    '_type': 'xml'
                }
                
                if state:
                    params['state'] = state
                
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{self.BASE_URL}/abandonmentPublicService_v2/abandonmentPublic", params=params)
                    response.raise_for_status()
                    
                    page_animals = self._parse_xml_response(response.text)
                    
                    # 더 이상 데이터가 없으면 중단
                    if not page_animals:
                        break
                    
                    all_animals.extend(page_animals)
                    current_page += 1
                    
                    # 안전장치: 너무 많은 페이지를 가져오지 않도록 제한
                    if current_page > 100:  # 최대 100페이지까지만
                        break
        else:
            # 업데이트 동기화: 최근 5페이지만 가져옴
            for page in range(1, 6):  # 1~5페이지
                params = {
                    'serviceKey': self.service_key,
                    'bgnde': bgnde,
                    'endde': endde,
                    'upkind': upkind,
                    'pageNo': page,
                    'numOfRows': num_of_rows,
                    '_type': 'xml'
                }
                
                if state:
                    params['state'] = state
                
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{self.BASE_URL}/abandonmentPublicService_v2/abandonmentPublic", params=params)
                    response.raise_for_status()
                    
                    page_animals = self._parse_xml_response(response.text)
                    
                    # 더 이상 데이터가 없으면 중단
                    if not page_animals:
                        break
                    
                    all_animals.extend(page_animals)
        
        return all_animals
    
    def _parse_xml_response(self, xml_content: str) -> List[PublicDataAnimalOut]:
        """XML 응답 파싱"""
        try:
            root = ET.fromstring(xml_content)
            items = []
            
            for item in root.findall('.//item'):
                item_data = {}
                for child in item:
                    tag = child.tag
                    text = child.text.strip() if child.text else ""
                    
                    # 날짜 필드 변환
                    if tag in ['happenDt', 'noticeSdt', 'noticeEdt']:
                        if text and len(text) == 8:
                            try:
                                item_data[tag] = datetime.strptime(text, '%Y%m%d').date()
                            except ValueError:
                                item_data[tag] = None
                        else:
                            item_data[tag] = None
                    elif tag == 'updTm':
                        if text:
                            try:
                                item_data[tag] = datetime.strptime(text, '%Y-%m-%d %H:%M:%S.%f')
                            except ValueError:
                                try:
                                    item_data[tag] = datetime.strptime(text, '%Y-%m-%d %H:%M:%S')
                                except ValueError:
                                    item_data[tag] = None
                        else:
                            item_data[tag] = None
                    else:
                        item_data[tag] = text
                
                # 스키마로 변환
                try:
                    animal_out = PublicDataAnimalOut(
                        desertion_no=item_data.get('desertionNo', ''),
                        happen_dt=item_data.get('happenDt'),
                        happen_place=item_data.get('happenPlace', ''),
                        kind_full_nm=item_data.get('kindFullNm', ''),
                        up_kind_cd=item_data.get('upKindCd', ''),
                        up_kind_nm=item_data.get('upKindNm', ''),
                        kind_cd=item_data.get('kindCd', ''),
                        kind_nm=item_data.get('kindNm', ''),
                        color_cd=item_data.get('colorCd', ''),
                        age=item_data.get('age', ''),
                        weight=item_data.get('weight', ''),
                        notice_no=item_data.get('noticeNo', ''),
                        notice_sdt=item_data.get('noticeSdt'),
                        notice_edt=item_data.get('noticeEdt'),
                        popfile1=item_data.get('popfile1'),
                        popfile2=item_data.get('popfile2'),
                        process_state=item_data.get('processState', ''),
                        sex_cd=item_data.get('sexCd', ''),
                        neuter_yn=item_data.get('neuterYn', ''),
                        special_mark=item_data.get('specialMark', ''),
                        notice_comment=item_data.get('noticeComment', ''),  # 공고 코멘트 추가
                        care_reg_no=item_data.get('careRegNo', ''),
                        care_nm=item_data.get('careNm', ''),
                        care_tel=item_data.get('careTel', ''),
                        care_addr=item_data.get('careAddr', ''),
                        care_owner_nm=item_data.get('careOwnerNm', ''),
                        org_nm=item_data.get('orgNm', ''),
                        upd_tm=item_data.get('updTm')
                    )
                    items.append(animal_out)
                except Exception as e:
                    print(f"스키마 변환 오류: {e}")
                    continue
            
            return items
        except ET.ParseError as e:
            print(f"XML 파싱 오류: {e}")
            return []
    
    async def process_abandoned_animals(self, animals_data: List[PublicDataAnimalOut]) -> Dict:
        """유기동물 데이터 처리 및 DB 저장"""
        created_count = 0
        updated_count = 0
        error_count = 0
        
        for animal_data in animals_data:
            try:
                # 공고번호로 기존 동물 확인
                existing_animal = await self._get_existing_animal(animal_data)
                
                if existing_animal:
                    # 기존 동물 업데이트 (상태 변경 등)
                    was_updated = await self._update_animal(existing_animal, animal_data)
                    if was_updated:
                        updated_count += 1
                else:
                    # 새 동물 생성 (중복되지 않는 경우만)
                    await self._create_animal(animal_data)
                    created_count += 1
                    
            except Exception as e:
                print(f"동물 데이터 처리 오류: {e}")
                error_count += 1
        
        return {
            'created': created_count,
            'updated': updated_count,
            'errors': error_count,
            'total': len(animals_data)
        }
    
    async def _get_existing_animal(self, animal_data: PublicDataAnimalOut) -> Optional[Animal]:
        """공고번호로 기존 동물 조회 (중복 체크)"""
        notice_number = animal_data.notice_no
        if not notice_number:
            return None
        
        try:
            # public_notice_number로 중복 체크
            animal = await Animal.objects.filter(
                public_notice_number=notice_number
            ).afirst()
            return animal
        except Exception:
            return None
    
    async def _create_animal(self, animal_data: PublicDataAnimalOut):
        """새 동물 생성"""
        # 기본 센터 생성 또는 조회
        center = await self._get_or_create_center(animal_data)
        
        # 동물 생성 - 기존 DB 구조 활용
        animal = Animal(
            center=center,
            name=f"공공데이터_{animal_data.desertion_no}",
            announce_number=animal_data.notice_no,  # 기존 announce_number 활용
            breed=animal_data.kind_nm or '믹스견',
            age=self._parse_age(animal_data.age),
            is_female=animal_data.sex_cd == 'F',
            weight=self._parse_weight(animal_data.weight),
            neutering=animal_data.neuter_yn == 'Y',
            status=self._map_status(animal_data.process_state),  # 공공데이터 상태를 우리 status에 매핑
            description=animal_data.special_mark or '',  # 공공데이터 특이사항을 description에 저장
            found_location=animal_data.happen_place,  # 공공데이터 발견장소를 found_location에 저장
            admission_date=animal_data.happen_dt,  # 공공데이터 구조날짜를 admission_date에 저장
            is_public_data=True,
            public_notice_number=animal_data.notice_no,  # 공고번호만 별도 저장 (중복 방지용)
            comment=animal_data.notice_comment or '',  # 공공데이터 공고 코멘트를 comment에 저장
        )
        
        await animal.asave()
        
        # 이미지 처리
        await self._process_animal_images(animal, animal_data)
        
        return animal
    
    async def _update_animal(self, animal: Animal, animal_data: PublicDataAnimalOut) -> bool:
        """기존 동물 업데이트 - 실제 변경사항이 있을 때만 업데이트"""
        updated = False
        
        # 1. 상태 업데이트 (가장 중요한 변경사항)
        new_status = self._map_status(animal_data.process_state)
        if animal.status != new_status:
            animal.status = new_status
            updated = True
            print(f"동물 상태 업데이트: {animal.public_notice_number} - {animal.status} -> {new_status}")
        
        # 2. 공공데이터 정보 업데이트 - 기존 필드 활용
        if animal.description != (animal_data.special_mark or ''):
            animal.description = animal_data.special_mark or ''
            updated = True
        
        if animal.comment != (animal_data.notice_comment or ''):
            animal.comment = animal_data.notice_comment or ''
            updated = True
        
        if animal.found_location != animal_data.happen_place:
            animal.found_location = animal_data.happen_place
            updated = True
        
        if animal.admission_date != animal_data.happen_dt:
            animal.admission_date = animal_data.happen_dt
            updated = True
        
        # 3. 기타 정보 업데이트 (변경 가능한 경우)
        if animal.breed != (animal_data.kind_nm or '믹스견'):
            animal.breed = animal_data.kind_nm or '믹스견'
            updated = True
        
        if animal.age != self._parse_age(animal_data.age):
            animal.age = self._parse_age(animal_data.age)
            updated = True
        
        if animal.weight != self._parse_weight(animal_data.weight):
            animal.weight = self._parse_weight(animal_data.weight)
            updated = True
        
        if animal.is_female != (animal_data.sex_cd == 'F'):
            animal.is_female = animal_data.sex_cd == 'F'
            updated = True
        
        if animal.neutering != (animal_data.neuter_yn == 'Y'):
            animal.neutering = animal_data.neuter_yn == 'Y'
            updated = True
        
        # 4. 센터 정보 업데이트 (필요한 경우)
        if animal.center.public_reg_no != animal_data.care_reg_no:
            new_center = await self._get_or_create_center(animal_data)
            if new_center and new_center != animal.center:
                animal.center = new_center
                updated = True
        
        # 5. 실제 변경사항이 있을 때만 DB에 저장
        if updated:
            await animal.asave()
            print(f"동물 정보 업데이트 완료: {animal.public_notice_number}")
        
        return updated
    
    async def _get_or_create_center(self, animal_data: PublicDataAnimalOut) -> Center:
        """보호소 생성 또는 조회 - Center에 직접 매핑"""
        care_reg_no = animal_data.care_reg_no
        care_name = animal_data.care_nm or '공공데이터 보호소'
        
        if care_reg_no:
            # Center 모델에서 해당 보호소와 연결된 센터 조회
            center, created = await Center.objects.aget_or_create(
                public_reg_no=care_reg_no,
                defaults={
                    'name': care_name,
                    'location': animal_data.care_addr or '',
                    'phone_number': animal_data.care_tel or '',
                    'is_public': True,
                    'region': self._map_sido_to_region(animal_data.org_nm) if animal_data.org_nm else None
                }
            )
            
            # 보호소 정보가 업데이트된 경우 센터 정보도 업데이트
            if not created:
                updated = False
                if center.name != care_name:
                    center.name = care_name
                    updated = True
                if center.location != (animal_data.care_addr or ''):
                    center.location = animal_data.care_addr or ''
                    updated = True
                if center.phone_number != (animal_data.care_tel or ''):
                    center.phone_number = animal_data.care_tel or ''
                    updated = True
                
                # 지역 정보 업데이트
                new_region = self._map_sido_to_region(animal_data.org_nm) if animal_data.org_nm else None
                if center.region != new_region:
                    center.region = new_region
                    updated = True
                
                if updated:
                    await center.asave()
                    print(f"센터 정보 업데이트 완료: {center.name} ({center.public_reg_no})")
            
            return center
        
        # 기본 센터 반환
        return await Center.objects.filter(is_public=True).afirst()
    
    def _map_sido_to_region(self, org_name: str) -> str:
        """기관명에서 지역 추출하여 우리 시스템의 지역 코드로 매핑"""
        if not org_name:
            return None
            
        region_mapping = {
            '서울': '서울',
            '부산': '부산',
            '대구': '대구',
            '인천': '인천',
            '광주': '광주',
            '대전': '대전',
            '울산': '울산',
            '세종': '세종',
            '경기': '경기',
            '강원': '강원',
            '충북': '충북',
            '충남': '충남',
            '전북': '전북',
            '전남': '전남',
            '경북': '경북',
            '경남': '경남',
            '제주': '제주'
        }
        
        # 기관명에서 지역 추출
        for region_key, region_value in region_mapping.items():
            if region_key in org_name:
                return region_value
        
        return None
    
    def _parse_age(self, age_str: str) -> Optional[int]:
        """나이 파싱 (개월 단위로 변환)"""
        if not age_str:
            return None
        
        try:
            # "2021(년생)" -> 2021년생 -> 2025-2021 = 4년 = 48개월
            if '년생' in age_str:
                year = int(age_str.split('(')[0])
                current_year = datetime.now().year
                age_years = current_year - year
                return age_years * 12
            # "60일미만" -> 2개월 미만
            elif '일미만' in age_str:
                return 1
            # "2025(60일미만)" -> 2개월 미만
            elif '60일미만' in age_str:
                return 1
            else:
                return None
        except (ValueError, AttributeError):
            return None
    
    def _parse_weight(self, weight_str: str) -> Optional[float]:
        """체중 파싱 (kg 단위)"""
        if not weight_str:
            return None
        
        try:
            # "16(Kg)" -> 16.0
            weight = weight_str.replace('(Kg)', '').replace('Kg', '').strip()
            return float(weight)
        except (ValueError, AttributeError):
            return None
    
    def _map_status(self, public_status: str) -> str:
        """공공데이터 상태를 우리 시스템 상태로 매핑"""
        status_mapping = {
            '보호중': '보호중',
            '공고중': '보호중',
            '입양완료': '입양완료',
            '안락사': '안락사',
            '자연사': '자연사',
            '반환': '반환'
        }
        return status_mapping.get(public_status, '보호중')
    
    async def _process_animal_images(self, animal: Animal, animal_data: PublicDataAnimalOut):
        """동물 이미지 처리 - filename과 popfile 모두 처리"""
        # 기존 이미지 삭제
        await AnimalImage.objects.filter(animal=animal).adelete()
        
        # 새 이미지 추가
        images = []
        sequence = 0
        
        # popfile1, popfile2 처리 (공공데이터 이미지)
        for image_url in [animal_data.popfile1, animal_data.popfile2]:
            if image_url and image_url.strip():
                images.append(AnimalImage(
                    animal=animal,
                    image_url=image_url.strip(),
                    is_primary=(sequence == 0),  # 첫 번째 이미지를 대표 이미지로
                    sequence=sequence
                ))
                sequence += 1
        
        # filename 처리 (추가 이미지가 있는 경우)
        # 공공데이터 API에서 filename 필드가 제공되는 경우를 대비
        
        if images:
            await AnimalImage.objects.abulk_create(images)
            print(f"동물 이미지 처리 완료: {animal.public_notice_number} - {len(images)}개 이미지")
        else:
            print(f"동물 이미지 없음: {animal.public_notice_number}")
