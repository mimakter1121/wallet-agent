import React, { useState } from 'react';
import { 
  Network, 
  UserPlus, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Copy, 
  Check, 
  QrCode, 
  Sparkles, 
  ShieldCheck, 
  Building2,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { InviteAgentModal } from '../components/modals/InviteAgentModal';

export const NetworkPage: React.FC = () => {
  const { agent, subAgents, showToast } = useApp();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 10;

  const directCount = subAgents.length;
  const activeCount = subAgents.filter(s => s.status === 'active').length;
  const pendingCount = subAgents.filter(s => s.status === 'pending').length;
  const totalVolume = subAgents.reduce((acc, s) => acc + s.totalVolume, 0);

  const activeRefCode = agent.referralCode || (agent.id ? 'AGENT-' + agent.id.replace('AG-', '') : 'AGENT-PARTNER');
  const inviteLink = `${window.location.origin}/signup?ref=${activeRefCode}`;

  const filteredSubAgents = subAgents.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.mobile.includes(q) ||
      s.location.toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSubAgents.length / itemsPerPage) || 1;
  const paginatedSubAgents = filteredSubAgents.slice(
    (currentPageNum - 1) * itemsPerPage,
    currentPageNum * itemsPerPage
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    showToast('info', 'Link Copied', 'Partner referral link copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeRefCode);
    setCopiedCode(true);
    showToast('info', 'Code Copied', `Referral code ${activeRefCode} copied to clipboard.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* Header */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 flex items-center justify-center">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Sub-Agent Partner Network
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Manage your regional sub-agent hierarchy and earn perpetual 0.5% liquidity volume overrides
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-950/50 active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New Sub-Agent</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Direct Sub-Agents"
          value={directCount}
          subtitle="Partners"
          icon={Users}
          iconBgColor="bg-[#00b0ff]/15 border-[#00b0ff]/30"
          iconColor="text-[#00b0ff]"
        />

        <StatCard
          title="Active Clearing Hubs"
          value={activeCount}
          subtitle="Operational"
          icon={CheckCircle2}
          iconBgColor="bg-[#00c853]/15 border-[#00c853]/30"
          iconColor="text-[#00c853]"
        />

        <StatCard
          title="Pending Verification"
          value={pendingCount}
          subtitle="In Review"
          icon={Clock}
          iconBgColor="bg-amber-500/15 border-amber-500/30"
          iconColor="text-amber-400"
        />

        <StatCard
          title="Network Clearing Volume"
          value={`$${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Gross Float Volume"
          icon={TrendingUp}
          iconBgColor="bg-purple-500/15 border-purple-500/30"
          iconColor="text-purple-400"
        />
      </div>

      {/* Referral Link & Code Box */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#00c853]" />
            <span>Your Partner Referral Link & Code</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1a294e] border border-[#233763] px-3 py-1.5 rounded-xl">
            <span className="text-[11px] text-slate-300 font-bold">Referral Code:</span>
            <span className="font-mono text-[#00c853] font-black text-xs">{activeRefCode}</span>
            <button
              onClick={handleCopyCode}
              className="ml-1 p-1 rounded-lg bg-[#00c853]/20 hover:bg-[#00c853]/30 text-[#00c853] transition-colors"
              title="Copy Code Only"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="w-full px-4 py-3 rounded-xl bg-[#1a294e] border border-[#233763] font-mono text-xs text-[#00c853] font-bold focus:outline-none"
            />
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs transition-all shadow-md shadow-emerald-950/50"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 shadow-card">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Sub-Agent name, mobile, location, code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder-slate-400 focus:outline-none focus:border-[#00c853]"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPageNum(1);
              }}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none"
            >
              <option value="all" className="bg-[#121e3d]">All Statuses ({subAgents.length})</option>
              <option value="active" className="bg-[#121e3d]">Active Hubs ({activeCount})</option>
              <option value="pending" className="bg-[#121e3d]">Pending Verification ({pendingCount})</option>
              <option value="suspended" className="bg-[#121e3d]">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sub-Agents Directory Table */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-4 sm:p-6 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-[#233763]">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00c853]" />
              <span>Sub-Agent Network Partners ({filteredSubAgents.length})</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Registered tier 2 agents operating under your liquidity desk in Supabase
            </p>
          </div>
        </div>

        {filteredSubAgents.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Network className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#00b0ff]" />
            <p className="text-sm font-bold text-white">No sub-agents match criteria</p>
            <p className="text-xs text-slate-300 mt-1">Try resetting search term or filters</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#233763] text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3 min-w-[140px]">Agent Name / ID</th>
                    <th className="py-3 px-3 min-w-[130px]">Location / Region</th>
                    <th className="py-3 px-3 min-w-[110px]">Cleared Volume</th>
                    <th className="py-3 px-3 min-w-[120px]">0.5% Commission Yield</th>
                    <th className="py-3 px-3 min-w-[100px]">Status</th>
                    <th className="py-3 px-3 text-right min-w-[110px]">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233763]">
                  {paginatedSubAgents.map(ag => {
                    const overrideYield = ag.commissionEarned > 0 ? ag.commissionEarned : parseFloat((ag.totalVolume * 0.005).toFixed(2));
                    return (
                      <tr key={ag.id} className="hover:bg-[#1a294e] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-black text-white">{ag.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ag.id} • {ag.mobile}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          {ag.location}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-white font-mono">
                          ${ag.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-3 font-black text-[#00c853] font-mono">
                          +${overrideYield.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={ag.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                          {ag.joinedDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#233763] text-xs font-bold text-slate-300 text-center sm:text-left mt-2">
              <div>
                Showing {(currentPageNum - 1) * itemsPerPage + 1} to {Math.min(currentPageNum * itemsPerPage, filteredSubAgents.length)} of {filteredSubAgents.length} sub-agents
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPageNum === 1}
                  onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-[#1a294e] border border-[#233763] disabled:opacity-40 hover:bg-[#233763] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>Page {currentPageNum} of {totalPages}</span>
                <button
                  disabled={currentPageNum === totalPages}
                  onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-[#1a294e] border border-[#233763] disabled:opacity-40 hover:bg-[#233763] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <InviteAgentModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  );
};
