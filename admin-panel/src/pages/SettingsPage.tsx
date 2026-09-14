import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Check, RefreshCw, Database, Percent, DollarSign, AlertCircle, CheckCircle2, Send, ExternalLink } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

interface SystemSetting {
  key: string;
  value: string;
  label: string;
}

export const SettingsPage: React.FC = () => {
  const { showToast } = useAdmin();

  const [settings, setSettings] = useState<Record<string, string>>({
    tier1_deposit_rate: '4.0',
    tier1_withdrawal_rate: '2.5',
    tier2_deposit_rate: '5.0',
    tier2_withdrawal_rate: '3.0',
    tier3_deposit_rate: '6.0',
    tier3_withdrawal_rate: '3.5',
    deposit_commission_rate: '6.0',
    withdrawal_commission_rate: '3.5',
    clearance_fee_rate: '0.5',
    min_deposit_amount: '10',
    max_deposit_amount: '10000',
    min_withdrawal_amount: '10',
    max_withdrawal_amount: '5000',
    telegram_username: '@baji999_agent_support',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load settings from Supabase on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value, label');

      if (error) {
        showToast('error', 'Load Failed', 'Could not load system settings from database.');
        return;
      }

      if (data && data.length > 0) {
        const map: Record<string, string> = {};
        data.forEach((row: SystemSetting) => {
          map[row.key] = row.value;
        });
        setSettings(prev => ({ ...prev, ...map }));
      }
    } catch (err) {
      console.error('Settings load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates = [
        { key: 'tier1_deposit_rate', value: settings.tier1_deposit_rate || '4.0', label: 'Tier 1 Deposit Commission (%)' },
        { key: 'tier1_withdrawal_rate', value: settings.tier1_withdrawal_rate || '2.5', label: 'Tier 1 Withdrawal Commission (%)' },
        { key: 'tier2_deposit_rate', value: settings.tier2_deposit_rate || '5.0', label: 'Tier 2 Deposit Commission (%)' },
        { key: 'tier2_withdrawal_rate', value: settings.tier2_withdrawal_rate || '3.0', label: 'Tier 2 Withdrawal Commission (%)' },
        { key: 'tier3_deposit_rate', value: settings.tier3_deposit_rate || '6.0', label: 'Tier 3 Deposit Commission (%)' },
        { key: 'tier3_withdrawal_rate', value: settings.tier3_withdrawal_rate || '3.5', label: 'Tier 3 Withdrawal Commission (%)' },
        { key: 'deposit_commission_rate', value: settings.tier3_deposit_rate || '6.0', label: 'Platform Master Deposit Commission (%)' },
        { key: 'withdrawal_commission_rate', value: settings.tier3_withdrawal_rate || '3.5', label: 'Platform Master Withdrawal Commission (%)' },
        { key: 'clearance_fee_rate', value: settings.clearance_fee_rate || '0.5', label: 'Network Clearance Fee (%)' },
      ];

      for (const update of updates) {
        await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'key' });
      }

      setLastSaved(new Date().toLocaleTimeString());
      showToast('success', '✅ Settings Saved', `Tier commission rates updated in database. T1: 4%/2.5% | T2: 5%/3% | T3: 6%/3.5%`);
    } catch (err) {
      showToast('error', 'Save Failed', 'Could not save commission settings to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates = [
        { key: 'min_deposit_amount', value: settings.min_deposit_amount, label: 'Minimum Deposit Amount ($)' },
        { key: 'max_deposit_amount', value: settings.max_deposit_amount, label: 'Maximum Deposit Amount ($)' },
        { key: 'min_withdrawal_amount', value: settings.min_withdrawal_amount, label: 'Minimum Withdrawal Amount ($)' },
        { key: 'max_withdrawal_amount', value: settings.max_withdrawal_amount, label: 'Maximum Withdrawal Amount ($)' },
      ];

      for (const update of updates) {
        await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'key' });
      }

      setLastSaved(new Date().toLocaleTimeString());
      showToast('success', '✅ Limits Saved', 'Transaction limit rules updated in database successfully.');
    } catch (err) {
      showToast('error', 'Save Failed', 'Could not save transaction limits to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let handle = (settings.telegram_username || '@baji999_agent_support').trim();
      if (!handle.startsWith('@') && !handle.startsWith('http')) {
        handle = '@' + handle;
      }
      await supabase
        .from('system_settings')
        .upsert({ key: 'telegram_username', value: handle, label: 'Live Telegram Support Channel Username' }, { onConflict: 'key' });

      setLastSaved(new Date().toLocaleTimeString());
      showToast('success', '✅ Telegram Support Saved', `Telegram handle updated to ${handle}. Agent Floating Button updated.`);
    } catch (err) {
      showToast('error', 'Save Failed', 'Could not save Telegram settings to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading settings from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                System Settings & Commission Controls
              </h2>
              <p className="text-xs text-slate-400">
                Configure global commission rates and transaction limits — saved directly to database
              </p>
            </div>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#00c853]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved at {lastSaved}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Commission Rules Form */}
        <form onSubmit={handleSaveCommission} className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#00c853]" />
              <h3 className="text-sm font-bold text-white">
                Platform Tier Commission Rates
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              3 Tiers Configured
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-900/20 border border-[#00c853]/40 text-xs text-[#00c853] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Tier commission rates are automatically applied when agents process deposit and withdrawal transactions.</span>
          </div>

          {/* Tier 1 Box */}
          <div className="p-4 rounded-2xl bg-[#1a294e]/70 border border-[#233763] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-slate-700 text-slate-200 text-[11px] flex items-center justify-center font-bold">1</span>
                Tier 1 (Basic)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Limit: $200/day</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Deposit Comm (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={settings.tier1_deposit_rate || '4.0'}
                    onChange={e => handleChange('tier1_deposit_rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Withdraw Comm (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={settings.tier1_withdrawal_rate || '2.5'}
                    onChange={e => handleChange('tier1_withdrawal_rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-sky-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tier 2 Box */}
          <div className="p-4 rounded-2xl bg-[#1a294e]/70 border border-[#233763] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] flex items-center justify-center font-bold">2</span>
                Tier 2 (Business)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Limit: $1,000/day</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Deposit Comm (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={settings.tier2_deposit_rate || '5.0'}
                    onChange={e => handleChange('tier2_deposit_rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Withdraw Comm (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={settings.tier2_withdrawal_rate || '3.0'}
                    onChange={e => handleChange('tier2_withdrawal_rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-sky-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tier 3 Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-[#1a294e]/70 border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] flex items-center justify-center font-bold">3</span>
                Tier 3 (Master Agent)
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-bold">Unlimited Liquidity</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Deposit Comm (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={settings.tier3_deposit_rate || '6.0'}
                    onChange={e => handleChange('tier3_deposit_rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-amber-500/40 text-amber-300 text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Withdraw Comm (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={settings.tier3_withdrawal_rate || '3.5'}
                    onChange={e => handleChange('tier3_withdrawal_rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-amber-500/40 text-amber-300 text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-sky-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network Clearance Override */}
          <div className="pt-2 border-t border-[#233763]">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Network Clearance Fee / Referral Override (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.clearance_fee_rate || '0.5'}
                onChange={e => handleChange('clearance_fee_rate', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-sm font-bold focus:outline-none focus:border-[#00c853]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Paid to Tier 3 Master Agents on their sub-agent clearing volume</p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-60 text-white text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{isSaving ? 'Saving to Database...' : 'Save Tier Commission Rules'}</span>
          </button>
        </form>

        {/* Transaction Limits Form */}
        <form onSubmit={handleSaveLimits} className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#233763]">
            <DollarSign className="w-4 h-4 text-[#00b0ff]" />
            <h3 className="text-sm font-bold text-white">
              Transaction Limit Controls
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Min Deposit ($)</label>
              <input
                type="number"
                min="1"
                value={settings.min_deposit_amount}
                onChange={e => handleChange('min_deposit_amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-sm font-bold focus:outline-none focus:border-[#00b0ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Deposit ($)</label>
              <input
                type="number"
                min="1"
                value={settings.max_deposit_amount}
                onChange={e => handleChange('max_deposit_amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-sm font-bold focus:outline-none focus:border-[#00b0ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Min Withdrawal ($)</label>
              <input
                type="number"
                min="1"
                value={settings.min_withdrawal_amount}
                onChange={e => handleChange('min_withdrawal_amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-sm font-bold focus:outline-none focus:border-[#00b0ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Withdrawal ($)</label>
              <input
                type="number"
                min="1"
                value={settings.max_withdrawal_amount}
                onChange={e => handleChange('max_withdrawal_amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-sm font-bold focus:outline-none focus:border-[#00b0ff]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#00b0ff] hover:bg-[#40c4ff] disabled:opacity-60 text-white text-sm font-bold shadow-md transition-all"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{isSaving ? 'Saving to Database...' : 'Save Transaction Limits'}</span>
          </button>
        </form>

        {/* Telegram Support Channel Form */}
        <form onSubmit={handleSaveTelegram} className="md:col-span-2 bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#233763]">
            <Send className="w-4 h-4 text-[#229ED9]" />
            <h3 className="text-sm font-bold text-white">
              Agent Portal Telegram Live Support Control
            </h3>
            <span className="ml-auto px-2.5 py-0.5 rounded-full bg-[#229ED9]/10 text-[#229ED9] border border-[#229ED9]/30 text-[10px] font-bold">
              Live Agent Floating Widget Link
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Telegram Support Handle / Channel Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. @baji999_agent_support or https://t.me/baji999_agent_support"
                  value={settings.telegram_username}
                  onChange={e => handleChange('telegram_username', e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-sm font-bold font-mono focus:outline-none focus:border-[#229ED9]"
                />
                <Send className="w-4 h-4 text-[#229ED9] absolute left-3 top-1/2 -translate-y-1/2 -rotate-45" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your Telegram username or full URL. All agent floating support buttons will automatically open this link.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#0088cc] disabled:opacity-60 text-white text-sm font-bold shadow-md transition-all"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isSaving ? 'Saving...' : 'Save Telegram Link'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* DB Status */}
        <div className="md:col-span-2 bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-2 pb-3 border-b border-[#233763] mb-4">
            <Database className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-white">Backend Connectivity</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#1a294e] rounded-xl border border-[#233763]">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
                <span className="font-bold text-white">Supabase Backend</span>
              </div>
              <div className="font-mono text-[#00c853] text-[11px]">xyoiwvzifgfwvvwdqjsf.supabase.co</div>
            </div>
            <div className="p-3 bg-[#1a294e] rounded-xl border border-[#233763]">
              <div className="font-bold text-white mb-1">Database</div>
              <div className="text-slate-400">PostgreSQL 17.6 — Agent Niyog</div>
            </div>
            <div className="p-3 bg-[#1a294e] rounded-xl border border-[#233763]">
              <div className="font-bold text-white mb-1">Settings Table</div>
              <div className="text-[#00c853] font-mono">public.system_settings</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
