import React, { useEffect, useState } from 'react';
import { Award, ArrowDownLeft, ArrowUpRight, Users, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase/client';

export const CommissionChart: React.FC = () => {
  const { transactions } = useApp();

  // Fetch commission rates from system_settings in Supabase
  const [depRate, setDepRate] = useState(0.015);     // 1.5% default
  const [wthRate, setWthRate] = useState(0.012);     // 1.2% default
  const [clearanceRate, setClearanceRate] = useState(0.005); // 0.5% default
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', ['deposit_commission_rate', 'withdrawal_commission_rate', 'clearance_fee_rate']);

        if (data) {
          data.forEach((row: { key: string; value: string }) => {
            const val = parseFloat(row.value) / 100;
            if (row.key === 'deposit_commission_rate') setDepRate(val);
            if (row.key === 'withdrawal_commission_rate') setWthRate(val);
            if (row.key === 'clearance_fee_rate') setClearanceRate(val);
          });
        }
      } catch (err) {
        console.error('Failed to load commission rates:', err);
      } finally {
        setLoadingRates(false);
      }
    };
    fetchRates();
  }, []);

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
            {loadingRates && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">
            Earnings by channel operation — rates from system settings
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
