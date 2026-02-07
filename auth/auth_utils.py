import jwt
from functools import wraps
from flask import request, jsonify
from config import SECRET_KEY

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({"ok": True}), 200

        auth = request.headers.get("Authorization")
        if not auth:
            return jsonify({"error": "Auth required"}), 401

        try:
            token = auth.split()[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_id = payload["user_id"]
        except Exception:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return wrapper
