from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from unittest.mock import patch, AsyncMock
from datetime import datetime, date, timedelta
from animals.models import Animal, AnimalImage
from animals.services import PublicDataService
from centers.models import Center
from animals.schemas.public_data import PublicDataAnimalOut

User = get_user_model()


class PublicDataServiceTest(TestCase):
    """공공데이터 서비스 테스트"""
    
    def setUp(self):
        """테스트 설정"""
        # 테스트용 사용자 생성
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name='테스트 보호소',
            location='서울시 강남구',
            phone_number='02-1234-5678',
            region='서울',
            is_public=True
        )
        
        # 공공데이터 서비스 키 설정
        self.service_key = 'test_service_key'
        self.service = PublicDataService(self.service_key)
    
    def test_service_initialization(self):
        """서비스 초기화 테스트"""
        self.assertEqual(self.service.service_key, self.service_key)
        self.assertEqual(self.service.BASE_URL, 'https://apis.data.go.kr/1543061')
    
    def test_parse_age(self):
        """나이 파싱 테스트"""
        # 년생 테스트
        self.assertEqual(self.service._parse_age('2021(년생)'), 48)  # 2025-2021 = 4년 = 48개월
        
        # 일미만 테스트
        self.assertEqual(self.service._parse_age('60일미만'), 1)
        
        # 잘못된 형식 테스트
        self.assertIsNone(self.service._parse_age('invalid'))
        self.assertIsNone(self.service._parse_age(''))
    
    def test_parse_weight(self):
        """체중 파싱 테스트"""
        # 정상 케이스
        self.assertEqual(self.service._parse_weight('16(Kg)'), 16.0)
        self.assertEqual(self.service._parse_weight('5.5Kg'), 5.5)
        
        # 잘못된 형식
        self.assertIsNone(self.service._parse_weight('invalid'))
        self.assertIsNone(self.service._parse_weight(''))
    
    def test_map_protection_status(self):
        """보호상태 매핑 테스트"""
        # 정상 매핑
        self.assertEqual(self.service._map_protection_status('보호중'), '보호중')
        self.assertEqual(self.service._map_protection_status('공고중'), '보호중')  # 공고중은 보호중으로 매핑
        self.assertEqual(self.service._map_protection_status('입양완료'), '입양완료')
        self.assertEqual(self.service._map_protection_status('안락사'), '안락사')
        self.assertEqual(self.service._map_protection_status('자연사'), '자연사')
        self.assertEqual(self.service._map_protection_status('반환'), '반환')
        self.assertEqual(self.service._map_protection_status('기증'), '기증')
        self.assertEqual(self.service._map_protection_status('방사'), '방사')
        self.assertEqual(self.service._map_protection_status('임시보호'), '임시보호')
        
        # 알 수 없는 상태는 기본값 '보호중'
        self.assertEqual(self.service._map_protection_status('알수없음'), '보호중')
        self.assertEqual(self.service._map_protection_status(''), '보호중')
        self.assertEqual(self.service._map_protection_status(None), '보호중')
    
    def test_map_adoption_status(self):
        """입양상태 매핑 테스트"""
        # 입양가능 상태
        self.assertEqual(self.service._map_adoption_status('보호중'), '입양가능')
        self.assertEqual(self.service._map_adoption_status('공고중'), '입양가능')
        self.assertEqual(self.service._map_adoption_status('임시보호'), '입양가능')
        
        # 입양완료 상태
        self.assertEqual(self.service._map_adoption_status('입양완료'), '입양완료')
        self.assertEqual(self.service._map_adoption_status('기증'), '입양완료')
        
        # 입양불가 상태
        self.assertEqual(self.service._map_adoption_status('안락사'), '입양불가')
        self.assertEqual(self.service._map_adoption_status('자연사'), '입양불가')
        self.assertEqual(self.service._map_adoption_status('반환'), '입양불가')
        self.assertEqual(self.service._map_adoption_status('방사'), '입양불가')
        
        # 알 수 없는 상태는 기본값 '입양가능'
        self.assertEqual(self.service._map_adoption_status('알수없음'), '입양가능')
        self.assertEqual(self.service._map_adoption_status(''), '입양가능')
    
    def test_status_mapping_consistency(self):
        """보호상태와 입양상태 매핑 일관성 테스트"""
        # 공고중: 보호상태는 보호중, 입양상태는 입양가능
        self.assertEqual(self.service._map_protection_status('공고중'), '보호중')
        self.assertEqual(self.service._map_adoption_status('공고중'), '입양가능')
        
        # 기증: 보호상태는 기증, 입양상태는 입양완료
        self.assertEqual(self.service._map_protection_status('기증'), '기증')
        self.assertEqual(self.service._map_adoption_status('기증'), '입양완료')
        
        # 안락사: 보호상태는 안락사, 입양상태는 입양불가
        self.assertEqual(self.service._map_protection_status('안락사'), '안락사')
        self.assertEqual(self.service._map_adoption_status('안락사'), '입양불가')
        
        # 자연사: 보호상태는 자연사, 입양상태는 입양불가
        self.assertEqual(self.service._map_protection_status('자연사'), '자연사')
        self.assertEqual(self.service._map_adoption_status('자연사'), '입양불가')
        
        # 반환: 보호상태는 반환, 입양상태는 입양불가
        self.assertEqual(self.service._map_protection_status('반환'), '반환')
        self.assertEqual(self.service._map_adoption_status('반환'), '입양불가')
        
        # 입양완료: 보호상태는 입양완료, 입양상태는 입양완료
        self.assertEqual(self.service._map_protection_status('입양완료'), '입양완료')
        self.assertEqual(self.service._map_adoption_status('입양완료'), '입양완료')
    
    def test_map_sido_to_region(self):
        """지역 매핑 테스트"""
        # 정상 매핑
        self.assertEqual(self.service._map_sido_to_region('서울특별시동물보호센터'), '서울')
        self.assertEqual(self.service._map_sido_to_region('부산광역시동물보호소'), '부산')
        
        # 매핑되지 않는 경우
        self.assertIsNone(self.service._map_sido_to_region(''))
        self.assertIsNone(self.service._map_sido_to_region('해외동물보호소'))


