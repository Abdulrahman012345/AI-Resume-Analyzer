import os
from dotenv import load_dotenv

load_dotenv()
import pymysql
pymysql.install_as_MySQLdb()
from urllib.parse import urlparse, unquote
import ssl
import os
from pathlib import Path
from datetime import timedelta

import pymysql
from dotenv import load_dotenv

# PyMySQL compatibility for Django MySQL backend
pymysql.version_info = (2, 2, 1, "final", 0)
pymysql.__version__ = "2.2.1"
pymysql.install_as_MySQLdb()

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env
load_dotenv(BASE_DIR / ".env")

# Security
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("DJANGO_SECRET_KEY is missing from backend/.env")

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "ai-resume-analyzer-4jf7.onrender.com",
]

# Applications
INSTALLED_APPS = [
    "rest_framework",
    "corsheaders",
    "resumes",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

# Middleware
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database - MySQL

db_url = urlparse(os.getenv("DATABASE_URL"))
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", "resume_analyzer"),
        "USER": os.getenv("DB_USER", "root"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "3306"),
        "OPTIONS": {
    "charset": "utf8mb4",
    "ssl": {
        "ssl": {}
    },
},
    }
}

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static Files
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media Files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ai-resume-analyzer-1-1mo2.onrender.com",
]

# Email
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.BasicAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
}

# JWT Configuration
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CORS_ALLOWED_ORIGINS = [
    "https://ai-resume-analyzer-1-1mo2.onrender.com",
]