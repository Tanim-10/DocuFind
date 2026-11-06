import os
from datetime import datetime
from flask import Blueprint, jsonify, current_app

import config
from modules.document_loader import DocumentLoader

index_bp = Blueprint("index", __name__, url_prefix="/api/index")


@index_bp.route("/stats", methods=["GET"])
def get_stats():
    """Returns statistics on the inverted index and document counts."""
    index = current_app.inverted_index
    stats = index.get_stats()
    return jsonify({
        "status": "success",
        "stats": stats
    }), 200


@index_bp.route("/terms", methods=["GET"])
def get_terms():
    """Returns top terms by document frequency for index analysis and visualization."""
    index = current_app.inverted_index
    top_terms = index.get_top_terms(limit=25)
    return jsonify({
        "status": "success",
        "terms": top_terms,
        "total_terms": len(index.postings)
    }), 200


@index_bp.route("/rebuild", methods=["POST"])
def rebuild_index():
    """
    Rebuilds the inverted index from all files residing in storage/uploads.
    """
    index = current_app.inverted_index
    existing_docs = list(index.documents.values())
    
    files_to_index = []
    if existing_docs:
        for doc in existing_docs:
            files_to_index.append((doc.get("id"), doc))
    else:
        # Discover files in uploads folder
        for fname in os.listdir(config.UPLOADS_DIR):
            full_path = os.path.join(config.UPLOADS_DIR, fname)
            if os.path.isfile(full_path):
                _, ext = os.path.splitext(fname)
                ext_clean = ext.lower().lstrip(".")
                if ext_clean in config.ALLOWED_EXTENSIONS:
                    doc_id = fname.split("_")[0] if "_" in fname else fname
                    orig_name = fname.split("_", 1)[1] if "_" in fname else fname
                    meta = {
                        "id": doc_id,
                        "filename": fname,
                        "original_filename": orig_name,
                        "file_type": ext_clean.upper(),
                        "file_size": os.path.getsize(full_path),
                        "filepath": full_path,
                        "upload_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                    files_to_index.append((doc_id, meta))

    # Clear existing index
    index.clear()

    rebuilt_count = 0
    failed_count = 0

    for doc_id, meta in files_to_index:
        file_path = meta.get("filepath")
        if not file_path or not os.path.exists(file_path):
            file_path = os.path.join(config.UPLOADS_DIR, meta.get("filename", ""))
            meta["filepath"] = file_path

        if not os.path.exists(file_path):
            failed_count += 1
            index.record_failed_document(doc_id, meta, "File not found on disk during rebuild.")
            continue

        try:
            extracted_text = DocumentLoader.extract_text(file_path)
            if not extracted_text.strip():
                index.record_failed_document(doc_id, meta, "Empty document text.")
                failed_count += 1
            else:
                index.add_document(doc_id, meta, extracted_text)
                rebuilt_count += 1
        except Exception as e:
            index.record_failed_document(doc_id, meta, str(e))
            failed_count += 1

    return jsonify({
        "status": "success",
        "message": f"Index rebuild complete: {rebuilt_count} indexed, {failed_count} failed.",
        "stats": index.get_stats()
    }), 200
