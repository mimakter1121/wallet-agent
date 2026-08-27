import React, { useState, useEffect } from 'react';
import { 
  Award, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CommissionChart } from '../components/charts/CommissionChart';
import { StatCard } from '../components/common/StatCard';
import { TypeBadge } from '../components/common/StatusBadge';
import { ClaimCommissionModal } from '../components/modals/ClaimCommissionModal';
import { supabase } from '../lib/supabase/client';

export const CommissionPage: React.FC = () => {
  const { agent, transactions } = useApp();
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Fetch live system settings commission rates
  const [depRate, setDepRate] = useState(0.015);
  const [wthRate, setWthRate] = useState(0.012);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', ['deposit_commission_rate', 'withdrawal_commission_rate']);

        if (data && data.length > 0) {
          data.forEach((row: { key: string; value: string }) => {
            const val = parseFloat(row.value) / 100;
            if (row.key === 'deposit_commission_rate' && !isNaN(val)) setDepRate(val);
            if (row.key === 'withdrawal_commission_rate' && !isNaN(val)) setWthRate(val);
          });
        }
      } catch (err) {
        console.error('Error fetching commission rates in CommissionPage:', err);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  }, []);

  // Build commission ledger from live approved transactions with dynamic rates
  const commissionLedger = transactions
    .filter(t => t.status === 'success' && (t.type === 'deposit' || t.type === 'withdrawal'))
    .map(t => {
      const rate = t.type === 'deposit' ? depRate : wthRate;
      return {
        id: 'CMM-' + t.id.substring(0, 8),
        transactionId: t.id,
        type: t.type as 'deposit' | 'withdrawal',
        transactionAmount: t.amount,
        commissionRate: rate,
        commissionAmount: parseFloat((t.amount * rate).toFixed(2)),
        date: t.createdAt || new Date().toISOString().substring(0, 16),
        customerName: t.customerName
      };
    });

  const filteredLedger = commissionLedger.filter(c => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  const totalDepComm = commissionLedger.filter(c => c.type === 'deposit').reduce((acc, c) => acc + c.commissionAmount, 0);
  const totalWthComm = commissionLedger.filter(c => c.type === 'withdrawal').reduce((acc, c) => acc + c.commissionAmount, 0);

  const depRatePercentText = (depRate * 100).toFixed(1) + '% per cash-in';
  const wthRatePercentText = (wthRate * 100).toFixed(1) + '% per cash-out';

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Commission & Revenue Center</span>
              {loadingRates && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />}
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
          subtitle={depRatePercentText}
          icon={ArrowDownLeft}
          iconBgColor="bg-[#00c853]/15 border-[#00c853]/30"
          iconColor="text-[#00c853]"
        />

        <StatCard
          title="Withdrawal Commission"
          value={`+$${totalWthComm.toFixed(2)}`}
          subtitle={wthRatePercentText}
          icon={ArrowUpRight}
          iconBgColor="bg-[#00b0ff]/15 border-[#00b0ff]/30"
          iconColor="text-[#00b0ff]"
        />

        <StatCard
          title="Clearance Tier"
          value={agent.kycLevel}
          subtitle="Commission Tier"
          icon={ShieldCheck}
          iconBgColor="bg-purple-500/15 border-purple-500/30"
          iconColor="text-purple-400"
        />
      </div>

      {/* Chart Breakdown */}
      <CommissionChart />

      {/* Commission Settlement Ledger */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#233763]">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#00c853]" />
              <span>Commission Settlement Ledger ({filteredLedger.length})</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Detailed log of commission percentages and earned yield per transaction
            </p>
          </div>

          <div className="flex items-center bg-[#1a294e] border border-[#233763] p-1 rounded-xl text-xs font-bold">
            {['all', 'deposit', 'withdrawal'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filterType === t
                    ? 'bg-[#00c853] text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Revenue' : t}
              </button>
            ))}
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-30 text-amber-400" />
            <p className="text-sm font-bold text-white">No commission records found</p>
            <p className="text-xs text-slate-300 mt-1">Approve customer deposit or payout orders to accrue commission revenue</p>
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
