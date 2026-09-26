import React, { useState, useMemo } from 'react';
import { 
  Award, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck,
  Crown,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CommissionChart } from '../components/charts/CommissionChart';
import { StatCard } from '../components/common/StatCard';
import { TypeBadge } from '../components/common/StatusBadge';
import { ClaimCommissionModal } from '../components/modals/ClaimCommissionModal';

export const CommissionPage: React.FC = () => {
  const { agent, transactions, commissions, commissionRates, allTierRates, agentTierNum } = useApp();
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal' | 'referral'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const depRate = commissionRates.deposit;
  const wthRate = commissionRates.withdrawal;

  // Build normalized, unified commission ledger from both explicit commissions and approved transactions
  const commissionLedger = useMemo(() => {
    const map = new Map<string, {
      id: string;
      transactionId: string;
      type: 'deposit' | 'withdrawal' | 'referral';
      transactionAmount: number;
      commissionRate: number;
      commissionAmount: number;
      date: string;
      customerName: string;
      status: string;
    }>();

    // 1. Ingest explicit commission records from AppContext
    (commissions || []).forEach(c => {
      const rawType = (c.type || 'deposit').toLowerCase();
      let normalizedType: 'deposit' | 'withdrawal' | 'referral' = 'deposit';
      if (rawType.includes('with') || rawType.includes('payout')) normalizedType = 'withdrawal';
      else if (rawType.includes('ref') || rawType.includes('over')) normalizedType = 'referral';

      const tx = transactions.find(t => t.id === c.transactionId);
      const entryId = c.id || `COM-${c.transactionId}`;

      map.set(entryId, {
        id: entryId.startsWith('COM') || entryId.startsWith('CMM') ? entryId : `CMM-${entryId.substring(0, 8)}`,
        transactionId: c.transactionId || 'SYS-AUTO',
        type: normalizedType,
        transactionAmount: c.transactionAmount || 0,
        commissionRate: c.commissionRate || (normalizedType === 'deposit' ? depRate : (normalizedType === 'withdrawal' ? wthRate : allTierRates.clearance)),
        commissionAmount: c.commissionAmount || 0,
        date: c.date || new Date().toISOString().substring(0, 16),
        customerName: tx?.customerName || 'Client Settlement',
        status: c.status || 'credited'
      });
    });

    // 2. Ingest approved transactions from transactions list
    (transactions || [])
      .filter(t => {
        const s = (t.status || '').toLowerCase();
        const type = (t.type || '').toLowerCase();
        return (s === 'success' || s === 'approved' || s === 'completed') && (type.includes('dep') || type.includes('with'));
      })
      .forEach(t => {
        const type = (t.type || '').toLowerCase().includes('with') ? 'withdrawal' : 'deposit';
        const rate = type === 'deposit' ? depRate : wthRate;
        const commId = 'CMM-' + t.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
        
        // Avoid duplicate if already mapped via transactionId
        const isAlreadyAdded = Array.from(map.values()).some(v => v.transactionId === t.id);
        if (!isAlreadyAdded) {
          map.set(commId, {
            id: commId,
            transactionId: t.id,
            type,
            transactionAmount: t.amount,
            commissionRate: rate,
            commissionAmount: parseFloat((t.amount * rate).toFixed(2)),
            date: t.createdAt || new Date().toISOString().substring(0, 16),
            customerName: t.customerName || 'Client Cash Service',
            status: 'credited'
          });
        }
      });

    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [commissions, transactions, depRate, wthRate, allTierRates.clearance]);

  // Counts for filter pills
  const counts = useMemo(() => ({
    all: commissionLedger.length,
    deposit: commissionLedger.filter(c => c.type === 'deposit').length,
    withdrawal: commissionLedger.filter(c => c.type === 'withdrawal').length,
    referral: commissionLedger.filter(c => c.type === 'referral').length
  }), [commissionLedger]);

  // Filtered by type and search query
  const filteredLedger = useMemo(() => {
    return commissionLedger.filter(c => {
      const matchesType = filterType === 'all' || c.type === filterType;
      if (!matchesType) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.transactionId && c.transactionId.toLowerCase().includes(q)) ||
        (c.customerName && c.customerName.toLowerCase().includes(q))
      );
    });
  }, [commissionLedger, filterType, searchQuery]);

  const totalDepComm = commissionLedger.filter(c => c.type === 'deposit').reduce((acc, c) => acc + c.commissionAmount, 0);
  const totalWthComm = commissionLedger.filter(c => c.type === 'withdrawal').reduce((acc, c) => acc + c.commissionAmount, 0);

  const depRatePercentText = `${(depRate * 100).toFixed(1)}% per cash-in`;
  const wthRatePercentText = `${(wthRate * 100).toFixed(1)}% per cash-out`;

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex flex-wrap items-center gap-2">
              <span>Commission & Revenue Center</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase whitespace-nowrap shrink-0 inline-flex items-center">
                Tier {agentTierNum} Active
              </span>
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Real-time settlement revenue earned from customer transaction clearance
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsClaimOpen(true)}
          disabled={agent.commissionBalance <= 0}
          className="flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-950/50 active:scale-98"
        >
          <Sparkles className="w-4 h-4" />
          <span>Claim ${agent.commissionBalance.toFixed(2)} to Float</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Unclaimed Balance"
          value={`$${agent.commissionBalance.toFixed(2)}`}
          subtitle="Ready to claim"
          icon={TrendingUp}
          iconBgColor="bg-amber-500/15 border-amber-500/30"
          iconColor="text-amber-400"
        />

        <StatCard
          title="Deposit Commission"
          value={`+$${totalDepComm.toFixed(2)}`}
          subtitle={`${depRatePercentText} (Tier ${agentTierNum})`}
          icon={ArrowDownLeft}
          iconBgColor="bg-[#00c853]/15 border-[#00c853]/30"
          iconColor="text-[#00c853]"
        />

        <StatCard
          title="Withdrawal Commission"
          value={`+$${totalWthComm.toFixed(2)}`}
          subtitle={`${wthRatePercentText} (Tier ${agentTierNum})`}
          icon={ArrowUpRight}
          iconBgColor="bg-[#00b0ff]/15 border-[#00b0ff]/30"
          iconColor="text-[#00b0ff]"
        />

        <StatCard
          title="Active Tier Status"
          value={`Tier ${agentTierNum} • ${agentTierNum === 3 ? 'Master' : agentTierNum === 2 ? 'Business' : 'Basic'}`}
          subtitle={agentTierNum === 3 ? 'Max 6.0% + Referrals Active' : 'Upgrade for Higher Rates'}
          icon={agentTierNum === 3 ? Crown : ShieldCheck}
          iconBgColor={agentTierNum === 3 ? "bg-amber-500/15 border-amber-500/30" : "bg-purple-500/15 border-purple-500/30"}
          iconColor={agentTierNum === 3 ? "text-amber-400" : "text-purple-400"}
        />
      </div>

      {/* Tier Commission Matrix */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#233763]">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Platform Tier Commission Structure</span>
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Your current earning rates are determined dynamically by your account tier level
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Network Override: <strong className="text-amber-400 font-mono">+{(allTierRates.clearance * 100).toFixed(1)}%</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1 Card */}
          <div className={`p-4 rounded-2xl border transition-all relative ${
            agentTierNum === 1
              ? 'bg-gradient-to-b from-[#00c853]/15 to-[#121e3d] border-[#00c853] ring-1 ring-[#00c853]'
              : 'bg-[#1a294e]/50 border-[#233763] opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-700/60 text-slate-200 text-xs font-black flex items-center justify-center">1</span>
                <span className="font-bold text-white text-sm">Tier 1 • Basic</span>
              </div>
              {agentTierNum === 1 && (
                <span className="px-2 py-0.5 rounded-full bg-[#00c853] text-white text-[10px] font-black uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Current
                </span>
              )}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-300">Deposit Commission:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">{(allTierRates.tier1.deposit * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-300">Withdrawal Commission:</span>
                <span className="font-mono font-black text-sky-400 text-sm">{(allTierRates.tier1.withdrawal * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-300">Daily Volume Limit:</span>
                <span className="font-mono font-bold text-slate-300">$200 / day</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-slate-400">
                <span>Sub-Agent Referrals:</span>
                <span className="flex items-center gap-1 text-slate-500 font-bold text-[11px]"><Lock className="w-3 h-3" /> Locked</span>
              </div>
            </div>
          </div>

          {/* Tier 2 Card */}
          <div className={`p-4 rounded-2xl border transition-all relative ${
            agentTierNum === 2
              ? 'bg-gradient-to-b from-[#00c853]/15 to-[#121e3d] border-[#00c853] ring-1 ring-[#00c853]'
              : 'bg-[#1a294e]/50 border-[#233763] opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-black flex items-center justify-center">2</span>
                <span className="font-bold text-white text-sm">Tier 2 • Business</span>
              </div>
              {agentTierNum === 2 && (
                <span className="px-2 py-0.5 rounded-full bg-[#00c853] text-white text-[10px] font-black uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Current
                </span>
              )}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-300">Deposit Commission:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">{(allTierRates.tier2.deposit * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-300">Withdrawal Commission:</span>
                <span className="font-mono font-black text-sky-400 text-sm">{(allTierRates.tier2.withdrawal * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-300">Daily Volume Limit:</span>
                <span className="font-mono font-bold text-slate-300">$1,000 / day</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-slate-400">
                <span>Sub-Agent Referrals:</span>
                <span className="flex items-center gap-1 text-slate-500 font-bold text-[11px]"><Lock className="w-3 h-3" /> Locked</span>
              </div>
            </div>
          </div>

          {/* Tier 3 Card */}
          <div className={`p-4 rounded-2xl border transition-all relative ${
            agentTierNum === 3
              ? 'bg-gradient-to-b from-amber-500/20 via-[#121e3d] to-[#121e3d] border-amber-500/60 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/40'
              : 'bg-[#1a294e]/50 border-[#233763] opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-white text-sm">Tier 3 • Master Agent</span>
              </div>
              {agentTierNum === 3 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              )}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-300">Deposit Commission:</span>
                <span className="font-mono font-black text-amber-400 text-sm">{(allTierRates.tier3.deposit * 100).toFixed(1)}% (Max)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-300">Withdrawal Commission:</span>
                <span className="font-mono font-black text-sky-400 text-sm">{(allTierRates.tier3.withdrawal * 100).toFixed(1)}% (Max)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-300">Daily Volume Limit:</span>
                <span className="font-mono font-bold text-emerald-400">Unlimited Liquidity</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-slate-300">
                <span>Sub-Agent Network:</span>
                <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                  ✨ +{(allTierRates.clearance * 100).toFixed(1)}% Override
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Breakdown */}
      <CommissionChart />

      {/* Commission Settlement Ledger */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#233763]">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#00c853]" />
              <span>Commission Settlement Ledger</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/30">
                {filteredLedger.length} {filteredLedger.length === 1 ? 'Record' : 'Records'}
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Detailed log of commission percentages and earned yield per transaction
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, Tx, or Client..."
                className="w-full bg-[#1a294e] border border-[#233763] rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00c853] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-[#1a294e] border border-[#233763] p-1 rounded-xl text-xs font-bold gap-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  filterType === 'all'
                    ? 'bg-[#00c853] text-white shadow font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  filterType === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                }`}>
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => setFilterType('deposit')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  filterType === 'deposit'
                    ? 'bg-[#00c853] text-white shadow font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Cash-In</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  filterType === 'deposit' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                }`}>
                  {counts.deposit}
                </span>
              </button>

              <button
                onClick={() => setFilterType('withdrawal')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  filterType === 'withdrawal'
                    ? 'bg-[#00c853] text-white shadow font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Cash-Out</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  filterType === 'withdrawal' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                }`}>
                  {counts.withdrawal}
                </span>
              </button>

              {counts.referral > 0 && (
                <button
                  onClick={() => setFilterType('referral')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    filterType === 'referral'
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <span>Referrals</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    filterType === 'referral' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/10 text-amber-300'
                  }`}>
                    {counts.referral}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-30 text-amber-400" />
            <p className="text-sm font-bold text-white">No commission records found</p>
            <p className="text-xs text-slate-300 mt-1">
              {filterType !== 'all' || searchQuery
                ? 'No transactions matched the selected filter or search query.'
                : 'Approve customer deposit or payout orders to accrue commission revenue.'}
            </p>
            {(filterType !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#1a294e] border border-[#233763] text-xs font-bold text-[#00c853] hover:border-[#00c853] transition-colors inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#233763] text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Commission ID</th>
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Channel Type</th>
                  <th className="py-3 px-3">Gross Tx Amount</th>
                  <th className="py-3 px-3">Yield Rate</th>
                  <th className="py-3 px-3">Earned Yield</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233763]">
                {filteredLedger.map(comm => (
                  <tr key={comm.id} className="hover:bg-[#1a294e] transition-colors">
                    <td className="py-3.5 px-3 font-mono font-black text-white text-[10px]">
                      {comm.id}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-200">
                      {comm.customerName || '-'}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-400 text-[10px]">
                      {comm.transactionId}
                    </td>
                    <td className="py-3.5 px-3">
                      <TypeBadge type={comm.type} />
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white font-mono">
                      ${comm.transactionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#00c853]">
                      {(comm.commissionRate * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-3 font-mono font-black text-[#00c853]">
                      +${comm.commissionAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                      {comm.date}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/30 uppercase">
                        Credited
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CLAIM MODAL */}
      <ClaimCommissionModal
        isOpen={isClaimOpen}
        onClose={() => setIsClaimOpen(false)}
      />

    </div>
  );
};
