# Generated by Django 5.1.2 on 2025-02-11 17:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('items', '0012_searchhistory_search_query_alter_searchhistory_item'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='address',
            field=models.CharField(default='', max_length=255),
        ),
    ]
