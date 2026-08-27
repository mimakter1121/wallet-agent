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
  Building2
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

  const directCount = subAgents.length;
  const activeCount = subAgents.filter(s => s.status === 'active').length;
  const pendingCount = subAgents.filter(s => s.status === 'pending').length;
  const totalVolume = subAgents.reduce((acc, s) => acc + s.totalVolume, 0);

  const activeRefCode = agent.referralCode || (agent.id ? 'AGENT-' + agent.id.replace('AG-', '') : 'AGENT-PARTNER');
  const inviteLink = `${window.location.origin}/signup?ref=${activeRefCode}`;

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

      {/* Sub-Agents Directory Table */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-[#233763]">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00c853]" />
              <span>Sub-Agent Network Partners</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Registered tier 2 agents operating under your liquidity desk
            </p>
          </div>
        </div>

        {subAgents.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Network className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#00b0ff]" />
            <p className="text-sm font-bold text-white">No sub-agents in network yet</p>
            <p className="text-xs text-slate-300 mt-1">Invite partners using your referral link above</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#233763] text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Agent Name</th>
                  <th className="py-3 px-3">Location / Region</th>
                  <th className="py-3 px-3">Cleared Volume</th>
                  <th className="py-3 px-3">0.5% Commission Yield</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233763]">
                {subAgents.map(agent => {
                  const overrideYield = parseFloat((agent.totalVolume * 0.005).toFixed(2));
                  return (
                    <tr key={agent.id} className="hover:bg-[#1a294e] transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-black text-white">{agent.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{agent.mobile}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {agent.location}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white font-mono">
                        ${agent.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 font-black text-[#00c853] font-mono">
                        +${overrideYield.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={agent.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                        {agent.joinedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
