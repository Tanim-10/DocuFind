import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, 'storage')
UPLOADS_DIR = os.path.join(STORAGE_DIR, 'uploads')
INDEX_FILE = os.path.join(STORAGE_DIR, 'index.json')

ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}
MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32 MB max request size

# Ensure storage directories exist
os.makedirs(UPLOADS_DIR, exist_ok=True)

