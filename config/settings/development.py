from .base import *

DEBUG = True

# SQLite untuk development (tidak perlu install PostgreSQL dulu)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CORS_ALLOW_ALL_ORIGINS = True  # Izinkan semua origin saat development
