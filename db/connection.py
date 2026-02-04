import psycopg2
from config import DB_CONFIG

def get_connection():
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception:
        return None
