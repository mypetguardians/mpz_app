from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import asyncio
from notifications.utils import send_real_time_notification, send_broadcast_notification

User = get_user_model()


class Command(BaseCommand):
    help = '실시간 WebSocket 알림을 테스트합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=str,
            help='테스트할 사용자 ID (지정하지 않으면 첫 번째 사용자 사용)',
        )
        parser.add_argument(
            '--title',
            type=str,
            default='실시간 테스트 알림',
            help='알림 제목',
        )
        parser.add_argument(
            '--message',
            type=str,
            default='이것은 실시간 WebSocket 테스트 알림입니다.',
            help='알림 내용',
        )
        parser.add_argument(
            '--type',
            type=str,
            default='test',
            help='알림 타입',
        )
        parser.add_argument(
            '--broadcast',
            action='store_true',
            help='관리자들에게 브로드캐스트 알림 전송',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('실시간 WebSocket 알림 테스트를 시작합니다...')
        )
        
        # 비동기 함수 실행
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(self.test_realtime_notification(options))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'오류가 발생했습니다: {e}')
            )
        finally:
            loop.close()
    
    async def test_realtime_notification(self, options):
        """실시간 알림을 테스트합니다."""
        
        @sync_to_async
        def get_test_user():
            if options['user_id']:
                try:
                    return User.objects.get(id=options['user_id'])
                except User.DoesNotExist:
                    raise Exception(f"사용자 ID {options['user_id']}를 찾을 수 없습니다")
            else:
                # 첫 번째 사용자 사용
                user = User.objects.first()
                if not user:
                    raise Exception("사용자가 존재하지 않습니다")
                return user
        
        if options['broadcast']:
            # 브로드캐스트 알림 테스트
            self.stdout.write('관리자들에게 브로드캐스트 알림을 전송합니다...')
            
            notification_data = {
                "title": options['title'],
                "message": options['message'],
                "notification_type": options['type'],
                "priority": "normal",
                "timestamp": "2024-01-01T00:00:00Z"
            }
            
            try:
                await send_broadcast_notification(notification_data)
                self.stdout.write(
                    self.style.SUCCESS('브로드캐스트 알림 전송 성공')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'브로드캐스트 알림 전송 실패: {e}')
                )
        else:
            # 개별 사용자 알림 테스트
            test_user = await get_test_user()
            self.stdout.write(
                self.style.SUCCESS(f'테스트 사용자: {test_user.username} ({test_user.email})')
            )
            
            notification_data = {
                "id": "test-notification-id",
                "title": options['title'],
                "message": options['message'],
                "notification_type": options['type'],
                "priority": "normal",
                "action_url": "/test",
                "metadata": {"test": True},
                "created_at": "2024-01-01T00:00:00Z"
            }
            
            self.stdout.write('실시간 WebSocket 알림을 전송합니다...')
            
            try:
                await send_real_time_notification(str(test_user.id), notification_data)
                self.stdout.write(
                    self.style.SUCCESS('실시간 알림 전송 성공')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'실시간 알림 전송 실패: {e}')
                )
