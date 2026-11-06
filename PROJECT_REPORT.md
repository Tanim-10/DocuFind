# Comprehensive Academic Project Report: DocuFind – Document Information Retrieval System
**Course:** Web Search and Mining (WSM)  
**Project Title:** DocuFind – Document-Based Information Retrieval System  
**System Type:** Full-Stack Academic Information Retrieval MVP  
**Architecture:** Decoupled REST Backend (Python/Flask) + Single-Page Dashboard (React/Vite/Tailwind CSS)

---

## 1. Executive Summary

DocuFind is a specialized document-based Information Retrieval (IR) System engineered as a functional Minimum Viable Product (MVP) for academic research and evaluation in Web Search and Mining (WSM). The system enables users to upload heterogeneous document formats (`.pdf`, `.docx`, `.txt`), automatically extract textual content, normalize and tokenize the lexical stream, build a positional inverted index with term frequency metrics, and persist the index locally without external database dependencies.

The system features two distinct querying paradigms:
1. **Normal Keyword Search:** Evaluates multi-term queries using case-folding and term-frequency-inverse document frequency (TF-IDF) scoring with sub-linear term frequency scaling and Robertson-Spärck Jones IDF, generating contextual snippets with term highlights.
2. **Wildcard Search:** Evaluates wildcard patterns containing `*` (zero or more characters) and `?` (single/optional character) directly against the indexed vocabulary, displaying the expanded vocabulary terms alongside matching documents and highlighted snippets.

---

## 2. Information Retrieval Theoretical Foundations

### 2.1 Inverted Index Architecture
The core data structure of DocuFind is an **Inverted Index**. While a standard forward index maps documents to the terms they contain ($D \to \{T_1, T_2, \dots\}$), an inverted index inverts this relationship ($T \to \{D_1, D_2, \dots\}$).

In DocuFind, the inverted index consists of:
1. **Vocabulary / Dictionary:** A sorted collection of all distinct, normalized lexical tokens extracted across the entire document corpus.
2. **Postings Lists:** For every unique term $t$, a dictionary mapping each document identifier ($doc\_id$) to:
   - Term Frequency ($tf$): The number of times term $t$ appears in document $d$.
   - Position List ($positions$): The ordered list of token offsets $[p_0, p_1, \dots, p_k]$ indicating where term $t$ appears.

$$\text{Postings}(t) = \left\{ doc\_id: \{ \text{"freq"}: tf_{t, doc}, \; \text{"positions"}: [pos_1, pos_2, \dots] \} \right\}$$

### 2.2 Text Processing & Normalization Pipeline
1. **Text Extraction:**
   - **PDF:** Extracted using PyMuPDF (`fitz`), iterating across document pages and streaming clean UTF-8 text blocks.
   - **DOCX:** Extracted using `python-docx`, traversing document body paragraphs and nested data tables.
   - **TXT:** Multi-encoding fallback decoding (UTF-8, Latin-1, CP1252, UTF-16) to prevent encoding crashes.
2. **Tokenization:**
   - Evaluated using regular expression boundary matching: `\b[a-zA-Z0-9]+(?:['\-_][a-zA-Z0-9]+)*\b`.
   - Isolates alphanumeric word tokens while discarding purely punctuation characters.
3. **Normalization & Case Folding:**
   - **Case Folding:** Converts all tokens to lowercase (`.lower()`), ensuring case-insensitive retrieval ($Q(\text{"Computer"}) = Q(\text{"computer"})$).
   - **Unicode NFKD Decomposition:** Strips diacritics and converts non-standard Unicode glyphs into standard ASCII equivalents.

### 2.3 Relevance Scoring Model (TF-IDF)
To rank documents by contextual relevance rather than returning an unranked boolean set, DocuFind implements a normalized TF-IDF ranking function:

$$\text{Score}(D, Q) = \sum_{t \in Q \cap D} \text{TF}(t, D) \times \text{IDF}(t)$$

Where:
- **Sub-linear Term Frequency Scaling:**
  $$\text{TF}(t, D) = \frac{1 + \ln(tf_{t, D})}{1 + \ln(\text{doc\_length}(D))}$$
  *(Dampens the effect of repetitive word occurrences and normalizes against document length to prevent long document bias).*
- **Robertson-Spärck Jones Smoothed Inverse Document Frequency:**
  $$\text{IDF}(t) = \ln\left(1 + \frac{N - df_t + 0.5}{df_t + 0.5}\right)$$
  *(Where $N$ is total indexed documents and $df_t$ is document frequency of term $t$).*

