from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import asyncio
from notifications.utils import FCMPushNotificationService
from notifications.models import PushToken

User = get_user_model()


class Command(BaseCommand):
    help = 'FCM 푸시 알림을 테스트합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=str,
            help='테스트할 사용자 ID (지정하지 않으면 첫 번째 사용자 사용)',
        )
        parser.add_argument(
            '--title',
            type=str,
            default='테스트 알림',
            help='알림 제목',
        )
        parser.add_argument(
            '--body',
            type=str,
            default='이것은 FCM 테스트 알림입니다.',
            help='알림 내용',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 FCM 전송 없이 테스트만 실행',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('FCM 푸시 알림 테스트를 시작합니다...')
        )
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('DRY RUN 모드: 실제 FCM 전송을 하지 않습니다')
            )
        
        # 비동기 함수 실행
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(self.test_fcm_notification(options))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'오류가 발생했습니다: {e}')
            )
        finally:
            loop.close()
    
    async def test_fcm_notification(self, options):
        """FCM 알림을 테스트합니다."""
        
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
        
        @sync_to_async
        def get_user_push_tokens(user):
            return list(PushToken.objects.filter(user=user, is_active=True).values_list('token', flat=True))
        
        # 테스트 사용자 가져오기
        test_user = await get_test_user()
        self.stdout.write(
            self.style.SUCCESS(f'테스트 사용자: {test_user.username} ({test_user.email})')
        )
        
        # 사용자의 푸시 토큰 확인
        push_tokens = await get_user_push_tokens(test_user)
        
        if not push_tokens:
            self.stdout.write(
                self.style.WARNING('사용자에게 등록된 푸시 토큰이 없습니다')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS(f'발견된 푸시 토큰: {len(push_tokens)}개')
        )
        
        if options['dry_run']:
            self.stdout.write(
                self.style.SUCCESS('DRY RUN 모드로 테스트가 완료되었습니다')
            )
            return
        
        # FCM 서비스 초기화
        fcm_service = FCMPushNotificationService()
        
        if not fcm_service.fcm_server_key:
            self.stdout.write(
                self.style.ERROR('FCM_SERVER_KEY가 설정되지 않았습니다')
            )
            return
        
        # FCM 알림 전송
        self.stdout.write('FCM 푸시 알림을 전송합니다...')
        
        try:
            result = await fcm_service.send_push_notification(
                user_tokens=push_tokens,
                title=options['title'],
                body=options['body'],
                data={
                    'test': True,
                    'timestamp': str(asyncio.get_event_loop().time())
                }
            )
            
            if result.get('success'):
                self.stdout.write(
                    self.style.SUCCESS(f'FCM 푸시 알림 전송 성공: {result}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'FCM 푸시 알림 전송 실패: {result}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'FCM 전송 중 오류 발생: {e}')
            )
