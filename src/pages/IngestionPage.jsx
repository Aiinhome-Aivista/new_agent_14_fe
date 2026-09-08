import React from 'react';
import { useAuth } from '../context/AuthContext';
import UploadPanel from '../components/ingestion/UploadPanel';

const IngestionPage = () => {
  const { user } = useAuth();

  if (!['Project Manager', 'PMO'].includes(user?.role)) {
    return (
      <div className="py-12 text-center theme-card p-8 rounded-2xl max-w-md mx-auto">
        <h2 className="text-xl font-bold theme-heading mb-2">Access Denied</h2>
        <p className="text-xs theme-muted">Only PMO and Project Managers have permission to upload and ingest program documents.</p>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6">
      <div className="pb-2 border-b border-slate-200 dark:border-white/10">
        <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Data Ingestion Engine</h1>
        <p className="text-xs sm:text-sm theme-muted mt-1">Upload unstructured contracts, meeting minutes, and project deliverables to be processed into semantic memory.</p>
      </div>
      
      <div className="max-w-2xl">
        <UploadPanel />
      </div>
    </div>
  );
};

export default IngestionPage;
