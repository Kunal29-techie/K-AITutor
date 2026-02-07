import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_IN_PRODUCTION")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

INSTRUCTIONS_PATH = os.path.join(BASE_DIR, "instructions.txt")
TRANSCRIPT_PATH = os.path.join(BASE_DIR, "Transcript-1.docx")
LOGO_PATH = os.path.join(BASE_DIR, "routes", "kaitutor-logo.png")

DB_CONFIG = {
    "dbname": "kaitutor",
    "user": "postgres",
    "password": "kaitutor2025",
    "host": "kaitutor-db.cby8g244akoo.ap-south-1.rds.amazonaws.com",
    "port": "5432"
}
