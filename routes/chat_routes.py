from flask import Blueprint, request, jsonify
from auth.auth_utils import require_auth
from db.connection import get_connection
from ai.chat_service import run_chat

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/api/chat", methods=["POST"])
@require_auth
def chat():
    data = request.get_json()
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB unavailable"}), 503

    messages = data.get("messages", [])
    answer = run_chat(messages)

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO chats (session_id, sender, message) VALUES (%s,%s,%s)",
        (data["session_id"], "assistant", answer),
    )
    conn.commit()

    return jsonify({"answer": answer})
