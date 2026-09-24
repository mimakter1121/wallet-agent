import React, { useState } from 'react';
import { QrCode, Plus, Power, Trash2, ShieldCheck, Wallet, Check, Copy, AlertCircle, Building, Layers, Upload, RotateCcw } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { PaymentChannel } from '../types';
import { supabase } from '../lib/supabase';

export const ChannelsPage: React.FC = () => {
  const { channels, toggleChannelStatus, addChannel, deleteChannel, updateChannelQr, showToast } = useAdmin();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('TRC20');
  const [accountNumber, setAccountNumber] = useState('');
  const [minDepositUSD, setMinDepositUSD] = useState('10');
  const [estFee, setEstFee] = useState('~$0.10');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formQrUrl, setFormQrUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadingChannelId, setUploadingChannelId] = useState<string | null>(null);

  const uploadFileToStorage = async (file: File, prefix: string): Promise<string> => {
    try {
      const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
      const fileName = `${prefix}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: true, contentType: file.type || 'image/png' });
      if (!error && data?.path) {
        const { data: p } = supabase.storage.from('avatars').getPublicUrl(data.path);
        if (p?.publicUrl) return p.publicUrl;
      }
    } catch (_) {}

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFormQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFileToStorage(file, 'treasury_form_qr');
      setFormQrUrl(url);
      showToast('success', 'QR Uploaded', 'Custom QR Code attached to channel form.');
    } catch (err: any) {
      showToast('error', 'Upload Failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleListQrUpload = async (channelId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingChannelId(channelId);
    try {
      const url = await uploadFileToStorage(file, `treasury_${channelId}`);
      await updateChannelQr(channelId, url);
    } catch (err: any) {
      showToast('error', 'Upload Failed', err.message);
    } finally {
      setUploadingChannelId(null);
      e.target.value = '';
    }
  };

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
      estFee: estFee.trim() || 'Free',
      qr_code_url: formQrUrl || undefined
    });

    setShowForm(false);
    setName('');
    setAccountNumber('');
    setFormQrUrl('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fadeIn text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center font-bold shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Admin Treasury Deposit Addresses (Agent Float Channels)
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Configure Admin's receiving wallet addresses (USDT TRC20, BEP20, TON) & Bank Wire details where Agents send funds to top-up their balance.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Add Treasury Address'}</span>
        </button>
      </div>

      {/* Add New Treasury Channel Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
            <h3 className="text-sm font-bold text-white">Add New Admin Treasury Receiving Address</h3>
            <span className="text-xs font-bold text-[#00c853]">Agents will see this when adding float funds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Channel Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. USDT (TRC20 Network)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-semibold focus:outline-none focus:border-[#00c853]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Network Standard / Provider
              </label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
              >
                <option value="TRC20">USDT (TRC20 - Tron)</option>
                <option value="BEP20">USDT (BEP20 - BSC)</option>
                <option value="TON">USDT (TON Network)</option>
                <option value="ERC20">USDT (ERC20 - Ethereum)</option>
                <option value="Bank Wire">Admin Corporate Bank Wire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Min Agent Top-up (USD)
              </label>
              <input
                type="number"
                value={minDepositUSD}
                onChange={e => setMinDepositUSD(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Wallet Address / Bank Details <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="e.g. TXY9a8K7jLq1mP3nN5vR2sW4tU6vX8yZ1Q or Bank Swift Details"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-mono font-bold focus:outline-none focus:border-[#00c853]"
            />
          </div>

          {/* Custom QR Code Upload Section */}
          <div className="p-3.5 rounded-xl bg-[#1a294e] border border-[#233763] space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#00c853]" />
                <span>Custom QR Code Image (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Uploaded QR will be shown to Agents when adding float funds
              </span>
            </div>

            <div className="flex items-center gap-3">
              {formQrUrl ? (
                <div className="relative group w-16 h-16 bg-white p-1 rounded-xl border-2 border-[#00c853] shrink-0">
                  <img src={formQrUrl} alt="QR Preview" className="w-full h-full object-contain rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFormQrUrl('')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-xs shadow cursor-pointer"
                    title="Remove QR Image"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-[#121e3d] border border-dashed border-[#233763] rounded-xl flex flex-col items-center justify-center text-slate-500 shrink-0">
                  <QrCode className="w-6 h-6 opacity-40 text-slate-400" />
                  <span className="text-[9px] mt-0.5 opacity-60">Auto QR</span>
                </div>
              )}

              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] hover:border-[#00c853] text-xs font-bold text-slate-200 hover:text-white cursor-pointer transition-all shadow">
                  <Upload className="w-3.5 h-3.5 text-[#00c853]" />
                  <span>{isUploading ? 'Uploading...' : formQrUrl ? 'Change QR Image' : 'Upload QR Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFormQrUpload}
                    disabled={isUploading}
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">
                  PNG, JPG, WEBP. If empty, system auto-generates QR code from address.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-[#1a294e] border border-[#233763] text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white text-xs font-bold shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              Save Treasury Address
            </button>
          </div>
        </form>
      )}

      {/* Admin Treasury Addresses List */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#233763] flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">Admin Treasury Accounts for Agent Float</h3>
            <p className="text-xs text-slate-400">Configured accounts where agents send liquidity funds.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853]">
            {channels.filter(c => c.status === 'active').length} Active Channels
          </span>
        </div>

        <div className="space-y-3">
          {channels.map(ch => {
            const isActive = ch.status === 'active';
            return (
              <div
                key={ch.id}
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all ${
                  isActive ? 'bg-[#1a294e]/70 border-[#233763]' : 'bg-[#121e3d]/50 border-[#233763]/40 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#00c853]/20 text-[#00c853] flex items-center justify-center font-bold text-sm border border-[#00c853]/40 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{ch.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853]">
                        ADMIN TREASURY
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        isActive ? 'bg-[#00c853]/20 text-[#00c853] border-[#00c853]/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {ch.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs bg-[#121e3d] px-2 py-0.5 rounded-lg border border-[#233763]">
                        {ch.accountNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(ch.id, ch.accountNumber)}
                        className="text-slate-400 hover:text-[#00c853] text-xs font-bold p-1 cursor-pointer"
                        title="Copy address"
                      >
                        {copiedId === ch.id ? <Check className="w-3.5 h-3.5 text-[#00c853]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* QR Code Preview & Direct Upload/Reset in Admin List */}
                  <div className="flex items-center gap-2 shrink-0 bg-[#121e3d] p-1.5 rounded-xl border border-[#233763]">
                    <div className="w-11 h-11 bg-white p-1 rounded-lg border border-slate-300 shrink-0">
                      <img
                        src={ch.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(ch.accountNumber)}`}
                        alt="QR"
                        className="w-full h-full object-contain rounded"
                      />
                    </div>

                    <div className="flex flex-col gap-1 pr-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase leading-none ${
                        ch.qr_code_url ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {ch.qr_code_url ? 'Custom QR' : 'Auto QR'}
                      </span>

                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-[#00c853] hover:text-white bg-[#1a294e] hover:bg-[#00c853] px-2 py-1 rounded-md border border-[#00c853]/40 transition-all cursor-pointer inline-flex items-center gap-1">
                          <Upload className="w-2.5 h-2.5" />
                          <span>{uploadingChannelId === ch.id ? '...' : ch.qr_code_url ? 'Change' : 'Upload QR'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleListQrUpload(ch.id, e)}
                            disabled={uploadingChannelId === ch.id}
                          />
                        </label>

                        {ch.qr_code_url && (
                          <button
                            type="button"
                            onClick={() => updateChannelQr(ch.id, null)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 p-1 rounded bg-[#1a294e] border border-rose-500/30 hover:border-rose-500/60 cursor-pointer"
                            title="Reset to system auto QR"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#233763]">
                  <button
                    onClick={() => toggleChannelStatus(ch.id)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Power className={`w-3.5 h-3.5 ${isActive ? 'text-[#00c853]' : 'text-slate-400'}`} />
                    <span>{isActive ? 'Active' : 'Inactive'}</span>
                  </button>

                  <button
                    onClick={() => deleteChannel(ch.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Channel"
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
