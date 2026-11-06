import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

import config
from modules.document_loader import DocumentLoader

document_bp = Blueprint("documents", __name__, url_prefix="/api/documents")


@document_bp.route("", methods=["GET"])
def get_documents():
    """Retrieve list of all uploaded documents."""
    index = current_app.inverted_index
    docs = index.get_all_documents()
    # Sort latest first
    sorted_docs = sorted(docs, key=lambda d: d.get("upload_date", ""), reverse=True)
    return jsonify({
        "status": "success",
        "count": len(sorted_docs),
        "documents": sorted_docs
    }), 200


@document_bp.route("/upload", methods=["POST"])
def upload_documents():
    """Handles uploading and automatic indexing of one or multiple documents."""
    index = current_app.inverted_index
    uploaded_files = []
    if "files" in request.files:
        uploaded_files = request.files.getlist("files")
    elif "file" in request.files:
        uploaded_files = [request.files.get("file")]

    if not uploaded_files or all(f.filename == "" for f in uploaded_files):
        return jsonify({
            "status": "error",
            "message": "No files selected for upload."
        }), 400

    results = []
    for file in uploaded_files:
        if not file or file.filename == "":
            continue

        orig_filename = secure_filename(file.filename) or "document"
        _, ext = os.path.splitext(orig_filename)
        ext_clean = ext.lower().lstrip(".")

        if ext_clean not in config.ALLOWED_EXTENSIONS:
            results.append({
                "filename": orig_filename,
                "status": "failed",
                "error": f"Unsupported extension '.{ext_clean}'. Supported types: PDF, TXT, DOCX."
            })
            continue

        # Generate unique doc_id and storage filename to avoid collisions
        doc_id = uuid.uuid4().hex[:12]
        stored_filename = f"{doc_id}_{orig_filename}"
        file_path = os.path.join(config.UPLOADS_DIR, stored_filename)

        try:
            file.save(file_path)
            file_size = os.path.getsize(file_path)
        except Exception as e:
            results.append({
                "filename": orig_filename,
                "status": "failed",
                "error": f"Failed to save file: {str(e)}"
            })
            continue

        metadata = {
            "id": doc_id,
            "filename": stored_filename,
            "original_filename": orig_filename,
            "file_type": ext_clean.upper(),
            "file_size": file_size,
            "filepath": file_path,
            "upload_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # Extract text & index
        try:
            extracted_text = DocumentLoader.extract_text(file_path)
            if not extracted_text.strip():
                index.record_failed_document(doc_id, metadata, "Document contains no extractable text.")
                results.append({
                    "id": doc_id,
                    "filename": orig_filename,
                    "status": "failed",
                    "error": "Document contains no extractable text."
                })
            else:
                index.add_document(doc_id, metadata, extracted_text)
                results.append({
                    "id": doc_id,
                    "filename": orig_filename,
                    "file_type": ext_clean.upper(),
                    "file_size": file_size,
                    "status": "indexed",
                    "term_count": index.doc_lengths.get(doc_id, 0),
                    "unique_terms": index.documents.get(doc_id, {}).get("unique_terms", 0)
                })
        except Exception as e:
            index.record_failed_document(doc_id, metadata, str(e))
            results.append({
                "id": doc_id,
                "filename": orig_filename,
                "status": "failed",
                "error": str(e)
            })

    success_count = sum(1 for r in results if r["status"] == "indexed")
    return jsonify({
        "status": "success" if success_count > 0 else "partial_error",
        "message": f"Processed {len(results)} file(s): {success_count} indexed successfully.",
        "results": results,
        "stats": index.get_stats()
    }), 200


@document_bp.route("/<doc_id>", methods=["DELETE"])
def delete_document(doc_id: str):
    """Deletes a document from the inverted index and disk."""
    index = current_app.inverted_index
    doc = index.get_document(doc_id)
    if not doc:
        return jsonify({
            "status": "error",
            "message": f"Document with ID '{doc_id}' not found."
        }), 404

    # Delete physical file
    file_path = doc.get("filepath")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Warning: could not remove file {file_path}: {e}")

    # Remove from index
    deleted = index.delete_document(doc_id)
    if deleted:
        return jsonify({
            "status": "success",
            "message": f"Document '{doc.get('original_filename', doc_id)}' deleted successfully.",
            "stats": index.get_stats()
        }), 200
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to delete document from index."
        }), 500


@document_bp.route("/<doc_id>/preview", methods=["GET"])
def preview_document(doc_id: str):
    """Retrieves document metadata and full extracted content for preview."""
    index = current_app.inverted_index
    doc = index.get_document(doc_id)
    if not doc:
        return jsonify({
            "status": "error",
            "message": f"Document with ID '{doc_id}' not found."
        }), 404

    file_path = doc.get("filepath", "")
    if not os.path.exists(file_path):
        return jsonify({
            "status": "error",
            "message": "Physical document file is missing from storage."
        }), 404

    try:
        content = DocumentLoader.extract_text(file_path)
        return jsonify({
            "status": "success",
            "document": doc,
            "content": content
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "document": doc,
            "content": "",
            "message": f"Failed to extract preview content: {str(e)}"
        }), 500
