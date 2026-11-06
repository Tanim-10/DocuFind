# DocuFind – Document Information Retrieval System
**Academic Project for Web Search and Mining (WSM)**

DocuFind is a document-based Information Retrieval (IR) System built with a Python Flask REST backend and a React.js (Vite + Tailwind CSS) editorial dashboard. The application enables users to upload heterogeneous document formats (PDF, DOCX, TXT), automatically extract and index textual content into a persistent inverted index, and query the corpus using either multi-term keyword search or vocabulary-expanded wildcard matching.

---

## 1. Key Features

- **Multi-Format Document Parsing**:
  - **PDF**: PyMuPDF extraction across all document pages.
  - **DOCX**: `python-docx` extraction across paragraphs and data tables.
  - **TXT**: Multi-encoding fallback loader (UTF-8, Latin-1, CP1252, UTF-16).
  - Safety validation against corrupted or unsupported files.
- **Inverted Index Engine**:
  - Full term-to-document postings mapping with term frequencies and word positions.
  - Tokenization with punctuation stripping and case folding normalization.
  - Zero database dependency: persistent local storage in `backend/storage/index.json`.
  - Automatic index updates when documents are added, deleted, or rebuilt.
- **Query Processing Modes**:
  - **Normal Keyword Search**: Multi-term queries evaluated using TF-IDF (Robertson-Spärck Jones IDF and sub-linear TF scaling), returning scored documents and contextual snippets with `<mark>` highlighted keywords.
  - **Wildcard Search**: Evaluates `*` (zero or more characters) and `?` (single/optional character) directly against the indexed vocabulary. Displays the expanded vocabulary terms alongside matching documents and highlighted snippets.
- **Academic Editorial Dashboard**:
  - Live statistics: Total Documents, Indexed Documents, Total Unique Terms, and Total Index Entries.
  - Vocabulary term frequency distribution visualization.
  - In-browser document preview modal with query term highlighting.
  - WSM-compliant design system using Burgundy (`#6C151E`), Deep Teal (`#0F3D3A`), and Warm Cream (`#F5DABF`).

---

## 2. Technology Stack

- **Frontend**:
  - React.js 18 (Vite SPA)
  - Tailwind CSS 3
  - Lucide React icons
- **Backend**:
  - Python 3.10+
  - Flask 3 & Flask-CORS
  - PyMuPDF (`pymupdf`)
  - `python-docx`
  - `werkzeug`

---

## 3. Project Directory Structure

```
WSM/
├── backend/
│   ├── app.py                      # Flask application factory & blueprint registry
│   ├── config.py                   # Storage paths, allowed formats & limits
│   ├── requirements.txt            # Python dependencies
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── document_loader.py      # PDF, DOCX, and TXT text extractors
│   │   ├── tokenizer.py            # Word boundary token extraction & offsets
│   │   ├── normalizer.py           # Case folding & unicode normalization
│   │   ├── inverted_index.py       # Postings lists, doc registry & persistence
│   │   ├── query_processor.py      # TF-IDF normal search & snippet generator
│   │   └── wildcard_processor.py   # Vocabulary pattern expansion (* and ?)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── document_routes.py      # /api/documents upload, list, preview, delete
│   │   ├── search_routes.py        # /api/search?q=&mode=
│   │   └── index_routes.py         # /api/index/stats, terms, rebuild
│   └── storage/
│       ├── uploads/                # Local uploaded files
│       └── index.json              # Serialized inverted index
├── frontend/
│   ├── package.json
│   ├── vite.config.js              # Vite server & API reverse proxy configuration
│   ├── tailwind.config.js          # Custom color palette & font configuration
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 # Main layout & persistent view router
│       ├── index.css               # Editorial typography & custom styling
│       ├── services/
│       │   └── api.js              # REST API client
│       └── components/
│           ├── Sidebar.jsx         # Persistent Deep Teal navigation sidebar
│           ├── Dashboard.jsx       # Real-time metrics & quick search
│           ├── Documents.jsx       # Drag-and-drop uploader & corpus table
│           ├── Search.jsx          # Dual-mode search console & results
│           ├── IndexStatus.jsx     # Postings health & term distribution
│           ├── DocumentPreviewModal.jsx # Full-text preview modal with highlights
│           └── Notification.jsx    # Alert toast notifications
├── sample_documents/
│   ├── information_retrieval_intro.txt     # IR concepts & inverted index
│   ├── web_search_and_mining.txt           # Crawling, PageRank, mining
│   ├── algorithms_and_complexity.docx      # DOCX format test
│   └── database_systems_and_indexing.pdf   # PDF format test
├── tests/
│   └── test_backend.py             # Automated unit & integration test suite
├── .gitignore
└── README.md
```

---

## 4. Setup and Execution Instructions

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (with npm)

### Step 1: Backend Setup
Open a terminal in the project root:

```bash
# 1. Install Python dependencies
pip install -r backend/requirements.txt

# 2. Run the Flask API server
python backend/app.py
```
*The backend API will start at: `http://127.0.0.1:5000`*

### Step 2: Frontend Setup
Open a second terminal:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```
*The frontend dashboard will be available at: `http://localhost:5173`*

---

## 5. Sample Testing Guide

For quick verification, pre-packaged test documents are provided in `sample_documents/`:

1. Navigate to the **Documents** tab (`http://localhost:5173`).
2. Drag and drop the files from `sample_documents/`:
   - `information_retrieval_intro.txt`
   - `algorithms_and_complexity.docx`
   - `database_systems_and_indexing.pdf`
   - `web_search_and_mining.txt`
3. Click **Upload & Index**. You will see tokens extracted and documents marked as `Indexed`.
4. Navigate to **Search Engine**:
   - **Normal Mode**: Test queries like `information retrieval` or `database systems`.
   - **Wildcard Mode**:
     - `comput*` $\rightarrow$ Expands to `computer`, `computing`, `computational`, `computation`.
     - `alg?orithm` $\rightarrow$ Expands to `algorithm`.
     - `data*base` $\rightarrow$ Expands to `database`.
     - `retriev*` $\rightarrow$ Expands to `retrieval`, `retrieve`.
5. Click **View in Document** on any result to inspect the preview modal with highlighted terms.
6. Navigate to **Index Status** to view the live term distribution and total posting list entries.

---

## 6. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and engine version |
| `GET` | `/api/documents` | Retrieve all indexed corpus documents |
| `POST` | `/api/documents/upload` | Upload & automatically index single/multiple files (`files` multipart) |
| `DELETE` | `/api/documents/<id>` | Delete document and remove postings from index |
| `GET` | `/api/documents/<id>/preview` | Get full text content for preview modal |
| `GET` | `/api/search?q=<query>&mode=<normal\|wildcard>` | Execute search with relevance scoring & snippets |
| `GET` | `/api/index/stats` | Inverted index document & vocabulary statistics |
| `GET` | `/api/index/terms` | Top vocabulary terms by document frequency |
| `POST` | `/api/index/rebuild` | Re-parse and rebuild inverted index from stored files |

---

## 7. Running the Test Suite

The project includes an automated test suite verifying tokenization, normalization, document parsing, inverted indexing, wildcard expansion, TF-IDF ranking, document deletion, and index rebuilding:

```bash
python -m unittest tests/test_backend.py
```
Output:
```
........
----------------------------------------------------------------------
Ran 8 tests in 0.928s

OK
```

