"""
공공데이터 동기화 Django 관리 명령어
사용법: python manage.py sync_public_data
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from animals.services import PublicDataService
from animals.status_sync_service import PublicDataStatusSyncService
from animals.models import Animal
from datetime import datetime, timedelta
from asgiref.sync import sync_to_async
import asyncio

class Command(BaseCommand):
    help = '공공데이터 동기화 실행'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='동기화할 일수 (기본값: 30일)',
        )
        parser.add_argument(
            '--strategy',
            type=str,
            default='incremental',
            choices=['incremental', 'full', 'status_check'],
            help='동기화 전략 (기본값: incremental)',
        )

    def handle(self, *args, **options):
        service_key = getattr(settings, 'PUBLIC_DATA_SERVICE_KEY', None)
        
        if not service_key:
            self.stdout.write(
                self.style.ERROR('❌ PUBLIC_DATA_SERVICE_KEY가 설정되지 않았습니다.')
            )
            self.stdout.write(
                self.style.WARNING('💡 .env 파일에 PUBLIC_DATA_SERVICE_KEY를 설정해주세요.')
            )
            return
        
        asyncio.run(self.run_sync(service_key, options['days'], options['strategy']))

    async def run_sync(self, service_key, days, strategy):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("🔄 공공데이터 동기화 시작"))
        self.stdout.write("=" * 60)
        
        # 동기화 전 통계
        before_count = await sync_to_async(lambda: Animal.objects.filter(is_public_data=True).count())()
        self.stdout.write(f"📊 동기화 전 공공데이터 동물 수: {before_count}개")
        
        # 날짜 설정: 10월 1일부터 현재까지
        end_date = datetime.now()
        start_date = datetime(end_date.year, 10, 1)  # 올해 10월 1일
        
        bgnde = start_date.strftime('%Y%m%d')
        endde = end_date.strftime('%Y%m%d')
        
        self.stdout.write(f"📅 동기화 기간: {bgnde} ~ {endde}")
        self.stdout.write(f"📋 동기화 전략: {strategy}")
        
        # 공공데이터 서비스 초기화
        public_data_service = PublicDataService(service_key)
        
        # 동물 데이터 가져오기
        self.stdout.write("\n📥 공공데이터 가져오는 중...")
        try:
            is_initial_sync = (strategy == 'full')
            animals_data = await public_data_service.fetch_abandoned_animals(
                bgnde=bgnde,
                endde=endde,
                upkind="417000",  # 개
                state=None,  # None으로 설정하여 모든 상태(보호중, 공고중, 안락사, 자연사 등) 가져오기
                page_no=1,
                num_of_rows=1000,
                is_initial_sync=is_initial_sync
            )
            
            if not animals_data:
                self.stdout.write(self.style.WARNING("⚠️ 가져올 데이터가 없습니다."))
                return
            
            self.stdout.write(self.style.SUCCESS(f"✅ {len(animals_data)}개 동물 데이터 가져옴"))
            
            # 동물 데이터 처리
            self.stdout.write("\n🔄 동물 데이터 처리 중...")
            result = await public_data_service.process_abandoned_animals(animals_data)
            
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS("📊 동기화 결과"))
            self.stdout.write("=" * 60)
            self.stdout.write(f"✅ 생성된 동물: {result['created']}개")
            self.stdout.write(f"🔄 업데이트된 동물: {result['updated']}개")
            if result.get('deleted', 0) > 0:
                self.stdout.write(f"🗑️  삭제된 동물 (데이터없음): {result['deleted']}개")
            self.stdout.write(f"❌ 오류 발생: {result['errors']}개")
            self.stdout.write(f"📦 전체 처리: {result['total']}개")
            
            # 증분 동기화 후 상태 체크
            if strategy == 'incremental':
                self.stdout.write("\n🔄 최근 등록된 동물들의 상태 체크 중...")
                try:
                    status_sync_service = PublicDataStatusSyncService(service_key)
                    status_check_result = await status_sync_service.sync_recent_status_changes(days_back=7)
                    
                    if status_check_result:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"✅ 추가 상태 업데이트: {status_check_result.get('updated', 0)}개"
                            )
                        )
                        self.stdout.write(f"📦 체크한 동물: {status_check_result.get('checked', 0)}개")
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f"⚠️ 상태 체크 중 오류 (무시): {e}")
                    )
            
            # 최종 통계
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS("📊 최종 통계"))
            self.stdout.write("=" * 60)
            after_count = await sync_to_async(lambda: Animal.objects.filter(is_public_data=True).count())()
            self.stdout.write(f"📊 동기화 후 공공데이터 동물 수: {after_count}개")
            self.stdout.write(f"📈 증가: {after_count - before_count}개")
            
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS("✅ 동기화 완료!"))
            self.stdout.write("=" * 60)
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ 오류 발생: {e}"))
            import traceback
            traceback.print_exc()

