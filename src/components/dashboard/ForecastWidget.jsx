import React, { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  RefreshCw,
  ShieldAlert,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const ForecastWidget = ({ activeProject }) => {
  const { user } = useAuth();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Only render for Program Director
  if (user?.role !== 'Program Director') return null;

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projectId = activeProject?.numeric_id || activeProject?.id || null;
      const res = await dashboardApi.getForecast(projectId);
      if (res.status === 'success') {
        setForecastData(res.data);
        setHasGenerated(true);
      } else {
        setError(res.message || 'Forecast generation failed');
      }
    } catch (err) {
      console.error('Forecast error:', err);
      setError(err?.response?.data?.message || 'Unable to generate forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    const abs = Math.abs(val);
    if (abs >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const getConfidenceColor = (score) => {
    if (score >= 85) return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' };
    if (score >= 70) return { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' };
    return { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', glow: 'shadow-red-500/20' };
  };

  const getTrajectoryInfo = (variance) => {
    if (typeof variance === 'string') {
      return { label: 'Analyzing...', icon: <Target size={14} />, color: 'text-slate-400' };
    }
    if (variance > 0) return { label: 'Under Budget', icon: <TrendingUp size={14} />, color: 'text-emerald-400' };
    if (variance < 0) return { label: 'Over Budget', icon: <TrendingDown size={14} />, color: 'text-red-400' };
    return { label: 'On Target', icon: <Target size={14} />, color: 'text-blue-400' };
  };

  // --- PRE-GENERATION STATE ---
  if (!hasGenerated && !loading) {
    return (
      <div className="p-6 rounded-2xl theme-card border border-white/10 relative overflow-hidden group">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
                <Brain size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black theme-heading flex items-center gap-1.5">
                  AI Predictive Forecast
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                    REFLEXION AI
                  </span>
                </h3>
                <p className="text-[11px] theme-muted mt-0.5">
                  Powered by PredictiveAgent • Self-critique convergence loop
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs theme-muted mb-5 leading-relaxed">
            Generate an AI-driven cost variance forecast using the <strong className="theme-heading">Reflexion Predictive Loop</strong>. 
            The agent analyzes your live budget data, active risk register, and project status to produce 
            a converged forecast with confidence scoring.
          </p>

          <button
            onClick={fetchForecast}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles size={16} className="animate-pulse" />
            Generate Forecast
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="p-6 rounded-2xl theme-card border border-violet-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 mb-4">
            <Brain size={28} className="animate-pulse" />
          </div>
          
          <h4 className="text-sm font-black theme-heading mb-2">Generating AI Forecast</h4>
          <p className="text-[11px] theme-muted text-center max-w-xs mb-4">
            Running Reflexion self-critique convergence loop against live budget variance and active risk matrix...
          </p>

          {/* Animated progress steps */}
          <div className="space-y-2 w-full max-w-xs">
            {['Phase 1: Baseline Projection', 'Phase 2: Risk-Adjusted Critique', 'Phase 3: Converged Output'].map((phase, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                    animationDelay: `${i * 0.8}s`,
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                >
                  <Zap size={10} />
                </div>
                <span className="theme-muted font-medium" style={{ animationDelay: `${i * 0.4}s` }}>
                  {phase}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="p-6 rounded-2xl theme-card border border-red-500/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400 border border-red-500/30">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-red-400">Forecast Generation Failed</h3>
            <p className="text-[11px] theme-muted">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchForecast}
          className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  // --- FORECAST DATA DISPLAY ---
  if (!forecastData) return null;

  const confidence = forecastData.confidence_score || 0;
  const confColors = getConfidenceColor(confidence);
  const forecastedVar = forecastData.forecasted_variance;
  const trajectory = getTrajectoryInfo(forecastedVar);
  const narrative = forecastData.forecast_narrative || '';
  const aiStatus = forecastData.ai_processing_status || 'success';

  return (
    <div className="p-6 rounded-2xl theme-card border border-violet-500/20 hover:border-violet-500/40 transition-all relative overflow-hidden group">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black theme-heading flex items-center gap-1.5">
                AI Predictive Forecast
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold ${
                  aiStatus === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  {aiStatus === 'success' ? 'AI CONVERGED' : 'FALLBACK'}
                </span>
              </h3>
              <p className="text-[11px] theme-muted mt-0.5">Reflexion loop • Dynamic risk-adjusted</p>
            </div>
          </div>

          <button
            onClick={fetchForecast}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 hover:bg-violet-500/15 border border-white/10 hover:border-violet-500/30 text-slate-400 hover:text-violet-400 transition-all"
            title="Re-generate forecast"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Confidence Score */}
          <div className={`p-3 rounded-xl ${confColors.bg} border ${confColors.border}`}>
            <span className="text-[10px] font-bold theme-muted uppercase tracking-wider block mb-1">Confidence</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${confColors.text}`}>{confidence}</span>
              <span className={`text-xs font-bold ${confColors.text}`}>%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/20 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${confidence}%`,
                  background: confidence >= 85 ? 'linear-gradient(90deg, #10B981, #34D399)' :
                             confidence >= 70 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' :
                             'linear-gradient(90deg, #EF4444, #F87171)'
                }}
              />
            </div>
          </div>

          {/* Forecasted Variance */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold theme-muted uppercase tracking-wider block mb-1">Forecasted Var.</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-black ${trajectory.color}`}>
                {typeof forecastedVar === 'number' ? fmtCurrency(forecastedVar) : forecastedVar}
              </span>
            </div>
            <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-bold ${trajectory.color}`}>
              {trajectory.icon}
              {trajectory.label}
            </div>
          </div>

          {/* Risk Count */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold theme-muted uppercase tracking-wider block mb-1">Active Risks</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-orange-400">{forecastData.risk_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-orange-400">
              <ShieldAlert size={12} />
              High / Critical
            </div>
          </div>
        </div>

        {/* Budget Context Bar */}
        {forecastData.total_planned > 0 && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="theme-muted font-medium flex items-center gap-1">
                <DollarSign size={12} className="text-[#FF5A14]" />
                Budget Context
              </span>
              <span className="font-mono font-bold theme-heading">
                {fmtCurrency(forecastData.total_actual)} / {fmtCurrency(forecastData.total_planned)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-700"
                style={{ width: `${Math.min(100, forecastData.total_planned > 0 ? (forecastData.total_actual / forecastData.total_planned) * 100 : 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* AI Narrative */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-violet-500/15">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-violet-400" />
            <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">AI Forecast Narrative</span>
          </div>
          <p className="text-xs theme-muted leading-relaxed">
            {narrative}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForecastWidget;
