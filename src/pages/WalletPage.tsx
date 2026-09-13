import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  PlusCircle, 
  Send, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Building2,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge, TypeBadge } from '../components/common/StatusBadge';
import { AddFundsModal } from '../components/modals/AddFundsModal';
import { TransferModal } from '../components/modals/TransferModal';
import { ClaimCommissionModal } from '../components/modals/ClaimCommissionModal';
import { CurrencyExchangeModal } from '../components/modals/CurrencyExchangeModal';
import {
  getExchangeRates,
  usdToLocal,
  getPreferredCurrency,
  setPreferredCurrency,
  CurrencyRate
} from '../config/currencyRates';

export const WalletPage: React.FC = () => {
  const { 
    agent, 
    transactions, 
    setCurrentPage, 
    setSelectedTransaction, 
    setIsDetailOpen 
  } = useApp();

  const rates = useMemo(() => getExchangeRates().filter(r => r.code !== 'USD'), []);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyRate>(
    () => rates.find(r => r.code === getPreferredCurrency()) ?? rates[0]
  );
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Convert USD balance to local currency for display
  const localBalance = usdToLocal(agent.balance, displayCurrency.code);
  const localPending = usdToLocal(agent.pendingBalance, displayCurrency.code);
  const localCommission = usdToLocal(agent.commissionBalance, displayCurrency.code);
  const localVolume = usdToLocal(agent.todayVolume, displayCurrency.code);

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Top Header Card */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Balance breakdown */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Agent Liquidity Vault (ID: {agent.id})</span>
            </div>
            
            {/* Main balance in local currency */}
            <div className="flex items-end gap-3 flex-wrap">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {displayCurrency.symbol}{localBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                <span className="text-base font-bold text-[#00c853] ml-1.5">{displayCurrency.code}</span>
              </div>
              <div className="text-sm font-bold text-slate-300 mb-1">
                ≈ ${agent.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </div>
            </div>

            {/* Currency switcher */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowCurrencyPicker(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a294e] border border-[#233763] text-xs font-bold text-white hover:border-[#00c853] transition-colors"
              >
                <span>{displayCurrency.flag}</span>
                <span>Display in {displayCurrency.code}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCurrencyPicker ? 'rotate-180' : ''}`} />
              </button>
              {showCurrencyPicker && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-[#121e3d] border border-[#233763] rounded-xl shadow-xl overflow-hidden w-48 text-white">
                  {rates.map(rate => (
                    <button
                      key={rate.code}
                      type="button"
                      onClick={() => {
                        setDisplayCurrency(rate);
                        setPreferredCurrency(rate.code);
                        setShowCurrencyPicker(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold transition-colors text-left ${
                        displayCurrency.code === rate.code
                          ? 'bg-[#00c853]/20 text-[#00c853]'
                          : 'hover:bg-[#1a294e] text-white'
                      }`}
                    >
                      <span className="text-base">{rate.flag}</span>
                      <div>
                        <div>{rate.code} ({rate.symbol})</div>
                        <div className="text-[10px] text-slate-300 font-normal">1 USD = {rate.ratePerUSD}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => setIsAddFundsOpen(true)}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#00c853] hover:bg-[#00e676] text-white px-3 sm:px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-950/50 active:scale-98 text-center"
            >
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Add Funds</span>
            </button>

            <button
              onClick={() => setIsExchangeOpen(true)}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#00b0ff] hover:bg-[#40c4ff] text-white px-3 sm:px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-98 text-center"
            >
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Swap & Rates</span>
            </button>

            <button
              onClick={() => setIsTransferOpen(true)}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#1a294e] hover:bg-[#233763] text-white px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs border border-[#233763] transition-all active:scale-98 text-center"
            >
              <Send className="w-4 h-4 text-[#00b0ff] flex-shrink-0" />
              <span className="truncate">Transfer</span>
            </button>

            <button
              onClick={() => setCurrentPage('withdrawals')}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#1a294e] hover:bg-[#233763] text-white px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs border border-[#233763] transition-all active:scale-98 text-center"
            >
              <ArrowUpRight className="w-4 h-4 text-[#00c853] flex-shrink-0" />
              <span className="truncate">Payout</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Pill Indicators — in local currency */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#233763]">
          <div className="p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] min-w-0">
            <div className="text-[11px] font-bold text-slate-300 uppercase truncate">Available Balance</div>
            <div className="text-base sm:text-lg font-black text-white mt-1 font-mono truncate">
              {displayCurrency.symbol}{localBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">≈ ${agent.balance.toFixed(2)} USD</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] min-w-0">
            <div className="text-[11px] font-bold text-slate-300 uppercase truncate">Pending Hold</div>
            <div className="text-base sm:text-lg font-black text-amber-400 mt-1 font-mono truncate">
              {displayCurrency.symbol}{localPending.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-amber-400 mt-0.5 font-semibold truncate">≈ ${agent.pendingBalance.toFixed(2)} USD</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <div className="text-[11px] font-bold text-slate-300 uppercase truncate">Commission</div>
              <button
                onClick={() => setIsClaimOpen(true)}
                className="text-[10px] bg-[#00c853] hover:bg-[#00e676] text-white font-black px-2 py-0.5 rounded-md transition-colors shadow-sm flex-shrink-0"
              >
                Claim
              </button>
            </div>
            <div className="text-base sm:text-lg font-black text-[#00c853] mt-1 font-mono truncate">
              +{displayCurrency.symbol}{localCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">≈ ${agent.commissionBalance.toFixed(2)} USD</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] min-w-0">
            <div className="text-[11px] font-bold text-slate-300 uppercase truncate">Today's Volume</div>
            <div className="text-base sm:text-lg font-black text-[#00b0ff] mt-1 font-mono truncate">
              {displayCurrency.symbol}{localVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">≈ ${agent.todayVolume.toFixed(2)} USD</div>
          </div>
        </div>
      </div>

      {/* Wallet Activity Ledger Timeline */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-4 sm:p-6 shadow-card text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#233763]">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#00c853]" />
              <span>Wallet Activity Timeline & Audit Ledger</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Immutable chronological record of credits, debits, adjustments, and float updates
            </p>
          </div>

          {/* Type filter tabs */}
          <div className="flex items-center bg-[#1a294e] border border-[#233763] p-1 rounded-xl text-xs font-bold overflow-x-auto max-w-full no-scrollbar">
            {['all', 'deposit', 'withdrawal', 'transfer', 'topup'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all whitespace-nowrap flex-shrink-0 ${
                  filterType === t
                    ? 'bg-[#00c853] text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Ledger' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold">
            No ledger records for this filter category yet.
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#233763] text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3 min-w-[140px]">Transaction / Ref</th>
                  <th className="py-3 px-3 min-w-[110px]">Activity Type</th>
                  <th className="py-3 px-3 min-w-[140px]">Counterparty / Customer</th>
                  <th className="py-3 px-3 min-w-[130px]">Method & Account</th>
                  <th className="py-3 px-3 min-w-[130px]">Date & Time</th>
                  <th className="py-3 px-3 min-w-[110px]">Gross Amount</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Ledger Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233763]">
                {filteredTransactions.map(tx => {
                  const isDebit = tx.type === 'withdrawal' || tx.type === 'transfer';
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => {
                        setSelectedTransaction(tx);
                        setIsDetailOpen(true);
                      }}
                      className="hover:bg-[#1a294e] cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-black text-white group-hover:text-[#00c853]">
                          {tx.id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{tx.reference}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <TypeBadge type={tx.type} />
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">
                        {tx.customerName}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        <div>{tx.paymentMethod}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tx.channelAccount || 'System Rail'}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono whitespace-nowrap">
                        {tx.createdAt}
                      </td>
                      <td className="py-3.5 px-3 font-black font-mono">
                        <span className={isDebit ? 'text-rose-400' : 'text-[#00c853]'}>
                          {isDebit ? '-' : '+'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <StatusBadge status={tx.status} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <ClaimCommissionModal isOpen={isClaimOpen} onClose={() => setIsClaimOpen(false)} />
      <CurrencyExchangeModal
        isOpen={isExchangeOpen}
        onClose={() => setIsExchangeOpen(false)}
        onRatesUpdated={() => {
          const freshRates = getExchangeRates().filter(r => r.code !== 'USD');
          const currentPref = getPreferredCurrency();
          const found = freshRates.find(r => r.code === currentPref);
          if (found) setDisplayCurrency(found);
        }}
      />
    </div>
  );
};
