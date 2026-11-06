import os
try:
    import pymupdf as fitz
except ImportError:
    import fitz
from docx import Document


class DocumentLoader:
    """Handles text extraction from PDF, TXT, and DOCX files safely."""

    @staticmethod
    def extract_text(file_path: str) -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        _, ext = os.path.splitext(file_path)
        ext = ext.lower().lstrip(".")

        if ext == "txt":
            return DocumentLoader._extract_txt(file_path)
        elif ext == "pdf":
            return DocumentLoader._extract_pdf(file_path)
        elif ext == "docx":
            return DocumentLoader._extract_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: .{ext}. Supported formats are PDF, TXT, DOCX.")

    @staticmethod
    def _extract_txt(file_path: str) -> str:
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "utf-16"]
        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    return f.read()
            except (UnicodeDecodeError, UnicodeError):
                continue
        # Fallback reading with error replacement
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()

    @staticmethod
    def _extract_pdf(file_path: str) -> str:
        try:
            doc = fitz.open(file_path)
            extracted_pages = []
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text("text")
                if page_text:
                    extracted_pages.append(page_text)
            doc.close()
            return "\n".join(extracted_pages)
        except Exception as e:
            raise RuntimeError(f"Failed to extract text from PDF: {str(e)}")

    @staticmethod
    def _extract_docx(file_path: str) -> str:
        try:
            doc = Document(file_path)
            text_parts = []

            # Extract from paragraphs
            for para in doc.paragraphs:
                if para.text.strip():
                    text_parts.append(para.text)

            # Extract from tables
            for table in doc.tables:
                for row in table.rows:
                    row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_text:
                        text_parts.append(" | ".join(row_text))

            return "\n".join(text_parts)
        except Exception as e:
            raise RuntimeError(f"Failed to extract text from DOCX: {str(e)}")
