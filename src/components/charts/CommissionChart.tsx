import React from 'react';
import { Award, ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CommissionChart: React.FC = () => {
  const { transactions, commissionRates, agentTierNum } = useApp();

  const depRate = commissionRates.deposit;
  const wthRate = commissionRates.withdrawal;
  const clearanceRate = commissionRates.clearance;


  // Compute commission amounts from live approved transactions
  const approvedTxs = transactions.filter(t => t.status === 'success');

  const depositComm = approvedTxs
    .filter(t => t.type === 'deposit')
    .reduce((acc, t) => acc + t.amount * depRate, 0);

  const withdrawalComm = approvedTxs
    .filter(t => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount * wthRate, 0);

  // Referral/Network commission from clearance rate on all approved txs
  const networkComm = approvedTxs
    .filter(t => t.type === 'deposit' || t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount * clearanceRate, 0);

  const total = depositComm + withdrawalComm + networkComm;

  const depositPercent  = total > 0 ? Math.round((depositComm / total) * 100)    : 0;
  const withdrawalPercent = total > 0 ? Math.round((withdrawalComm / total) * 100) : 0;
  const networkPercent  = total > 0 ? Math.round((networkComm / total) * 100)    : 0;

  return (
    <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-5 shadow-card text-white">
      <div className="flex items-center justify-between pb-4 border-b border-[#233763]">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00c853]" />
            <span>Commission Breakdown</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Tier {agentTierNum}
            </span>
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">
            Earnings by channel operation — synced in real-time from Supabase
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Yield</span>
          <div className="text-base font-black text-[#00c853] font-mono">
            +${total.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="my-5">
        <div className="h-3 w-full rounded-full bg-[#1a294e] border border-[#233763] overflow-hidden flex">
          <div 
            style={{ width: `${depositPercent}%` }} 
            className="h-full bg-[#00c853] transition-all duration-500"
          />
          <div 
            style={{ width: `${withdrawalPercent}%` }} 
            className="h-full bg-[#00b0ff] transition-all duration-500"
          />
          <div 
            style={{ width: `${networkPercent}%` }} 
            className="h-full bg-amber-400 transition-all duration-500"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold mt-2 px-1">
          <span>Deposit ({(depRate * 100).toFixed(1)}%)</span>
          <span>Withdrawal ({(wthRate * 100).toFixed(1)}%)</span>
          <span>Network ({(clearanceRate * 100).toFixed(1)}%)</span>
        </div>
      </div>

      {/* Breakdown Items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-[#1a294e] border border-[#233763]">
          <div className="flex items-center gap-1.5 text-xs text-[#00c853] font-bold mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Deposit</span>
          </div>
          <div className="text-sm font-black text-white font-mono">
            ${depositComm.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            {depositPercent}% of revenue · {(depRate * 100).toFixed(1)}% rate
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#1a294e] border border-[#233763]">
          <div className="flex items-center gap-1.5 text-xs text-[#00b0ff] font-bold mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Payout</span>
          </div>
          <div className="text-sm font-black text-white font-mono">
            ${withdrawalComm.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            {withdrawalPercent}% of revenue · {(wthRate * 100).toFixed(1)}% rate
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#1a294e] border border-[#233763]">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Network</span>
          </div>
          <div className="text-sm font-black text-white font-mono">
            ${networkComm.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            {networkPercent}% of revenue · {(clearanceRate * 100).toFixed(1)}% rate
          </div>
        </div>
      </div>
    </div>
  );
};
