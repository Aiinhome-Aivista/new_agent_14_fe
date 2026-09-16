with open(r'e:\Pwc_Agent\VCO Agent-14\new_agent_14_fe\src\components\dashboard\PMOLeadDashboard.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_card = """
        {/* PILLAR 5: PROGRAM RISKS & THREATS */}
        <div 
          onClick={() => {
            const activePid = activeProject?.numeric_id || activeProject?.id || '1';
            navigate(`/project/${activePid}?tab=threats`);
          }}
          className="p-5 rounded-2xl theme-card border border-red-500/10 hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] transition-all group relative overflow-hidden cursor-pointer"
          title="Click to open Level 4 Drilldown: Program Issues & Threat Register"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Program Risks & Threats
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Level 4 Drilldown <ArrowUpRight size={12} />
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 group-hover:scale-110 transition-transform">
                <AlertTriangle size={18} />
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-black text-red-500">
              {projectRisks?.length || 0}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              Active Risks
            </span>
          </div>

          <p className="text-xs theme-muted font-medium mb-3">
            Critical/High: <strong className="text-red-400 font-bold">{projectRisks?.filter(r => r.severity === 'Critical' || r.severity === 'High').length || 0}</strong> • {escalations.length} Escalations
          </p>

          <div className="pt-2 border-t theme-border flex items-center justify-between text-[11px]">
            <span className="theme-muted font-medium">Risk Status:</span>
            <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${(projectRisks?.length || 0) > 0 ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
              {(projectRisks?.length || 0) > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
        </div>
"""

# 1. Update Grid to 5 columns
for i, line in enumerate(lines):
    if 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5' in line:
        lines[i] = line.replace('lg:grid-cols-4', 'lg:grid-cols-5')
        break

# 2. Find insertion point for new card (after Pillar 4)
for i, line in enumerate(lines):
    if '{governance.gate_clearance_status}' in line:
        # line i is {governance.gate_clearance_status}
        # line i+1 is </span>
        # line i+2 is </div>
        # line i+3 is </div>
        lines.insert(i+4, new_card)
        break

# 3. Delete the tabs and Threat Register sections
# Let's find the indices exactly
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if 'DETAILED TABS: 1. RESOURCE ALLOCATION' in line:
        start_idx = i
        break
for i, line in enumerate(lines):
    if 'title="Program Issues & Threat Register"' in line:
        end_idx = i + 2 # the /> is at i+1
        break

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + lines[end_idx:]

with open(r'e:\Pwc_Agent\VCO Agent-14\new_agent_14_fe\src\components\dashboard\PMOLeadDashboard.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
