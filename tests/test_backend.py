import os
import sys
import unittest
import json
import io

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

import config
from app import create_app
from modules.document_loader import DocumentLoader
from modules.tokenizer import Tokenizer
from modules.normalizer import Normalizer
from modules.inverted_index import InvertedIndex
from modules.query_processor import QueryProcessor
from modules.wildcard_processor import WildcardProcessor


class TestDocuFindIRSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_index_path = os.path.join(config.STORAGE_DIR, "test_index.json")
        if os.path.exists(cls.test_index_path):
            os.remove(cls.test_index_path)
        cls.app = create_app(index_file=cls.test_index_path)
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.test_index_path):
            try:
                os.remove(cls.test_index_path)
            except Exception:
                pass

    def test_01_tokenizer_and_normalizer(self):
        text = "Information Retrieval (IR) and Algorithmic Search! It's fast."
        tokens = Tokenizer.tokenize(text)
        self.assertIn("Information", tokens)
        self.assertIn("Retrieval", tokens)
        self.assertIn("IR", tokens)
        self.assertIn("Algorithmic", tokens)

        norm_tokens = Normalizer.normalize_tokens(tokens)
        self.assertIn("information", norm_tokens)
        self.assertIn("retrieval", norm_tokens)
        self.assertIn("ir", norm_tokens)
        self.assertIn("algorithmic", norm_tokens)

    def test_02_document_loader_txt_pdf_docx(self):
        samples_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_documents"))

        # Test TXT extraction
        txt_file = os.path.join(samples_dir, "information_retrieval_intro.txt")
        self.assertTrue(os.path.exists(txt_file))
        txt_content = DocumentLoader.extract_text(txt_file)
        self.assertIn("Information Retrieval", txt_content)
        self.assertIn("Inverted Index", txt_content)

        # Test DOCX extraction
        docx_file = os.path.join(samples_dir, "algorithms_and_complexity.docx")
        self.assertTrue(os.path.exists(docx_file))
        docx_content = DocumentLoader.extract_text(docx_file)
        self.assertIn("Computational Complexity", docx_content)
        self.assertIn("Inverted Index Lookup", docx_content)

        # Test PDF extraction
        pdf_file = os.path.join(samples_dir, "database_systems_and_indexing.pdf")
        self.assertTrue(os.path.exists(pdf_file))
        pdf_content = DocumentLoader.extract_text(pdf_file)
        self.assertIn("Database Systems", pdf_content)
        self.assertIn("B-Trees", pdf_content)

    def test_03_api_upload_and_indexing(self):
        samples_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_documents"))

        with open(os.path.join(samples_dir, "information_retrieval_intro.txt"), "rb") as f1, \
             open(os.path.join(samples_dir, "algorithms_and_complexity.docx"), "rb") as f2, \
             open(os.path.join(samples_dir, "database_systems_and_indexing.pdf"), "rb") as f3, \
             open(os.path.join(samples_dir, "web_search_and_mining.txt"), "rb") as f4:

            data = {
                "files": [
                    (io.BytesIO(f1.read()), "information_retrieval_intro.txt"),
                    (io.BytesIO(f2.read()), "algorithms_and_complexity.docx"),
                    (io.BytesIO(f3.read()), "database_systems_and_indexing.pdf"),
                    (io.BytesIO(f4.read()), "web_search_and_mining.txt"),
                ]
            }

            res = self.client.post("/api/documents/upload", data=data, content_type="multipart/form-data")
            self.assertEqual(res.status_code, 200)
            res_data = res.get_json()
            self.assertEqual(res_data["status"], "success")
            self.assertGreaterEqual(len(res_data["results"]), 4)

        # Verify documents endpoint returns the list
        docs_res = self.client.get("/api/documents")
        self.assertEqual(docs_res.status_code, 200)
        docs_data = docs_res.get_json()
        self.assertGreaterEqual(docs_data["count"], 4)

        # Verify index stats
        stats_res = self.client.get("/api/index/stats")
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.get_json()["stats"]
        self.assertGreaterEqual(stats["indexed_documents"], 4)
        self.assertGreater(stats["total_unique_terms"], 50)
        self.assertGreater(stats["total_index_entries"], 50)

    def test_04_normal_keyword_search(self):
        # Query for 'information retrieval'
        res = self.client.get("/api/search?q=information+retrieval&mode=normal")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["mode"], "normal")
        self.assertGreater(data["total_matches"], 0)
        self.assertIn("execution_time_ms", data)
        self.assertGreater(len(data["results"]), 0)

        first_res = data["results"][0]
        self.assertIn("score", first_res)
        self.assertIn("snippet", first_res)
        self.assertIn("<mark>", first_res["snippet"])

    def test_05_wildcard_search(self):
        # 1. comput* should expand to compute, computer, computing, computational, etc.
        res = self.client.get("/api/search?q=comput*&mode=wildcard")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["mode"], "wildcard")
        self.assertGreater(data["expansion_count"], 0)
        self.assertGreater(data["total_matches"], 0)
        self.assertTrue(any("comput" in t for t in data["expanded_terms"]))

        # 2. alg?orithm should match algorithm
        res2 = self.client.get("/api/search?q=alg?orithm&mode=wildcard")
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertEqual(data2["mode"], "wildcard")
        self.assertIn("algorithm", data2["expanded_terms"])
        self.assertGreater(data2["total_matches"], 0)

        # 3. data*base should match database
        res3 = self.client.get("/api/search?q=data*base&mode=wildcard")
        self.assertEqual(res3.status_code, 200)
        data3 = res3.get_json()
        self.assertIn("database", data3["expanded_terms"])
        self.assertGreater(data3["total_matches"], 0)

        # 4. Non-matching wildcard should return informative empty state
        res4 = self.client.get("/api/search?q=xyznonexistent*&mode=wildcard")
        self.assertEqual(res4.status_code, 200)
        data4 = res4.get_json()
        self.assertEqual(data4["total_matches"], 0)
        self.assertEqual(data4["expansion_count"], 0)
        self.assertIsNotNone(data4["message"])

    def test_06_document_preview(self):
        docs_res = self.client.get("/api/documents")
        docs = docs_res.get_json()["documents"]
        self.assertGreater(len(docs), 0)
        doc_id = docs[0]["id"]

        preview_res = self.client.get(f"/api/documents/{doc_id}/preview")
        self.assertEqual(preview_res.status_code, 200)
        preview_data = preview_res.get_json()
        self.assertEqual(preview_data["status"], "success")
        self.assertGreater(len(preview_data["content"]), 0)

    def test_07_index_terms_and_rebuild(self):
        terms_res = self.client.get("/api/index/terms")
        self.assertEqual(terms_res.status_code, 200)
        terms_data = terms_res.get_json()
        self.assertGreater(len(terms_data["terms"]), 0)

        # Rebuild index
        rebuild_res = self.client.post("/api/index/rebuild")
        self.assertEqual(rebuild_res.status_code, 200)
        rebuild_data = rebuild_res.get_json()
        self.assertEqual(rebuild_data["status"], "success")
        self.assertGreater(rebuild_data["stats"]["indexed_documents"], 0)

    def test_08_delete_document_and_update_index(self):
        # Fetch current documents
        docs_res = self.client.get("/api/documents")
        initial_docs = docs_res.get_json()["documents"]
        initial_count = len(initial_docs)
        self.assertGreater(initial_count, 0)

        # Target document to delete
        target_doc = initial_docs[-1]
        target_id = target_doc["id"]

        # Delete document
        del_res = self.client.delete(f"/api/documents/{target_id}")
        self.assertEqual(del_res.status_code, 200)
        del_data = del_res.get_json()
        self.assertEqual(del_data["status"], "success")

        # Verify doc count decreased
        updated_docs_res = self.client.get("/api/documents")
        updated_docs = updated_docs_res.get_json()["documents"]
        self.assertEqual(len(updated_docs), initial_count - 1)
        self.assertFalse(any(d["id"] == target_id for d in updated_docs))


if __name__ == "__main__":
    unittest.main()
