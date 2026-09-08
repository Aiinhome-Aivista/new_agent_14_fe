import React, { useState, useEffect } from 'react';
import { Bot, Cpu, ShieldCheck, Sparkles, Activity } from 'lucide-react';

const TELEMETRY_STAGES = [
  { text: "Initializing Autonomous Agentic Loop...", icon: Bot },
  { text: "Querying Semantic Vector Knowledge Space...", icon: Cpu },
  { text: "Synthesizing Multi-Vendor Performance Telemetry...", icon: Activity },
  { text: "Calibrating 5x5 Predictive Risk Matrix...", icon: Sparkles },
  { text: "Verifying Enterprise Compliance & Guardrail Policies...", icon: ShieldCheck },
];

const FuturisticLoader = ({ 
  title = "Agentic AI Synthesizing Telemetry...", 
  subtitle = "VPM Autonomous Intelligence Engine • Neural Reasoning Core",
  size = "full" 
}) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % TELEMETRY_STAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const currentStage = TELEMETRY_STAGES[stageIndex];
  const StageIcon = currentStage.icon;

  if (size === "card") {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[220px] rounded-2xl theme-card relative overflow-hidden backdrop-blur-md">
        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#FF5A14]/30 animate-spin-slow"></div>
          <div className="absolute inset-1 rounded-full border-2 border-t-[#FF5A14] border-r-[#EB8C00] border-b-transparent border-l-transparent animate-spin"></div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,90,20,0.6)]">
            <Cpu size={16} />
          </div>
        </div>
        <div className="text-xs font-bold theme-heading tracking-wide flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A14] animate-pulse"></span>
          {title}
        </div>
        <div className="text-[11px] theme-muted mt-1 text-center font-mono">
          {currentStage.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] p-8 relative overflow-hidden">
      
      {/* Ambient Pulsing Glow Backdrop */}
      <div className="absolute w-80 h-80 bg-[#FF5A14]/15 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      {/* Futuristic Gyroscope AI Core */}
      <div className="relative w-36 h-36 flex items-center justify-center mb-8">
        
        {/* Outer segmented radar ring */}
        <div className="absolute inset-0 rounded-full border border-slate-300 dark:border-white/10 border-t-[#FF5A14] border-b-[#EB8C00] animate-spin-slow"></div>
        
        {/* Counter-rotating dashed ring */}
        <div className="absolute inset-3 rounded-full border-2 border-dashed border-[#FF5A14]/40 animate-spin-reverse"></div>
        
        {/* Luminous laser scan line */}
        <div className="absolute inset-5 rounded-full border border-slate-300 dark:border-white/20 overflow-hidden">
          <div className="w-full h-1/2 bg-gradient-to-b from-[#FF5A14]/30 to-transparent animate-radar-sweep"></div>
        </div>

        {/* Orbiting AI Data Sparkles */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#FF5A14] shadow-[0_0_12px_rgba(255,90,20,0.9)]"></div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#EB8C00] shadow-[0_0_10px_rgba(235,140,0,0.8)]"></div>

        {/* Central Neural Node */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5A14] via-[#E04808] to-[#9E2A00] flex items-center justify-center text-white shadow-[0_0_35px_rgba(255,90,20,0.6)] border border-white/30 transform hover:scale-105 transition-transform">
          <Bot size={30} className="animate-pulse" />
        </div>

      </div>

      {/* Main Status Header */}
      <div className="text-center max-w-md relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5A14]/10 border border-[#FF5A14]/30 text-[#FF5A14] text-xs font-bold uppercase tracking-wider mb-3">
          <span className="w-2 h-2 rounded-full bg-[#FF5A14] animate-ping"></span>
          <span>Autonomous AI Engine Active</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold theme-heading tracking-tight">
          {title}
        </h3>

        <p className="text-xs sm:text-sm theme-muted mt-1 font-medium">
          {subtitle}
        </p>

        {/* Live Dynamic Telemetry Phase Indicator */}
        <div className="mt-6 p-3 rounded-xl theme-card flex items-center justify-center gap-2.5 shadow-sm">
          <StageIcon size={16} className="text-[#FF5A14] animate-bounce" />
          <span className="text-xs font-mono font-medium theme-heading">
            {currentStage.text}
          </span>
        </div>

        {/* Multi-step progress ticks */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {TELEMETRY_STAGES.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === stageIndex 
                  ? 'w-6 bg-[#FF5A14] shadow-[0_0_8px_rgba(255,90,20,0.8)]' 
                  : 'w-2 bg-slate-300 dark:bg-white/10'
              }`}
            />
          ))}
        </div>

      </div>

    </div>
  );
};

export default FuturisticLoader;
