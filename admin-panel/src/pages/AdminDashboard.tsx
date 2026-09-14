import React from 'react';
import {
  DollarSign,
  Users,
  Building2,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const AdminDashboard: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const { stats, rates, channels, agents } = useAdmin();

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fadeIn">
      
      {/* Welcome Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card text-white flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] text-[11px] sm:text-xs font-black">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Wallet Agent Master Command Center</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            Financial Liquidity Overview
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-xl">
            Real-time management of exchange rates, bKash/Nagad/Rocket collection numbers, agent balances, and system clearance.
          </p>
        </div>

        <div className="flex gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={() => onNavigate('exchange_rates')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Manage Rates</span>
          </button>
          <button
            onClick={() => onNavigate('channels')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#1a294e] hover:bg-[#233763] text-white font-bold text-xs border border-[#233763] transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#00c853]" />
            <span>Collection Numbers</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-card text-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Total Volume</span>
            <div className="w-8 h-8 rounded-xl bg-[#00c853]/20 text-[#00c853] flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ${stats.totalVolumeUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#00c853] font-bold mt-1">
            ≈ ৳{(stats.totalVolumeUSD * (rates.find(r => r.code === 'BDT')?.ratePerUSD || 120)).toLocaleString()} BDT Total
          </div>
        </div>

        <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-card text-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Active Agents</span>
            <div className="w-8 h-8 rounded-xl bg-[#00b0ff]/20 text-[#00b0ff] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {stats.totalAgents} Registered
          </div>
          <div className="text-[11px] text-[#00b0ff] font-semibold mt-1">
            Master & Liquidity Agents
          </div>
        </div>

        <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-card text-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Active Channels</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {stats.activeChannelsCount} Active
          </div>
          <div className="text-[11px] text-indigo-400 font-semibold mt-1 truncate">
            bKash, Nagad, Rocket, Upay, Crypto
          </div>
        </div>

        <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-card text-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Commissions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#00c853]">
            ${stats.totalCommissionsUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-400 font-semibold mt-1">
            Platform revenue generated
          </div>
        </div>

      </div>

      {/* Grid Section: Live Rates & Collection Numbers Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Live Rates Overview */}
        <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card space-y-4 text-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#00c853]" />
                <span>Live System Exchange Rates</span>
              </h3>
              <p className="text-xs text-slate-400">1 USD conversion rates applied to agents</p>
            </div>
            <button
              onClick={() => onNavigate('exchange_rates')}
              className="text-xs font-bold text-[#00c853] hover:underline cursor-pointer"
            >
              Edit Rates →
            </button>
          </div>

          <div className="space-y-2">
            {rates.filter(r => r.code !== 'USD').map(r => (
              <div key={r.code} className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#1a294e]/70 border border-[#233763]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.flag}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{r.name}</div>
                    <div className="text-[10px] text-slate-400">Currency Code: {r.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#00c853]">
                    1$ = {r.symbol}{r.ratePerUSD}
                  </div>
                  <div className="text-[10px] text-slate-400">Updated: {r.lastUpdated}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Collection Numbers Summary */}
        <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card space-y-4 text-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Active Collection Numbers</span>
              </h3>
              <p className="text-xs text-slate-400">bKash, Nagad, Rocket, Upay agent/personal numbers</p>
            </div>
            <button
              onClick={() => onNavigate('channels')}
              className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer"
            >
              Manage Numbers →
            </button>
          </div>

          <div className="space-y-2">
            {channels.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#1a294e]/70 border border-[#233763] text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{c.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853]">
                      {c.accountCategory}
                    </span>
                  </div>
                  <div className="font-mono text-slate-400 mt-0.5">{c.accountNumber}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  c.status === 'active' ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
