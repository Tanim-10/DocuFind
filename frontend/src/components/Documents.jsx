import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  HardDrive,
  FileUp,
  X,
  Layers,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

export default function Documents({ openPreview, showNotification }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Could not fetch documents',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFiles = (files) => {
    const allowed = ['pdf', 'txt', 'docx'];
    const valid = [];
    const invalid = [];

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (allowed.includes(ext)) {
        valid.push(file);
      } else {
        invalid.push(file.name);
      }
    });

    if (invalid.length > 0) {
      showNotification({
        type: 'error',
        message: 'Unsupported file type(s)',
        details: `Skipped: ${invalid.join(', ')}. Only PDF, TXT, and DOCX are supported.`
      });
    }

    return valid;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const valid = validateFiles(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const valid = validateFiles(e.target.files);
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await api.uploadDocuments(formData);
      
      const successCount = res.results?.filter(r => r.status === 'indexed').length || 0;
      const failCount = res.results?.filter(r => r.status === 'failed').length || 0;

      if (successCount > 0) {
        showNotification({
          type: 'success',
          message: `Indexed ${successCount} document(s) successfully!`,
          details: failCount > 0 ? `${failCount} document(s) failed text extraction.` : undefined
        });
      } else {
        showNotification({
          type: 'error',
          message: 'Failed to index uploaded documents',
          details: res.results?.[0]?.error || 'Unknown error'
        });
      }

      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDocuments();
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Upload failed',
        details: err.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Delete "${filename}"? This will remove its postings from the inverted index.`)) {
      return;
    }

    try {
      setDeletingId(docId);
      await api.deleteDocument(docId);
      showNotification({
        type: 'info',
        message: `Deleted "${filename}"`,
        details: 'Index postings updated and document removed.'
      });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Delete failed',
        details: err.message
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRebuildIndex = async () => {
    if (!window.confirm('Rebuild the inverted index from all stored documents?')) return;
    try {
      setRebuilding(true);
      const res = await api.rebuildIndex();
      showNotification({
        type: 'success',
        message: 'Inverted Index Rebuilt!',
        details: res.message
      });
      fetchDocuments();
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Rebuild failed',
        details: err.message
      });
    } finally {
      setRebuilding(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getBadgeColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'PDF':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'DOCX':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'TXT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesType = filterType === 'ALL' || doc.file_type === filterType;
    const matchesSearch = !searchFilter.trim() || 
      doc.original_filename?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E8E1D8] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6C151E] bg-[#FAF0F1] px-2.5 py-1 rounded-full border border-[#6C151E]/20">
            Document Repository
          </span>
          <h1 className="text-3xl font-bold text-[#292524] mt-2 font-editorial">
            Corpus Management
          </h1>
          <p className="text-[#78716C] text-sm mt-1">
            Upload, inspect, and maintain documents in the Information Retrieval index.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRebuildIndex}
            disabled={rebuilding}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#0F3D3A] bg-[#EDF5F4] hover:bg-[#0F3D3A] hover:text-white rounded-lg transition border border-[#18534F]/30"
            title="Rebuild index across all documents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rebuilding ? 'animate-spin' : ''}`} />
            {rebuilding ? 'Rebuilding...' : 'Rebuild Index'}
          </button>
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#292524] bg-white border border-[#E8E1D8] hover:bg-[#FAF7F2] rounded-lg transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs">
        <h2 className="text-lg font-bold text-[#292524] font-editorial mb-1">
          Upload Documents
        </h2>
        <p className="text-xs text-[#78716C] mb-4">
          Select or drag multiple PDF, TXT, or DOCX files. Documents will be automatically tokenized and indexed.
        </p>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive
              ? 'border-[#6C151E] bg-[#F5DABF]/30 scale-[0.99]'
              : 'border-[#E8E1D8] bg-[#FAF7F2] hover:bg-[#F5DABF]/15'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload-input"
          />

          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F5DABF] text-[#6C151E] flex items-center justify-center mb-4 shadow-xs">
              <FileUp className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#292524]">
              Drag and drop your files here
            </h3>
            <p className="text-xs text-[#78716C] mt-1 mb-4">
              Supports <span className="font-semibold text-[#292524]">PDF, DOCX, TXT</span> up to 32MB each.
            </p>
            <label
              htmlFor="file-upload-input"
              className="px-5 py-2.5 bg-[#6C151E] hover:bg-[#541017] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Local Files</span>
            </label>
          </div>
        </div>

        {/* Selected Files Preview List */}
        {selectedFiles.length > 0 && (
          <div className="mt-5 p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E1D8] animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#292524]">
                Ready to Index ({selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''})
              </span>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-xs text-red-600 hover:underline font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[#E8E1D8] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[#6C151E] shrink-0" />
                    <span className="font-medium text-[#292524] truncate">{file.name}</span>
                    <span className="text-[#78716C] shrink-0 font-mono text-[11px]">
                      ({formatSize(file.size)})
                    </span>
                  </div>
                  <button
                    onClick={() => removeSelectedFile(idx)}
                    className="text-stone-400 hover:text-red-600 p-1 rounded"
                    title="Remove from batch"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2.5 bg-[#0F3D3A] hover:bg-[#0A2927] text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Text & Indexing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Upload & Index {selectedFiles.length} Document(s)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document List Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E1D8]">
          <div>
            <h2 className="text-lg font-bold text-[#292524] font-editorial">
              Corpus Documents
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Showing {filteredDocuments.length} of {documents.length} registered documents
            </p>
          </div>

          {/* Filters and search */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by name..."
              className="px-3 py-1.5 text-xs rounded-lg border border-[#E8E1D8] bg-[#FAF7F2] text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#6C151E]"
            />
            <div className="flex rounded-lg border border-[#E8E1D8] bg-[#FAF7F2] p-0.5 text-xs">
              {['ALL', 'PDF', 'DOCX', 'TXT'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    filterType === type
                      ? 'bg-white text-[#6C151E] shadow-2xs'
                      : 'text-[#78716C] hover:text-[#292524]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4">
          {loading ? (
            <div className="py-16 text-center text-sm text-[#78716C]">
              <div className="w-7 h-7 border-2 border-[#6C151E] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading document index...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF0F1] text-[#6C151E] mx-auto flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#292524]">
                {documents.length === 0 ? 'No documents in index yet' : 'No documents match filter criteria'}
              </p>
              <p className="text-xs text-[#78716C] mt-1">
                {documents.length === 0 ? 'Upload files above to build your inverted index corpus.' : 'Try resetting your search filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E1D8] text-[#78716C] bg-[#FAF7F2]/40">
                    <th className="py-3 px-3 font-semibold rounded-l-lg">Document Name</th>
                    <th className="py-3 px-3 font-semibold">Format</th>
                    <th className="py-3 px-3 font-semibold">File Size</th>
                    <th className="py-3 px-3 font-semibold">Index Metrics</th>
                    <th className="py-3 px-3 font-semibold">Upload Date</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D8]/60">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#FAF7F2]/60 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#292524] truncate max-w-xs" title={doc.original_filename}>
                          {doc.original_filename}
                        </div>
                        <div className="text-[10px] text-[#78716C] font-mono">
                          ID: {doc.id}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(doc.file_type)}`}>
                          {doc.file_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#78716C] font-mono">
                        {formatSize(doc.file_size)}
                      </td>
                      <td className="py-3 px-3 text-[#78716C]">
                        {doc.status === 'indexed' ? (
                          <div>
                            <span className="font-semibold text-[#292524]">{doc.term_count?.toLocaleString() || 0}</span> tokens
                            <span className="text-[10px] block text-[#78716C]">
                              ({doc.unique_terms?.toLocaleString() || 0} unique)
                            </span>
                          </div>
                        ) : (
                          <span className="text-red-500 italic">Not extracted</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#78716C]">
                        {doc.upload_date}
                      </td>
                      <td className="py-3 px-3">
                        {doc.status === 'indexed' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Indexed
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-800 bg-red-50 px-2 py-0.5 rounded-full border border-red-200"
                            title={doc.error}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openPreview(doc.id)}
                            className="p-1.5 text-[#0F3D3A] hover:bg-[#EDF5F4] rounded-lg transition"
                            title="Preview document content"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.original_filename)}
                            disabled={deletingId === doc.id}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete document and update index"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

