import logging
from flask import Flask, render_template
from config import Config
from extensions import db
from routes.attendance import attendance_bp
from routes.users import users_bp
from routes.dashboard import dashboard_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(attendance_bp, url_prefix="/api")
    app.register_blueprint(users_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()
        logger.info("Tables ready.")

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template("errors/500.html"), 500

    logger.info("App started.")
    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=app.config.get("DEBUG", False))
