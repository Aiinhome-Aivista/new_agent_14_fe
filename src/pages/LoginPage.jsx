import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  User, 
  Briefcase, 
  UserCog, 
  UserCheck, 
  ArrowLeft, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Loader2,
  AlertCircle
} from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail, loginPassword) => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/projects');
    } catch (err) {
      console.error(err);
      setError('Invalid credentials. Please verify your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const handlePersonaSelect = (personaEmail) => {
    setEmail(personaEmail);
    setPassword('password123');
    handleLogin(personaEmail, 'password123');
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 selection:bg-[#FF5A14] selection:text-white font-sans flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Background Ambient Lighting & High-Tech Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-[#FF5A14]/25 via-[#FF7A45]/10 to-transparent blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-blue-600/10 blur-[160px] rounded-full"></div>
        <div className="absolute top-[40%] left-[-15%] w-[500px] h-[500px] bg-[#FF5A14]/10 blur-[160px] rounded-full"></div>
        <div className="absolute inset-0 bg-grid-dark opacity-50"></div>
      </div>

      {/* Main Login Card Container */}
      <div className="max-w-lg w-full dark-glass-card p-8 sm:p-10 rounded-3xl border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative z-10">
        
        {/* Top Action / Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full dark-glass border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:border-[#FF5A14]/40 hover:bg-white/[0.04] transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Homepage</span>
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API Online</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-4 shadow-[0_0_30px_rgba(255,90,20,0.55)] border border-white/20">
            V
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In to <span className="text-gradient-orange">VPM Intelligence</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Autonomous Vendor Governance & Risk Command Center
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-3 text-red-300 text-xs">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Manual Credentials Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Email Input Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                className="w-full bg-[#0E1322]/80 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14]/40 transition-all"
                placeholder="name@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Password Input Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Security Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-[#0E1322]/80 border border-white/10 rounded-xl px-4 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14]/40 transition-all"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" />
              <button
                type="button"
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit CTA Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-sm font-bold shadow-[0_0_25px_rgba(255,90,20,0.4)] hover:shadow-[0_0_35px_rgba(255,90,20,0.6)] hover:brightness-110 disabled:opacity-60 transition-all flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Command Center</span>
                  <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </div>

        </form>

        {/* Quick Persona Selector Section */}
        <div className="mt-8 pt-6 border-t border-white/[0.08]">
          <div className="relative mb-5 text-center">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Or 1-Click Fast Sign In as Persona
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            
            {/* Investor */}
            <button
              type="button"
              onClick={() => handlePersonaSelect('investor@example.com')}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#FF5A14]/50 transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#FF5A14]/20 text-[#FF7A45] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User size={15} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded">
                  Cap
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#FF7A45] transition-colors">
                  Investor
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Portfolio Health & ROI
                </div>
              </div>
            </button>

            {/* Program Director */}
            <button
              type="button"
              onClick={() => handlePersonaSelect('director@example.com')}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#FF5A14]/50 transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#FF5A14]/20 text-[#FF7A45] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCog size={15} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded">
                  Gov
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#FF7A45] transition-colors">
                  Prog Director
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Multi-Program Delivery
                </div>
              </div>
            </button>

            {/* Project Manager */}
            <button
              type="button"
              onClick={() => handlePersonaSelect('pm@example.com')}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#FF5A14]/50 transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#FF5A14]/20 text-[#FF7A45] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck size={15} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded">
                  Sprint
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#FF7A45] transition-colors">
                  Proj Manager
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Milestone Velocity
                </div>
              </div>
            </button>

            {/* PMO */}
            <button
              type="button"
              onClick={() => handlePersonaSelect('pmo@example.com')}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#FF5A14]/50 transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#FF5A14]/20 text-[#FF7A45] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase size={15} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded">
                  Audit
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#FF7A45] transition-colors">
                  PMO Lead
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Guardrails & Compliance
                </div>
              </div>
            </button>

          </div>
        </div>

        {/* Security & Audit Footer Note */}
        <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-[#FF7A45]" />
          <span>256-Bit Encrypted • Guardrail Audited • RBAC Protected</span>
        </div>

      </div>

    </div>
  );
};

export default LoginPage;
