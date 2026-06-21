from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Full project setup: migrate, seed data, create default users'

    def handle(self, *args, **options):
        self.stdout.write('Running migrations...')
        call_command('migrate', verbosity=0)

        self.stdout.write('Seeding products...')
        call_command('seed_products', verbosity=0)

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@shopverse.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('Created admin user (admin / admin123)'))
        else:
            self.stdout.write('Admin user already exists')

        if not User.objects.filter(username='demo').exists():
            User.objects.create_user('demo', 'demo@shopverse.com', 'demo123')
            self.stdout.write(self.style.SUCCESS('Created demo user (demo / demo123)'))
        else:
            self.stdout.write('Demo user already exists')

        self.stdout.write(self.style.SUCCESS('\nShopVerse is ready!'))
        self.stdout.write('  Store: http://127.0.0.1:8000/')
        self.stdout.write('  Admin: http://127.0.0.1:8000/admin/')
        self.stdout.write('  Demo:  demo / demo123')
        self.stdout.write('  Admin: admin / admin123')
