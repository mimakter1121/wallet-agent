import React, { useState } from 'react';
import { QrCode, Plus, Power, Trash2, ShieldCheck, Wallet, Check, Copy, AlertCircle, Building, Layers } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { PaymentChannel } from '../types';

export const ChannelsPage: React.FC = () => {
  const { channels, toggleChannelStatus, addChannel, deleteChannel, showToast } = useAdmin();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('TRC20');
  const [accountNumber, setAccountNumber] = useState('');
  const [minDepositUSD, setMinDepositUSD] = useState('10');
  const [estFee, setEstFee] = useState('~$0.10');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountNumber.trim()) return;

    addChannel({
      name: name.trim(),
      provider,
      category: 'crypto',
      accountCategory: 'merchant',
      accountNumber: accountNumber.trim(),
      badgeText: 'ADMIN TREASURY',
      status: 'active',
      minDepositUSD: parseFloat(minDepositUSD) || 10,
      estFee: estFee.trim() || 'Free'
    });

    setShowForm(false);
    setName('');
    setAccountNumber('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Admin Treasury Deposit Addresses (Agent Float Channels)
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Configure Admin's receiving wallet addresses (USDT TRC20, BEP20, TON) & Bank Wire details where Agents send funds to top-up their balance.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-900/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Add Treasury Address'}</span>
        </button>
      </div>

      {/* Add New Treasury Channel Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Admin Treasury Receiving Address</h3>
            <span className="text-xs font-bold text-emerald-600">Agents will see this when adding float funds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Channel Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. USDT (TRC20 Network)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Network Standard / Provider
              </label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="TRC20">USDT (TRC20 - Tron)</option>
                <option value="BEP20">USDT (BEP20 - BSC)</option>
                <option value="TON">USDT (TON Network)</option>
                <option value="ERC20">USDT (ERC20 - Ethereum)</option>
                <option value="Bank Wire">Admin Corporate Bank Wire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Agent Top-up (USD)
              </label>
              <input
                type="number"
                value={minDepositUSD}
                onChange={e => setMinDepositUSD(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Admin Wallet Address / Bank Details <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="e.g. TXY9a8K7jLq1mP3nN5vR2sW4tU6vX8yZ1Q or Bank Swift Details"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-900/20"
            >
              Save Treasury Address
            </button>
          </div>
        </form>
      )}

      {/* Admin Treasury Addresses List */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Admin Treasury Accounts for Agent Float Deposits</h3>
            <p className="text-xs text-slate-500">Agents send funds to these configured accounts when replenishing their float balance.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {channels.filter(c => c.status === 'active').length} Active Channels
          </span>
        </div>

        <div className="space-y-3">
          {channels.map(ch => {
            const isActive = ch.status === 'active';
            return (
              <div
                key={ch.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isActive ? 'bg-white dark:bg-navy-900 border-slate-200/80 dark:border-slate-800' : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-200/60 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{ch.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-300">
                        ADMIN TREASURY
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}>
                        {ch.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        {ch.accountNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(ch.id, ch.accountNumber)}
                        className="text-slate-400 hover:text-emerald-600 text-xs font-bold"
                        title="Copy address"
                      >
                        {copiedId === ch.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleChannelStatus(ch.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300'
                    }`}
                  >
                    <Power className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{isActive ? 'Active' : 'Inactive'}</span>
                  </button>

                  <button
                    onClick={() => deleteChannel(ch.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
