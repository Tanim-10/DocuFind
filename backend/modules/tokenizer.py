import re
from typing import List, Tuple


class Tokenizer:
    """Splits text into tokens and strips unnecessary punctuation."""

    # Matches sequences of alphanumeric characters. Words separated by punctuation are cleanly tokenized.
    TOKEN_PATTERN = re.compile(r"\b[a-zA-Z0-9]+(?:['\-_][a-zA-Z0-9]+)*\b")

    @classmethod
    def tokenize(cls, text: str) -> List[str]:
        if not text:
            return []
        # Find all matching tokens
        tokens = cls.TOKEN_PATTERN.findall(text)
        # Strip any stray leading/trailing quotes or hyphens
        cleaned = [t.strip("'-_") for t in tokens if t.strip("'-_")]
        return cleaned

    @classmethod
    def tokenize_with_positions(cls, text: str) -> List[Tuple[str, int]]:
        """Returns list of (token, token_index) preserving word order."""
        tokens = cls.tokenize(text)
        return [(tok, idx) for idx, tok in enumerate(tokens)]

