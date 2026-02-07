from flask import Flask
from extensions import cors
from routes.chat_routes import chat_bp
from routes.core_routes import core_bp
from routes.assessment_routes import assessment_bp

app = Flask(__name__)
cors.init_app(app, supports_credentials=True)

app.register_blueprint(chat_bp)
app.register_blueprint(core_bp)
app.register_blueprint(assessment_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
