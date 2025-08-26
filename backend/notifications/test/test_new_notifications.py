from django.test import TestCase
from django.utils import timezone
from asgiref.sync import sync_to_async
from unittest.mock import patch, AsyncMock
import asyncio

from notifications.models import Notification
from notifications.utils import (
    notify_new_adoption_application,
    notify_new_temporary_protection,
    notify_monitoring_delayed_for_center,
    notify_monitoring_delayed_for_user,
    notify_new_comment,
    notify_new_reply
)
from user.models import User
from centers.models import Center
from animals.models import Animal
from adoptions.models import Adoption
from posts.models import Post
from comments.models import Comment, Reply


class TestNewNotificationFunctions(TestCase):
    """새로운 알림 기능 테스트"""
    
    def setUp(self):
        """테스트 데이터 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='일반사용자',
            nickname='테스트유저'
        )
        
        self.center_user = User.objects.create_user(
            username='centeruser',
            email='center@example.com',
            password='testpass123',
            user_type='센터관리자',
            nickname='센터관리자'
        )
        
        # 센터 생성
        self.center = Center.objects.create(
            name='테스트 센터',
            owner=self.center_user,
            location='서울시 강남구',
            center_number='02-1234-5678'
        )
        
        # 동물 생성
        self.animal = Animal.objects.create(
            name='테스트 동물',
            center=self.center,
            is_female=True,
            age=3,
            weight=5.5,
            breed='믹스',
            status='보호중'
        )
        
        # 입양 신청 생성
        self.adoption = Adoption.objects.create(
            user=self.user,
            animal=self.animal,
            status='신청',
            monitoring_agreement=True,
            guidelines_agreement=True
        )
        
        # 포스트 생성
        self.post = Post.objects.create(
            title='테스트 포스트',
            content='테스트 내용',
            user=self.user
        )
        
        # 댓글 생성
        self.comment = Comment.objects.create(
            post=self.post,
            user=self.center_user,
            content='테스트 댓글'
        )
        
        # 대댓글 생성
        self.reply = Reply.objects.create(
            comment=self.comment,
            user=self.user,
            content='테스트 대댓글'
        )
    
    def test_notify_new_adoption_application(self):
        """새로운 입양 신청 알림 테스트"""
        # 비동기 함수 실행
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 알림 전송
            loop.run_until_complete(notify_new_adoption_application(str(self.adoption.id)))
            
            # 알림이 생성되었는지 확인
            notification = Notification.objects.filter(
                notification_type='new_adoption_application',
                user=self.center_user
            ).first()
            
            self.assertIsNotNone(notification)
            self.assertEqual(notification.title, '새로운 입양 신청이 접수됐어요')
            self.assertIn(self.user.nickname, notification.message)
            self.assertIn(self.animal.name, notification.message)
            self.assertEqual(notification.priority, 'high')
            
        finally:
            loop.close()
    
    def test_notify_new_temporary_protection(self):
        """새로운 임시보호 등록 알림 테스트"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 알림 전송
            loop.run_until_complete(notify_new_temporary_protection(str(self.animal.id)))
            
            # 알림이 생성되었는지 확인
            notification = Notification.objects.filter(
                notification_type='new_temporary_protection',
                user=self.center_user
            ).first()
            
            self.assertIsNotNone(notification)
            self.assertEqual(notification.title, '새로운 아이가 임시보호 등록됐어요')
            self.assertIn(self.animal.name, notification.message)
            
        finally:
            loop.close()
    
    def test_notify_monitoring_delayed_for_center(self):
        """센터 관리자 모니터링 지연 알림 테스트"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 알림 전송
            loop.run_until_complete(notify_monitoring_delayed_for_center(str(self.adoption.id), 3))
            
            # 알림이 생성되었는지 확인
            notification = Notification.objects.filter(
                notification_type='monitoring_delayed',
                user=self.center_user
            ).first()
            
            self.assertIsNotNone(notification)
            self.assertEqual(notification.title, '모니터링이 3일 지연됐어요')
            self.assertIn('3일 지연', notification.message)
            self.assertEqual(notification.priority, 'high')
            
        finally:
            loop.close()
    
    def test_notify_monitoring_delayed_for_user(self):
        """사용자 모니터링 지연 알림 테스트"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 알림 전송
            loop.run_until_complete(notify_monitoring_delayed_for_user(str(self.adoption.id), 3))
            
            # 알림이 생성되었는지 확인
            notification = Notification.objects.filter(
                notification_type='monitoring_delayed_user',
                user=self.user
            ).first()
            
            self.assertIsNotNone(notification)
            self.assertEqual(notification.title, '모니터링이 3일 지연됐어요')
            self.assertIn('3일 지연', notification.message)
            self.assertEqual(notification.priority, 'high')
            
        finally:
            loop.close()
    
    def test_notify_new_comment(self):
        """새로운 댓글 알림 테스트"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 알림 전송
            loop.run_until_complete(notify_new_comment(str(self.comment.id)))
            
            # 알림이 생성되었는지 확인
            notification = Notification.objects.filter(
                notification_type='new_comment',
                user=self.user  # 포스트 작성자
            ).first()
            
            self.assertIsNotNone(notification)
            self.assertEqual(notification.title, '새로운 댓글이 달렸어요')
            self.assertIn(self.center_user.nickname, notification.message)
            self.assertIn(self.post.title, notification.message)
            
        finally:
            loop.close()
    
    def test_notify_new_comment_self_comment(self):
        """본인이 댓글을 단 경우 알림 전송하지 않음 테스트"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 본인이 댓글을 단 경우
            self_comment = Comment.objects.create(
                post=self.post,
                user=self.user,  # 포스트 작성자와 동일
                content='본인 댓글'
            )
            
            # 알림 전송
            loop.run_until_complete(notify_new_comment(str(self_comment.id)))
            
            # 알림이 생성되지 않았는지 확인
            notification = Notification.objects.filter(
                notification_type='new_comment',
                user=self.user
            ).filter(
                metadata__comment_id=str(self_comment.id)
            ).first()
            
            self.assertIsNone(notification)
            
        finally:
            loop.close()
    
    def test_notify_new_reply(self):
        """새로운 대댓글 알림 테스트"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 알림 전송
            loop.run_until_complete(notify_new_reply(str(self.reply.id)))
            
            # 알림이 생성되었는지 확인
            notification = Notification.objects.filter(
                notification_type='new_reply',
                user=self.comment.user  # 댓글 작성자
            ).first()
            
            self.assertIsNotNone(notification)
            self.assertEqual(notification.title, '새로운 대댓글이 달렸어요')
            self.assertIn(self.user.nickname, notification.message)
            self.assertIn(self.comment.post.title, notification.message)
            
        finally:
            loop.close()
    
    def test_notify_new_reply_self_reply(self):
        """본인이 대댓글을 단 경우 알림 전송하지 않음 테스트"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 본인이 대댓글을 단 경우
            self_reply = Reply.objects.create(
                comment=self.comment,
                user=self.user,  # 댓글 작성자와 동일
                content='본인 대댓글'
            )
            
            # 알림 전송
            loop.run_until_complete(notify_new_reply(str(self_reply.id)))
            
            # 알림이 생성되지 않았는지 확인
            notification = Notification.objects.filter(
                notification_type='new_reply',
                user=self.user
            ).filter(
                metadata__reply_id=str(self_reply.id)
            ).first()
            
            self.assertIsNone(notification)
            
        finally:
            loop.close()
    
    def test_create_notification_for_center_users(self):
        """센터 사용자들에게 알림 생성 테스트"""
        from notifications.utils import create_notification_for_center_users
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 센터 사용자들에게 알림 생성
            result = loop.run_until_complete(create_notification_for_center_users(
                center_id=str(self.center.id),
                notification_type='test_notification',
                title='테스트 알림',
                message='테스트 메시지',
                priority='normal'
            ))
            
            # 알림이 생성되었는지 확인
            notifications = Notification.objects.filter(
                notification_type='test_notification',
                user=self.center_user
            )
            
            self.assertEqual(len(notifications), 1)
            self.assertEqual(result, 1)  # 생성된 알림 개수
            
        finally:
            loop.close()
    
    def test_create_notification_for_user(self):
        """특정 사용자에게 알림 생성 테스트"""
        from notifications.utils import create_notification_for_user
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 특정 사용자에게 알림 생성
            notification = loop.run_until_complete(create_notification_for_user(
                user_id=str(self.user.id),
                notification_type='test_notification',
                title='테스트 알림',
                message='테스트 메시지',
                priority='normal'
            ))
            
            # 알림이 생성되었는지 확인
            self.assertIsNotNone(notification)
            self.assertEqual(notification.user, self.user)
            self.assertEqual(notification.title, '테스트 알림')
            
        finally:
            loop.close()
