from django.db import migrations, models

def clean_data(apps, schema_editor):
    SearchHistory = apps.get_model('items', 'SearchHistory')
    for record in SearchHistory.objects.all():
        try:
            # Validate if the item is an integer
            int(record.item)
        except (ValueError, TypeError):
            # Replace invalid values with NULL or a valid default integer
            record.item = None  # Use None if the field allows null
        record.save()

class Migration(migrations.Migration):
    dependencies = [
        ('items', '0006_searchhistory'),  # Update this to the correct dependency
    ]

    operations = [
        migrations.RunPython(clean_data),  # Clean data before altering the field
        migrations.AlterField(
            model_name='searchhistory',
            name='item',
            field=models.BigIntegerField(null=True, blank=True),  # Allow null/blank
        ),
    ]
