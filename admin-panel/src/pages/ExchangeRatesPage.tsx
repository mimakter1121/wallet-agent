import React, { useState } from 'react';
import { RefreshCw, Check, ShieldCheck, RotateCcw, Zap } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const ExchangeRatesPage: React.FC = () => {
  const { rates, updateRate, showToast } = useAdmin();

  const [inputRates, setInputRates] = useState<{ [code: string]: string }>(() => {
    const map: { [code: string]: string } = {};
    rates.forEach(r => {
      map[r.code] = r.ratePerUSD.toString();
    });
    return map;
  });

  const handleSave = (code: string, e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputRates[code]);
    if (isNaN(val) || val <= 0) {
      showToast('error', 'Invalid Rate', 'Please enter a valid positive number.');
      return;
    }
    updateRate(code, val);
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              System Exchange Rates Manager
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure 1 USD conversion rates for BDT (৳), INR (₹), and PKR (₨). Rates broadcast live across agent apps.
            </p>
          </div>
        </div>
      </div>

      {/* Exchange Rate Edit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rates.filter(r => r.code !== 'USD').map(r => (
          <form
            key={r.code}
            onSubmit={(e) => handleSave(r.code, e)}
            className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{r.flag}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                  ACTIVE
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{r.name}</h3>
                <div className="text-xs text-slate-400 font-mono">ISO Code: {r.code}</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  1 USD Exchange Rate
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400">$1 USD =</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                      {r.symbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={inputRates[r.code] || ''}
                      onChange={e => setInputRates({ ...inputRates, [r.code]: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-extrabold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/20 transition-all active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Save {r.code} Rate</span>
            </button>
          </form>
        ))}
      </div>

      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
        <span>Rate changes update instantly on agent balances, deposit calculations, and payout estimates without requiring page refresh.</span>
      </div>

    </div>
  );
};
