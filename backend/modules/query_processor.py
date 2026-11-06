import re
import math
import time
from typing import Dict, List, Any, Optional

from modules.tokenizer import Tokenizer
from modules.normalizer import Normalizer
from modules.inverted_index import InvertedIndex
from modules.document_loader import DocumentLoader


class QueryProcessor:
    """
    Processes normal keyword queries, executes scoring (TF-IDF),
    extracts contextual snippets with highlighted terms, and records execution time.
    """

    def __init__(self, index: InvertedIndex):
        self.index = index

    def search(self, query: str) -> Dict[str, Any]:
        start_time = time.perf_counter()

        # Tokenize and normalize query
        query_tokens = Tokenizer.tokenize(query)
        normalized_terms = Normalizer.normalize_tokens(query_tokens)

        # Remove duplicate terms for query vector
        unique_query_terms = list(dict.fromkeys(normalized_terms))

        if not unique_query_terms:
            return {
                "query": query,
                "mode": "normal",
                "total_matches": 0,
                "execution_time_ms": 0.0,
                "terms": [],
                "results": []
            }

        # Calculate scores
        stats = self.index.get_stats()
        total_docs = max(1, stats.get("indexed_documents", 1))

        doc_scores: Dict[str, float] = {}
        doc_matched_terms: Dict[str, List[str]] = {}

        for term in unique_query_terms:
            postings = self.index.get_postings(term)
            if not postings:
                continue

            df = len(postings)
            # Standard smoothed Robertson-Spärck Jones IDF
            idf = math.log(1.0 + (total_docs - df + 0.5) / (df + 0.5))
            if idf < 0.1:
                idf = 0.1

            for doc_id, posting in postings.items():
                tf = posting["freq"]
                doc_len = self.index.doc_lengths.get(doc_id, 100) or 100
                # Normalized TF with sub-linear scaling
                tf_score = (1.0 + math.log(tf)) / (1.0 + math.log(doc_len))
                term_score = tf_score * idf

                doc_scores[doc_id] = doc_scores.get(doc_id, 0.0) + term_score

                if doc_id not in doc_matched_terms:
                    doc_matched_terms[doc_id] = []
                doc_matched_terms[doc_id].append(term)

        # Sort documents by relevance score descending
        sorted_doc_ids = sorted(doc_scores.keys(), key=lambda d: doc_scores[d], reverse=True)

        results = []
        for doc_id in sorted_doc_ids:
            doc_meta = self.index.get_document(doc_id)
            if not doc_meta:
                continue

            matched_terms = doc_matched_terms.get(doc_id, [])
            
            # Generate snippet from file
            snippet = self._generate_snippet(doc_meta.get("filepath", ""), matched_terms)

            results.append({
                "id": doc_id,
                "filename": doc_meta.get("original_filename", doc_meta.get("filename", "")),
                "file_type": doc_meta.get("file_type", ""),
                "file_size": doc_meta.get("file_size", 0),
                "upload_date": doc_meta.get("upload_date", ""),
                "score": round(doc_scores[doc_id], 4),
                "snippet": snippet,
                "matched_terms": matched_terms
            })

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "query": query,
            "mode": "normal",
            "total_matches": len(results),
            "execution_time_ms": execution_time_ms,
            "terms": unique_query_terms,
            "results": results
        }

    def _generate_snippet(self, file_path: str, matched_terms: List[str], max_length: int = 240) -> str:
        """Extracts text, locates highest density window of matching terms, and highlights them."""
        try:
            raw_text = DocumentLoader.extract_text(file_path)
        except Exception:
            return "Preview unavailable for this document."

        if not raw_text.strip():
            return "Document contains no readable text."

        # Split into sentences or lines
        sentences = re.split(r"(?<=[.!?\n])\s+", raw_text)
        sentences = [s.strip() for s in sentences if s.strip()]

        if not sentences:
            sentences = [raw_text[:max_length]]

        # Score sentences by number of matched terms present
        best_sentence_idx = 0
        best_score = -1

        matched_patterns = [re.compile(rf"\b{re.escape(t)}\b", re.IGNORECASE) for t in matched_terms]

        for idx, sentence in enumerate(sentences):
            score = sum(1 for pat in matched_patterns if pat.search(sentence))
            if score > best_score:
                best_score = score
                best_sentence_idx = idx

        # Pick surrounding context around best sentence
        chosen = sentences[best_sentence_idx]
        
        # If too short, append adjacent sentence
        if len(chosen) < max_length // 2 and best_sentence_idx + 1 < len(sentences):
            chosen = f"{chosen} {sentences[best_sentence_idx + 1]}"

        # Truncate if too long while preserving words
        if len(chosen) > max_length:
            chosen = chosen[:max_length].rsplit(" ", 1)[0] + "..."

        if best_sentence_idx > 0 and not chosen.startswith("..."):
            chosen = "..." + chosen

        # Highlight matched terms with <mark> tags
        highlighted = chosen
        for term in matched_terms:
            pattern = re.compile(rf"\b({re.escape(term)})\b", re.IGNORECASE)
            highlighted = pattern.sub(r"<mark>\1</mark>", highlighted)

        return highlighted

