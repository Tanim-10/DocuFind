import unicodedata
from typing import List


class Normalizer:
    """Applies consistent text normalization and case folding."""

    @classmethod
    def normalize_token(cls, token: str) -> str:
        if not token:
            return ""
        # Unicode decomposition (e.g. café -> cafe)
        normalized = unicodedata.normalize("NFKD", token)
        # Encode to ASCII bytes, ignoring non-ASCII, and decode back
        ascii_text = normalized.encode("ascii", "ignore").decode("utf-8")
        if not ascii_text:
            ascii_text = token
        # Case folding
        return ascii_text.lower().strip()

    @classmethod
    def normalize_tokens(cls, tokens: List[str]) -> List[str]:
        result = []
        for token in tokens:
            norm = cls.normalize_token(token)
            if norm:
                result.append(norm)
        return result

    @classmethod
    def normalize_text(cls, text: str) -> str:
        if not text:
            return ""
        normalized = unicodedata.normalize("NFKD", text)
        ascii_text = normalized.encode("ascii", "ignore").decode("utf-8")
        if not ascii_text:
            ascii_text = text
        return ascii_text.lower()

