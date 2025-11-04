from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0009_remove_post_adoption'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemtag',
            name='sequence',
            field=models.IntegerField(default=0, help_text='표시 순서'),
        ),
        migrations.AlterModelOptions(
            name='systemtag',
            options={
                'db_table': 'system_tags',
                'verbose_name': '시스템 태그',
                'verbose_name_plural': '시스템 태그들',
                'ordering': ['sequence', 'name'],
            },
        ),
    ]


