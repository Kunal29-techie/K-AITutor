from flask import Blueprint, request, jsonify
import bcrypt, jwt
from datetime import datetime, timedelta, timezone
from db.connection import get_connection
from config import SECRET_KEY

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB unavailable"}), 503

    cur = conn.cursor()
    cur.execute(
        "SELECT id, password_hash FROM students WHERE user_id=%s",
        (data["user_id"],)
    )
    user = cur.fetchone()

    if not user or not bcrypt.checkpw(
        data["password"].encode(), user[1].encode()
    ):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode(
        {
            "user_id": user[0],
            "exp": datetime.now(timezone.utc) + timedelta(days=1),
        },
        SECRET_KEY,
        algorithm="HS256",
    )

    return jsonify({"token": token})
