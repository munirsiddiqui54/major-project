from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv


def create_app() -> Flask:
    load_dotenv()
    app = Flask(__name__)

    # Config can be extended later; keeping defaults minimal for now
    # Enable CORS for frontend dev server
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000", "*"]}})

    # Register blueprints
    from .routes.health import health_bp
    from .routes.generation import generation_bp
    from .routes.deploy_render import deploy_render_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(generation_bp, url_prefix="/api")
    app.register_blueprint(deploy_render_bp, url_prefix="/api")

    @app.route("/")
    def root():
        return {"status": "ok", "service": "fraxon-backend"}

    return app


