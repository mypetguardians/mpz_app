"""
이미지 일괄 마이그레이션 + 경량화.

1) 공공API URL 이미지 → Supabase Storage로 복사 + 경량화
2) 기존 Supabase 이미지 → 경량화 (재업로드)

사용법:
  python manage.py migrate_images                    # 공공API URL 이미지만
  python manage.py migrate_images --all              # Supabase 기존 이미지도 경량화
  python manage.py migrate_images --concurrency=10   # 동시 10개
  python manage.py migrate_images --dry-run          # 대상 확인만
  python manage.py migrate_images --limit=50         # 50개만 처리
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from django.core.management.base import BaseCommand
from animals.models import AnimalImage
from animals.services import PublicDataService

logger = logging.getLogger(__name__)

# 경량화 스킵 기준 (이미 작은 이미지)
SKIP_SIZE_THRESHOLD = 150 * 1024  # 150KB 이하면 이미 경량화된 것으로 판단


class Command(BaseCommand):
    help = "이미지 일괄 마이그레이션 + 경량화 (병렬 처리)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--concurrency",
            type=int,
            default=20,
            help="동시 처리 수 (기본: 20)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="실제 처리 없이 대상 수만 확인",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="최대 처리 수 (0=전체)",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Supabase 기존 이미지도 경량화 (기본: 공공API만)",
        )

    def handle(self, *args, **options):
        concurrency = options["concurrency"]
        dry_run = options["dry_run"]
        limit = options["limit"]
        include_supabase = options["all"]

        # 대상 조회
        public_api_count = AnimalImage.objects.filter(
            image_url__contains="openapi.animal.go.kr"
        ).count()

        supabase_count = 0
        if include_supabase:
            supabase_count = AnimalImage.objects.filter(
                image_url__contains="supabase.co"
            ).count()

        self.stdout.write(f"공공API 이미지: {public_api_count}개")
        if include_supabase:
            self.stdout.write(f"Supabase 이미지: {supabase_count}개")
        self.stdout.write(f"총 대상: {public_api_count + supabase_count}개")
        self.stdout.write(f"동시 처리: {concurrency}개")

        if dry_run:
            self.stdout.write("(dry-run 모드 - 실제 처리 안 함)")
            return

        total = public_api_count + supabase_count
        if total == 0:
            self.stdout.write("마이그레이션할 이미지가 없습니다.")
            return

        asyncio.run(self._migrate(concurrency, limit, include_supabase))

    async def _migrate(self, concurrency, limit, include_supabase):
        import httpx
        from asgiref.sync import sync_to_async
        from django.db.models import Q

        service = PublicDataService(service_key="")
        storage_client = service._get_storage_client()
        if not storage_client:
            self.stdout.write(self.style.ERROR("Storage 클라이언트 초기화 실패"))
            return

        # 대상 조회: 공공API → Supabase 순서
        query = Q(image_url__contains="openapi.animal.go.kr")
        if include_supabase:
            query |= Q(image_url__contains="supabase.co")

        images = await sync_to_async(list)(
            AnimalImage.objects.filter(query)
            .select_related("animal")
            .order_by("id")
        )

        if limit > 0:
            images = images[:limit]

        total = len(images)
        semaphore = asyncio.Semaphore(concurrency)

        # 결과 추적
        results = {"success": 0, "failed": 0, "skipped": 0}
        failed_log = []
        start_time = time.time()

        self.stdout.write(f"처리 시작: {total}개 (동시 {concurrency}개)\n")

        async with httpx.AsyncClient(
            timeout=30,
            limits=httpx.Limits(max_connections=concurrency + 5),
        ) as client:

            async def process_one(idx, img):
                async with semaphore:
                    try:
                        is_supabase = "supabase.co" in img.image_url
                        source_type = "supabase" if is_supabase else "public"

                        # 다운로드
                        response = await client.get(img.image_url, timeout=20)
                        if response.status_code != 200:
                            results["skipped"] += 1
                            failed_log.append({
                                "id": str(img.id),
                                "animal_id": str(img.animal_id),
                                "url": img.image_url,
                                "reason": f"HTTP {response.status_code}",
                                "source": source_type,
                            })
                            return

                        image_bytes = response.content

                        # 이미 작은 이미지는 스킵 (Supabase 경량화 시)
                        if is_supabase and len(image_bytes) <= SKIP_SIZE_THRESHOLD:
                            results["skipped"] += 1
                            return

                        # 경량화
                        optimized_bytes, content_type = await sync_to_async(
                            PublicDataService._optimize_image
                        )(image_bytes)

                        # 크기 변화 없으면 스킵
                        if len(optimized_bytes) >= len(image_bytes):
                            results["skipped"] += 1
                            return

                        # 업로드
                        prefix = (
                            img.animal.public_notice_number
                            or str(img.animal_id)
                        )
                        key = service._build_public_image_key(prefix, ".jpg")

                        result = await sync_to_async(storage_client.upload_file)(
                            key=key,
                            data=optimized_bytes,
                            content_type=content_type,
                        )

                        new_url = result.get("url")
                        if not new_url:
                            results["failed"] += 1
                            failed_log.append({
                                "id": str(img.id),
                                "animal_id": str(img.animal_id),
                                "url": img.image_url,
                                "reason": "업로드 후 URL 없음",
                                "source": source_type,
                            })
                            return

                        # URL 업데이트
                        old_size = len(image_bytes)
                        new_size = len(optimized_bytes)
                        saving = ((old_size - new_size) / old_size * 100) if old_size > 0 else 0

                        img.image_url = new_url
                        await sync_to_async(img.save)(update_fields=["image_url"])

                        results["success"] += 1
                        done = results["success"] + results["failed"] + results["skipped"]
                        if done % 50 == 0 or done == total:
                            elapsed = time.time() - start_time
                            rate = done / elapsed if elapsed > 0 else 0
                            eta = (total - done) / rate if rate > 0 else 0
                            self.stdout.write(
                                f"  [{done}/{total}] "
                                f"성공:{results['success']} 실패:{results['failed']} 스킵:{results['skipped']} "
                                f"({elapsed:.0f}초 경과, 예상 잔여: {eta:.0f}초)"
                            )

                    except Exception as exc:
                        results["failed"] += 1
                        failed_log.append({
                            "id": str(img.id),
                            "animal_id": str(img.animal_id),
                            "url": img.image_url,
                            "reason": str(exc),
                            "source": "supabase" if "supabase.co" in img.image_url else "public",
                        })

            # 병렬 실행
            tasks = [process_one(i, img) for i, img in enumerate(images)]
            await asyncio.gather(*tasks)

        elapsed = time.time() - start_time

        # 실패 로그 파일 저장
        if failed_log:
            log_path = Path(f"migrate_images_failed_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            log_path.write_text(json.dumps(failed_log, ensure_ascii=False, indent=2))
            self.stdout.write(f"\n실패 로그 저장: {log_path}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\n완료: 성공 {results['success']}, 실패 {results['failed']}, "
                f"스킵 {results['skipped']} / 전체 {total} ({elapsed:.1f}초)"
            )
        )
