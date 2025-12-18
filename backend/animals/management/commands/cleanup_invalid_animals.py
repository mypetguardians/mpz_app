"""
잘못된 상태의 공공데이터 동물 삭제 관리 명령어
사용법: python manage.py cleanup_invalid_animals
"""
from django.core.management.base import BaseCommand
from animals.models import Animal
from asgiref.sync import sync_to_async

class Command(BaseCommand):
    help = '잘못된 상태(데이터없음, 상태불명)의 공공데이터 동물 삭제'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제로 삭제하지 않고 확인만 함',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # 잘못된 상태의 동물 찾기
        invalid_animals = Animal.objects.filter(is_public_data=True).filter(
            adoption_status__in=['데이터없음', '상태불명']
        ) | Animal.objects.filter(is_public_data=True).filter(
            protection_status__in=['상태불명']
        )
        
        count = invalid_animals.count()
        
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.WARNING("🗑️  잘못된 상태의 동물 삭제"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"📊 발견된 잘못된 상태 동물: {count}개")
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS("✅ 삭제할 동물이 없습니다."))
            return
        
        # 상세 정보
        self.stdout.write("\n📋 삭제 대상 동물 목록 (최대 20개):")
        for animal in invalid_animals[:20]:
            self.stdout.write(
                f"   - {animal.name} ({animal.public_notice_number}): "
                f"보호상태={animal.protection_status}, 입양상태={animal.adoption_status}"
            )
        
        if count > 20:
            self.stdout.write(f"   ... 외 {count - 20}개")
        
        if dry_run:
            self.stdout.write("\n" + self.style.WARNING("🔍 DRY RUN 모드: 실제로 삭제하지 않습니다."))
            return
        
        # 확인
        self.stdout.write("\n" + self.style.ERROR(f"⚠️  {count}개 동물을 삭제하시겠습니까?"))
        self.stdout.write(self.style.WARNING("계속하려면 'yes'를 입력하세요: "))
        
        confirm = input()
        if confirm.lower() != 'yes':
            self.stdout.write(self.style.WARNING("❌ 취소되었습니다."))
            return
        
        # 삭제 실행
        self.stdout.write("\n🗑️  삭제 중...")
        deleted_count, _ = invalid_animals.delete()
        
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS(f"✅ {deleted_count}개 동물 삭제 완료!"))
        self.stdout.write("=" * 60)

