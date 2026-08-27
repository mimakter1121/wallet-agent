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
    <div className="p-6 space-y-6 animate-fadeIn">
      
      {/* Welcome Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] text-xs font-black">
            <Zap className="w-3.5 h-3.5" />
            <span>Wallet Agent Platform Master Command Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Financial Liquidity Overview
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-xl">
            Real-time management of exchange rates, bKash/Nagad/Rocket collection numbers, agent balances, and system clearance.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => onNavigate('exchange_rates')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs shadow-md shadow-emerald-950/50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Manage Exchange Rates</span>
          </button>
          <button
            onClick={() => onNavigate('channels')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a294e] hover:bg-[#233763] text-white font-bold text-xs border border-[#233763] transition-all"
          >
            <Building2 className="w-4 h-4 text-[#00c853]" />
            <span>Manage Collection Numbers</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-5 shadow-card text-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Volume Processed</span>
            <div className="w-8 h-8 rounded-xl bg-[#00c853]/20 text-[#00c853] flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${stats.totalVolumeUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#00c853] font-bold mt-1">
            ≈ ৳{(stats.totalVolumeUSD * (rates.find(r => r.code === 'BDT')?.ratePerUSD || 120)).toLocaleString()} BDT Total
          </div>
        </div>

        <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-5 shadow-card text-white">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Agents</span>
            <div className="w-8 h-8 rounded-xl bg-[#00b0ff]/20 text-[#00b0ff] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.totalAgents} Registered
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
            Master & Liquidity Agents
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Channels</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.activeChannelsCount} Active
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
            bKash, Nagad, Rocket, Upay, Crypto
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">System Commissions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ${stats.totalCommissionsUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
            Platform revenue generated
          </div>
        </div>

      </div>

      {/* Grid Section: Live Rates & Collection Numbers Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Live Rates Overview */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-500" />
                <span>Live System Exchange Rates</span>
              </h3>
              <p className="text-xs text-slate-500">1 USD conversion rates applied to agents</p>
            </div>
            <button
              onClick={() => onNavigate('exchange_rates')}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Edit Rates →
            </button>
          </div>

          <div className="space-y-2">
            {rates.filter(r => r.code !== 'USD').map(r => (
              <div key={r.code} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.flag}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{r.name}</div>
                    <div className="text-[10px] text-slate-400">Currency Code: {r.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    1$ = {r.symbol}{r.ratePerUSD}
                  </div>
                  <div className="text-[10px] text-slate-400">Last updated: {r.lastUpdated}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Collection Numbers Summary */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>Active Collection Numbers</span>
              </h3>
              <p className="text-xs text-slate-500">bKash, Nagad, Rocket, Upay agent/personal numbers</p>
            </div>
            <button
              onClick={() => onNavigate('channels')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Manage Numbers →
            </button>
          </div>

          <div className="space-y-2">
            {channels.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{c.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {c.accountCategory}
                    </span>
                  </div>
                  <div className="font-mono text-slate-500 mt-0.5">{c.accountNumber}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
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
