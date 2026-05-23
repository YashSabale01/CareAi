import os
from dotenv import load_dotenv

load_dotenv()

ML_PORT = int(os.getenv('ML_PORT', 5001))
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
MODEL_DIR = os.getenv('MODEL_DIR', './models/saved')