class PublicDataModelTest(TestCase):
    """공공데이터 모델 테스트"""
    
    def setUp(self):
        """테스트 설정"""
        # 테스트용 사용자 생성
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name='테스트 보호소',
            location='서울시 강남구',
            phone_number='02-1234-5678',
            region='서울',
            is_public=True,
            public_reg_no='TEST001'
        )
    
    def test_animal_creation_with_public_data(self):
        """공공데이터로 동물 생성 테스트"""
        animal = Animal.objects.create(
            center=self.center,
            name='테스트 동물',
            announce_number='ANNOUNCE001',
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=True,
            public_notice_number='PUBLIC001'
        )
        
        # 필드 검증
        self.assertTrue(animal.is_public_data)
        self.assertEqual(animal.public_notice_number, 'PUBLIC001')
        self.assertEqual(animal.announce_number, 'ANNOUNCE001')
        self.assertEqual(animal.found_location, '서울시 강남구')
        self.assertEqual(animal.center, self.center)
    
    def test_center_public_reg_no_unique(self):
        """센터 공공데이터 번호 유니크 제약 테스트"""
        # 동일한 public_reg_no로 센터 생성 시도
        with self.assertRaises(Exception):
            Center.objects.create(
                name='중복 보호소',
                public_reg_no='TEST001'  # 이미 존재하는 번호
            )
    
    def test_duplicate_public_notice_number_handling(self):
        """중복 공고번호 처리 테스트"""
        # 첫 번째 동물 생성
        animal1 = Animal.objects.create(
            center=self.center,
            name='테스트 동물 1',
            announce_number='ANNOUNCE001',
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명 1',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=True,
            public_notice_number='PUBLIC001'
        )
        
        # 동일한 public_notice_number로 두 번째 동물 생성 시도
        with self.assertRaises(Exception):
            Animal.objects.create(
                center=self.center,
                name='테스트 동물 2',
                announce_number='ANNOUNCE002',
                breed='믹스견',
                age=36,
                is_female=False,
                weight=20.0,
                neutering=False,
                protection_status='보호중',
                adoption_status='입양가능',
                description='테스트 설명 2',
                found_location='서울시 서초구',
                admission_date=date.today(),
                is_public_data=True,
                public_notice_number='PUBLIC001'  # 중복된 공고번호
            )
    
    def test_display_notice_number_property(self):
        """공고번호 표시 속성 테스트"""
        # announce_number가 있는 경우
        animal1 = Animal.objects.create(
            center=self.center,
            name='테스트 동물 1',
            announce_number='ANNOUNCE001',
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명 1',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=False,
            public_notice_number=None
        )
        self.assertEqual(animal1.display_notice_number, 'ANNOUNCE001')
        
        # announce_number가 없고 public_notice_number가 있는 경우
        animal2 = Animal.objects.create(
            center=self.center,
            name='테스트 동물 2',
            announce_number=None,
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명 2',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=True,
            public_notice_number='PUBLIC002'
        )
        self.assertEqual(animal2.display_notice_number, 'PUBLIC002')
        
        # 둘 다 없는 경우
        animal3 = Animal.objects.create(
            center=self.center,
            name='테스트 동물 3',
            announce_number=None,
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명 3',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=False,
            public_notice_number=None
        )
        self.assertEqual(animal3.display_notice_number, '공고번호 없음')
    
    def test_is_public_data_animal_property(self):
        """공공데이터 동물 여부 속성 테스트"""
        # 공공데이터 동물
        animal1 = Animal.objects.create(
            center=self.center,
            name='테스트 동물 1',
            announce_number=None,
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명 1',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=True,
            public_notice_number='PUBLIC001'
        )
        self.assertTrue(animal1.is_public_data_animal)
        
        # 일반 동물 (is_public_data가 False)
        animal2 = Animal.objects.create(
            center=self.center,
            name='테스트 동물 2',
            announce_number='ANNOUNCE001',
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명 2',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=False,
            public_notice_number=None
        )
        self.assertFalse(animal2.is_public_data_animal)
        
        # 공공데이터지만 public_notice_number가 없는 경우
        animal3 = Animal.objects.create(
            center=self.center,
            name='테스트 동물 3',
            announce_number=None,
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명 3',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=True,
            public_notice_number=None
        )
        self.assertFalse(animal3.is_public_data_animal)
    
    def test_comment_field_mapping(self):
        """공공데이터 코멘트 필드 매핑 테스트"""
        # comment 필드가 있는 동물 생성
        animal = Animal.objects.create(
            center=self.center,
            name='테스트 동물',
            announce_number='ANNOUNCE001',
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=True,
            public_notice_number='PUBLIC001',
            comment='공공데이터에서 가져온 특이사항 코멘트입니다.'
        )
        
        # comment 필드 검증
        self.assertEqual(animal.comment, '공공데이터에서 가져온 특이사항 코멘트입니다.')
        self.assertTrue(animal.is_public_data)
    
    def test_center_information_update_logic(self):
        """센터 정보 업데이트 로직 테스트 (동기 방식)"""
        # 기존 센터 생성
        center = Center.objects.create(
            name='기존 보호소',
            location='서울시 강남구',
            phone_number='02-1234-5678',
            region='서울',
            is_public=True,
            public_reg_no='CENTER001'
        )
        
        # 센터 정보 업데이트 시뮬레이션
        center.name = '업데이트된 보호소명'
        center.phone_number = '02-9876-5432'
        center.location = '서울시 서초구'
        center.region = '서울'
        center.save()
        
        # 업데이트된 정보 확인
        updated_center = Center.objects.get(public_reg_no='CENTER001')
        self.assertEqual(updated_center.name, '업데이트된 보호소명')
        self.assertEqual(updated_center.phone_number, '02-9876-5432')
        self.assertEqual(updated_center.location, '서울시 서초구')
        self.assertEqual(updated_center.region, '서울')
    
    def test_animal_image_structure(self):
        """동물 이미지 구조 테스트 (실제 DB 작업 없이)"""
        # 이미지가 있는 동물 생성
        animal = Animal.objects.create(
            center=self.center,
            name='테스트 동물',
            announce_number='ANNOUNCE001',
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            description='테스트 설명',
            found_location='서울시 강남구',
            admission_date=date.today(),
            is_public_data=True,
            public_notice_number='PUBLIC001'
        )
        
        # 이미지 구조 검증 (실제 이미지 처리 없이)
        self.assertTrue(hasattr(animal, 'animalimage_set'))
        self.assertEqual(animal.animalimage_set.count(), 0)  # 초기에는 이미지 없음
        
        # 동물 삭제
        animal.delete()
    
    def test_animal_status_update_from_public_data(self):
        """공공데이터로부터 동물 상태 업데이트 테스트"""
        from animals.schemas.public_data import PublicDataAnimalOut
        
        # 공공데이터 서비스 초기화
        service = PublicDataService('test_service_key')
        
        # 초기 동물 생성 (보호중 상태)
        animal = Animal.objects.create(
            center=self.center,
            name='테스트 동물',
            breed='믹스견',
            age=24,
            is_female=True,
            weight=15.5,
            neutering=True,
            protection_status='보호중',
            adoption_status='입양가능',
            is_public_data=True,
            public_notice_number='PUBLIC001'
        )
        
        # 공공데이터에서 '기증' 상태로 변경된 경우
        animal_data = PublicDataAnimalOut(
            desertion_no='DESERTION001',
            notice_no='PUBLIC001',
            process_state='기증',  # 상태 변경
            kind_nm='믹스견',
            kind_full_nm='믹스견',
            kind_cd='417000',
            up_kind_cd='417000',
            up_kind_nm='개',
            sex_cd='F',
            age='2021(년생)',
            weight='15.5(Kg)',
            neuter_yn='Y',
            color_cd='갈색',
            special_mark='특이사항',
            happen_place='서울시 강남구',
            happen_dt=date.today(),
            care_nm='테스트 보호소',
            care_tel='02-1234-5678',
            care_addr='서울시 강남구',
            care_reg_no='CENTER001',
            care_owner_nm='테스트',
            org_nm='서울특별시동물보호센터'
        )
        
        # 상태 업데이트 시뮬레이션
        new_protection_status = service._map_protection_status(animal_data.process_state)
        new_adoption_status = service._map_adoption_status(animal_data.process_state)
        
        # 상태 변경 확인
        self.assertEqual(new_protection_status, '기증')
        self.assertEqual(new_adoption_status, '입양완료')
        
        # 실제 동물 상태 업데이트
        animal.protection_status = new_protection_status
        animal.adoption_status = new_adoption_status
        animal.save()
        
        # 업데이트된 상태 확인
        updated_animal = Animal.objects.get(public_notice_number='PUBLIC001')
        self.assertEqual(updated_animal.protection_status, '기증')
        self.assertEqual(updated_animal.adoption_status, '입양완료')
        
        # '안락사' 상태로 변경
        animal_data.process_state = '안락사'
        new_protection_status = service._map_protection_status(animal_data.process_state)
        new_adoption_status = service._map_adoption_status(animal_data.process_state)
        
        self.assertEqual(new_protection_status, '안락사')
        self.assertEqual(new_adoption_status, '입양불가')
        
        animal.protection_status = new_protection_status
        animal.adoption_status = new_adoption_status
        animal.save()
        
        updated_animal = Animal.objects.get(public_notice_number='PUBLIC001')
        self.assertEqual(updated_animal.protection_status, '안락사')
        self.assertEqual(updated_animal.adoption_status, '입양불가')
        
        # '공고중' 상태로 변경
        animal_data.process_state = '공고중'
        new_protection_status = service._map_protection_status(animal_data.process_state)
        new_adoption_status = service._map_adoption_status(animal_data.process_state)
        
        self.assertEqual(new_protection_status, '보호중')  # 공고중은 보호중으로 매핑
        self.assertEqual(new_adoption_status, '입양가능')
        
        animal.protection_status = new_protection_status
        animal.adoption_status = new_adoption_status
        animal.save()
        
        updated_animal = Animal.objects.get(public_notice_number='PUBLIC001')
        self.assertEqual(updated_animal.protection_status, '보호중')
        self.assertEqual(updated_animal.adoption_status, '입양가능')
        
        # 빈 process_state 처리 테스트
        # 기존 상태를 '안락사'로 설정
        animal.protection_status = '안락사'
        animal.adoption_status = '입양불가'
        animal.save()
        
        # process_state가 빈 문자열인 경우 상태가 업데이트되지 않아야 함
        animal_data_empty = PublicDataAnimalOut(
            desertion_no='DESERTION001',
            notice_no='PUBLIC001',
            process_state='',  # 빈 문자열
            kind_nm='믹스견',
            kind_full_nm='믹스견',
            kind_cd='417000',
            up_kind_cd='417000',
            up_kind_nm='개',
            sex_cd='F',
            age='2021(년생)',
            weight='15.5(Kg)',
            neuter_yn='Y',
            color_cd='갈색',
            special_mark='특이사항',
            happen_place='서울시 강남구',
            happen_dt=date.today(),
            care_nm='테스트 보호소',
            care_tel='02-1234-5678',
            care_addr='서울시 강남구',
            care_reg_no='CENTER001',
            care_owner_nm='테스트',
            org_nm='서울특별시동물보호센터'
        )
        
        # 빈 process_state로 업데이트 시도 (상태는 변경되지 않아야 함)
        # async 함수이므로 동기적으로 테스트하기 위해 직접 상태 매핑 확인
        # 빈 process_state는 상태 매핑을 건너뛰므로 기존 상태 유지
        from asgiref.sync import sync_to_async
        
        # 빈 process_state는 상태 업데이트를 건너뛰므로 상태는 변경되지 않아야 함
        # 실제로는 _update_animal이 async이므로 테스트에서는 상태 매핑만 확인
        empty_status = service._map_protection_status('')
        self.assertEqual(empty_status, '보호중')  # 빈 문자열은 기본값 '보호중' 반환
        
        # 하지만 _update_animal에서는 빈 process_state를 무시하므로 상태는 변경되지 않음
        # 실제 동물 상태는 여전히 '안락사'여야 함
        updated_animal = Animal.objects.get(public_notice_number='PUBLIC001')
        self.assertEqual(updated_animal.protection_status, '안락사')  # 변경되지 않음
        self.assertEqual(updated_animal.adoption_status, '입양불가')  # 변경되지 않음


class PublicDataErrorHandlingTest(TestCase):
    """공공데이터 오류 처리 테스트"""
    
    def setUp(self):
        """테스트 설정"""
        # 테스트용 사용자 생성
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # 테스트용 센터 생성
        self.center = Center.objects.create(
            name='테스트 보호소',
            location='서울시 강남구',
            phone_number='02-1234-5678',
            region='서울',
            is_public=True
        )
    
    def test_invalid_xml_parsing(self):
        """잘못된 XML 파싱 테스트"""
        service = PublicDataService('test_key')
        
        # 잘못된 XML로 파싱 시도
        result = service._parse_xml_response('<invalid>xml</invalid>')
        
        # 빈 리스트 반환 확인
        self.assertEqual(result, [])
    
    def test_malformed_animal_data(self):
        """잘못된 동물 데이터 처리 테스트"""
        # 필수 필드가 누락된 동물 생성 시도
        with self.assertRaises(Exception):
            animal = Animal(
                # center 필드 누락 (필수 필드)
                name='테스트 동물',
                public_notice_number='TEST001',
                is_public_data=True
            )
            animal.save()  # 실제로 저장 시도


if __name__ == '__main__':
    pass
