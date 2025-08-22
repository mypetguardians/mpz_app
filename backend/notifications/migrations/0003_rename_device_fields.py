# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='pushtoken',
            old_name='device_type',
            new_name='platform',
        ),
        migrations.RenameField(
            model_name='pushtoken',
            old_name='last_used_at',
            new_name='last_used',
        ),
        migrations.AlterUniqueTogether(
            name='pushtoken',
            unique_together={('user', 'platform', 'token')},
        ),
    ]
