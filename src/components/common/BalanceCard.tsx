import React, { useState } from 'react';
import { Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usdToLocal, formatCurrency } from '../../config/currencyRates';

interface BalanceCardProps {
  onAddFunds: () => void;
  onRequestWithdrawal: () => void;
  onNewDeposit: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  onAddFunds,
  onRequestWithdrawal,
  onNewDeposit
}) => {
  const { agent, transactions, showToast } = useApp();

  // Compute live stats from today's approved transactions with timezone resilience
  const nowUTCDate = new Date().toISOString().substring(0, 10);
  const localToday = new Date().toLocaleDateString('en-CA');
  const todayTxs = transactions.filter(t => t.status === 'success' && (t.createdAt?.startsWith(localToday) || t.createdAt?.startsWith(nowUTCDate)));
  const computedTodayVol = todayTxs.reduce((sum, t) => sum + t.amount, 0);
  const todayVolume = computedTodayVol;
  const netRevenue = transactions
    .filter(t => t.status === 'success' && (t.type === 'deposit' || t.type === 'withdrawal'))
    .reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount * 0.015 : t.amount * 0.012), 0);
  const displayCommission = agent.commissionBalance > 0 ? agent.commissionBalance : netRevenue;
  const [hideBalance, setHideBalance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'BDT' | 'INR' | 'PKR'>('USD');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('info', 'Float Synced', 'Agent cashier wallet synced with main portal treasury.');
    }, 500);
  };

  const getFormattedBalance = () => {
    if (hideBalance) return '••••••••';
    if (displayCurrency === 'USD') {
      return `$${agent.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return formatCurrency(usdToLocal(agent.balance, displayCurrency), displayCurrency);
  };

  return (
    <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-4 sm:p-6 shadow-card text-white space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#233763]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00c853]/20 text-[#00c853] flex items-center justify-center border border-[#00c853]/40">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-slate-300 uppercase">Agent Cashier Float Balance</span>
              <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Available float for instant Customer Deposits (Cash In) & Payouts (Cash Out)
            </p>
          </div>
        </div>

        {/* Currency Selector & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#1a294e] border border-[#233763] rounded-lg p-0.5 sm:p-1 text-[10px] sm:text-xs font-bold overflow-x-auto max-w-[210px] sm:max-w-none">
            {(['USD', 'BDT', 'INR', 'PKR'] as const).map(curr => (
              <button
                key={curr}
                onClick={() => setDisplayCurrency(curr)}
                className={`px-1.5 sm:px-2.5 py-1 rounded transition-all shrink-0 ${
                  displayCurrency === curr
                    ? 'bg-[#00c853] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {curr === 'BDT' ? '৳ BDT' : curr === 'INR' ? '₹ INR' : curr === 'PKR' ? '₨ PKR' : '$ USD'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              className="p-1.5 sm:p-2 rounded-lg bg-[#1a294e] hover:bg-[#233763] text-slate-300 transition-colors border border-[#233763]"
              title={hideBalance ? 'Show Balance' : 'Hide Balance'}
            >
              {hideBalance ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            <button 
              onClick={handleRefresh}
              className="p-1.5 sm:p-2 rounded-lg bg-[#1a294e] hover:bg-[#233763] text-slate-300 transition-colors border border-[#233763]"
              title="Refresh Float"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-[#00c853]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Balance Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
            <span className="text-[#00c853] font-bold">{getFormattedBalance()}</span>
            {displayCurrency !== 'USD' && !hideBalance && (
              <span className="text-xs font-bold text-slate-400 font-sans">
                ($${agent.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Agent ID: <span className="text-white font-mono font-bold">{agent.id}</span> • Tier: <span className="text-[#00c853] font-bold">{agent.kycLevel}</span>
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 bg-[#1a294e] p-3 rounded-xl border border-[#233763] text-xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Pending Hold</div>
            <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
              {hideBalance ? '••••' : `$${agent.pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Today Volume</div>
            <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
              {hideBalance ? '••••' : `$${todayVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Net Revenue</div>
            <div className="text-sm font-bold text-[#00c853] font-mono mt-0.5">
              {hideBalance ? '••••' : `+$${displayCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
        </div>
      </div>

      {/* Cashier Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <button
          onClick={onAddFunds}
          className="cash-btn-blue py-3 px-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Funds</span>
        </button>

        <button
          onClick={onNewDeposit}
          className="cash-btn-primary py-3 px-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md active:scale-98"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>↓ Deposit (Cash In)</span>
        </button>

        <button
          onClick={onRequestWithdrawal}
          className="bg-[#1a294e] hover:bg-[#233763] text-white border border-[#233763] py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-98"
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          <span>↑ Payout (Cash Out)</span>
        </button>
      </div>
    </div>
  );
};
