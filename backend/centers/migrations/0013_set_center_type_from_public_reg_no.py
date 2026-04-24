from django.db import migrations


def set_center_type(apps, schema_editor):
    Center = apps.get_model('centers', 'Center')
    # public_reg_no가 없는 센터 → 민간
    Center.objects.filter(public_reg_no__isnull=True).update(center_type='private')
    # public_reg_no가 있는 센터 → 공공 (기본값이지만 명시적으로)
    Center.objects.filter(public_reg_no__isnull=False).update(center_type='public')


def reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('centers', '0012_add_center_type'),
    ]

    operations = [
        migrations.RunPython(set_center_type, reverse),
    ]
