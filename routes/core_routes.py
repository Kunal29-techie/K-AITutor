from flask import Blueprint, jsonify
from auth.auth_utils import require_auth
from db.connection import get_connection

core_bp = Blueprint("core", __name__)

@core_bp.route("/", methods=["GET"])
def home():
    return "✅ KAiTutor Server Running"

@core_bp.route("/api/dashboard-stats", methods=["GET"])
@require_auth
def dashboard():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB unavailable"}), 503

    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM chats WHERE sender='user' AND session_id IN "
        "(SELECT session_id FROM sessions WHERE user_id=%s)",
        (request.user_id,),
    )
    total = cur.fetchone()[0]
    return jsonify({"total_chats": total})
