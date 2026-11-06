import re
import math
import time
from typing import Dict, List, Any, Set

from modules.tokenizer import Tokenizer
from modules.normalizer import Normalizer
from modules.inverted_index import InvertedIndex
from modules.document_loader import DocumentLoader


class WildcardProcessor:
    """
    Expands wildcard patterns (* for 0+ characters, ? for 1 character)
    against the indexed vocabulary, retrieves matching documents,
    scores results, and highlights expanded terms in snippets.
    """

    def __init__(self, index: InvertedIndex):
        self.index = index

    @staticmethod
    def _wildcard_to_regex(pattern: str) -> re.Pattern:
        """
        Translates * (zero or more chars) and ? (single/optional char) into regex.
        Supports patterns like comput*, data*base, and alg?orithm.
        """
        pattern = pattern.lower().strip()
        escaped = re.escape(pattern)
        # * represents zero or more alphanumeric characters
        # ? represents single character (or optional single char for flexible IR matching like alg?orithm)
        regex_str = escaped.replace(r"\*", r"[a-zA-Z0-9]*").replace(r"\?", r"[a-zA-Z0-9]?")
        return re.compile(rf"^{regex_str}$")

    def search(self, query: str) -> Dict[str, Any]:
        start_time = time.perf_counter()

        if not query or not query.strip():
            return {
                "query": query,
                "mode": "wildcard",
                "total_matches": 0,
                "execution_time_ms": 0.0,
                "expanded_terms": [],
                "expansion_count": 0,
                "results": [],
                "message": "Query cannot be empty."
            }

        # Raw query tokens (preserving * and ?)
        raw_tokens = [t.strip() for t in query.split() if t.strip()]

        vocabulary = self.index.get_vocabulary()

        all_matched_terms: Set[str] = set()
        unmatched_patterns: List[str] = []

        for token in raw_tokens:
            if "*" in token or "?" in token:
                regex = self._wildcard_to_regex(token)
                matched = [term for term in vocabulary if regex.match(term)]
                if matched:
                    all_matched_terms.update(matched)
                else:
                    unmatched_patterns.append(token)
            else:
                norm = Normalizer.normalize_token(token)
                if norm in self.index.postings:
                    all_matched_terms.add(norm)
                else:
                    unmatched_patterns.append(token)

        expanded_terms_list = sorted(list(all_matched_terms))

        if not expanded_terms_list:
            execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            patterns_str = ", ".join(f"'{p}'" for p in unmatched_patterns)
            return {
                "query": query,
                "mode": "wildcard",
                "total_matches": 0,
                "execution_time_ms": execution_time_ms,
                "expanded_terms": [],
                "expansion_count": 0,
                "results": [],
                "message": f"No indexed vocabulary terms matched pattern: {patterns_str}."
            }

        # Retrieve documents matching any expanded terms
        stats = self.index.get_stats()
        total_docs = max(1, stats.get("indexed_documents", 1))

        doc_scores: Dict[str, float] = {}
        doc_matched_terms: Dict[str, List[str]] = {}

        for term in expanded_terms_list:
            postings = self.index.get_postings(term)
            if not postings:
                continue

            df = len(postings)
            idf = math.log(1.0 + (total_docs - df + 0.5) / (df + 0.5))
            if idf < 0.1:
                idf = 0.1

            for doc_id, posting in postings.items():
                tf = posting["freq"]
                doc_len = self.index.doc_lengths.get(doc_id, 100) or 100
                tf_score = (1.0 + math.log(tf)) / (1.0 + math.log(doc_len))
                term_score = tf_score * idf

                doc_scores[doc_id] = doc_scores.get(doc_id, 0.0) + term_score

                if doc_id not in doc_matched_terms:
                    doc_matched_terms[doc_id] = []
                if term not in doc_matched_terms[doc_id]:
                    doc_matched_terms[doc_id].append(term)

        # Sort documents by score descending
        sorted_doc_ids = sorted(doc_scores.keys(), key=lambda d: doc_scores[d], reverse=True)

        results = []
        for doc_id in sorted_doc_ids:
            doc_meta = self.index.get_document(doc_id)
            if not doc_meta:
                continue

            terms_in_doc = doc_matched_terms.get(doc_id, [])
            snippet = self._generate_snippet(doc_meta.get("filepath", ""), terms_in_doc)

            results.append({
                "id": doc_id,
                "filename": doc_meta.get("original_filename", doc_meta.get("filename", "")),
                "file_type": doc_meta.get("file_type", ""),
                "file_size": doc_meta.get("file_size", 0),
                "upload_date": doc_meta.get("upload_date", ""),
                "score": round(doc_scores[doc_id], 4),
                "snippet": snippet,
                "matched_terms": terms_in_doc
            })

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "query": query,
            "mode": "wildcard",
            "total_matches": len(results),
            "execution_time_ms": execution_time_ms,
            "expanded_terms": expanded_terms_list,
            "expansion_count": len(expanded_terms_list),
            "results": results,
            "message": None if results else "Expanded terms matched vocabulary, but no indexed documents were found."
        }

    def _generate_snippet(self, file_path: str, matched_terms: List[str], max_length: int = 240) -> str:
        """Extracts snippet and highlights matched expanded terms."""
        try:
            raw_text = DocumentLoader.extract_text(file_path)
        except Exception:
            return "Preview unavailable for this document."

        if not raw_text.strip():
            return "Document contains no readable text."

        sentences = re.split(r"(?<=[.!?\n])\s+", raw_text)
        sentences = [s.strip() for s in sentences if s.strip()]

        if not sentences:
            sentences = [raw_text[:max_length]]

        best_sentence_idx = 0
        best_score = -1

        matched_patterns = [re.compile(rf"\b{re.escape(t)}\b", re.IGNORECASE) for t in matched_terms]

        for idx, sentence in enumerate(sentences):
            score = sum(1 for pat in matched_patterns if pat.search(sentence))
            if score > best_score:
                best_score = score
                best_sentence_idx = idx

        chosen = sentences[best_sentence_idx]
        if len(chosen) < max_length // 2 and best_sentence_idx + 1 < len(sentences):
            chosen = f"{chosen} {sentences[best_sentence_idx + 1]}"

        if len(chosen) > max_length:
            chosen = chosen[:max_length].rsplit(" ", 1)[0] + "..."

        if best_sentence_idx > 0 and not chosen.startswith("..."):
            chosen = "..." + chosen

        highlighted = chosen
        for term in matched_terms:
            pattern = re.compile(rf"\b({re.escape(term)})\b", re.IGNORECASE)
            highlighted = pattern.sub(r"<mark>\1</mark>", highlighted)

        return highlighted
