import React, { useState, useEffect } from 'react';
import { 
  Search as SearchIcon, 
  X, 
  Clock, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  Hash, 
  SlidersHorizontal,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function Search({ initialQuery = '', openPreview, showNotification }) {
  const [query, setQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState('normal'); // 'normal' | 'wildcard'
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-detect wildcard patterns in query
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      if (initialQuery.includes('*') || initialQuery.includes('?')) {
        setSearchMode('wildcard');
      }
      executeSearch(initialQuery, (initialQuery.includes('*') || initialQuery.includes('?')) ? 'wildcard' : 'normal');
    }
  }, [initialQuery]);

  const executeSearch = async (queryString = query, mode = searchMode) => {
    const trimmed = queryString.trim();
    if (!trimmed) {
      setSearchResults(null);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      const res = await api.search(trimmed, mode);
      setSearchResults(res);
    } catch (err) {
      setError(err.message || 'Search execution failed');
      showNotification({
        type: 'error',
        message: 'Search failed',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  const handleClear = () => {
    setQuery('');
    setSearchResults(null);
    setHasSearched(false);
    setError(null);
  };

  const handleModeChange = (newMode) => {
    setSearchMode(newMode);
    if (query.trim() && hasSearched) {
      executeSearch(query, newMode);
    }
  };

  const setSampleQuery = (sampleText, mode = 'wildcard') => {
    setQuery(sampleText);
    setSearchMode(mode);
    executeSearch(sampleText, mode);
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

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-[#E8E1D8] pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6C151E] bg-[#FAF0F1] px-2.5 py-1 rounded-full border border-[#6C151E]/20">
          Information Retrieval Engine
        </span>
        <h1 className="text-3xl font-bold text-[#292524] mt-2 font-editorial">
          Document Search
        </h1>
        <p className="text-[#78716C] text-sm mt-1">
          Perform indexed keyword retrieval with TF-IDF relevance ranking, or pattern-based wildcard matching.
        </p>
      </div>

      {/* Search Console Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs">
        {/* Mode Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E8E1D8]/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#292524] uppercase tracking-wider">
              Search Mode:
            </span>
            <div className="inline-flex rounded-xl p-1 bg-[#FAF7F2] border border-[#E8E1D8]">
              <button
                type="button"
                onClick={() => handleModeChange('normal')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  searchMode === 'normal'
                    ? 'bg-[#6C151E] text-white shadow-xs'
                    : 'text-[#78716C] hover:text-[#292524]'
                }`}
              >
                Normal Search
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('wildcard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  searchMode === 'wildcard'
                    ? 'bg-[#6C151E] text-white shadow-xs'
                    : 'text-[#78716C] hover:text-[#292524]'
                }`}
              >
                Wildcard Search (* / ?)
              </button>
            </div>
          </div>

          {/* Mode description pill */}
          <div className="text-xs text-[#78716C] flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E8E1D8]">
            <Sparkles className="w-3.5 h-3.5 text-[#6C151E]" />
            <span>
              {searchMode === 'normal'
                ? 'Multi-term query with case-folding & TF-IDF scoring'
                : 'Vocabulary pattern expansion (* = 0+ chars, ? = 1 char)'}
            </span>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchMode === 'normal'
                    ? 'Enter search keywords (e.g. information retrieval ranking)...'
                    : 'Enter wildcard pattern (e.g. comput*, alg?orithm, data*base)...'
                }
                className="w-full px-5 py-4 pl-12 pr-12 rounded-xl border-2 border-[#E8E1D8] focus:border-[#6C151E] focus:ring-0 text-base text-[#292524] placeholder-stone-400 bg-white shadow-xs transition"
                autoFocus
              />
              <SearchIcon className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-[#292524] rounded-md transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-7 py-4 bg-[#6C151E] hover:bg-[#541017] text-white text-sm font-bold rounded-xl shadow-xs transition disabled:opacity-50 shrink-0 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <SearchIcon className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Sample Queries */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#78716C] font-medium">Quick examples:</span>
          {searchMode === 'normal' ? (
            <>
              {['information retrieval', 'algorithms', 'database system', 'vector space'].map((sample) => (
                <button
                  key={sample}
                  onClick={() => setSampleQuery(sample, 'normal')}
                  className="px-2.5 py-1 rounded-md bg-[#FAF7F2] text-[#292524] hover:bg-[#F5DABF] border border-[#E8E1D8] transition font-medium text-[11px]"
                >
                  {sample}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { label: 'comput*', query: 'comput*' },
                { label: 'alg?orithm', query: 'alg?orithm' },
                { label: 'data*base', query: 'data*base' },
                { label: 'retriev*', query: 'retriev*' },
                { label: 'search*', query: 'search*' }
              ].map((sample) => (
                <button
                  key={sample.label}
                  onClick={() => setSampleQuery(sample.query, 'wildcard')}
                  className="px-2.5 py-1 rounded-md bg-[#FAF7F2] text-[#6C151E] hover:bg-[#F5DABF] border border-[#E8E1D8] transition font-mono text-[11px] font-semibold"
                >
                  {sample.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Query Execution Metrics & Wildcard Expansion Info */}
      {searchResults && (
        <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E1D8] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[#78716C]">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#292524]">
              Found <span className="text-[#6C151E] font-bold">{searchResults.total_matches}</span> matching document{searchResults.total_matches === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Execution: <strong className="text-[#292524]">{searchResults.execution_time_ms} ms</strong></span>
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#E8E1D8] text-[11px] font-mono">
              mode: {searchResults.mode}
            </span>
          </div>

          {/* If Wildcard Search: Display backend expanded vocabulary terms */}
          {searchResults.mode === 'wildcard' && searchResults.expanded_terms?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[#0F3D3A]">
                Expanded Terms ({searchResults.expansion_count}):
              </span>
              <div className="flex flex-wrap gap-1 max-w-md">
                {searchResults.expanded_terms.map((term, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-white text-[#6C151E] border border-[#E8E1D8] rounded font-mono text-[10px] font-medium"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results View Container */}
      <div className="space-y-4">
        {/* Loading State */}
        {loading && (
          <div className="bg-white p-12 rounded-2xl border border-[#E8E1D8] text-center">
            <div className="w-10 h-10 border-3 border-[#6C151E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-[#292524]">Querying Inverted Index...</p>
            <p className="text-xs text-[#78716C] mt-1">
              Retrieving postings and calculating TF-IDF relevance scores.
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-800 text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Search query error</span>
            </div>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* Initial Empty State (Before searching) */}
        {!loading && !hasSearched && (
          <div className="bg-white p-12 rounded-2xl border border-[#E8E1D8] text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F5DABF] text-[#6C151E] mx-auto flex items-center justify-center mb-4 shadow-xs">
              <SearchIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#292524] font-editorial">
              Ready to Search
            </h3>
            <p className="text-xs text-[#78716C] mt-1 max-w-md mx-auto leading-relaxed">
              Enter any term above to search the document inverted index. Wildcard searches match indexed terms using <code className="bg-[#FAF7F2] px-1 py-0.5 rounded font-mono">*</code> and <code className="bg-[#FAF7F2] px-1 py-0.5 rounded font-mono">?</code>.
            </p>
          </div>
        )}

        {/* No Results Found State */}
        {!loading && hasSearched && searchResults?.results?.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-[#E8E1D8] text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF0F1] text-[#6C151E] mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#292524]">
              No matching documents found
            </h3>
            <p className="text-xs text-[#78716C] mt-1 max-w-md mx-auto leading-relaxed">
              {searchResults?.message || (
                searchMode === 'wildcard'
                  ? `No vocabulary terms matched the wildcard pattern "${query}". Ensure terms exist in uploaded documents.`
                  : `No documents in the inverted index contain the term(s) in "${query}".`
              )}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setSearchMode(searchMode === 'normal' ? 'wildcard' : 'normal')}
                className="text-xs font-semibold text-[#6C151E] hover:underline"
              >
                Switch to {searchMode === 'normal' ? 'Wildcard Mode' : 'Normal Mode'} →
              </button>
            </div>
          </div>
        )}

        {/* Search Results List */}
        {!loading && searchResults?.results?.map((doc, idx) => (
          <div
            key={doc.id}
            className="bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs hover:border-[#6C151E]/40 transition group"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              {/* Document Title & Meta */}
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono font-bold text-stone-400 mt-0.5">
                  #{idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 
                      onClick={() => openPreview(doc.id, doc.matched_terms)}
                      className="text-base font-bold text-[#292524] group-hover:text-[#6C151E] transition cursor-pointer font-editorial flex items-center gap-1.5"
                    >
                      <span>{doc.filename}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(doc.file_type)}`}>
                      {doc.file_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#78716C] mt-0.5">
                    <span>{formatSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>Uploaded: {doc.upload_date}</span>
                  </div>
                </div>
              </div>

              {/* Relevance Score Pill */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="px-3 py-1 rounded-xl bg-[#FBF2E8] border border-[#E2C19E] text-right">
                  <span className="text-[10px] uppercase font-semibold text-[#78716C] block leading-none">
                    Relevance
                  </span>
                  <span className="text-sm font-bold text-[#6C151E] font-mono leading-tight">
                    {doc.score}
                  </span>
                </div>
              </div>
            </div>

            {/* Snippet with highlighted terms */}
            <div className="mt-4 p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E1D8] text-xs text-stone-800 leading-relaxed font-sans">
              <p 
                dangerouslySetInnerHTML={{ __html: doc.snippet }} 
              />
            </div>

            {/* Matched Terms Pills and View Preview Button */}
            <div className="mt-3.5 pt-3 border-t border-[#E8E1D8]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#78716C] font-medium">Matched terms:</span>
                {doc.matched_terms?.map((term, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2 py-0.5 rounded-md bg-[#FAF0F1] text-[#6C151E] border border-[#6C151E]/20 font-semibold font-mono text-[11px]"
                  >
                    {term}
                  </span>
                ))}
              </div>

              <button
                onClick={() => openPreview(doc.id, doc.matched_terms)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF0F1] text-[#6C151E] font-semibold border border-[#E8E1D8] hover:border-[#6C151E]/30 rounded-lg transition"
              >
                <span>View in Document</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

