import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Type, 
  Layers, 
  RefreshCw, 
  Clock, 
  BarChart3, 
  Sparkles,
  Info,
  Server
} from 'lucide-react';
import { api } from '../services/api';

export default function IndexStatus({ showNotification }) {
  const [stats, setStats] = useState(null);
  const [topTerms, setTopTerms] = useState([]);
  const [totalTermsCount, setTotalTermsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState(null);

  const fetchIndexData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, termsRes] = await Promise.all([
        api.getIndexStats(),
        api.getIndexTerms()
      ]);
      setStats(statsRes.stats);
      setTopTerms(termsRes.terms || []);
      setTotalTermsCount(termsRes.total_terms || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch index details');
      showNotification({
        type: 'error',
        message: 'Could not load index state',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndexData();
  }, []);

  const handleRebuild = async () => {
    if (!window.confirm('Rebuild the inverted index from all uploaded documents?')) return;
    try {
      setRebuilding(true);
      const res = await api.rebuildIndex();
      showNotification({
        type: 'success',
        message: 'Index Rebuild Completed',
        details: res.message
      });
      fetchIndexData();
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

  const maxDocFreq = topTerms.length > 0 ? Math.max(...topTerms.map(t => t.doc_freq)) : 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E8E1D8] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6C151E] bg-[#FAF0F1] px-2.5 py-1 rounded-full border border-[#6C151E]/20">
            Internal Storage & Postings
          </span>
          <h1 className="text-3xl font-bold text-[#292524] mt-2 font-editorial">
            Inverted Index Status
          </h1>
          <p className="text-[#78716C] text-sm mt-1">
            Structural health, vocabulary statistics, and posting list distributions of the IR engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F3D3A] hover:bg-[#0A2927] rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rebuilding ? 'animate-spin' : ''}`} />
            {rebuilding ? 'Rebuilding Index...' : 'Rebuild Inverted Index'}
          </button>
          <button
            onClick={fetchIndexData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#292524] bg-white border border-[#E8E1D8] hover:bg-[#FAF7F2] rounded-lg shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchIndexData} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Documents & Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
              Document Coverage
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF0F1] text-[#6C151E] flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#292524] mt-3 font-editorial">
            {stats?.total_documents ?? 0}
          </p>
          <div className="mt-4 pt-3 border-t border-[#E8E1D8] flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              {stats?.indexed_documents ?? 0} Successfully Indexed
            </span>
            {stats?.failed_documents > 0 && (
              <span className="flex items-center gap-1.5 text-red-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {stats.failed_documents} Failed
              </span>
            )}
          </div>
        </div>

        {/* Vocabulary Terms */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
              Unique Vocabulary
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EDF5F4] text-[#0F3D3A] flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#292524] mt-3 font-editorial">
            {stats?.total_unique_terms?.toLocaleString() ?? 0}
          </p>
          <div className="mt-4 pt-3 border-t border-[#E8E1D8] flex items-center justify-between text-xs text-[#78716C]">
            <span>Normalized unique terms</span>
            <span className="font-mono text-[#0F3D3A] font-medium">Case-folded</span>
          </div>
        </div>

        {/* Postings Entries */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
              Postings List Entries
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FBF2E8] text-[#6C151E] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#292524] mt-3 font-editorial">
            {stats?.total_index_entries?.toLocaleString() ?? 0}
          </p>
          <div className="mt-4 pt-3 border-t border-[#E8E1D8] flex items-center justify-between text-xs text-[#78716C]">
            <span>Term-to-document postings</span>
            <span className="font-mono text-[#6C151E] font-medium">Positions included</span>
          </div>
        </div>
      </div>

      {/* Index Update Timestamp & Persistence Note */}
      <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#78716C]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#6C151E]" />
          <span>Last Inverted Index Modification:</span>
          <strong className="text-[#292524] font-mono">
            {stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Not recorded'}
          </strong>
        </div>
        <span className="px-2.5 py-1 rounded bg-white border border-[#E8E1D8] text-[11px] font-medium text-[#0F3D3A]">
          Persistent Disk Storage: <code className="font-mono">storage/index.json</code>
        </span>
      </div>

      {/* Visualization: Top Indexed Terms Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8E1D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F5DABF] text-[#6C151E] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#292524] font-editorial">
                Vocabulary Term Frequency Distribution
              </h2>
              <p className="text-xs text-[#78716C]">
                Top frequent terms across document corpus by document frequency (DF) and total occurrences
              </p>
            </div>
          </div>
          <span className="text-xs text-[#78716C]">
            Sample of top {topTerms.length} terms
          </span>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#78716C]">
              Loading vocabulary distribution...
            </div>
          ) : topTerms.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#78716C]">
              No indexed terms found. Upload documents to populate the vocabulary.
            </div>
          ) : (
            <div className="space-y-3">
              {topTerms.map((item, idx) => {
                const percentage = Math.round((item.doc_freq / Math.max(1, maxDocFreq)) * 100);
                return (
                  <div key={idx} className="flex items-center gap-4 text-xs">
                    <span className="w-6 text-stone-400 font-mono text-[11px] text-right shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="w-28 font-mono font-semibold text-[#292524] truncate shrink-0">
                      {item.term}
                    </span>
                    <div className="flex-1 bg-[#FAF7F2] rounded-full h-3 overflow-hidden border border-[#E8E1D8]">
                      <div
                        className="bg-gradient-to-r from-[#0F3D3A] to-[#6C151E] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>
                    <div className="w-36 text-right shrink-0 flex items-center justify-end gap-2 text-[11px]">
                      <span className="font-semibold text-[#6C151E]">{item.doc_freq} doc{item.doc_freq > 1 ? 's' : ''}</span>
                      <span className="text-[#78716C]">({item.total_freq} hits)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Educational Academic Note on IR Architecture */}
      <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E8E1D8] space-y-3 text-xs leading-relaxed text-[#78716C]">
        <div className="flex items-center gap-2 text-[#292524] font-bold text-sm">
          <Info className="w-4 h-4 text-[#6C151E]" />
          <span>IR Inverted Index Architecture (WSM Academic Overview)</span>
        </div>
        <p>
          The system maintains a direct inverted index mapping each normalized term \(t\) to a postings list of document identifiers with positional offsets and term frequencies.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[#292524]">
          <div className="p-3 bg-white rounded-xl border border-[#E8E1D8]">
            <p className="font-bold text-[#6C151E]">1. Tokenization & Folding</p>
            <p className="text-[11px] text-[#78716C] mt-1">
              Extracts text from PDF/TXT/DOCX, tokenizes on word boundaries, strips punctuation, and applies ASCII case folding.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#E8E1D8]">
            <p className="font-bold text-[#0F3D3A]">2. TF-IDF & Scoring</p>
            <p className="text-[11px] text-[#78716C] mt-1">
              Normal search computes term frequency weights normalized by document length and combines them with Robertson-Spärck Jones IDF.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#E8E1D8]">
            <p className="font-bold text-[#292524]">3. Wildcard Expansion</p>
            <p className="text-[11px] text-[#78716C] mt-1">
              Matches wildcard patterns (\(*\) and \(?\)) against the sorted indexed vocabulary array before executing postings retrieval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

