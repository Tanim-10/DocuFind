import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, HardDrive, Copy, Check, Hash, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function DocumentPreviewModal({ docId, queryTerms = [], onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    setError(null);
    api.previewDocument(docId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load document content');
        setLoading(false);
      });
  }, [docId]);

  const handleCopy = () => {
    if (!data?.content) return;
    navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Highlight query terms in preview text
  const renderHighlightedContent = (text) => {
    if (!text) return 'Document is empty.';
    if (!queryTerms || queryTerms.length === 0) {
      return text;
    }

    // Escape regex characters and match any term
    const escapedTerms = queryTerms
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(Boolean);

    if (escapedTerms.length === 0) return text;

    const regex = new RegExp(`(\\b(?:${escapedTerms.join('|')})\\b)`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark key={index} className="bg-[#F5DABF] text-[#6C151E] font-semibold px-1 py-0.5 rounded border-b border-[#E2C19E]">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const doc = data?.document;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-[#E8E1D8] w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E1D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5DABF] text-[#6C151E] flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {doc?.file_type || 'FILE'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#292524] truncate max-w-lg font-editorial">
                {doc?.original_filename || 'Document Content Preview'}
              </h2>
              <div className="flex items-center gap-4 text-xs text-[#78716C] mt-0.5">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  {formatSize(doc?.file_size)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {doc?.upload_date}
                </span>
                {doc?.term_count && (
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    {doc.term_count.toLocaleString()} tokens
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading || !data?.content}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#292524] bg-white border border-[#E8E1D8] hover:bg-[#FAF7F2] rounded-lg transition disabled:opacity-50"
              title="Copy document text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#78716C] hover:text-[#292524] hover:bg-[#E8E1D8]/50 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Query highlight indicator */}
        {queryTerms && queryTerms.length > 0 && (
          <div className="px-6 py-2 bg-[#FBF2E8] border-b border-[#E2C19E]/60 text-xs text-[#6C151E] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Highlighting terms:</span>
            <div className="flex flex-wrap gap-1">
              {queryTerms.map((t, idx) => (
                <span key={idx} className="font-semibold bg-white/70 px-1.5 py-0.5 rounded border border-[#E2C19E]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs leading-relaxed text-stone-800 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#78716C]">
              <div className="w-8 h-8 border-3 border-[#6C151E] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-sans">Extracting and reading document...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-sans">
              <p className="font-semibold">Unable to load document preview</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm text-[#292524] leading-relaxed">
              {renderHighlightedContent(data?.content)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF7F2] border-t border-[#E8E1D8] flex items-center justify-between text-xs text-[#78716C]">
          <span>Document ID: <code className="bg-stone-200/60 px-1.5 py-0.5 rounded text-[11px] font-mono">{docId}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#6C151E] text-white hover:bg-[#541017] rounded-lg font-medium transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

