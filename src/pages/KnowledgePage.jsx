import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { knowledgeApi } from '../api/knowledgeApi';
import { BookOpen, Search, FileText, Database, Layers, Sparkles, CheckCircle2, FolderKanban, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import FuturisticLoader from '../components/common/FuturisticLoader';

const KnowledgePage = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const [knowledgeData, setKnowledgeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  const fetchKnowledge = async (projectId) => {
    if (!projectId) {
      setKnowledgeData({ documents: [], total_chunks: 0, partitions: {} });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await knowledgeApi.getKnowledge(projectId);
      setKnowledgeData(res);
    } catch (err) {
      console.error("Failed to load knowledge documents:", err);
      setError("Failed to connect to the knowledge base service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchResults(null);
    setSearchQuery('');
    if (activeProject?.id) {
      fetchKnowledge(activeProject.id);
    } else {
      setKnowledgeData({ documents: [], total_chunks: 0, partitions: {} });
      setLoading(false);
    }
  }, [activeProject?.id]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !activeProject?.id) {
      setSearchResults(null);
      return;
    }
    try {
      setSearching(true);
      const res = await knowledgeApi.searchKnowledge(searchQuery, activeProject.id);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  if (loading && !knowledgeData) {
    return (
      <FuturisticLoader 
        title="Accessing Semantic Vector Knowledge Base..." 
        subtitle="Retrieving partitioned vector embeddings, contracts, and RAG index"
      />
    );
  }

  if (error && !knowledgeData) {
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
    <div className="py-2 h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end pb-2 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Knowledge Base & RAG Index</h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Enterprise-grade partitioned vector store (ChromaDB HNSW) with recursive semantic chunking and project-level context isolation.
          </p>
        </div>
        {['PMO', 'Project Manager', 'Program Director'].includes(user?.role) && (
          <Link
            to="/ingestion"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 transition-all"
          >
            Upload New Document
          </Link>
        )}
      </div>

      {!activeProject ? (
        /* No active project selected state */
        <div className="text-center py-16 px-4 theme-card border border-dashed theme-border rounded-3xl">
          <div className="w-14 h-14 rounded-2xl bg-[#FF5A14]/10 text-[#FF5A14] border border-[#FF5A14]/20 flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={28} />
          </div>
          <h3 className="text-lg font-black theme-heading">Select a Project from Header</h3>
          <p className="text-xs theme-muted mt-1.5 max-w-md mx-auto">
            Knowledge Base &amp; RAG Vector Indexes are strictly isolated per project. Please select a project from the top navigation dropdown to access its partitioned vector store and indexed documents.
          </p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
                <FileText size={24} />
              </div>
              <div>
                <div className="text-2xl font-black theme-heading">{documents.length}</div>
                <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">
                  Partition [{activeProject.jira_key || 'PRJ'}] Files
                </div>
              </div>
            </div>

            <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
                <Layers size={24} />
              </div>
              <div>
                <div className="text-2xl font-black theme-heading">{totalChunks}</div>
                <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">
                  Vectorized Semantic Chunks
                </div>
              </div>
            </div>

            <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                <Database size={24} />
              </div>
              <div>
                <div className="text-2xl font-black theme-heading">Vector Vault</div>
                <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">
                  {knowledgeData?.embedding_model || '384-dim Dense Vectors'}
                </div>
              </div>
            </div>
          </div>

          {/* Active Project Vector Partition Scope Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl theme-card border theme-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF5A14]/15 border border-[#FF5A14]/30 text-[#FF5A14] flex items-center justify-center shrink-0">
                <FolderKanban size={18} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black theme-heading uppercase tracking-wider">
                    Active Vector Partition:
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs font-mono border border-blue-500/25 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    [{activeProject.jira_key || 'PRJ'}] {activeProject.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Strictly Isolated Partition
                  </span>
                </div>
                <p className="text-[11px] theme-muted mt-1">
                  Data and semantic embeddings are strictly isolated to the project selected in the header. Cross-project context leakage is blocked.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border theme-border flex items-center gap-2 text-xs font-mono font-bold theme-heading">
                <Database size={14} className="text-[#FF5A14]" />
                <span>{totalChunks} Chunks Indexed</span>
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
                  placeholder={`Search within [${activeProject.jira_key || 'PRJ'}] ${activeProject.name} (meeting minutes, architectural decisions, risks)...`}
                  className="w-full pl-11 pr-4 py-3 theme-input rounded-xl text-sm focus:outline-none focus:border-[#FF5A14] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-3 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {searching ? 'Searching...' : 'Search Partition'}
              </button>
            </form>

            {/* Semantic Search Results */}
            {searchResults !== null && (
              <div className="mt-6 border-t theme-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold theme-heading flex items-center gap-2">
                    <Sparkles size={16} className="text-[#FF5A14]" />
                    <span>
                      Semantic Retrieval Results ({searchResults.length} matches in [{activeProject.jira_key || 'PRJ'}] {activeProject.name})
                    </span>
                  </h3>
                  <button 
                    onClick={() => setSearchResults(null)}
                    className="text-xs text-slate-400 hover:text-[#FF5A14] font-medium"
                  >
                    Clear Search
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <p className="text-xs theme-muted italic py-3 text-center">No matching vector chunks found in this partition.</p>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl theme-card border theme-border space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#FF5A14] font-mono">{item.source || item.metadata?.source || 'Document'}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 font-mono text-slate-500">
                              {item.id}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                              Partition: [{activeProject.jira_key || 'PRJ'}]
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            <span>{item.score || 'Match'} Similarity</span>
                          </span>
                        </div>
                        <p className="text-xs theme-heading leading-relaxed font-sans bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border theme-border">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ingested Documents List */}
          <div className="theme-card rounded-2xl p-6 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-bold theme-heading flex items-center gap-2">
                <BookOpen className="text-[#FF5A14]" size={20} />
                <span>Ingested Knowledge Sources</span>
              </h2>
              <span className="text-xs theme-muted font-mono">
                {documents.length} source documents in partition [{activeProject.jira_key || 'PRJ'}]
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12 border border-dashed theme-border rounded-2xl">
                <BookOpen className="mx-auto text-slate-400 mb-3" size={40} />
                <h3 className="text-sm font-bold theme-heading">No Documents in [{activeProject.jira_key || 'PRJ'}] Partition</h3>
                <p className="text-xs theme-muted mt-1 max-w-sm mx-auto">
                  Upload MOMs, specification documents, or sync connector data for this project to index vector memory.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 sm:p-5 rounded-2xl theme-subtle border theme-border flex flex-col justify-between hover:border-[#FF5A14]/40 transition-all shadow-sm space-y-3"
                  >
                    <div>
                      {/* Document Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] border border-[#FF5A14]/20 flex-shrink-0 mt-0.5">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs theme-heading truncate" title={doc.title || doc.filename}>
                              {doc.title || doc.filename}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] theme-muted font-mono mt-0.5 truncate">
                              <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-white/10 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                                {doc.file_ext || 'TXT'}
                              </span>
                              <span>{doc.filename || doc.source}</span>
                              <span>•</span>
                              <span>{doc.timestamp || 'Indexed'}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-500 border border-blue-500/25 flex-shrink-0">
                          {doc.chunk_count} chunks
                        </span>
                      </div>

                      {/* Semantic NLP Tags */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {doc.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-white/5 theme-muted border theme-border">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Clean Content Preview */}
                      {doc.preview && (
                        <div className="text-[11px] theme-heading leading-relaxed theme-card p-3 rounded-xl border theme-border font-sans">
                          {doc.preview}
                        </div>
                      )}
                    </div>

                    {/* Vector Metadata & Partition Footer */}
                    <div className="flex items-center justify-between text-[10px] theme-muted pt-2.5 border-t theme-border">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{doc.embedding_info || '384-dim Dense Vectors'}</span>
                      </span>
                      <span className="font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                        Partition: [{activeProject.jira_key || 'PRJ'}]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default KnowledgePage;
