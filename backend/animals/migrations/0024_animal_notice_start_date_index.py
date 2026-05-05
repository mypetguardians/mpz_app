"""
notice_start_date에 db_index 추가 + 민간 동물 backfill.

목적:
- 입양탭 정렬 기준을 notice_start_date desc로 통일 → 인덱스 필수.
- 민간 동물(is_public_data=False) 99건 중 notice_start_date NULL인 행을
  created_at::date로 backfill (model.save() 자동 채움은 이후 등록부터 적용).

PostgreSQL CONCURRENTLY:
- AlterField로 db_index=True 추가 시 Django는 일반 CREATE INDEX 사용 (lock 발생).
- prod 35,800건 규모면 lock 시간 거의 무시할 수준이라 standard로 진행.
- 더 큰 테이블이거나 lock 회피 필요 시 RunSQL with CONCURRENTLY로 별도 분리.
"""
from django.db import migrations, models
from django.db.models import F


def backfill_private_notice_start_date(apps, schema_editor):
    """민간 동물 notice_start_date를 created_at의 date 부분으로 채움."""
    Animal = apps.get_model('animals', 'Animal')
    Animal.objects.filter(
        is_public_data=False,
        notice_start_date__isnull=True,
    ).update(notice_start_date=F('created_at__date'))


def reverse_noop(apps, schema_editor):
    """downgrade 시 NULL로 되돌리는 건 위험하므로 noop."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('animals', '0023_synclog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='animal',
            name='notice_start_date',
            field=models.DateField(
                blank=True,
                null=True,
                db_index=True,
                help_text=(
                    "공고 시작일 — 사용자에게 동물이 노출되기 시작한 날짜. "
                    "공공 동물: 공공 API의 noticeSdt(공고 시작일). "
                    "민간 동물: 센터가 우리 시스템에 등록한 일자(created_at::date) — pre_save에서 자동 채움. "
                    "한 번 set되면 이후 sync에서도 갱신 안 됨 (입양탭 정렬 위치 보존)."
                ),
            ),
        ),
        migrations.RunPython(backfill_private_notice_start_date, reverse_noop),
    ]
