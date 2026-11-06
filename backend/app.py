import os
from flask import Flask, jsonify
from flask_cors import CORS

import config
from modules.inverted_index import InvertedIndex
from modules.query_processor import QueryProcessor
from modules.wildcard_processor import WildcardProcessor
from routes.document_routes import document_bp
from routes.search_routes import search_bp
from routes.index_routes import index_bp


def create_app(index_file=None):
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH

    # Enable CORS for all routes (supporting development with Vite frontend)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize IR system components
    actual_index_file = index_file or config.INDEX_FILE
    inverted_index = InvertedIndex(actual_index_file)
    query_processor = QueryProcessor(inverted_index)
    wildcard_processor = WildcardProcessor(inverted_index)

    # Attach to app instance
    app.inverted_index = inverted_index
    app.query_processor = query_processor
    app.wildcard_processor = wildcard_processor

    # Register Route Blueprints
    app.register_blueprint(document_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(index_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "name": "DocuFind IR Engine",
            "version": "1.0.0"
        }), 200

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            "status": "error",
            "message": "File exceeds the maximum upload limit of 32MB."
        }), 413

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "status": "error",
            "message": "API endpoint not found."
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "status": "error",
            "message": "An internal server error occurred."
        }), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"DocuFind Backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