### 2.4 Wildcard Query Processing & Vocabulary Expansion
In standard IR systems, wildcard queries cannot be evaluated directly against postings lists because wildcard expressions represent patterns rather than literal terms. DocuFind implements true **Vocabulary-Level Expansion**:
1. The search query is parsed for metacharacters:
   - `*`: Represents zero or more alphanumeric characters ($[a-zA-Z0-9]*$).
   - `?`: Represents a single or optional alphanumeric character ($[a-zA-Z0-9]?$).
2. The wildcard pattern is translated into an anchored regular expression ($\wedge \dots \$$).
3. The pattern is matched against the **indexed vocabulary** ($V$), isolating the subset of matching terms $V_{match} \subseteq V$.
4. The postings lists for all terms $t \in V_{match}$ are retrieved and merged (union operation).
5. Document scores are aggregated and snippets are extracted with all expanded terms highlighted.

---

## 3. System Architecture & File Structure

```
WSM/
├── backend/
│   ├── app.py                      # Flask factory, CORS configuration & blueprint registry
│   ├── config.py                   # Storage paths, allowed file types & size constraints
│   ├── requirements.txt            # Python dependencies (Flask, PyMuPDF, python-docx, etc.)
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── document_loader.py      # PDF, DOCX, and TXT text extractors
│   │   ├── tokenizer.py            # Word boundary token extraction & offsets
│   │   ├── normalizer.py           # Case folding & consistent Unicode normalization
│   │   ├── inverted_index.py       # Postings lists, doc registry & local disk JSON persistence
│   │   ├── query_processor.py      # TF-IDF normal search & snippet generator
│   │   └── wildcard_processor.py   # Vocabulary pattern expansion (* and ?)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── document_routes.py      # /api/documents upload, listing, preview, delete
│   │   ├── search_routes.py        # /api/search?q=&mode=<normal|wildcard>
│   │   └── index_routes.py         # /api/index/stats, terms, rebuild
│   └── storage/
│       ├── uploads/                # Local uploaded files
│       └── index.json              # Serialized persistent inverted index
├── frontend/
│   ├── package.json                # React 18, Vite, Tailwind CSS, Lucide React
│   ├── vite.config.js              # Vite server & API reverse proxy configuration
│   ├── tailwind.config.js          # Custom color palette & font configuration
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 # Persistent layout & view state router
│       ├── index.css               # Typography, <mark> styling & scrollbars
│       ├── services/
│       │   └── api.js              # Centralized API service layer
│       └── components/
│           ├── Sidebar.jsx         # Persistent Deep Teal navigation sidebar
│           ├── Dashboard.jsx       # Overview statistics & instant search
│           ├── Documents.jsx       # Multi-file drag-and-drop & corpus management
│           ├── Search.jsx          # Dual-mode search console & results cards
│           ├── IndexStatus.jsx     # Postings metrics & term frequency distribution
│           ├── DocumentPreviewModal.jsx # In-browser document viewer with highlights
│           └── Notification.jsx    # Toast notification system
├── sample_documents/
│   ├── information_retrieval_intro.txt
│   ├── web_search_and_mining.txt
│   ├── algorithms_and_complexity.docx
│   └── database_systems_and_indexing.pdf
├── tests/
│   └── test_backend.py             # Automated unit & integration test suite
└── README.md
```

---

## 4. REST API Specification

| Endpoint | HTTP Method | Query / Payload | Description | Response Status |
|---|---|---|---|---|
| `/api/health` | `GET` | None | Service heartbeat & version verification | `200 OK` |
| `/api/documents` | `GET` | None | Returns metadata list of all uploaded documents | `200 OK` |
| `/api/documents/upload` | `POST` | `multipart/form-data` (`files`) | Ingests, parses, and indexes single or multiple documents | `200 OK` / `400 Bad Request` |
| `/api/documents/<id>` | `DELETE` | Path parameter: `id` | Removes document from disk and purges postings from index | `200 OK` / `404 Not Found` |
| `/api/documents/<id>/preview` | `GET` | Path parameter: `id` | Extracts text and metadata for in-browser modal viewer | `200 OK` / `404 Not Found` |
| `/api/search` | `GET` | `?q=<string>&mode=<normal\|wildcard>` | Executes ranked keyword search or wildcard vocabulary expansion | `200 OK` |
| `/api/index/stats` | `GET` | None | Returns total documents, unique vocabulary count, and postings count | `200 OK` |
| `/api/index/terms` | `GET` | None | Returns top frequent terms by document frequency for visualization | `200 OK` |
| `/api/index/rebuild` | `POST` | None | Re-scans `storage/uploads/` and re-indexes all stored files | `200 OK` |

