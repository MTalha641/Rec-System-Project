from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Drops the auth_user table from the database'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute("DROP TABLE IF EXISTS auth_user CASCADE;")
        self.stdout.write(self.style.SUCCESS('Successfully dropped auth_user table'))
