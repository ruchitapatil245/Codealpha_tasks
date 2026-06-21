@echo off
echo ========================================
echo   ShopVerse E-Commerce - Setup
echo ========================================
echo.

py -3 -m pip install -r requirements.txt -q
py -3 manage.py migrate
py -3 manage.py seed_products

py -3 -c "import os,django; os.environ.setdefault('DJANGO_SETTINGS_MODULE','shop.settings'); django.setup(); from django.contrib.auth.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin','admin@shopverse.com','admin123'); User.objects.filter(username='demo').exists() or User.objects.create_user('demo','demo@shopverse.com','demo123'); print('Users ready.')"

echo.
echo ========================================
echo   Setup complete! Starting server...
echo ========================================
echo.
echo   Store:  http://127.0.0.1:8000/
echo   Admin:  http://127.0.0.1:8000/admin/
echo.
echo   Demo login:  demo / demo123
echo   Admin login: admin / admin123
echo.
py -3 manage.py runserver