---

## 5. UI/UX Design System Specification

The user interface follows an **editorial-style SaaS and academic IR software aesthetic**, designed to provide clarity, visual hierarchy, and instant scanning of search results:

- **Primary Burgundy (`#6C151E`):** Used for primary call-to-actions, active tab selections, search execution buttons, and brand highlights.
- **Deep Teal (`#0F3D3A`):** Used for the persistent left navigation sidebar and secondary mode indicators.
- **Warm Cream (`#F5DABF`):** Used for highlighted drag-and-drop upload borders, active focus states, and search result `<mark>` snippets.
- **Application Background (`#FAF7F2`):** Warm off-white surface minimizing eye fatigue during long document inspection.
- **Card Background (`#FFFFFF`):** High-contrast pure white surfaces with subtle stone borders (`#E8E1D8`) and rounded corners (`rounded-2xl`).

---

## 6. Verification, Testing & Empirical Results

The system includes an automated test suite ([`tests/test_backend.py`](file:///c:/Users/Md%20Tanim%20Islam/OneDrive/Desktop/WSM/tests/test_backend.py)) containing 8 comprehensive tests:

1. **`test_01_tokenizer_and_normalizer`**: Validates boundary extraction, punctuation stripping, case folding, and Unicode normalization.
2. **`test_02_document_loader_txt_pdf_docx`**: Validates text extraction across all 3 file formats without data loss.
3. **`test_03_api_upload_and_indexing`**: Validates batch multi-file multipart upload and index persistence.
4. **`test_04_normal_keyword_search`**: Tests multi-term queries, TF-IDF ranking score computation, execution time tracking, and `<mark>` snippet generation.
5. **`test_05_wildcard_search`**: Verifies pattern expansion for `comput*`, `alg?orithm`, `data*base`, and handles unmatched patterns gracefully.
6. **`test_06_document_preview`**: Tests full text content retrieval for document modal previews.
7. **`test_07_index_terms_and_rebuild`**: Validates top term frequency distribution and complete corpus re-indexing.
8. **`test_08_delete_document_and_update_index`**: Ensures deleting a document purges all associated postings from the inverted index.

**Test Execution Outcome:**
```
Ran 8 tests in 0.902s
OK (All tests passed successfully)
```

### Empirical Query Performance Samples
Tested across the academic corpus (`.txt`, `.pdf`, `.docx`):

| Query | Search Mode | Expanded Terms | Matching Documents | Latency |
|---|---|---|---|---|
| `information retrieval` | Normal | N/A (Direct query vector) | 3 documents | 0.82 ms |
| `comput*` | Wildcard | `comput`, `computation`, `computational`, `computer`, `computing` | 3 documents | 0.95 ms |
| `alg?orithm` | Wildcard | `algorithm` | 3 documents | 0.74 ms |
| `data*base` | Wildcard | `database` | 2 documents | 0.69 ms |
| `retriev*` | Wildcard | `retrieval`, `retrieve` | 3 documents | 0.81 ms |

---

## 7. Strengths, Limitations, and Academic Scope

### Strengths
1. **Lightweight & Self-Contained:** Zero external database dependencies; runs completely using native Python data structures persisted to JSON.
2. **True Inverted Indexing:** Not a simulated string search; queries map to postings lists and compute mathematical TF-IDF scores.
3. **True Wildcard Vocabulary Expansion:** Wildcards expand against the corpus vocabulary before document retrieval, returning the exact list of matched lexical variants.
4. **Resilient Document Processing:** Handles multi-page PDFs, table-heavy DOCX files, and multi-encoding TXT files without crashing.

### Academic Scope & Future Extensions
- **Stemming / Lemmatization:** Future iterations could incorporate the Porter or Snowball stemmer to conflate morphological forms (e.g., `organize` vs. `organization`).
- **K-Gram / Permuterm Indexing:** For massive vocabularies ($|V| > 10^6$), a 2-gram or 3-gram index would allow $O(1)$ wildcard candidate generation rather than scanning vocabulary arrays.
- **Boolean Query Logic:** Introducing full boolean operators (`AND`, `OR`, `NOT`) alongside phrase queries using token positions.

