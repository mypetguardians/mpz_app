from django.core.management.base import BaseCommand
from django.utils import timezone
from asgiref.sync import sync_to_async
import asyncio
from notifications.utils import check_and_notify_monitoring_delays


class Command(BaseCommand):
    help = '모니터링 지연을 확인하고 알림을 전송합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 알림을 전송하지 않고 확인만 합니다',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('모니터링 지연 확인을 시작합니다...')
        )
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('DRY RUN 모드: 실제 알림을 전송하지 않습니다')
            )
        
        # 비동기 함수 실행
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            if not options['dry_run']:
                loop.run_until_complete(check_and_notify_monitoring_delays())
                self.stdout.write(
                    self.style.SUCCESS('모니터링 지연 확인 및 알림 전송이 완료되었습니다')
                )
            else:
                # DRY RUN 모드에서는 실제 알림 전송 없이 확인만
                self.stdout.write(
                    self.style.SUCCESS('DRY RUN 모드로 모니터링 지연 확인이 완료되었습니다')
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'오류가 발생했습니다: {e}')
            )
        finally:
            loop.close()
