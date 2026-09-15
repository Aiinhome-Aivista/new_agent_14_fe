import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X, 
  Shield,
  BookOpen,
  Layers,
  Activity,
  Tag,
  Sparkles,
  FileText,
  Cpu,
  Info,
  HelpCircle
} from 'lucide-react';

const AccuracyWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  accuracyData,
  isProcessing = false
}) => {
  if (!isOpen || !accuracyData) return null;

  const {
    match_percentage = 0,
    threshold = 70,
    project_name = 'Enterprise Project',
    project_code = 'PRJ',
    project_description = '',
    matched_aspects = [],
    unmatched_aspects = [],
    matched_keywords = [],
    missing_keywords = [],
    document_topics = [],
    dimensions = {},
    nlp_stats = {},
    summary = ''
  } = accuracyData;

  const isCritical = match_percentage < 50;

  // Helper to parse "[Category] Details" formatting
  const parseAspect = (text) => {
    if (typeof text !== 'string') return { tag: null, content: String(text) };
    const match = text.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      return { tag: match[1], content: match[2] };
    }
    return { tag: null, content: text };
  };

  // Dimensions with fallback
  const semanticScore = dimensions?.semantic_similarity?.score ?? nlp_stats?.cosine_similarity ?? Math.min(100, Math.round(match_percentage * 0.9));
  const scopeScore = dimensions?.scope_vocabulary?.score ?? nlp_stats?.scope_lexicon_score ?? Math.min(100, Math.round(match_percentage * 0.8));
  const govScore = dimensions?.governance_telemetry?.score ?? nlp_stats?.governance_score ?? 50;
  const entityScore = dimensions?.entity_validation?.score ?? nlp_stats?.entity_score ?? (match_percentage > 60 ? 100 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="max-w-3xl w-full bg-white dark:bg-[#0F1422] rounded-3xl p-5 sm:p-7 border border-amber-500/30 dark:border-amber-500/30 shadow-[0_25px_90px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all max-h-[92vh] flex flex-col font-sans">
        
        {/* Glow Accent Header Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-[#FF5A14]"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-200 dark:border-white/10 mb-3.5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isCritical 
                ? 'bg-red-500/15 text-red-500 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.25)]' 
                : 'bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            }`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                  <Cpu size={11} />
                  NLP Accuracy & Scope Audit
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Required Threshold: <strong className="text-slate-700 dark:text-slate-200">{threshold}%</strong>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 leading-snug">
                Your accuracy percentage is low ({match_percentage}%). Do you still want to save?
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body (Hidden Scrollbar) */}
        <div className="overflow-y-auto space-y-4 text-xs no-scrollbar flex-1">
          
          {/* Target Project Scope Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                <FileText size={12} className="text-[#FF5A14]" />
                Target Project Scope Definition
              </span>
              <span className="font-mono text-[11px] text-[#FF5A14] font-bold bg-[#FF5A14]/10 px-2 py-0.5 rounded-md border border-[#FF5A14]/20">
                [{project_code}] {project_name}
              </span>
            </div>
            {project_description ? (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed line-clamp-2">
                "{project_description}"
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No formal description registered for this project.</p>
            )}
          </div>

          {/* Accuracy Score Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-red-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black flex-shrink-0 ${
                isCritical 
                  ? 'bg-red-500/20 text-red-500 border border-red-500/40' 
                  : 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
              }`}>
                <span className="text-xl leading-none">{match_percentage}%</span>
                <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-80">Match</span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {match_percentage < threshold ? 'Fails Minimum Data Quality Threshold' : 'Meets Required Quality Threshold'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Enterprise governance standard requires <strong className="font-mono text-slate-700 dark:text-slate-300">{threshold}%</strong> relevance. Document divergence may affect autonomous project reporting.
                </p>
              </div>
            </div>

            {/* Visual Gauge */}
            <div className="sm:w-36 flex flex-col gap-1 flex-shrink-0">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold">
                <span>Score: {match_percentage}%</span>
                <span>Target: {threshold}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden relative">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isCritical ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, match_percentage)}%` }}
                ></div>
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white dark:bg-slate-200 z-10 shadow" 
                  style={{ left: `${threshold}%` }} 
                  title={`Threshold: ${threshold}%`}
                ></div>
              </div>
            </div>
          </div>

          {/* Multi-Dimensional Audit Gauges (Non-Tech Friendly) */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* Metric 1: Topic Match (Content Relevance) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-0.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Topic Match</span>
                    <Activity size={13} className="text-blue-500" />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">Overall context & theme</p>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{semanticScore}%</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      semanticScore >= 60 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                        : semanticScore >= 30 
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                    }`}>
                      {semanticScore >= 60 ? 'Strong' : semanticScore >= 30 ? 'Moderate' : 'Low Match'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(5, semanticScore))}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Metric 2: Project Keywords (Scope Alignment) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-0.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Project Keywords</span>
                    <BookOpen size={13} className="text-emerald-500" />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">Key tasks & scope terms</p>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{scopeScore}%</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      scopeScore >= 60 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                        : scopeScore >= 30 
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                    }`}>
                      {scopeScore >= 60 ? 'High Match' : scopeScore >= 30 ? 'Moderate' : 'Low Match'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(5, scopeScore))}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Metric 3: Required Sections (Governance Structure) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-0.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Required Sections</span>
                    <Layers size={13} className="text-purple-500" />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">Budget, Risks, Timeline</p>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{govScore}%</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      govScore >= 75 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                        : govScore >= 40 
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                    }`}>
                      {govScore >= 75 ? 'Complete' : govScore >= 40 ? 'Partial' : 'Missing'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(5, govScore))}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Metric 4: Project Name & Code (Entity Match) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-0.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Project Identity</span>
                    <Shield size={13} className="text-[#FF5A14]" />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">Name or code cited</p>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{entityScore}%</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      entityScore >= 70 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                        : entityScore > 0 
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                    }`}>
                      {entityScore >= 70 ? 'Found' : entityScore > 0 ? 'Partial' : 'Not Found'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${entityScore >= 70 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(5, entityScore))}%` }}></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Intuitive Non-Tech Friendly Explainer Banner */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <HelpCircle size={14} className="text-[#FF5A14] flex-shrink-0" />
              <span>
                <strong>Plain English Guide:</strong> These 4 gauges measure whether your file mentions the project name, covers expected scope keywords, includes key report sections (Budget, Risks, Timeline), and stays on topic.
              </span>
            </div>
          </div>

          {/* Detailed NLP Breakdown: WHAT MATCHED vs WHAT DID NOT MATCH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            
            {/* Left Card: WHAT MATCHED (Emerald) */}
            <div className="p-4 rounded-2xl bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border border-emerald-500/25 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/15">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>What Matched (NLP Analysis)</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {matched_aspects.length} Points
                </span>
              </div>

              {/* Matched Keywords Cloud Pills */}
              {matched_keywords && matched_keywords.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400/90 mb-1.5 flex items-center gap-1">
                    <Tag size={10} />
                    <span>Detected Scope Keywords:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matched_keywords.map((kw, i) => {
                      const term = typeof kw === 'string' ? kw : kw.term;
                      const count = typeof kw === 'object' && kw.count ? kw.count : null;
                      return (
                        <span 
                          key={i} 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        >
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{term}</span>
                          {count && count > 1 && (
                            <span className="text-[9px] opacity-75 font-normal">({count}x)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detailed Matched Aspects Bullet Points */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Detailed Findings:
                </div>
                <ul className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                  {matched_aspects && matched_aspects.length > 0 ? (
                    matched_aspects.map((item, idx) => {
                      const { tag, content } = parseAspect(item);
                      return (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed bg-white/50 dark:bg-white/[0.02] p-2 rounded-xl border border-emerald-500/15">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                          <div>
                            {tag && (
                              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 mr-1.5 border border-emerald-500/25">
                                {tag}
                              </span>
                            )}
                            <span className="text-slate-700 dark:text-slate-200">{content}</span>
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-slate-400 italic py-2 text-center">No functional scope matches detected</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Right Card: WHAT DID NOT MATCH / GAPS (Rose / Red) */}
            <div className="p-4 rounded-2xl bg-red-500/[0.04] dark:bg-red-500/[0.06] border border-red-500/25 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-red-500/15">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-xs uppercase tracking-wider">
                  <XCircle size={16} className="text-red-500" />
                  <span>What Did Not Match (Gaps)</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                  {unmatched_aspects.length} Gaps
                </span>
              </div>

              {/* Missing Expected Keywords Cloud Pills */}
              {missing_keywords && missing_keywords.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400/90 mb-1.5 flex items-center gap-1">
                    <Tag size={10} />
                    <span>Missing Expected Scope Terms:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missing_keywords.map((kw, i) => {
                      const term = typeof kw === 'string' ? kw : kw.term;
                      return (
                        <span 
                          key={i} 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/25 border-dashed"
                          title="This term is central to the target project definition but absent in the document"
                        >
                          <span className="text-red-500 font-bold">×</span>
                          <span>{term}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detailed Unmatched Aspects Bullet Points */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Identified Deviations:
                </div>
                <ul className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                  {unmatched_aspects && unmatched_aspects.length > 0 ? (
                    unmatched_aspects.map((item, idx) => {
                      const { tag, content } = parseAspect(item);
                      return (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed bg-white/50 dark:bg-white/[0.02] p-2 rounded-xl border border-red-500/15">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                          <div>
                            {tag && (
                              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-red-500/15 text-red-700 dark:text-red-400 mr-1.5 border border-red-500/25">
                                {tag}
                              </span>
                            )}
                            <span className="text-slate-700 dark:text-slate-200">{content}</span>
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-slate-400 italic py-2 text-center">No critical scope discrepancies identified</li>
                  )}
                </ul>
              </div>
            </div>

          </div>

          {/* Document Topics Context (Explains what the doc is actually about if different) */}
          {document_topics && document_topics.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <Info size={12} className="text-blue-400" />
                <span>Primary Document Topics Detected:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {document_topics.map((topic, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Audit Verdict Summary Banner */}
          {summary && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="flex items-center gap-1.5 font-extrabold text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                <Sparkles size={13} />
                <span>AI Governance Audit Verdict:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{summary}</p>
            </div>
          )}

        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3.5 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 mt-3">
          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
            <span>Minimum quality threshold: </span>
            <strong className="text-slate-300 font-mono">{threshold}%</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer text-center"
            >
              No, Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-[#FF5A14] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <AlertTriangle size={15} />
              <span>{isProcessing ? 'Processing...' : 'Yes, Save Anyway'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccuracyWarningModal;
