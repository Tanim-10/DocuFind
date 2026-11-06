const API_BASE = '/api';

export const api = {
  // Document endpoints
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocuments(formData) {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },

  async deleteDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete document');
    return data;
  },

  async previewDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}/preview`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to retrieve preview');
    return data;
  },

  // Search endpoint
  async search(query, mode = 'normal') {
    const params = new URLSearchParams({ q: query, mode });
    const res = await fetch(`${API_BASE}/search?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Search failed');
    return data;
  },

  // Index endpoints
  async getIndexStats() {
    const res = await fetch(`${API_BASE}/index/stats`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch index stats');
    return data;
  },

  async getIndexTerms() {
    const res = await fetch(`${API_BASE}/index/terms`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch vocabulary terms');
    return data;
  },

  async rebuildIndex() {
    const res = await fetch(`${API_BASE}/index/rebuild`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Index rebuild failed');
    return data;
  },
};

