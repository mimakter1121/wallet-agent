import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  RefreshCw,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  Settings,
  Zap,
  TrendingUp,
  Check,
  RotateCcw,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CurrencyRate,
  getExchangeRates,
  saveExchangeRates,
  getPreferredCurrency,
  setPreferredCurrency,
  usdToLocal,
  localToUsd,
  formatCurrency
} from '../../config/currencyRates';

interface CurrencyExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRatesUpdated?: () => void;
}

export const CurrencyExchangeModal: React.FC<CurrencyExchangeModalProps> = ({
  isOpen,
  onClose,
  onRatesUpdated
}) => {
  const { showToast, requestPinConfirmation } = useApp();

  const [activeTab, setActiveTab] = useState<'calculator' | 'admin_rates'>('calculator');
  const [rates, setRates] = useState<CurrencyRate[]>(() => getExchangeRates());

  // Calculator states
  const [fromCode, setFromCode] = useState<string>('USD');
  const [toCode, setToCode] = useState<string>(getPreferredCurrency() === 'USD' ? 'BDT' : getPreferredCurrency());
  const [inputAmount, setInputAmount] = useState<string>('100');

  // Admin Rate Editor states
  const [editableRates, setEditableRates] = useState<{ [code: string]: string }>(() => {
    const map: { [code: string]: string } = {};
    getExchangeRates().forEach(r => {
      map[r.code] = r.ratePerUSD.toString();
    });
    return map;
  });

  useEffect(() => {
    if (isOpen) {
      const fresh = getExchangeRates();
      setRates(fresh);
      const map: { [code: string]: string } = {};
      fresh.forEach(r => {
        map[r.code] = r.ratePerUSD.toString();
      });
      setEditableRates(map);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refreshRates = () => {
    const fresh = getExchangeRates();
    setRates(fresh);
    const map: { [code: string]: string } = {};
    fresh.forEach(r => {
      map[r.code] = r.ratePerUSD.toString();
    });
    setEditableRates(map);
    if (onRatesUpdated) onRatesUpdated();
  };

  const fromCurr = rates.find(r => r.code === fromCode) ?? rates[0];
  const toCurr = rates.find(r => r.code === toCode) ?? rates[1];

  const numInput = parseFloat(inputAmount) || 0;

  // Calculate Exchange Output
  const calculateOutput = (): number => {
    if (fromCode === toCode) return numInput;
    if (fromCode === 'USD') {
      return usdToLocal(numInput, toCode);
    } else if (toCode === 'USD') {
      return localToUsd(numInput, fromCode);
    } else {
      // Cross rate: Local 1 -> USD -> Local 2
      const usdVal = localToUsd(numInput, fromCode);
      return usdToLocal(usdVal, toCode);
    }
  };

  const outputAmount = calculateOutput();

  // Swap From and To
  const handleSwap = () => {
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
  };

  // Admin: Save Exchange Rates
  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    requestPinConfirmation(
      'Update System Exchange Rates',
      'Save new exchange rates for BDT, INR, PKR across all channels',
      () => {
        const updated = rates.map(r => {
          const val = parseFloat(editableRates[r.code]);
          return {
            ...r,
            ratePerUSD: !isNaN(val) && val > 0 ? val : r.ratePerUSD
          };
        });
        saveExchangeRates(updated);
        refreshRates();
        showToast('success', 'Exchange Rates Saved', 'System exchange rates have been updated successfully.');
      }
    );
  };

  // Reset to Default Rates
  const handleResetDefaults = () => {
    localStorage.removeItem('wa_exchange_rates');
    refreshRates();
    showToast('info', 'Rates Reset', 'Exchange rates reset to default values.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-white animate-slideUp">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#233763] flex items-center justify-between bg-[#1a294e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Currency Exchange System</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40">
                  LIVE RATES
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                Convert between USD, BDT (৳), INR (₹), and PKR (₨) with custom rate controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#233763] transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#233763] bg-[#1a294e] px-6 pt-2">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'calculator'
                ? 'border-[#00b0ff] text-[#00b0ff]'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Instant Calculator & Converter</span>
          </button>
          <button
            onClick={() => setActiveTab('admin_rates')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'admin_rates'
                ? 'border-[#00b0ff] text-[#00b0ff]'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Exchange Rate Settings (Admin)</span>
          </button>
        </div>

        {/* TAB 1: Instant Calculator */}
        {activeTab === 'calculator' && (
          <div className="p-6 space-y-5">
            
            {/* Live Exchange Rate Overview Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {rates.filter(r => r.code !== 'USD').map(r => (
                <div key={r.code} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-400 font-semibold">{r.flag} {r.code} Rate</div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                    1$ = {r.symbol}{r.ratePerUSD}
                  </div>
                </div>
              ))}
            </div>

            {/* From & To Exchange Box */}
            <div className="space-y-3">
              
              {/* FROM Currency Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>You Convert (From)</span>
                  <span>Balance Available</span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={fromCode}
                    onChange={e => setFromCode(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  >
                    {rates.map(r => (
                      <option key={r.code} value={r.code} className="bg-[#121e3d] text-white">
                        {r.flag} {r.code} ({r.symbol})
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={inputAmount}
                      onChange={e => setInputAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-right bg-transparent text-xl font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex items-center justify-center -my-2 relative z-10">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-2xl bg-[#00c853] hover:bg-[#00e676] text-white shadow-md shadow-emerald-950/50 flex items-center justify-center transition-transform hover:rotate-180 duration-300 active:scale-95"
                  title="Swap Currencies"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              {/* TO Currency Box */}
              <div className="p-4 rounded-2xl bg-[#1a294e] border border-[#233763] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#00c853]">
                  <span>You Receive (To Equivalent)</span>
                  <span className="text-[10px] bg-[#00c853]/20 px-2 py-0.5 rounded-md font-bold">
                    ESTIMATED RECEIPT
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={toCode}
                    onChange={e => setToCode(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  >
                    {rates.map(r => (
                      <option key={r.code} value={r.code} className="bg-[#121e3d] text-white">
                        {r.flag} {r.code} ({r.symbol})
                      </option>
                    ))}
                  </select>

                  <div className="flex-1 text-right text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(outputAmount, toCode)}
                  </div>
                </div>
              </div>

            </div>

            {/* Rate Details Footer */}
            <div className="p-3.5 bg-slate-50 dark:bg-navy-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Rate: 1 USD = {toCurr.symbol}{toCurr.ratePerUSD} {toCurr.code}</span>
              </div>
              <button
                onClick={() => {
                  setPreferredCurrency(toCode);
                  showToast('success', 'Preferred Currency Set', `Display currency updated to ${toCode}`);
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Set {toCode} as Default Display
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: Admin Rate Configuration Editor */}
        {activeTab === 'admin_rates' && (
          <form onSubmit={handleSaveRates} className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Admin Exchange Rate Control
                </h4>
                <p className="text-[11px] text-slate-500">
                  Set the conversion rate for 1 USD against BDT, INR, and PKR
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="space-y-3">
              {rates.filter(r => r.code !== 'USD').map(r => (
                <div key={r.code} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.flag}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {r.name} ({r.code})
                      </div>
                      <div className="text-[10px] text-slate-400">Symbol: {r.symbol}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">1 USD =</span>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        {r.symbol}
                      </span>
                      <input
                        type="number"
                        step="any"
                        required
                        value={editableRates[r.code] || ''}
                        onChange={e => setEditableRates({ ...editableRates, [r.code]: e.target.value })}
                        className="w-full pl-6 pr-3 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>Updating rates requires security PIN authorization and updates all live conversions.</span>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/20 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save New Rates</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
