from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Drops the items_item table from the database'

    def handle(self, *args, **options):
        table_name = 'items_item'

        with connection.cursor() as cursor:
            cursor.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE;")
        
        self.stdout.write(self.style.SUCCESS(f'Successfully dropped {table_name} table'))
