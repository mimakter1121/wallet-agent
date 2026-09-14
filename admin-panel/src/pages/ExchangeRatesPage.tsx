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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fadeIn text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              System Exchange Rates Manager
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Configure 1 USD conversion rates for BDT (৳), INR (₹), and PKR (₨). Rates broadcast live across agent apps.
            </p>
          </div>
        </div>
      </div>

      {/* Exchange Rate Edit Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {rates.filter(r => r.code !== 'USD').map(r => (
          <form
            key={r.code}
            onSubmit={(e) => handleSave(r.code, e)}
            className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{r.flag}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40">
                  ACTIVE
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white">{r.name}</h3>
                <div className="text-xs text-slate-400 font-mono">ISO Code: {r.code}</div>
              </div>

              <div className="p-3 bg-[#1a294e]/80 rounded-xl border border-[#233763]">
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  1 USD Exchange Rate
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-300">$1 USD =</span>
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
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-base font-extrabold focus:outline-none focus:border-[#00c853]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white text-xs font-black shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save {r.code} Rate</span>
            </button>
          </form>
        ))}
      </div>

      <div className="p-4 bg-[#121e3d] rounded-2xl border border-[#233763] text-xs text-emerald-400 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 text-[#00c853]" />
        <span>Rate changes update instantly on agent balances, deposit calculations, and payout estimates without requiring page refresh.</span>
      </div>

    </div>
  );
};
