from flask import Blueprint, request, jsonify, current_app

search_bp = Blueprint("search", __name__, url_prefix="/api/search")


@search_bp.route("", methods=["GET"])
def search():
    query_processor = current_app.query_processor
    wildcard_processor = current_app.wildcard_processor

    query = request.args.get("q", "").strip()
    mode = request.args.get("mode", "normal").lower().strip()

    if not query:
        return jsonify({
            "status": "success",
            "query": "",
            "mode": mode,
            "total_matches": 0,
            "execution_time_ms": 0.0,
            "results": [],
            "message": "Enter a keyword or wildcard pattern to search."
        }), 200

    if mode == "wildcard":
        result = wildcard_processor.search(query)
        return jsonify({
            "status": "success",
            **result
        }), 200
    else:
        result = query_processor.search(query)
        return jsonify({
            "status": "success",
            **result
        }), 200
