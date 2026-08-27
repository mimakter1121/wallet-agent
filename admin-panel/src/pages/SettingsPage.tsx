import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Check, RefreshCw, Database, Percent, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    deposit_commission_rate: '1.5',
    withdrawal_commission_rate: '1.2',
    clearance_fee_rate: '0.5',
    min_deposit_amount: '10',
    max_deposit_amount: '10000',
    min_withdrawal_amount: '10',
    max_withdrawal_amount: '5000',
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
        { key: 'deposit_commission_rate', value: settings.deposit_commission_rate, label: 'Agent Deposit Commission (%)' },
        { key: 'withdrawal_commission_rate', value: settings.withdrawal_commission_rate, label: 'Agent Withdrawal Commission (%)' },
        { key: 'clearance_fee_rate', value: settings.clearance_fee_rate, label: 'Network Clearance Fee (%)' },
      ];

      for (const update of updates) {
        await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'key' });
      }

      setLastSaved(new Date().toLocaleTimeString());
      showToast('success', '✅ Settings Saved', `Commission rates updated in database. Deposit: ${settings.deposit_commission_rate}% | Withdrawal: ${settings.withdrawal_commission_rate}%`);
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
      <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                System Settings & Commission Controls
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure global commission rates and transaction limits — saved directly to database
              </p>
            </div>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved at {lastSaved}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Commission Rules Form */}
        <form onSubmit={handleSaveCommission} className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Percent className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform Commission Rates
            </h3>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>These rates apply to all agent transactions processed on the platform.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Agent Deposit Commission (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.deposit_commission_rate}
                onChange={e => handleChange('deposit_commission_rate', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Current: {settings.deposit_commission_rate}% per approved cash-in</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Agent Withdrawal Commission (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.withdrawal_commission_rate}
                onChange={e => handleChange('withdrawal_commission_rate', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Current: {settings.withdrawal_commission_rate}% per approved cash-out</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Network Clearance Fee (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.clearance_fee_rate}
                onChange={e => handleChange('clearance_fee_rate', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">%</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-emerald-900/20 transition-all"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{isSaving ? 'Saving to Database...' : 'Save Commission Rules'}</span>
          </button>
        </form>

        {/* Transaction Limits Form */}
        <form onSubmit={handleSaveLimits} className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Transaction Limit Controls
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Min Deposit ($)</label>
              <input
                type="number"
                min="1"
                value={settings.min_deposit_amount}
                onChange={e => handleChange('min_deposit_amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Max Deposit ($)</label>
              <input
                type="number"
                min="1"
                value={settings.max_deposit_amount}
                onChange={e => handleChange('max_deposit_amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Min Withdrawal ($)</label>
              <input
                type="number"
                min="1"
                value={settings.min_withdrawal_amount}
                onChange={e => handleChange('min_withdrawal_amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Max Withdrawal ($)</label>
              <input
                type="number"
                min="1"
                value={settings.max_withdrawal_amount}
                onChange={e => handleChange('max_withdrawal_amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-blue-900/20 transition-all"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{isSaving ? 'Saving to Database...' : 'Save Transaction Limits'}</span>
          </button>
        </form>

        {/* DB Status */}
        <div className="md:col-span-2 bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <Database className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Backend Connectivity</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-900 dark:text-white">Supabase Backend</span>
              </div>
              <div className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">xyoiwvzifgfwvvwdqjsf.supabase.co</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white mb-1">Database</div>
              <div className="text-slate-500">PostgreSQL 17.6 — Agent Niyog</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white mb-1">Settings Table</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-mono">public.system_settings</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
