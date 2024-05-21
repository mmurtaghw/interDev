from flask import Flask
from flask_cors import CORS  # <-- Import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)  # <-- CORS is enabled for all routes
    from .routes import main
    app.register_blueprint(main)
    return app