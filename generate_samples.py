import os
try:
    import pymupdf as fitz
except ImportError:
    import fitz
from docx import Document

os.makedirs("sample_documents", exist_ok=True)

# 1. Create Algorithms and Complexity DOCX
docx_path = os.path.join("sample_documents", "algorithms_and_complexity.docx")
doc = Document()
doc.add_heading("Algorithms and Computational Complexity", 0)

doc.add_heading("1. Fundamentals of Algorithms", level=1)
doc.add_paragraph(
    "An algorithm is a finite sequence of well-defined, computer-implementable instructions "
    "to solve a class of specific problems or perform a computation. In information retrieval and "
    "search engines, efficient algorithms are necessary to index millions of text files and evaluate queries in real time."
)

doc.add_heading("2. Search and Inverted Indexing Algorithms", level=1)
doc.add_paragraph(
    "Classic retrieval algorithms rely on positional inverted index traversals. Binary search and "
    "hash lookups allow the search engine to rapidly find terms in the vocabulary. "
    "When processing wildcard queries such as 'alg?orithm' or 'comput*', the algorithm identifies matching "
    "lexical terms and merges their postings lists."
)

doc.add_heading("3. Asymptotic Notation and Space Complexity", level=1)
doc.add_paragraph(
    "Computational complexity measures the time and space resources required by an algorithm. "
    "Big-O notation describes the upper bound of execution time as the input document collection grows. "
    "Inverted index compression algorithms like variable-byte encoding and Elias gamma coding minimize memory consumption."
)

table = doc.add_table(rows=1, cols=3)
hdr_cells = table.rows[0].cells
hdr_cells[0].text = "Algorithm Type"
hdr_cells[1].text = "Average Time"
hdr_cells[2].text = "Applications"

data = [
    ("Inverted Index Lookup", "O(1) to O(log V)", "Term postings retrieval in search engines"),
    ("Wildcard Expansion", "O(V)", "Vocabulary pattern matching with asterisks"),
    ("TF-IDF Ranking", "O(N log k)", "Top-k document score evaluation")
]

for row in data:
    row_cells = table.add_row().cells
    row_cells[0].text = row[0]
    row_cells[1].text = row[1]
    row_cells[2].text = row[2]

doc.save(docx_path)
print(f"Created DOCX: {docx_path}")

# 2. Create Database Systems PDF using PyMuPDF
pdf_path = os.path.join("sample_documents", "database_systems_and_indexing.pdf")
pdf_doc = fitz.open()
page = pdf_doc.new_page(width=595, height=842)  # Standard A4

text_content = """Database Systems and Information Storage Architectures

Academic Lecture Notes: WSM Information Retrieval Foundations

1. Overview of Database Management Systems (DBMS)
A database management system is software designed to store, manage, and facilitate structured access 
to large quantities of data. Relational database systems utilize SQL for deterministic querying 
and maintain ACID (Atomicity, Consistency, Isolation, Durability) properties.

2. Comparison: Database Systems vs. Information Retrieval Systems
While traditional database systems excel at exact transactional record queries (e.g. employee ID lookup), 
Information Retrieval (IR) engines handle unstructured text documents. In an IR system, relevance scoring, 
term frequency, and wildcard pattern expansion take precedence over tabular schemas.

3. Indexing Mechanisms: B-Trees, Hash Tables, and Inverted Lists
Database storage architectures leverage B-Tree and B+ Tree indexes for fast range queries over ordered keys. 
In contrast, search engines use inverted index postings lists, which map individual vocabulary tokens 
to document identifiers and word positions.

4. Query Processing and Optimization
Database engines translate declarative SQL queries into physical relational algebra plans. Similarly, 
retrieval engines parse multi-term queries and evaluate wildcard expressions like 'data*base' 
to efficiently retrieve all matching records.
"""

# Insert text onto page
rect = fitz.Rect(50, 50, 545, 792)
page.insert_textbox(rect, text_content, fontsize=11, fontname="helv", lineheight=1.4)
pdf_doc.save(pdf_path)
pdf_doc.close()
print(f"Created PDF: {pdf_path}")
