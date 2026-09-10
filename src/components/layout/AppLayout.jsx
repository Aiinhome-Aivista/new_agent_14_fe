import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ChatWindow from '../chat/ChatWindow';
import { 
  LayoutDashboard, 
  BookOpen, 
  AlertTriangle, 
  BarChart2, 
  ShieldCheck, 
  MessageSquare,
  LogOut,
  Settings,
  Sun,
  Moon,
  Bot,
  Sparkles,
  Layers
} from 'lucide-react';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Executive Dashboard';
    if (path.startsWith('/knowledge')) return 'RAG Knowledge Intelligence';
    if (path.startsWith('/risks')) return 'Predictive Risk Register';
    if (path.startsWith('/reports')) return 'Automated Briefings & Analytics';
    if (path.startsWith('/guardrails')) return 'Guardrails & Compliance Audits';
    if (path.startsWith('/chat')) return 'Autonomous AI Copilot';
    if (path.startsWith('/ingestion')) return 'Document Ingestion & Parsing';
    if (path.startsWith('/project/')) return 'Project Deep Dive';
    if (path.startsWith('/settings')) return 'Enterprise Connectors';
    return 'VPM Command Center';
  };

  const allNavDefinitions = {
    dashboard: { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={19} /> },
    knowledge: { name: 'Knowledge & RAG', path: '/knowledge', icon: <BookOpen size={19} /> },
    risks: { name: 'Risk Register', path: '/risks', icon: <AlertTriangle size={19} /> },
    reports: { name: 'Reports & Analytics', path: '/reports', icon: <BarChart2 size={19} /> },
    guardrails: { name: 'Guardrails & Audits', path: '/guardrails', icon: <ShieldCheck size={19} /> },
    chat: { name: 'AI Copilot Assistant', path: '/chat', icon: <MessageSquare size={19} /> },
    settings: { name: 'Connectors', path: '/settings', icon: <Settings size={19} /> },
  };

  const getNavItemsForRole = (role) => {
    switch (role) {
      case 'Investor':
        return [
          allNavDefinitions.dashboard,
          allNavDefinitions.reports,
          allNavDefinitions.knowledge,
          allNavDefinitions.chat,
        ];
      case 'Program Director':
        return [
          allNavDefinitions.dashboard,
          allNavDefinitions.risks,
          allNavDefinitions.reports,
          allNavDefinitions.guardrails,
          allNavDefinitions.knowledge,
          allNavDefinitions.chat,
        ];
      case 'PMO':
        return [
          allNavDefinitions.dashboard,
          allNavDefinitions.risks,
          allNavDefinitions.reports,
          allNavDefinitions.guardrails,
          allNavDefinitions.knowledge,
          allNavDefinitions.settings,
        ];
      case 'Project Manager':
        return [
          allNavDefinitions.dashboard,
          allNavDefinitions.risks,
        ];
      default:
        return [allNavDefinitions.dashboard];
    }
  };

  const navItems = getNavItemsForRole(user?.role);

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark bg-[#0B0F19] text-slate-100' : 'bg-[#F1F5F9] text-slate-800'}`}>
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#141A28] border-r border-white/10 flex flex-col flex-shrink-0 shadow-2xl z-20 transition-all duration-300">
        
        {/* Brand Logo Header */}
        <div 
          className="h-16 flex items-center px-5 border-b border-white/10 cursor-pointer hover:bg-white/[0.02] transition-colors"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(255,90,20,0.5)] mr-3">
            V
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
              VPM <span className="text-[#FF7A45] font-normal">Platform</span>
            </span>
            <span className="block text-[9px] tracking-widest text-slate-400 uppercase font-semibold -mt-0.5">
              Enterprise Governance Suite
            </span>
          </div>
        </div>

        {/* AI Agent Core Status Ribbon */}
        <div className="px-4 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400 font-semibold">Autonomous Core</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Agent Active</span>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-[0_0_20px_rgba(255,90,20,0.4)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#FF7A45]'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
          
          {/* Upload Data Link for PMO / PM */}
          {['Project Manager', 'PMO'].includes(user?.role) && (
            <div className="pt-3 mt-3 border-t border-white/5">
              <span className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                Data Ops
              </span>
              <NavLink
                to="/ingestion"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-[0_0_20px_rgba(255,90,20,0.4)]' 
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`
                }
              >
                <Layers size={19} />
                <span>Upload & Ingest</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* User Card & Logout Bottom Section */}
        <div className="p-3.5 border-t border-white/10 bg-[#0E1320]/60">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                {user?.role ? user.role.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-white truncate">{user?.email || 'User'}</span>
                <span className="text-[10px] text-[#FF7A45] font-semibold truncate">{user?.role}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-red-500/20 text-xs font-semibold text-slate-300 hover:text-red-400 flex items-center justify-center gap-2 transition-colors border border-white/5"
          >
            <LogOut size={14} />
            <span>Log out</span>
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-6 z-10 flex-shrink-0 transition-colors duration-200 ${
          theme === 'dark' 
            ? 'bg-[#141A28] border-white/10 text-white' 
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          
          {/* Left: Page Title & Breadcrumb */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
              {getPageTitle()}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
              <Sparkles size={11} />
              <span>Autonomous Governance</span>
            </span>
          </div>

          {/* Right Header Actions: Theme Switcher, Persona Switcher, User Badge */}
          <div className="flex items-center gap-3">
            
            {/* Active User Role Badge (Read-only, strictly derived from login session) */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold select-none ${
                theme === 'dark'
                  ? 'bg-[#182236] border-white/10 text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <span className="text-[#FF5A14] font-bold">Role:</span>
              <span>{user?.role || 'User'}</span>
            </div>

            {/* Futuristic Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-[#182236] border-white/10 text-[#EB8C00] hover:bg-white/5 hover:border-[#FF5A14]/40'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
              title={theme === 'dark' ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* User Avatar Chip */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_0_12px_rgba(255,90,20,0.4)]">
              {user?.role ? user.role.charAt(0) : 'U'}
            </div>

          </div>
        </header>

        {/* Main Content View with Semantic Theme Background */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-[#0B0F19] bg-grid-dark text-slate-100' : 'bg-[#F1F5F9] bg-grid-light text-slate-800'
        }`}>
          <div className="max-w-7xl mx-auto h-full relative">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Chat Assistant Trigger */}
      {location.pathname !== '/chat' && (
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#FF5A14] to-[#E04808] text-white rounded-2xl shadow-[0_0_30px_rgba(255,90,20,0.5)] hover:shadow-[0_0_40px_rgba(255,90,20,0.7)] hover:scale-105 transition-all flex items-center justify-center z-40 group"
          title="Open Autonomous AI Copilot"
        >
          <Bot size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Floating Chat Panel */}
      {isChatOpen && location.pathname !== '/chat' && (
        <div className={`fixed bottom-24 right-6 w-[420px] h-[620px] z-50 rounded-2xl overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.7)] flex flex-col border backdrop-blur-xl ${
          theme === 'dark' ? 'bg-[#0E1322] border-white/10' : 'bg-white border-slate-300'
        }`}>
          <ChatWindow onClose={() => setIsChatOpen(false)} />
        </div>
      )}

    </div>
  );
};

export default AppLayout;
