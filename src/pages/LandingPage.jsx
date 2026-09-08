import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  FileText,
  Lock,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  BarChart3,
  Users,
  Bot,
  Database,
  ExternalLink,
  Activity,
  Sliders,
  Check,
  Eye
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for interactive hero tabs
  const [activeHeroTab, setActiveHeroTab] = useState('burndown');

  // State for persona switcher
  const [activePersona, setActivePersona] = useState('investor');

  // State for FAQ accordion
  const [openFaq, setOpenFaq] = useState(null);



  const personas = {
    investor: {
      role: "Investor & Capital Partner",
      title: "Strategic Capital Protection & Portfolio Health",
      desc: "Gain uncompromised macro-level visibility into capital allocation, milestone attainment, and ROI health across all supervised vendor engagements.",
      email: "investor@example.com",
      highlights: [
        "Real-time burn rate vs. value delivery benchmarking",
        "Predictive risk modeling before capital milestones trigger",
        "One-click automated executive briefings for investment committees",
        "Autonomous anomaly detection in vendor invoicing & time logs"
      ],
      stat: "$450M+",
      statLabel: "Capital Supervised with Zero Blindspots"
    },
    director: {
      role: "Program Director",
      title: "Cross-Program Governance & Delivery Acceleration",
      desc: "Eliminate vendor misalignment and delivery drag with unified velocity metrics, multi-vendor dependency tracking, and automated escalation workflows.",
      email: "director@example.com",
      highlights: [
        "Holistic multi-program Gantt and milestone burndown analysis",
        "Cross-vendor dependency graphs & blocker mitigation alerts",
        "Dynamic SLA breach probability scoring",
        "Direct export of boardroom-ready progress decks"
      ],
      stat: "4.2x",
      statLabel: "Faster Blocker Identification & Resolution"
    },
    pm: {
      role: "Project Manager",
      title: "Tactical Execution, Sprints & Vendor Accountability",
      desc: "Empower project leads with AI-extracted deliverables, automated Jira and GitHub progress synchronization, and contract deliverable verification.",
      email: "pm@example.com",
      highlights: [
        "Automatic contract SOW deliverable extraction via RAG",
        "Daily sprint velocity vs. contractor commitment mapping",
        "Automated change-order impact assessment",
        "Intelligent task prioritization based on critical-path risks"
      ],
      stat: "85%",
      statLabel: "Reduction in Manual Status Collection"
    },
    pmo: {
      role: "PMO & Compliance Leader",
      title: "Enterprise Standardization & Guardrail Audits",
      desc: "Standardize governance frameworks, enforce strict LLM safety guardrails, and maintain an immutable, auditor-ready trail of all program artifacts.",
      email: "pmo@example.com",
      highlights: [
        "Continuous compliance monitoring against ISO, SOC-2 & internal SOPs",
        "Automated LLM hallucination and PII leak interception",
        "Standardized risk scoring matrices across all suppliers",
        "Role-based permission enforcement with granular access logs"
      ],
      stat: "100%",
      statLabel: "Automated Compliance Audit Trail"
    }
  };

  const faqs = [
    {
      q: "What is VPM Platform and how does it revolutionize vendor governance?",
      a: "VPM (Vendor Performance & Program Intelligence Platform) is an enterprise-grade AI solution that unifies vendor contract analysis, sprint execution data, risk registers, and financial burn into a single autonomous command center. Powered by specialized RAG agents and strict compliance guardrails, it gives leaders immediate clarity into project delivery and supplier accountability."
    },
    {
      q: "How does the RAG Knowledge Base handle complex contracts and SOWs?",
      a: "Our document ingestion pipeline ingests PDFs, DOCX, XLSX, and scanned deliverables using semantic chunking and high-dimensional vector embeddings. When you or your executives query the system, the model retrieves exact contract clauses, SLA definitions, and milestone schedules with verifiable page-level citations."
    },
    {
      q: "How does VPM prevent LLM hallucinations and data leakage?",
      a: "VPM implements dual-layer enterprise guardrails. Outgoing prompts are checked for PII and sensitive internal credentials, while generated outputs are subjected to deterministic factuality checks against ingested source documents. If a response does not satisfy verification thresholds, the system flags the uncertainty or gracefully falls back to verified heuristics."
    },
    {
      q: "Can we integrate VPM with existing enterprise tools like Jira, GitHub, or SAP?",
      a: "Yes. VPM features native connectors and bidirectional webhooks for Jira, GitHub, Slack, Microsoft Teams, and enterprise ERP/financial systems. Project velocity and vendor commitments are continuously kept up to date without manual data entry."
    },
    {
      q: "How does role-based access control (RBAC) work?",
      a: "VPM comes pre-configured with distinct operational personas: Investor, Program Director, PMO Leader, and Project Manager. Each role sees tailored dashboards, specific data filters, and permission-appropriate actions to prevent unauthorized access to sensitive financial or technical information."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 selection:bg-[#FF5A14] selection:text-white font-sans overflow-x-hidden">
      
      {/* Background Ambient Glows & Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#FF5A14]/20 via-[#FF7A45]/5 to-transparent blur-[140px] rounded-full"></div>
        <div className="absolute top-[35%] -left-48 w-[600px] h-[600px] bg-blue-600/10 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[20%] -right-48 w-[600px] h-[600px] bg-[#FF5A14]/15 blur-[160px] rounded-full"></div>
        <div className="absolute inset-0 bg-grid-dark opacity-60"></div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0D14]/80 border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white font-extrabold text-xl shadow-[0_0_20px_rgba(255,90,20,0.5)] group-hover:scale-105 transition-transform duration-200">
              V
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                VPM <span className="text-[#FF7A45] font-light">Intelligence</span>
              </span>
              <span className="block text-[10px] tracking-widest text-slate-400 font-semibold uppercase -mt-1">
                Vendor Performance Management
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Interactive Hub</a>
            <a href="#personas" className="hover:text-white transition-colors">Solutions</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* User Auth CTAs */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block px-3 py-1 bg-white/[0.06] border border-white/[0.1] rounded-full text-xs text-slate-300">
                  Role: <strong className="text-[#FF7A45]">{user.role}</strong>
                </span>
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-sm font-semibold shadow-[0_0_25px_rgba(255,90,20,0.4)] hover:shadow-[0_0_35px_rgba(255,90,20,0.6)] hover:brightness-110 transition-all flex items-center gap-2"
                >
                  Launch Dashboard
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-sm font-semibold shadow-[0_0_25px_rgba(255,90,20,0.4)] hover:shadow-[0_0_35px_rgba(255,90,20,0.6)] hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <span>Explore App</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10">

        {/* HERO SECTION */}
        <section className="pt-20 pb-24 md:pt-28 md:pb-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full dark-glass border border-[#FF5A14]/30 text-xs font-semibold text-slate-200 mb-8 animate-float shadow-[0_0_20px_rgba(255,90,20,0.2)]">
            <span className="flex h-2 w-2 rounded-full bg-[#FF5A14] animate-pulse"></span>
            <Sparkles size={14} className="text-[#FF7A45]" />
            <span>Autonomous AI Governance for Multi-Vendor Programs</span>
            <span className="bg-[#FF5A14]/20 text-[#FF7A45] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">v2.4 Live</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15] sm:leading-[1.12]">
            Transform Vendor Risk & Delivery With <span className="text-gradient-orange">Autonomous Intelligence</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Eliminate vendor blindspots. Unify contracts, real-time Jira delivery velocity, predictive risk heatmaps, and enterprise-grade LLM guardrails into a single automated command center.
          </p>

          {/* Hero CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-base font-bold shadow-[0_0_30px_rgba(255,90,20,0.5)] hover:shadow-[0_0_45px_rgba(255,90,20,0.7)] hover:brightness-110 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Get Started Free / Live App</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#preview"
              className="w-full sm:w-auto px-8 py-4 rounded-xl dark-glass border border-white/10 hover:border-[#FF5A14]/50 text-slate-200 hover:text-white text-base font-semibold hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2"
            >
              <Eye size={18} className="text-[#FF7A45]" />
              <span>Interactive Feature Tour</span>
            </a>
          </div>

          {/* Fast Highlights Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#FF7A45]" />
              <span>Zero-Shot Contract RAG</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#FF7A45]" />
              <span>Autonomous Reasoning Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#FF7A45]" />
              <span>Strict Hallucination Guardrails</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#FF7A45]" />
              <span>Instant PDF Executive Reports</span>
            </div>
          </div>

          {/* INTERACTIVE HERO DASHBOARD PREVIEW */}
          <div id="preview" className="mt-16 sm:mt-20 scroll-mt-28">
            <div className="relative mx-auto rounded-2xl p-1 bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-[0_20px_70px_rgba(0,0,0,0.8)]">
              
              {/* Inner Window */}
              <div className="rounded-[14px] bg-[#101522] border border-white/10 overflow-hidden text-left shadow-2xl">
                
                {/* Window Header / Tabs */}
                <div className="bg-[#141A29] px-4 sm:px-6 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Traffic lights + Title */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 font-medium ml-2">
                      vpm-platform.internal/executive-console
                    </span>
                  </div>

                  {/* Interactive Tab Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-[#0A0D14] rounded-lg border border-white/[0.06] text-xs font-medium">
                    <button
                      onClick={() => setActiveHeroTab('burndown')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeHeroTab === 'burndown'
                          ? 'bg-[#FF5A14] text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Executive KPIs
                    </button>
                    <button
                      onClick={() => setActiveHeroTab('heatmap')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeHeroTab === 'heatmap'
                          ? 'bg-[#FF5A14] text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Predictive Risk Matrix
                    </button>
                    <button
                      onClick={() => setActiveHeroTab('rag')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeHeroTab === 'rag'
                          ? 'bg-[#FF5A14] text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      RAG Citations
                    </button>
                    <button
                      onClick={() => setActiveHeroTab('guardrails')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeHeroTab === 'guardrails'
                          ? 'bg-[#FF5A14] text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Safety Guardrails
                    </button>
                  </div>

                </div>

                {/* Tab Content Display */}
                <div className="p-6 sm:p-8 bg-[#0D121F]">

                  {/* TAB 1: EXECUTIVE KPIS & BURNDOWN */}
                  {activeHeroTab === 'burndown' && (
                    <div className="space-y-6">
                      {/* Top Metric Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#FF5A14]/30 transition-colors">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Portfolio Budget Burn</span>
                            <span className="text-emerald-400 font-semibold">+3.2% vs Plan</span>
                          </div>
                          <div className="text-2xl font-bold text-white mt-2">$2,640,000</div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#FF5A14] to-emerald-400 h-full rounded-full w-[68%]"></div>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1 block">Cap: $3,850,000</span>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#FF5A14]/30 transition-colors">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>SLA Delivery Index</span>
                            <span className="text-emerald-400 font-semibold">Healthy</span>
                          </div>
                          <div className="text-2xl font-bold text-white mt-2">99.4%</div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full w-[99%]"></div>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1 block">14 Vendors Supervised</span>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#FF5A14]/30 transition-colors">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Active Critical Risks</span>
                            <span className="text-amber-400 font-semibold">2 Managed</span>
                          </div>
                          <div className="text-2xl font-bold text-white mt-2">3 Total</div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full w-[35%]"></div>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1 block">1 Pending Remediation</span>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#FF5A14]/30 transition-colors">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Milestone Velocity</span>
                            <span className="text-[#FF7A45] font-semibold">Sprint 18</span>
                          </div>
                          <div className="text-2xl font-bold text-white mt-2">92.8%</div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-[#FF5A14] h-full rounded-full w-[92%]"></div>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1 block">4 Sprints Ahead of Q4 Deadline</span>
                        </div>
                      </div>

                      {/* Mock Chart & Vendor Table */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Interactive Burndown Curve visual */}
                        <div className="lg:col-span-2 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-sm font-semibold text-white">Cumulative Milestone Burndown</h4>
                              <p className="text-xs text-slate-400">Target vs Actual Deliverable Velocity across Enterprise Programs</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-[#FF5A14]/10 text-[#FF7A45] font-mono">Live Sync</span>
                          </div>

                          {/* Visual SVG Chart */}
                          <div className="h-44 w-full relative flex items-end justify-between px-2 pt-6">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                              <div className="border-b border-white w-full"></div>
                              <div className="border-b border-white w-full"></div>
                              <div className="border-b border-white w-full"></div>
                            </div>
                            {/* Bars / Points */}
                            {[
                              { label: 'Wk 1', ideal: 90, actual: 88 },
                              { label: 'Wk 2', ideal: 75, actual: 74 },
                              { label: 'Wk 3', ideal: 60, actual: 63 },
                              { label: 'Wk 4', ideal: 48, actual: 45 },
                              { label: 'Wk 5', ideal: 35, actual: 32 },
                              { label: 'Wk 6', ideal: 22, actual: 18 },
                              { label: 'Wk 7', ideal: 10, actual: 7 },
                            ].map((col, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer z-10">
                                <div className="flex items-end gap-1.5 h-32">
                                  <div style={{ height: `${col.ideal}%` }} className="w-3 rounded-t bg-slate-700 group-hover:bg-slate-600 transition-all"></div>
                                  <div style={{ height: `${col.actual}%` }} className="w-3 rounded-t bg-gradient-to-t from-[#FF5A14] to-[#FF7A45] shadow-[0_0_10px_rgba(255,90,20,0.5)]"></div>
                                </div>
                                <span className="text-[11px] text-slate-400">{col.label}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-end gap-5 mt-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-700"></span> Planned Baseline</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#FF5A14]"></span> Actual Delivered</span>
                          </div>
                        </div>

                        {/* High-Risk Vendor Watchlist */}
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-1">Supplier Health Feed</h4>
                            <p className="text-xs text-slate-400 mb-4">Autonomous Sentinel Status</p>
                            <div className="space-y-3">
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-semibold text-white">Apex Cloud Systems</div>
                                  <div className="text-[11px] text-slate-400">Core DB Migration</div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">99.8% SLA</span>
                              </div>

                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-semibold text-white">CyberSentinel LLC</div>
                                  <div className="text-[11px] text-slate-400">Penetration Testing</div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Review Due</span>
                              </div>

                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-semibold text-white">Quantum Data Labs</div>
                                  <div className="text-[11px] text-slate-400">ETL Pipelines</div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">98.4% SLA</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => navigate('/login')} 
                            className="w-full mt-4 py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>Open Full Vendor Directory</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 2: PREDICTIVE RISK MATRIX */}
                  {activeHeroTab === 'heatmap' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <h4 className="text-sm font-semibold text-white mb-1">5x5 Probability vs. Impact Risk Grid</h4>
                        <p className="text-xs text-slate-400 mb-4">Calculated continuously from contractor commit histories, Jira ticket backlog, and contract clauses.</p>
                        
                        {/* 5x5 Heatmap Grid */}
                        <div className="grid grid-cols-5 gap-2 max-w-lg mx-auto py-2">
                          {[
                            { color: 'bg-emerald-900/30 text-emerald-400', label: '1' },
                            { color: 'bg-emerald-900/40 text-emerald-400', label: '2' },
                            { color: 'bg-yellow-900/40 text-yellow-300', label: '3' },
                            { color: 'bg-amber-900/50 text-amber-300', label: '4' },
                            { color: 'bg-red-900/60 text-red-300 font-bold', label: '5' },
                            
                            { color: 'bg-emerald-900/30 text-emerald-400', label: '2' },
                            { color: 'bg-yellow-900/40 text-yellow-300', label: '4' },
                            { color: 'bg-yellow-900/50 text-yellow-300', label: '6' },
                            { color: 'bg-amber-900/60 text-amber-300 font-bold', label: '8' },
                            { color: 'bg-red-900/70 text-red-200 font-bold', label: '10' },

                            { color: 'bg-emerald-900/40 text-emerald-400', label: '3' },
                            { color: 'bg-yellow-900/40 text-yellow-300', label: '6' },
                            { color: 'bg-amber-900/50 text-amber-300', label: '9' },
                            { color: 'bg-red-900/60 text-red-300 font-bold', label: '12' },
                            { color: 'bg-red-900/80 text-red-100 font-extrabold', label: '15' },

                            { color: 'bg-yellow-900/30 text-yellow-400', label: '4' },
                            { color: 'bg-amber-900/40 text-amber-300', label: '8' },
                            { color: 'bg-red-900/60 text-red-300', label: '12' },
                            { color: 'bg-red-900/70 text-red-200 font-bold', label: '16' },
                            { color: 'bg-red-900/90 text-red-100 font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.5)]', label: '20' },

                            { color: 'bg-amber-900/40 text-amber-400', label: '5' },
                            { color: 'bg-red-900/50 text-red-300', label: '10' },
                            { color: 'bg-red-900/70 text-red-200 font-bold', label: '15' },
                            { color: 'bg-red-900/85 text-red-100 font-extrabold', label: '20' },
                            { color: 'bg-red-600/80 text-white font-extrabold shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse', label: '25' },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className={`h-12 rounded-lg ${item.color} border border-white/10 flex items-center justify-center text-xs transition-transform hover:scale-110 cursor-pointer`}
                              title={`Risk Score: ${item.label}`}
                            >
                              {item.label}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 mt-3 px-6">
                          <span>Low Probability ➔ High Probability</span>
                          <span>Low Impact ➔ High Impact</span>
                        </div>
                      </div>

                      {/* Flagged item breakdown */}
                      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Automated Risk Mitigation</h4>
                          <p className="text-xs text-slate-400 mb-4">Autonomous agent recommendations for active incidents:</p>
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-xs">
                              <div className="flex items-center gap-1.5 text-red-400 font-semibold mb-1">
                                <AlertTriangle size={14} />
                                <span>Score 25: Cloud Migration SOW</span>
                              </div>
                              <p className="text-slate-300 text-[11px] leading-relaxed">
                                Vendor capacity dropped 35%. Recommendation: trigger emergency SLA clause §8.2 to bring in secondary support team.
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs">
                              <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                                <Activity size={14} />
                                <span>Score 16: API Rate Limit Surge</span>
                              </div>
                              <p className="text-slate-300 text-[11px] leading-relaxed">
                                Approaching 85% of third-party quota. Autonomous cache layer recommended before month-end closing.
                              </p>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => navigate('/login')}
                          className="w-full mt-4 py-2 px-3 rounded-lg bg-[#FF5A14]/20 hover:bg-[#FF5A14]/30 border border-[#FF5A14]/40 text-xs font-semibold text-[#FF7A45] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>Explore Interactive Risk Register</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: RAG CITATIONS */}
                  {activeHeroTab === 'rag' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                        <div className="text-xs text-[#FF7A45] font-semibold mb-1 flex items-center gap-1.5">
                          <Bot size={14} />
                          <span>Natural Language RAG Query:</span>
                        </div>
                        <p className="text-sm text-white font-medium">
                          "Does our master agreement with DataCorp allow for automatic fee escalation if SLA drops below 98%?"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                            <Sparkles size={14} className="text-[#FF5A14]" />
                            <span>AI Agent Synthesis</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            No. Section 12.4 of the DataCorp Master Services Agreement explicitly waives fee escalations if downtime exceeds 2.0% within any rolling 30-day window. Furthermore, Section 12.5 specifies that a liquidated damages credit of 5% per 1% SLA degradation applies immediately.
                          </p>
                          <div className="mt-3 text-[11px] text-emerald-400 font-mono">
                            Confidence: 99.4% • Ingestion Timestamp: Today at 10:14 AM
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                            <FileText size={14} className="text-blue-400" />
                            <span>Verifiable Source Chunks</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2 rounded bg-black/40 border border-white/5 text-[11px]">
                              <span className="text-[#FF7A45] font-mono">MSA_DataCorp_2026.pdf (Page 24, §12.4):</span>
                              <p className="text-slate-400 mt-1 italic font-serif">"...no price adjustment, indexation or automatic fee escalations shall become enforceable during any period where SLA compliance fails to meet 98.0%..."</p>
                            </div>
                            <div className="p-2 rounded bg-black/40 border border-white/5 text-[11px]">
                              <span className="text-[#FF7A45] font-mono">SLA_Addendum_B.pdf (Page 3):</span>
                              <p className="text-slate-400 mt-1 italic font-serif">"...Service credits are calculated automatically at 5.0% of monthly recurring fee per breach event..."</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: SAFETY GUARDRAILS */}
                  {activeHeroTab === 'guardrails' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
                            <ShieldCheck size={16} />
                            <span>PII Redaction Engine</span>
                          </div>
                          <div className="text-2xl font-bold text-white">100%</div>
                          <p className="text-[11px] text-slate-400 mt-1">Names, SSNs, and API secrets scrubbed prior to model inference.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <div className="flex items-center gap-2 text-[#FF7A45] text-xs font-semibold mb-2">
                            <Lock size={16} />
                            <span>Hallucination Interceptor</span>
                          </div>
                          <div className="text-2xl font-bold text-white">99.8%</div>
                          <p className="text-[11px] text-slate-400 mt-1">Every generated output must map to a verified vector chunk citation.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-2">
                            <Database size={16} />
                            <span>Audit Logging</span>
                          </div>
                          <div className="text-2xl font-bold text-white">Immutable</div>
                          <p className="text-[11px] text-slate-400 mt-1">Complete cryptographic prompt-to-response provenance record.</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <h5 className="text-xs font-semibold text-slate-300 mb-3">Live Guardrail Telemetry Stream:</h5>
                        <div className="space-y-1.5 font-mono text-xs">
                          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                            <span className="text-slate-400">15:38:12 — Prompt Filter: Zero PII detected</span>
                            <span className="text-emerald-400 font-semibold">[PASSED]</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                            <span className="text-slate-400">15:38:14 — Factuality Grounding: 98.6% match to SOW_v2</span>
                            <span className="text-emerald-400 font-semibold">[VERIFIED]</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                            <span className="text-slate-400">15:38:15 — Toxicity & Bias Scan: 0.00 score</span>
                            <span className="text-emerald-400 font-semibold">[CLEARED]</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer bar inside preview */}
                <div className="bg-[#141A29] px-6 py-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Backend Orchestrator Online (Autonomous Core • Vector Engine)</span>
                  </div>
                  <button 
                    onClick={() => navigate('/login')}
                    className="text-[#FF7A45] hover:text-[#FF5A14] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Launch Full Interactive Environment</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            </div>
          </div>

        </section>

        {/* IMPACT METRICS STRIP */}
        <section className="py-12 border-y border-white/[0.08] bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">99.4%</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">SLA Contract Compliance</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#FF7A45] tracking-tight">&lt; 2.1s</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">RAG Query Latency</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">85%</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Reduction in Manual Audit Time</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#FF7A45] tracking-tight">$450M+</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Supervised Program Capital</div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE PLATFORM CAPABILITIES */}
        <section id="features" className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-[#FF7A45] uppercase">Engineered for High-Stakes Governance</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight">
              An End-to-End Operating System for Vendor Portfolio Management
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Traditional spreadsheets and static project management tools fail when managing millions in vendor commitments. VPM connects data across silos to keep your programs on time and on budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl dark-glass-card hover:border-[#FF5A14]/40 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(255,90,20,0.4)] group-hover:scale-110 transition-transform">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF7A45] transition-colors">
                Multimodal Contract RAG
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Ingest hundreds of pages of complex Master Service Agreements, Statements of Work, and technical annexes. Query with natural language and get precise answers with verified line-item citations.
              </p>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Automatic SLA term extraction</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Penalty and escalation clause detection</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Multimodal PDF, Word, and Excel support</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl dark-glass-card hover:border-[#FF5A14]/40 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(255,90,20,0.4)] group-hover:scale-110 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF7A45] transition-colors">
                Predictive Risk Matrix
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Continuous ML algorithms monitor contractor velocity, scope creep, and delivery patterns. Automatically score risks on a 5x5 matrix and receive autonomous mitigation playbooks before milestones fail.
              </p>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Probability × Impact auto-scoring</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Historical bottleneck trend analysis</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Automated risk escalation workflows</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl dark-glass-card hover:border-[#FF5A14]/40 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(255,90,20,0.4)] group-hover:scale-110 transition-transform">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF7A45] transition-colors">
                Real-Time Burndown Analytics
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Consolidate budget burn, story point completion, and deliverable sign-offs in real time. Gain instant portfolio-wide visibility into sprint velocity versus contracted commitments.
              </p>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Live Jira & GitHub sync</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Budget variance & milestone forecasting</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Executive-level drilldown by program</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl dark-glass-card hover:border-[#FF5A14]/40 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(255,90,20,0.4)] group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF7A45] transition-colors">
                Enterprise LLM Guardrails
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Never worry about confidential contract data leaking or models inventing false figures. Our bi-directional guardrail engine enforces strict PII scrubbing, sentiment alignment, and citation factuality checks.
              </p>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Zero unverified answers policy</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Automatic PII and credential masking</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> SOC-2 and ISO-27001 audit logging</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl dark-glass-card hover:border-[#FF5A14]/40 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(255,90,20,0.4)] group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF7A45] transition-colors">
                1-Click Executive PDF Briefings
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Generate polished, boardroom-ready PDF briefs and investment committee updates in seconds. Automatically synthesize milestone progress, risks, budget variances, and vendor performance scores.
              </p>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Automated executive summary generation</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Embedded charts and KPI cards</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Exportable directly to PDF & presentation decks</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl dark-glass-card hover:border-[#FF5A14]/40 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(255,90,20,0.4)] group-hover:scale-110 transition-transform">
                <Sliders size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF7A45] transition-colors">
                Native Enterprise Connectors
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Connect your existing tech stack seamlessly. Ingest project status from Jira, code merges from GitHub, notifications via Slack, and enterprise purchase orders from SAP or Oracle.
              </p>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> Jira Cloud & Jira Data Center webhooks</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> GitHub commits & pull request tracking</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#FF7A45]" /> REST API & custom database sync</li>
              </ul>
            </div>

          </div>
        </section>

        {/* ROLE-BASED SOLUTIONS (PERSONAS) */}
        <section id="personas" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-[#FF7A45] uppercase">Tailored for Every Stakeholder</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight">
              Purpose-Built Views for Every Executive & Operational Role
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Whether you are evaluating capital allocation or managing daily sprint blockers, VPM provides role-specific dashboards with granular data boundaries.
            </p>
          </div>

          {/* Persona Switcher Navigation */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {[
              { key: 'investor', label: 'Investor & Capital Partner', icon: <TrendingUp size={16} /> },
              { key: 'director', label: 'Program Director', icon: <Users size={16} /> },
              { key: 'pm', label: 'Project Manager', icon: <Activity size={16} /> },
              { key: 'pmo', label: 'PMO & Compliance Lead', icon: <ShieldCheck size={16} /> }
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setActivePersona(p.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activePersona === p.key
                    ? 'bg-[#FF5A14] text-white shadow-[0_0_25px_rgba(255,90,20,0.4)] scale-105'
                    : 'dark-glass border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Active Persona Card Display */}
          <div className="dark-glass-card rounded-3xl p-8 sm:p-12 border border-white/10 relative overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Details & Highlights */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5A14]/20 border border-[#FF5A14]/30 text-[#FF7A45] text-xs font-bold uppercase">
                  Persona View: {personas[activePersona].role}
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {personas[activePersona].title}
                </h3>

                <p className="text-base text-slate-300 leading-relaxed">
                  {personas[activePersona].desc}
                </p>

                <div className="space-y-3 pt-2">
                  {personas[activePersona].highlights.map((point, pidx) => (
                    <div key={pidx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#FF5A14]/20 text-[#FF7A45] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={13} />
                      </div>
                      <span className="text-sm text-slate-200">{point}</span>
                    </div>
                  ))}
                </div>

                {/* Access Action */}
                <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-sm font-bold shadow-lg hover:shadow-[0_0_30px_rgba(255,90,20,0.5)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Sign In to Access {personas[activePersona].role.split(' ')[0]} View</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Right Column: Hero Stat Badge & Visual Preview */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#182136] to-[#0F1424] border border-white/10 p-8 text-center shadow-xl relative">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#FF5A14]/30 rounded-full blur-2xl"></div>
                  
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 mb-2">
                    {personas[activePersona].stat}
                  </div>
                  <div className="text-sm font-semibold text-[#FF7A45] mb-6">
                    {personas[activePersona].statLabel}
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-left space-y-2">
                    <div className="text-xs text-slate-400 font-medium">Verified Test User Credentials:</div>
                    <div className="text-xs font-mono text-slate-200">Email: <span className="text-[#FF7A45]">{personas[activePersona].email}</span></div>
                    <div className="text-xs font-mono text-slate-200">Password: <span className="text-slate-400">password123</span></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* ARCHITECTURE & HOW IT WORKS FLOW */}
        <section className="py-24 bg-gradient-to-b from-[#0A0D14] via-[#0D1220] to-[#0A0D14] border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold tracking-widest text-[#FF7A45] uppercase">Enterprise Data Pipeline</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                How VPM Converts Chaos Into Governed Precision
              </h2>
              <p className="mt-3 text-slate-300 text-sm sm:text-base">
                Four orchestrated stages that operate continuously in the background to keep your vendor governance airtight.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              
              {/* Step 1 */}
              <div className="p-6 rounded-2xl dark-glass border border-white/[0.08] relative">
                <div className="text-4xl font-extrabold text-[#FF5A14]/30 mb-3 font-mono">01</div>
                <h4 className="text-lg font-bold text-white mb-2">Ingest & Parse</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upload vendor contracts, SOWs, and connect Jira or SAP. Documents are chunked and embedded into high-dimensional vector stores.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl dark-glass border border-white/[0.08] relative">
                <div className="text-4xl font-extrabold text-[#FF5A14]/30 mb-3 font-mono">02</div>
                <h4 className="text-lg font-bold text-white mb-2">Autonomous Analysis</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Specialized agents calculate burndown velocity, detect SLA discrepancy indicators, and compute predictive 5x5 risk scores.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-2xl dark-glass border border-white/[0.08] relative">
                <div className="text-4xl font-extrabold text-[#FF5A14]/30 mb-3 font-mono">03</div>
                <h4 className="text-lg font-bold text-white mb-2">Guardrail Enforcement</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dual-filter safety policies scrub PII, intercept hallucinations, and mandate verifiable page-level citations for every insight.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-2xl dark-glass border border-white/[0.08] relative">
                <div className="text-4xl font-extrabold text-[#FF5A14]/30 mb-3 font-mono">04</div>
                <h4 className="text-lg font-bold text-white mb-2">Actionable Intelligence</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Deliver executive dashboards, instant chatbot answers, automated risk mitigations, and one-click boardroom PDF briefings.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SECURITY & COMPLIANCE SECTION */}
        <section id="security" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="dark-glass-card rounded-3xl p-8 sm:p-12 border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase mb-4">
                  <ShieldCheck size={14} />
                  Enterprise Grade Security Architecture
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Your Proprietary Contracts & Vendor Data Never Leave Your Boundary
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                  Built from the ground up for strict enterprise security mandates, regulated industries, and global financial standards.
                </p>

                <div className="mt-6 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={13} />
                    </div>
                    <div>
                      <strong className="text-sm text-white block">Zero Public Training on Your Data:</strong>
                      <span className="text-xs text-slate-400">All vector embeddings and LLM prompts are isolated; your data is never used to train foundational models.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={13} />
                    </div>
                    <div>
                      <strong className="text-sm text-white block">Private VPC / On-Prem Deployment Ready:</strong>
                      <span className="text-xs text-slate-400">Deployable entirely behind your corporate firewall or inside an isolated AWS/Azure/GCP virtual private cloud.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={13} />
                    </div>
                    <div>
                      <strong className="text-sm text-white block">Granular Role-Based Access Control (RBAC):</strong>
                      <span className="text-xs text-slate-400">Cryptographically enforce who can inspect commercial terms, risk severity, and internal rate cards.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Badges Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <Lock size={32} className="text-[#FF7A45] mx-auto mb-3" />
                  <div className="font-bold text-white text-base">AES-256 & TLS 1.3</div>
                  <div className="text-xs text-slate-400 mt-1">End-to-End Encryption</div>
                </div>

                <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <ShieldCheck size={32} className="text-emerald-400 mx-auto mb-3" />
                  <div className="font-bold text-white text-base">SOC-2 Type II</div>
                  <div className="text-xs text-slate-400 mt-1">Certified Controls Ready</div>
                </div>

                <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <Database size={32} className="text-blue-400 mx-auto mb-3" />
                  <div className="font-bold text-white text-base">ISO 27001</div>
                  <div className="text-xs text-slate-400 mt-1">Information Security Align</div>
                </div>

                <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <Bot size={32} className="text-purple-400 mx-auto mb-3" />
                  <div className="font-bold text-white text-base">GDPR & CCPA</div>
                  <div className="text-xs text-slate-400 mt-1">Automated PII Masking</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-[#FF7A45] uppercase">Got Questions?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-slate-300 text-sm">
              Everything you need to know about the VPM platform, our AI models, and enterprise deployment.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, fidx) => (
              <div
                key={fidx}
                className="dark-glass rounded-xl border border-white/[0.08] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === fidx ? null : fidx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-white hover:text-[#FF7A45] transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transform transition-transform duration-200 flex-shrink-0 ${
                      openFaq === fidx ? 'rotate-180 text-[#FF5A14]' : ''
                    }`}
                  />
                </button>
                {openFaq === fidx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.04]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </section>

        {/* HIGH-CONVERTING BOTTOM CALL TO ACTION */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="rounded-3xl p-10 sm:p-16 bg-gradient-to-r from-[#182138] via-[#201824] to-[#182138] border border-[#FF5A14]/30 shadow-[0_0_80px_rgba(255,90,20,0.25)] relative overflow-hidden">
              
              <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-96 bg-[#FF5A14]/20 rounded-full blur-3xl pointer-events-none"></div>

              <span className="inline-block px-4 py-1.5 rounded-full bg-[#FF5A14]/20 border border-[#FF5A14]/40 text-xs font-bold text-[#FF7A45] uppercase mb-6">
                Start Governing With Autonomous Clarity
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl mx-auto leading-tight">
                Ready to Eliminate Vendor Delivery Drag and Budget Overruns?
              </h2>

              <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                Join program directors, PMO leaders, and investors managing over $450M in critical supplier capital.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-base font-bold shadow-[0_0_35px_rgba(255,90,20,0.6)] hover:shadow-[0_0_50px_rgba(255,90,20,0.8)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <span>Launch Live Platform</span>
                  <ArrowRight size={18} />
                </Link>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#07090F] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF5A14] flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                V
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                VPM Intelligence Platform
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#preview" className="hover:text-white transition-colors">Interactive Hub</a>
              <a href="#personas" className="hover:text-white transition-colors">Personas</a>
              <a href="#security" className="hover:text-white transition-colors">Security</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link to="/login" className="hover:text-[#FF7A45] transition-colors">Sign In</Link>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Operational • v2.4.0</span>
            </div>

          </div>

          <div className="mt-8 pt-8 border-t border-white/[0.05] text-center text-xs text-slate-500">
            © {new Date().getFullYear()} VPM Intelligence. Enterprise Vendor Performance & Portfolio Governance. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
