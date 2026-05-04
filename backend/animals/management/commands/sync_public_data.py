"""
공공데이터 동기화 Django 관리 명령어

사용법:
  # 증분 동기화 (어제~오늘, 기본값)
  python manage.py sync_public_data

  # 최근 7일 증분 동기화
  python manage.py sync_public_data --strategy incremental --days 7

  # 상태만 동기화 (이미지 스킵, 신규 생성 안 함 — update_only=True)
  python manage.py sync_public_data --strategy status_sync

  # 전체 동기화 (최근 90일)
  python manage.py sync_public_data --strategy full --days 90

운영 유의사항:
- **누적 기준점: 2025-10-01** — DB 비우고 재수집 시 반드시 이 날짜부터 시작.
  history/2026-04-22-24.md에 dev 7,639건 / prod 7,690건으로 처음 누적된 기록.
- **워커 컨테이너 코드 갱신 검증 필수** — 본 명령어는 worker 컨테이너에서 실행되므로
  backend 컨테이너 코드만 갱신되면 효과 없음. 배포 후 반드시
  `docker exec mpz_app-worker-1 grep update_only /backend/animals/services.py` 확인.
- **status_sync는 update_only=True 모드** — services.py:226 시그니처에 update_only
  파라미터 누락 시 신규 폭주 사고 재발 가능 (2026-04-26, 2026-05-03 사고 참조).
"""
import sys
import asyncio
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from asgiref.sync import sync_to_async

from animals.models import Animal, SyncLog
from animals.services import PublicDataService


class Command(BaseCommand):
    help = '공공데이터 동기화 실행'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days', type=int, default=2,
            help='동기화할 일수 (기본값: 2일)',
        )
        parser.add_argument(
            '--strategy', type=str, default='incremental',
            choices=['incremental', 'full', 'status_sync'],
            help='동기화 전략 (기본값: incremental)',
        )
        parser.add_argument(
            '--skip-images', action='store_true',
            help='이미지 업로드 스킵 (상태만 업데이트)',
        )

    def handle(self, *args, **options):
        service_key = getattr(settings, 'PUBLIC_DATA_SERVICE_KEY', None)
        if not service_key:
            self.stderr.write('PUBLIC_DATA_SERVICE_KEY가 설정되지 않았습니다.')
            sys.exit(1)

        try:
            asyncio.run(self._run(service_key, options))
        except Exception as e:
            self.stderr.write(f'동기화 실패: {e}')
            sys.exit(1)

    async def _run(self, service_key, options):
        strategy = options['strategy']
        days = options['days']
        skip_images = options['skip_images'] or strategy == 'status_sync'
        started_at = timezone.now()

        # 날짜 설정
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        bgnde = start_date.strftime('%Y%m%d')
        endde = end_date.strftime('%Y%m%d')

        is_initial_sync = strategy in ('full', 'status_sync')

        # status_sync는 날짜 없이 보호중 전체 조회
        if strategy == 'status_sync':
            bgnde = None
            endde = None

        self.stdout.write(
            f'[sync] 시작 strategy={strategy} days={days} '
            f'range={bgnde or "전체"}~{endde or "전체"} skip_images={skip_images}'
        )

        before_count = await sync_to_async(
            lambda: Animal.objects.filter(is_public_data=True).count()
        )()

        public_data_service = PublicDataService(service_key)
        if skip_images:
            public_data_service._skip_images = True

        # 상태 필터: status_sync는 보호중만 조회, incremental은 날짜 필터가 있으면 보호중만
        state = 'protect' if (bgnde or strategy == 'status_sync') else None

        animals_data = await public_data_service.fetch_abandoned_animals(
            bgnde=bgnde,
            endde=endde,
            upkind='417000',
            state=state,
            page_no=1,
            num_of_rows=1000,
            is_initial_sync=is_initial_sync,
        )

        if not animals_data:
            duration = (timezone.now() - started_at).total_seconds()
            await self._save_sync_log(strategy, 'success', 0, 0, 0, 0, 0, duration, started_at)
            self.stdout.write('[sync] 동기화할 데이터 없음')
            return

        self.stdout.write(f'[sync] {len(animals_data):,}개 동물 데이터 수신')

        update_only = strategy == 'status_sync'
        result = await public_data_service.process_abandoned_animals(animals_data, update_only=update_only)

        # status_sync/full: 공공데이터에 없는 기존 "보호중" 동물 → 보호 종료 처리
        expired_count = 0
        if strategy in ('status_sync', 'full'):
            api_notice_numbers = {a.notice_no for a in animals_data if a.notice_no}
            expired_count = await self._expire_missing_animals(api_notice_numbers)

        duration = (timezone.now() - started_at).total_seconds()

        sync_status = 'partial' if result['errors'] > 0 else 'success'
        await self._save_sync_log(
            strategy, sync_status,
            result['created'], result['updated'], result.get('deleted', 0) + expired_count,
            result['errors'], result['total'], duration, started_at,
        )

        after_count = await sync_to_async(
            lambda: Animal.objects.filter(is_public_data=True).count()
        )()

        self.stdout.write(
            f'[sync] 완료 created={result["created"]} updated={result["updated"]} '
            f'deleted={result.get("deleted", 0)} expired={expired_count} '
            f'errors={result["errors"]} '
            f'total={result["total"]} duration={duration:.0f}s '
            f'before={before_count} after={after_count}'
        )

    async def _expire_missing_animals(self, api_notice_numbers: set) -> int:
        """공공데이터 API에서 보호중으로 내려오지 않은 기존 동물을 보호종료 처리"""
        expired = await sync_to_async(
            lambda: Animal.objects.filter(
                is_public_data=True,
                protection_status='보호중',
            ).exclude(
                public_notice_number__in=api_notice_numbers,
            ).exclude(
                public_notice_number__isnull=True,
            ).exclude(
                public_notice_number='',
            ).update(
                protection_status='보호종료',
                adoption_status='기타',
            )
        )()
        if expired > 0:
            self.stdout.write(f'[sync] 보호종료 처리: {expired}개 (API에서 미발견)')
        return expired

    async def _save_sync_log(self, strategy, status, created, updated, deleted, errors, total, duration, started_at):
        try:
            await sync_to_async(SyncLog.objects.create)(
                strategy=strategy,
                status=status,
                created_count=created,
                updated_count=updated,
                deleted_count=deleted,
                error_count=errors,
                total_count=total,
                duration_seconds=duration,
                started_at=started_at,
            )
        except Exception as e:
            self.stderr.write(f'SyncLog 저장 실패: {e}')
