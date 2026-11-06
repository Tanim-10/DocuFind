import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Documents from './components/Documents';
import Search from './components/Search';
import IndexStatus from './components/IndexStatus';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import Notification from './components/Notification';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  
  // Document preview modal state
  const [previewState, setPreviewState] = useState({
    isOpen: false,
    docId: null,
    queryTerms: []
  });

  // Notification state
  const [notification, setNotification] = useState(null);

  const openPreview = (docId, queryTerms = []) => {
    setPreviewState({
      isOpen: true,
      docId,
      queryTerms
    });
  };

  const closePreview = () => {
    setPreviewState({
      isOpen: false,
      docId: null,
      queryTerms: []
    });
  };

  const showNotification = ({ type = 'info', message, details }) => {
    setNotification({ type, message, details });
  };

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] text-[#292524] antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={(view) => {
          setCurrentView(view);
          if (view !== 'search') {
            setQuickSearchQuery('');
          }
        }} 
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {currentView === 'dashboard' && (
          <Dashboard
            setCurrentView={setCurrentView}
            setQuickSearchQuery={setQuickSearchQuery}
            openPreview={openPreview}
            showNotification={showNotification}
          />
        )}

        {currentView === 'documents' && (
          <Documents
            openPreview={openPreview}
            showNotification={showNotification}
          />
        )}

        {currentView === 'search' && (
          <Search
            initialQuery={quickSearchQuery}
            openPreview={openPreview}
            showNotification={showNotification}
          />
        )}

        {currentView === 'index-status' && (
          <IndexStatus
            showNotification={showNotification}
          />
        )}
      </main>

      {/* Document Content Preview Modal */}
      {previewState.isOpen && (
        <DocumentPreviewModal
          docId={previewState.docId}
          queryTerms={previewState.queryTerms}
          onClose={closePreview}
        />
      )}

      {/* Floating System Notification */}
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}

