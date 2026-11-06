import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Type, 
  Database, 
  Search, 
  Upload, 
  ArrowRight, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ setCurrentView, setQuickSearchQuery, openPreview }) {
  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInputValue, setSearchInputValue] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, docsRes] = await Promise.all([
        api.getIndexStats(),
        api.getDocuments()
      ]);
      setStats(statsRes.stats);
      setRecentDocs(docsRes.documents?.slice(0, 5) || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (!searchInputValue.trim()) return;
    setQuickSearchQuery(searchInputValue.trim());
    setCurrentView('search');
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E8E1D8] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6C151E] bg-[#FAF0F1] px-2.5 py-1 rounded-full border border-[#6C151E]/20">
            Overview & Metrics
          </span>
          <h1 className="text-3xl font-bold text-[#292524] mt-2 font-editorial">
            System Dashboard
          </h1>
          <p className="text-[#78716C] text-sm mt-1">
            Real-time status of document corpus, inverted index mappings, and vocabulary metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#292524] bg-white border border-[#E8E1D8] hover:bg-[#FAF7F2] rounded-lg shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={() => setCurrentView('documents')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#6C151E] hover:bg-[#541017] rounded-lg shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Document
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={loadDashboardData} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Documents */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D8] shadow-xs relative overflow-hidden group hover:border-[#6C151E]/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#78716C]">Total Documents</span>
            <div className="w-9 h-9 rounded-xl bg-[#FAF0F1] text-[#6C151E] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-[#292524] font-editorial">
              {loading ? '-' : stats?.total_documents ?? 0}
            </p>
            <p className="text-xs text-[#78716C] mt-1 flex items-center gap-1">
              <span>Uploaded corpus files</span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#6C151E] opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Indexed Documents */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D8] shadow-xs relative overflow-hidden group hover:border-emerald-600/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#78716C]">Indexed Documents</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-[#292524] font-editorial">
              {loading ? '-' : stats?.indexed_documents ?? 0}
            </p>
            <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <span>{stats?.failed_documents ? `${stats.failed_documents} failed` : 'All files indexed successfully'}</span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Unique Terms */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D8] shadow-xs relative overflow-hidden group hover:border-[#0F3D3A]/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#78716C]">Unique Terms</span>
            <div className="w-9 h-9 rounded-xl bg-[#EDF5F4] text-[#0F3D3A] flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-[#292524] font-editorial">
              {loading ? '-' : stats?.total_unique_terms?.toLocaleString() ?? 0}
            </p>
            <p className="text-xs text-[#78716C] mt-1">
              Indexed distinct vocabulary words
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0F3D3A] opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Total Index Entries */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D8] shadow-xs relative overflow-hidden group hover:border-[#E2C19E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#78716C]">Total Index Entries</span>
            <div className="w-9 h-9 rounded-xl bg-[#FBF2E8] text-[#6C151E] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-[#292524] font-editorial">
              {loading ? '-' : stats?.total_index_entries?.toLocaleString() ?? 0}
            </p>
            <p className="text-xs text-[#78716C] mt-1">
              Active postings list references
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F5DABF] opacity-0 group-hover:opacity-100 transition" />
        </div>
      </div>

      {/* Prominent Quick Search Section */}
      <div className="bg-gradient-to-br from-[#0F3D3A] to-[#0A2927] rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18534F] text-[#F5DABF] text-xs font-medium mb-3 border border-[#F5DABF]/20">
            <Search className="w-3.5 h-3.5" />
            <span>Instant Search Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-editorial">
            Search documents with keywords or wildcards
          </h2>
          <p className="text-stone-300 text-sm mt-1.5 leading-relaxed">
            Execute fast multi-term queries or pattern matching with <code className="bg-[#18534F] text-[#F5DABF] px-1.5 py-0.5 rounded text-xs">*</code> and <code className="bg-[#18534F] text-[#F5DABF] px-1.5 py-0.5 rounded text-xs">?</code> against the indexed corpus.
          </p>

          <form onSubmit={handleQuickSearch} className="mt-6 flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                placeholder="Try queries like 'information retrieval' or 'comput*' or 'alg?orithm'..."
                className="w-full px-4 py-3.5 pl-11 rounded-xl bg-white text-[#292524] placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5DABF] shadow-sm"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-[#6C151E] hover:bg-[#541017] text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2 border border-[#881F2A]/30 shrink-0"
            >
              <span>Search Corpus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick example pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-300">
            <span className="text-[#F5DABF]/70">Try samples:</span>
            {['comput*', 'alg?orithm', 'retriev*', 'data*base'].map((pattern) => (
              <button
                key={pattern}
                onClick={() => {
                  setSearchInputValue(pattern);
                  setQuickSearchQuery(pattern);
                  setCurrentView('search');
                }}
                className="px-2.5 py-1 rounded-md bg-[#18534F] text-[#F5DABF] hover:bg-[#F5DABF] hover:text-[#0F3D3A] transition font-mono text-[11px]"
              >
                {pattern}
              </button>
            ))}
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* Quick Navigation Cards & Recent Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Action Card */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs">
            <h3 className="text-base font-bold text-[#292524] font-editorial">
              Quick Actions
            </h3>
            <p className="text-xs text-[#78716C] mt-1">
              Direct access to system core workflows.
            </p>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => setCurrentView('documents')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#E8E1D8] hover:border-[#6C151E]/40 hover:bg-[#FAF0F1]/50 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FAF0F1] text-[#6C151E] flex items-center justify-center group-hover:scale-105 transition">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#292524]">Document Manager</p>
                    <p className="text-xs text-[#78716C]">Upload PDF, DOCX or TXT files</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#6C151E] group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => setCurrentView('search')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#E8E1D8] hover:border-[#0F3D3A]/40 hover:bg-[#EDF5F4]/50 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EDF5F4] text-[#0F3D3A] flex items-center justify-center group-hover:scale-105 transition">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#292524]">Full Search Console</p>
                    <p className="text-xs text-[#78716C]">Normal & wildcard query modes</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#0F3D3A] group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => setCurrentView('index-status')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#E8E1D8] hover:border-[#F5DABF] hover:bg-[#FBF2E8]/50 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FBF2E8] text-[#6C151E] flex items-center justify-center group-hover:scale-105 transition">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#292524]">Inverted Index Details</p>
                    <p className="text-xs text-[#78716C]">Postings, vocabulary & rebuild</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#6C151E] group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>

          {/* Index Health card */}
          <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8E1D8]">
            <div className="flex items-center justify-between text-xs text-[#78716C] mb-2">
              <span className="font-semibold text-[#292524]">Corpus Health</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Operational</span>
            </div>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Inverted index is stored locally and persists across system restarts. Last updated:
            </p>
            <p className="text-xs font-mono text-[#292524] mt-1 bg-white p-2 rounded border border-[#E8E1D8]">
              {stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : 'No updates recorded yet'}
            </p>
          </div>
        </div>

        {/* Recent Uploaded Documents Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E8E1D8] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D8]">
              <div>
                <h3 className="text-base font-bold text-[#292524] font-editorial">
                  Recent Corpus Documents
                </h3>
                <p className="text-xs text-[#78716C] mt-0.5">
                  Latest files added to the inverted index
                </p>
              </div>
              <button
                onClick={() => setCurrentView('documents')}
                className="text-xs font-semibold text-[#6C151E] hover:text-[#541017] flex items-center gap-1 transition"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="py-12 text-center text-sm text-[#78716C]">
                  Loading recent files...
                </div>
              ) : recentDocs.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FAF0F1] text-[#6C151E] mx-auto flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-[#292524]">No documents uploaded yet</p>
                  <p className="text-xs text-[#78716C] mt-1 max-w-xs mx-auto">
                    Upload PDF, DOCX, or TXT documents to index vocabulary and begin searching.
                  </p>
                  <button
                    onClick={() => setCurrentView('documents')}
                    className="mt-4 px-4 py-2 bg-[#6C151E] text-white text-xs font-semibold rounded-lg hover:bg-[#541017] transition"
                  >
                    Upload First Document
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E8E1D8] text-[#78716C]">
                        <th className="pb-3 font-semibold">Document</th>
                        <th className="pb-3 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Size</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E1D8]/60">
                      {recentDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[#FAF7F2]/60 transition">
                          <td className="py-3 pr-2">
                            <div className="font-semibold text-[#292524] truncate max-w-[200px]" title={doc.original_filename}>
                              {doc.original_filename}
                            </div>
                            <div className="text-[10px] text-[#78716C]">
                              {doc.upload_date}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(doc.file_type)}`}>
                              {doc.file_type}
                            </span>
                          </td>
                          <td className="py-3 text-[#78716C]">
                            {formatSize(doc.file_size)}
                          </td>
                          <td className="py-3">
                            {doc.status === 'indexed' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Indexed ({doc.unique_terms || 0} terms)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => openPreview(doc.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#6C151E] bg-[#FAF0F1] hover:bg-[#F5DABF] rounded-md transition font-medium"
                              title="Preview document content"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[#E8E1D8] flex items-center justify-between text-xs text-[#78716C]">
            <span>Showing up to 5 most recent documents</span>
            <button
              onClick={() => setCurrentView('documents')}
              className="font-medium text-[#6C151E] hover:underline"
            >
              Manage All Documents →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

