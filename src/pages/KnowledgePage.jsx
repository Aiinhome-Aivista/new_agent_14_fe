import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { knowledgeApi } from '../api/knowledgeApi';
import { BookOpen, Search, FileText, Database, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import FuturisticLoader from '../components/common/FuturisticLoader';

const KnowledgePage = () => {
  const { user } = useAuth();
  const [knowledgeData, setKnowledgeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const res = await knowledgeApi.getKnowledge();
      setKnowledgeData(res);
    } catch (err) {
      console.error("Failed to load knowledge documents:", err);
      setError("Failed to connect to the knowledge base service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      setSearching(true);
      const res = await knowledgeApi.searchKnowledge(searchQuery);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <FuturisticLoader 
        title="Accessing Semantic Vector Knowledge Base..." 
        subtitle="Retrieving ingested contracts, meeting minutes, and RAG embeddings"
      />
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl theme-card border-red-500/40 text-center max-w-xl mx-auto">
          <h3 className="text-sm font-bold text-red-500">Error Loading Knowledge Base</h3>
          <p className="mt-2 text-xs theme-muted">{error}</p>
        </div>
      </div>
    );
  }

  const documents = knowledgeData?.documents || [];
  const totalChunks = knowledgeData?.total_chunks || 0;

  return (
    <div className="py-2 h-full flex flex-col space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end pb-2 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Knowledge Base & RAG Index</h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">Search through vectorized documents, meeting minutes, and program knowledge.</p>
        </div>
        {['PMO', 'Project Manager'].includes(user?.role) && (
          <Link
            to="/ingestion"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 transition-all"
          >
            Upload New Document
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-2xl font-black theme-heading">{documents.length}</div>
            <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">Indexed Source Files</div>
          </div>
        </div>

        <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-2xl font-black theme-heading">{totalChunks}</div>
            <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">Vectorized Semantic Chunks</div>
          </div>
        </div>

        <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <Database size={24} />
          </div>
          <div>
            <div className="text-2xl font-black theme-heading">Vector Vault</div>
            <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">Persistent Semantic Index</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="theme-card rounded-2xl p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across program meeting minutes, architectural decisions, and risk notes..."
              className="w-full pl-11 pr-4 py-3 theme-input rounded-xl text-sm focus:outline-none focus:border-[#FF5A14] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? 'Searching...' : 'Search Context'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults !== null && (
          <div className="mt-6 border-t theme-border pt-4">
            <h3 className="text-sm font-bold theme-heading mb-3">
              Search Results ({searchResults.length} matches for "{searchQuery}")
            </h3>
            {searchResults.length === 0 ? (
              <p className="text-xs theme-muted italic">No matching chunks found in semantic memory.</p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl theme-subtle border theme-border">
                    <div className="flex justify-between items-center text-xs theme-muted mb-1.5">
                      <span className="font-bold text-[#FF5A14]">Source: {item.metadata?.source || 'Document'}</span>
                      <span className="font-mono text-[10px]">Chunk ID: {item.id}</span>
                    </div>
                    <p className="text-xs theme-heading whitespace-pre-wrap leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ingested Documents List */}
      <div className="theme-card rounded-2xl p-6 flex-1">
        <h2 className="text-base font-bold theme-heading mb-4 flex items-center gap-2">
          <BookOpen className="text-[#FF5A14]" size={20} />
          <span>Ingested Knowledge Sources</span>
        </h2>

        {documents.length === 0 ? (
          <div className="text-center py-12 border border-dashed theme-border rounded-2xl">
            <BookOpen className="mx-auto text-slate-400 mb-3" size={40} />
            <h3 className="text-sm font-bold theme-heading">No Knowledge Sources Ingested</h3>
            <p className="text-xs theme-muted mt-1 max-w-sm mx-auto">
              Upload MOMs, status updates, or contract addendums to populate the semantic index.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, idx) => (
              <div key={idx} className="p-4 rounded-xl theme-subtle border theme-border flex flex-col justify-between hover:border-[#FF5A14]/40 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="text-[#FF5A14] flex-shrink-0" size={16} />
                      <span className="font-bold text-xs theme-heading truncate max-w-[200px]" title={doc.filename}>
                        {doc.filename}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                      {doc.chunk_count} chunks
                    </span>
                  </div>
                  
                  {doc.preview && (
                    <p className="text-[11px] theme-muted line-clamp-3 mb-3 theme-card p-2.5 rounded-lg border theme-border font-mono">
                      {doc.preview}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] theme-muted pt-2 border-t theme-border">
                  <span>Project ID: {doc.project_id || 1}</span>
                  <span className="font-mono">Indexed in Vector Memory</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default KnowledgePage;
