import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Clock,
  Zap,
  ArrowLeft,
  QrCode,
  Globe,
  Layers,
  ArrowDownLeft,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import {
  getExchangeRates,
  usdToLocal,
  getPreferredCurrency,
  formatCurrency
} from '../../config/currencyRates';
import { supabase } from '../../lib/supabase/client';
import { collectionAccountService } from '../../services/collectionAccountService';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CollectionAccount {
  id: string;
  provider: string;           // e.g. bKash, Nagad, Rocket, Upay, USDT TRC20, Bank
  account_category: string;   // e.g. Agent Number, Personal, Merchant, Crypto
  account_number: string;     // Wallet address or Phone number
  account_name: string;       // Name / Note title
  status: string;             // active / inactive
  daily_limit?: number;
  notes?: string;
}

type Step = 'select_channel' | 'enter_amount' | 'payment_details';

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose }) => {
  const { addFunds, requestPinConfirmation } = useApp();

  const rates = useMemo(() => getExchangeRates(), []);
  const displayCurrency = useMemo(
    () => rates.find(r => r.code === getPreferredCurrency()) ?? rates.find(r => r.code === 'BDT') ?? rates[1],
    [rates]
  );

  const [accounts, setAccounts] = useState<CollectionAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
  const [step, setStep] = useState<Step>('select_channel');
  const [selectedAccount, setSelectedAccount] = useState<CollectionAccount | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>('500');
  const [txReference, setTxReference] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'crypto' | 'mobile' | 'bank'>('all');

  // Load Admin Set Collection Accounts from Supabase
  useEffect(() => {
    if (isOpen) {
      fetchAdminCollectionAccounts();
    }
  }, [isOpen]);

  const fetchAdminCollectionAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from('treasury_accounts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin treasury accounts:', error);
        const fallback = await collectionAccountService.fetchTreasuryAccounts();
        setAccounts(fallback);
      } else if (data && data.length > 0) {
        setAccounts(data);
      } else {
        const fallback = await collectionAccountService.fetchTreasuryAccounts();
        setAccounts(fallback);
      }
    } catch {
      const fallback = await collectionAccountService.fetchTreasuryAccounts();
      setAccounts(fallback);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  if (!isOpen) return null;

  const numUsd = parseFloat(usdAmount) || 0;
  const localEquivalent = usdToLocal(numUsd, displayCurrency?.code ?? 'BDT');
  const targetAddress = selectedAccount ? selectedAccount.account_number : '';

  const handleCopy = () => {
    if (targetAddress) {
      navigator.clipboard.writeText(targetAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep('select_channel');
    setSelectedAccount(null);
    setUsdAmount('500');
    setTxReference('');
    onClose();
  };

  const handleConfirmAddFunds = () => {
    if (!numUsd || numUsd <= 0 || !selectedAccount) return;

    requestPinConfirmation(
      'Authorize Liquidity Top-up',
      `Add $${numUsd.toLocaleString()} USD (${formatCurrency(localEquivalent, displayCurrency.code)}) via Admin Wallet (${selectedAccount.provider})`,
      () => {
        addFunds(numUsd, (selectedAccount.provider || 'USDT TRC20') as PaymentMethod, txReference || `REF-${Date.now()}`);
        handleClose();
      }
    );
  };

  const filteredAccounts = accounts.filter(acc => {
    if (activeCategory === 'all') return true;
    const providerLower = acc.provider.toLowerCase();
    const catLower = acc.account_category.toLowerCase();

    if (activeCategory === 'crypto') return providerLower.includes('usdt') || providerLower.includes('crypto') || catLower.includes('crypto');
    if (activeCategory === 'mobile') return providerLower.includes('bkash') || providerLower.includes('nagad') || providerLower.includes('rocket') || providerLower.includes('upay');
    if (activeCategory === 'bank') return providerLower.includes('bank') || providerLower.includes('wire');
    return true;
  });

  const getProviderBadge = (provider: string, category?: string) => {
    const p = (provider || '').toLowerCase();
    if (p.includes('trc20')) return 'USDT (TRC20)';
    if (p.includes('bep20')) return 'USDT (BEP20)';
    if (p.includes('ton')) return 'USDT (TON)';
    if (p.includes('usdt')) return 'USDT CRYPTO';
    if (p.includes('bkash')) return 'BKASH AGENT';
    if (p.includes('nagad')) return 'NAGAD PERSONAL';
    if (p.includes('rocket')) return 'ROCKET AGENT';
    if (p.includes('upay')) return 'UPAY AGENT';
    return (category || 'TREASURY ACCOUNT').toUpperCase();
  };

  const getProviderSymbol = (provider: string) => {
    const p = (provider || '').toLowerCase();
    if (p.includes('usdt') || p.includes('trc') || p.includes('bep')) return '₮';
    if (p.includes('bkash') || p.includes('nagad') || p.includes('rocket') || p.includes('upay')) return '৳';
    return '$';
  };

  const getAccountCategoryLabel = (provider: string, category?: string) => {
    const p = (provider || '').toLowerCase();
    const c = (category || '').toLowerCase();
    if (p.includes('usdt') || p.includes('crypto') || p.includes('trc') || p.includes('bep') || c.includes('crypto')) {
      return 'crypto';
    }
    return category || 'merchant';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp text-white">

        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-[#233763] flex items-center justify-between bg-[#0a1128]">
          <div className="flex items-center gap-3">
            {step !== 'select_channel' && (
              <button
                onClick={() => setStep(step === 'payment_details' ? 'enter_amount' : 'select_channel')}
                className="p-1.5 rounded-xl hover:bg-[#1a294e] text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Add Liquidity Funds</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40">
                  ADMIN WALLETS
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                {step === 'select_channel' && 'Select active collection wallet set by Master Admin'}
                {step === 'enter_amount' && `Configure USD deposit amount for ${selectedAccount?.provider}`}
                {step === 'payment_details' && 'Send funds to Admin\'s designated collection account'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a294e] transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* STEP 1: Select Admin Collection Wallet */}
        {step === 'select_channel' && (
          <div className="p-6 space-y-4">
            
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1a294e] border border-[#233763] rounded-2xl text-xs font-bold">
              {[
                { id: 'all', label: 'All Wallets' },
                { id: 'crypto', label: 'Crypto (USDT)' },
                { id: 'mobile', label: 'Mobile Banking' },
                { id: 'bank', label: 'Bank Wire' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    activeCategory === tab.id
                      ? 'bg-[#00c853] text-white shadow font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Channels List */}
            {isLoadingAccounts ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#00c853]" />
                <p className="text-xs font-bold">Loading Admin set wallet addresses...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-[#1a294e] rounded-2xl border border-[#233763] p-6">
                <Building2 className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
                <p className="text-xs font-bold text-white">No active collection accounts set by Admin</p>
                <p className="text-[11px] text-slate-400 mt-1">Contact Master Admin to configure bKash, Nagad, or Crypto wallets.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredAccounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account);
                      setStep('enter_amount');
                    }}
                    className="w-full p-4 rounded-2xl bg-[#1a294e] hover:bg-[#233763] border border-[#233763] hover:border-[#00c853]/60 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#121e3d] border border-[#233763] flex items-center justify-center font-black text-sm text-[#00c853] group-hover:scale-105 transition-transform">
                        {getProviderSymbol(account.provider)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white group-hover:text-[#00c853] transition-colors">
                            {account.provider}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 uppercase">
                            {getProviderBadge(account.provider, account.account_category)}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 font-mono font-bold mt-0.5 flex items-center gap-2">
                          <span className="text-white">{account.account_number}</span>
                          <span>•</span>
                          <span className="text-[#00b0ff] font-sans font-medium">{getAccountCategoryLabel(account.provider, account.account_category)}</span>
                        </div>

                        {account.notes && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {account.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Note */}
            <div className="p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] text-[11px] text-slate-300 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#00c853] shrink-0" />
              <span className="font-medium">
                Admin Verified Collection Pool: Transfer funds to Admin's active wallet number above to add float balance.
              </span>
            </div>

          </div>
        )}

        {/* STEP 2: Enter Amount */}
        {step === 'enter_amount' && selectedAccount && (
          <div className="p-6 space-y-5">
            
            {/* Selected channel info bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-[#00c853] font-mono">{getProviderSymbol(selectedAccount.provider)}</span>
                <div>
                  <div className="text-xs font-black text-white">
                    {selectedAccount.provider} ({getAccountCategoryLabel(selectedAccount.provider, selectedAccount.account_category)})
                  </div>
                  <div className="text-[11px] text-[#00b0ff] font-mono font-bold">{selectedAccount.account_number}</div>
                </div>
              </div>
              <button
                onClick={() => setStep('select_channel')}
                className="text-xs text-[#00c853] font-bold hover:underline"
              >
                Change
              </button>
            </div>

            {/* Amount input box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span>Enter USD Deposit Amount</span>
                <span>Min: $10.00 USD</span>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#00c853] font-black">
                  <DollarSign className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  min="10"
                  step="10"
                  required
                  autoFocus
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full pl-10 pr-16 py-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] text-white text-xl font-black font-mono focus:outline-none focus:border-[#00c853] transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#00c853] bg-[#00c853]/20 border border-[#00c853]/40 px-2 py-1 rounded-lg">
                  USD
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                {['50', '100', '250', '500', '1000', '2500'].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setUsdAmount(amt)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1a294e] hover:bg-[#233763] text-slate-200 hover:text-white border border-[#233763] transition-all active:scale-98"
                  >
                    +${parseInt(amt).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Exchange Conversion Card */}
            {numUsd > 0 && (
              <div className="p-4 bg-[#1a294e] rounded-2xl border border-[#233763] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span>Gross USD Top-up:</span>
                  <span className="font-black text-white font-mono">${numUsd.toLocaleString()} USD</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span>Exchange Rate (1 USD):</span>
                  <span className="font-bold text-white font-mono">
                    {formatCurrency(usdToLocal(1, displayCurrency.code), displayCurrency.code)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#233763] flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Credited Local Equivalent:</span>
                  <span className="text-base font-black text-[#00c853] font-mono">
                    {formatCurrency(localEquivalent, displayCurrency.code)} {displayCurrency.code}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (numUsd >= 10) {
                  setStep('payment_details');
                }
              }}
              disabled={numUsd < 10}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm transition-all shadow-lg shadow-emerald-950/50 active:scale-99"
            >
              <span>Continue to Admin Wallet Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: Admin Set Payment Details & Copy Address */}
        {step === 'payment_details' && selectedAccount && (
          <div className="p-6 space-y-5">
            
            {/* Amount Summary */}
            <div className="flex items-center justify-between p-4 bg-[#0a1128] rounded-2xl border border-[#233763]">
              <div>
                <div className="text-[11px] font-black text-slate-300 uppercase tracking-wider">Transfer Amount</div>
                <div className="text-lg font-black text-white font-mono">${numUsd.toLocaleString()} USD</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-black text-slate-300 uppercase tracking-wider">Local Equivalent</div>
                <div className="text-lg font-black text-[#00c853] font-mono">
                  {formatCurrency(localEquivalent, displayCurrency.code)}
                </div>
              </div>
            </div>

            {/* Designated Admin Address Card */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-white flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#00c853]" />
                  <span>Admin Set Wallet / Account ({selectedAccount.provider})</span>
                </label>
                <span className="text-[10px] font-black text-[#00c853] bg-[#00c853]/20 border border-[#00c853]/40 px-2 py-0.5 rounded-md">
                  ADMIN VERIFIED
                </span>
              </div>

              {/* QR Code display if crypto or phone */}
              <div className="w-36 h-36 mx-auto my-3 p-2.5 bg-white rounded-2xl border-2 border-[#00c853]/40 shadow-lg flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(targetAddress)}`}
                  alt="Clearance QR Code"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              {/* Address / Account Number Box */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3.5 bg-[#1a294e] rounded-2xl border border-[#233763]">
                  <div className="flex-1 font-mono text-sm font-black text-white break-all leading-relaxed select-all">
                    {targetAddress}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                      copied
                        ? 'bg-[#00c853] text-white shadow-md shadow-emerald-950/50'
                        : 'bg-[#121e3d] text-[#00c853] border border-[#00c853]/40 hover:bg-[#00c853] hover:text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {selectedAccount.notes && (
                  <div className="p-2.5 rounded-xl bg-[#121e3d] border border-[#233763] text-[11px] text-slate-300 font-medium">
                    <span className="font-bold text-amber-400">Instructions:</span> {selectedAccount.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Hash / Ref Input */}
            <div>
              <label className="block text-xs font-black text-white mb-1.5">
                Transaction Reference / Trx ID / Sender Mobile
              </label>
              <input
                type="text"
                required
                value={txReference}
                onChange={(e) => setTxReference(e.target.value)}
                placeholder="Enter Transaction ID (TrxID) or Reference number after sending..."
                className="w-full px-3.5 py-3 rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder-slate-400 text-xs font-mono font-bold focus:outline-none focus:border-[#00c853]"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setStep('enter_amount')}
                className="flex-1 py-3 rounded-2xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold hover:bg-[#233763] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmAddFunds}
                disabled={!txReference.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg shadow-emerald-950/50 transition-all active:scale-99"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Top-up</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
