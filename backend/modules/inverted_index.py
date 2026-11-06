import os
import json
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional

from modules.tokenizer import Tokenizer
from modules.normalizer import Normalizer


class InvertedIndex:
    """
    Manages an inverted index mapping terms to document postings,
    including term frequencies and token positions.
    Persists to JSON disk storage.
    """

    def __init__(self, index_file: str):
        self.index_file = index_file
        self.lock = threading.Lock()
        
        # Core data structures
        # postings: { term: { doc_id: { "freq": int, "positions": [int, ...] } } }
        self.postings: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # documents: { doc_id: { metadata } }
        self.documents: Dict[str, Dict[str, Any]] = {}
        # doc_lengths: { doc_id: total_token_count }
        self.doc_lengths: Dict[str, int] = {}
        
        # Metadata / Stats
        self.last_updated: Optional[str] = None
        
        # Load from disk if exists
        self.load()

    def add_document(self, doc_id: str, metadata: Dict[str, Any], raw_text: str) -> bool:
        """
        Tokenizes, normalizes, and adds a document to the index.
        """
        with self.lock:
            # First remove existing document postings if it was previously indexed
            self._remove_doc_from_postings(doc_id)

            # Tokenize with positions
            token_positions = Tokenizer.tokenize_with_positions(raw_text)
            total_tokens = len(token_positions)
            
            # Map of normalized term -> list of positions
            term_positions: Dict[str, List[int]] = {}
            for token, pos in token_positions:
                term = Normalizer.normalize_token(token)
                if not term:
                    continue
                if term not in term_positions:
                    term_positions[term] = []
                term_positions[term].append(pos)

            # Insert into postings
            for term, positions in term_positions.items():
                if term not in self.postings:
                    self.postings[term] = {}
                self.postings[term][doc_id] = {
                    "freq": len(positions),
                    "positions": positions
                }

            # Update document registry
            doc_record = {
                **metadata,
                "id": doc_id,
                "term_count": total_tokens,
                "unique_terms": len(term_positions),
                "status": "indexed",
                "error": None
            }
            self.documents[doc_id] = doc_record
            self.doc_lengths[doc_id] = total_tokens
            self.last_updated = datetime.now().isoformat()

            self._save_unlocked()
            return True

    def record_failed_document(self, doc_id: str, metadata: Dict[str, Any], error_msg: str):
        """Records a document that could not be processed."""
        with self.lock:
            self._remove_doc_from_postings(doc_id)
            doc_record = {
                **metadata,
                "id": doc_id,
                "term_count": 0,
                "unique_terms": 0,
                "status": "failed",
                "error": error_msg
            }
            self.documents[doc_id] = doc_record
            self.doc_lengths[doc_id] = 0
            self.last_updated = datetime.now().isoformat()
            self._save_unlocked()

    def delete_document(self, doc_id: str) -> bool:
        """Deletes a document from the inverted index and document store."""
        with self.lock:
            if doc_id not in self.documents:
                return False

            self._remove_doc_from_postings(doc_id)
            
            # Remove from document store
            doc = self.documents.pop(doc_id, None)
            self.doc_lengths.pop(doc_id, None)
            self.last_updated = datetime.now().isoformat()

            self._save_unlocked()
            return True

    def _remove_doc_from_postings(self, doc_id: str):
        """Helper to purge all postings referencing doc_id."""
        empty_terms = []
        for term, doc_map in self.postings.items():
            if doc_id in doc_map:
                del doc_map[doc_id]
                if not doc_map:
                    empty_terms.append(term)
        
        for term in empty_terms:
            del self.postings[term]

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        with self.lock:
            return self.documents.get(doc_id)

    def get_all_documents(self) -> List[Dict[str, Any]]:
        with self.lock:
            return list(self.documents.values())

    def get_postings(self, term: str) -> Dict[str, Dict[str, Any]]:
        """Returns { doc_id: { freq: int, positions: [...] } } for a normalized term."""
        norm_term = Normalizer.normalize_token(term)
        with self.lock:
            return self.postings.get(norm_term, {})

    def get_vocabulary(self) -> List[str]:
        """Returns sorted list of all unique indexed terms."""
        with self.lock:
            return sorted(self.postings.keys())

    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            indexed_docs = sum(1 for d in self.documents.values() if d.get("status") == "indexed")
            failed_docs = sum(1 for d in self.documents.values() if d.get("status") == "failed")
            total_postings = sum(len(postings_map) for postings_map in self.postings.values())
            
            return {
                "total_documents": len(self.documents),
                "indexed_documents": indexed_docs,
                "failed_documents": failed_docs,
                "total_unique_terms": len(self.postings),
                "total_index_entries": total_postings,
                "last_updated": self.last_updated
            }

    def get_top_terms(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Returns top terms by document frequency (how many documents contain the term)."""
        with self.lock:
            # Sort by document frequency, then total term occurrences
            sorted_terms = sorted(
                self.postings.items(),
                key=lambda item: (len(item[1]), sum(p["freq"] for p in item[1].values())),
                reverse=True
            )
            top = []
            for term, doc_map in sorted_terms[:limit]:
                top.append({
                    "term": term,
                    "doc_freq": len(doc_map),
                    "total_freq": sum(p["freq"] for p in doc_map.values())
                })
            return top

    def clear(self):
        """Clears all in-memory index structures."""
        with self.lock:
            self.postings.clear()
            self.documents.clear()
            self.doc_lengths.clear()
            self.last_updated = datetime.now().isoformat()
            self._save_unlocked()

    def _save_unlocked(self):
        """Writes index to disk without acquiring lock (caller must hold lock)."""
        try:
            data = {
                "postings": self.postings,
                "documents": self.documents,
                "doc_lengths": self.doc_lengths,
                "last_updated": self.last_updated
            }
            tmp_file = f"{self.index_file}.tmp"
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            
            # Atomic replacement
            if os.path.exists(self.index_file):
                os.replace(tmp_file, self.index_file)
            else:
                os.rename(tmp_file, self.index_file)
        except Exception as e:
            print(f"Error persisting inverted index: {e}")

    def load(self):
        """Loads index from disk if present."""
        with self.lock:
            if not os.path.exists(self.index_file):
                return
            try:
                with open(self.index_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.postings = data.get("postings", {})
                    self.documents = data.get("documents", {})
                    self.doc_lengths = data.get("doc_lengths", {})
                    self.last_updated = data.get("last_updated")
            except Exception as e:
                print(f"Failed to load inverted index from {self.index_file}: {e}")

