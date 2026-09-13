import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  ShieldCheck,
  Check,
  Power,
  Trash2,
  Building2,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Tag,
  Hash,
  Info,
  Lock,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import {
  CollectionAccount,
  CollectionProvider,
  AccountCategory,
  getCollectionAccounts,
  addCollectionAccount,
  toggleCollectionAccountStatus,
  deleteCollectionAccount
} from '../../config/collectionAccounts';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { collectionAccountService } from '../../services/collectionAccountService';
import { useApp } from '../../context/AppContext';
import {
  usdToLocal,
  formatCurrency
} from '../../config/currencyRates';

interface CollectionAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const MIN_REQUIRED_BDT = 3000;

export const CollectionAccountsModal: React.FC<CollectionAccountsModalProps> = ({
  isOpen,
  onClose,
  onUpdate
}) => {
  const { agent, showToast } = useApp();
  const [accounts, setAccounts] = useState<CollectionAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [provider, setProvider] = useState<CollectionProvider>('bKash');
  const [category, setCategory] = useState<AccountCategory>('personal');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [dailyLimit, setDailyLimit] = useState('100000');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const agentBalanceBDT = usdToLocal(agent.balance || 0, 'BDT');
  const hasSufficientBalance = agentBalanceBDT >= MIN_REQUIRED_BDT;

  const [isLoading, setIsLoading] = useState(false);

  const loadAccounts = () => {
    const agentCodeToUse = agent.id || (agent as any).agentCode || 'AG-55353';
    setIsLoading(true);
    collectionAccountService.fetchAllAccounts(agentCodeToUse, agent.dbId, agent.email).then(data => {
      setAccounts(data || []);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadAccounts();

      if (isSupabaseConfigured()) {
        const channel = supabase
          .channel('agent_modal_collection_accounts_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'collection_accounts' }, () => {
            loadAccounts();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [isOpen, agent.id, (agent as any).agentCode, agent.dbId, agent.email]);

  if (!isOpen) return null;

  const handleToggleStatus = async (acc: CollectionAccount) => {
    const isActivating = acc.status !== 'active';

    // STRICTLY BLOCK ACTIVATION IF AGENT BALANCE IS LESS THAN 3000 BDT
    if (isActivating && !hasSufficientBalance) {
      showToast(
        'error',
        'Activation Locked (< ৳3,000 BDT)',
        `Minimum ৳3,000 BDT float balance required to activate collection numbers. Your current balance is ${formatCurrency(agentBalanceBDT, 'BDT')}.`
      );
      return;
    }

    const newStatus: 'active' | 'inactive' = isActivating ? 'active' : 'inactive';
    await collectionAccountService.toggleStatus(acc.id, newStatus);
    setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, status: newStatus } : a));
    if (onUpdate) onUpdate();

    showToast(
      'info',
      isActivating ? 'Account Activated' : 'Account Disabled',
      `${acc.provider} number ${acc.accountNumber} is now ${isActivating ? 'ACTIVE' : 'DISABLED'}.`
    );
  };

  const handleDelete = async (id: string) => {
    await collectionAccountService.deleteAccount(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (onUpdate) onUpdate();
    showToast('info', 'Account Deleted', 'Collection account removed.');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const agentCodeToUse = agent.id || (agent as any).agentCode || 'AG-55353';

    if (!accountNumber.trim()) {
      setFormError('Please enter account number.');
      return;
    }

    // Default status: if agent has 3000+ BDT balance -> active, otherwise -> strictly inactive
    const defaultStatus = hasSufficientBalance ? 'active' : 'inactive';

    const saved = await collectionAccountService.saveAccount({
      agentCode: agentCodeToUse,
      provider,
      accountCategory: category,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim() || `${provider} ${category.toUpperCase()} Account`,
      status: defaultStatus,
      dailyLimit: parseFloat(dailyLimit) || 100000,
      notes: note.trim() || undefined
    });

    setAccounts(prev => [saved, ...prev.filter(a => a.id !== saved.id)]);
    setShowAddForm(false);
    setAccountNumber('');
    setAccountName('');
    setNote('');
    setFormError('');
    if (onUpdate) onUpdate();

    if (!hasSufficientBalance) {
      showToast(
        'warning',
        'Saved in Locked State 🔒',
        `Account saved as inactive. Maintain minimum ৳3,000 BDT float balance to activate collection numbers.`
      );
    } else {
      showToast('success', 'Account Added', `${provider} account configured and activated.`);
    }
  };

  const getProviderBadge = (p: CollectionProvider) => {
    switch (p) {
      case 'bKash':
        return 'bg-pink-500/20 text-pink-400 border border-pink-500/40';
      case 'Nagad':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/40';
      case 'Rocket':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/40';
      case 'Upay':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/40';
      default:
        return 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40';
    }
  };

  const getCategoryBadge = (c: AccountCategory) => {
    switch (c) {
      case 'agent':
        return 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40';
      case 'merchant':
        return 'bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40';
      default: // personal
        return 'bg-[#1a294e] text-slate-300 border border-[#233763]';
    }
  };

  const activeCount = hasSufficientBalance ? accounts.filter(a => a.status === 'active').length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-2xl my-auto shadow-2xl overflow-hidden animate-slideUp text-white">

        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-[#233763] flex items-center justify-between bg-[#0a1128]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-xs sm:text-sm font-black text-white">Payment Collection Accounts</h3>
                {hasSufficientBalance ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 shrink-0">
                    {activeCount} ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 shrink-0">
                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>LOCKED (&lt; ৳3,000)</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium truncate sm:whitespace-normal">
                Manage Agent / Personal / Merchant collection numbers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a294e] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-h-[85vh] overflow-y-auto">

          {/* BELOW 3,000 BDT BALANCE WARNING BANNER */}
          {!hasSufficientBalance && (
            <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 sm:gap-3 shadow-md">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 w-full min-w-0">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                  <span className="font-black text-amber-400 flex items-center gap-1 text-[11px] sm:text-xs uppercase tracking-wide">
                    🔒 Number Activation Locked
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40 self-start xs:self-auto">
                    Current: {formatCurrency(agentBalanceBDT, 'BDT')}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium leading-relaxed">
                  Wallet Agents must maintain a minimum floating liquidity balance of <strong>৳3,000 BDT</strong> ($27.27 USD) to activate collection numbers for receiving customer cash-in requests.
                </p>
              </div>
            </div>
          )}

          {/* Action Header bar */}
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              My Collection Numbers List
            </h4>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white text-xs font-black transition-all shadow-md shadow-emerald-950/50 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Cancel' : 'Add New Account'}</span>
            </button>
          </div>

          {/* Add Form Accordion */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="p-4 rounded-2xl bg-[#1a294e] border border-[#233763] space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-[#00c853] flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>Configure New Collection Number</span>
                </h5>
                {!hasSufficientBalance && (
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    <Lock className="w-3 h-3" />
                    <span>Will save as Locked</span>
                  </span>
                )}
              </div>

              {formError && (
                <div className="text-[11px] text-rose-400 font-bold bg-rose-500/10 p-2 rounded-xl border border-rose-500/30">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                <div>
                  <label className="block text-slate-300 mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  >
                    <option value="bKash">bKash Mobile Money</option>
                    <option value="Nagad">Nagad Digital Wallet</option>
                    <option value="Rocket">DBBL Rocket</option>
                    <option value="Upay">UCB Upay</option>
                    <option value="Bank Wire">Bank Wire Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Account Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  >
                    <option value="agent">Agent Cash Out (017... / 018...)</option>
                    <option value="personal">Personal Send Money</option>
                    <option value="merchant">Merchant Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Account Number / Mobile Number <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01712345678"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs font-mono font-bold focus:outline-none focus:border-[#00c853]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Account Holder Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Primary bKash Line"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 mb-1">Internal Reference Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Cash-In Agent Number"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121e3d] border border-[#233763] text-white text-xs focus:outline-none focus:border-[#00c853]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#121e3d] border border-[#233763] text-slate-300 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white text-xs font-black shadow-md shadow-emerald-950/50"
                >
                  Save Account
                </button>
              </div>
            </form>
          )}

          {/* List of Accounts */}
          <div className="space-y-2.5">
            {isLoading ? (
              <div className="p-8 text-center rounded-2xl bg-[#121e3d] border border-[#233763] text-slate-400 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#00c853] border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-bold">Loading collection accounts...</p>
              </div>
            ) : accounts.length === 0 && !showAddForm ? (
              <div className="p-8 text-center rounded-2xl bg-[#121e3d] border border-[#233763] text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1a294e] border border-[#233763] text-[#00c853] flex items-center justify-center mx-auto">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">No Collection Accounts Added</h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Click <strong>"+ Add New Account"</strong> above to configure your bKash, Nagad, Rocket, or Upay collection numbers.
                  </p>
                </div>
              </div>
            ) : null}

            {accounts.map(acc => {
              const isEligibleActive = acc.status === 'active' && hasSufficientBalance;
              const isActivationDisabled = !hasSufficientBalance;

              return (
                <div
                  key={acc.id}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isEligibleActive
                      ? 'bg-[#1a294e] border-[#233763]'
                      : 'bg-[#121e3d] border-[#233763] opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#121e3d] border border-[#233763] flex items-center justify-center shrink-0">
                      <Smartphone className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#00c853]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-mono font-black text-xs sm:text-sm text-white">{acc.accountNumber}</span>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black ${getProviderBadge(acc.provider)} shrink-0`}>
                          {acc.provider}
                        </span>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${getCategoryBadge(acc.accountCategory)} shrink-0`}>
                          {acc.accountCategory?.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium flex flex-wrap items-center gap-1.5 sm:gap-3">
                        {acc.accountName && <span className="truncate max-w-[160px] sm:max-w-none">Holder: {acc.accountName}</span>}
                        {acc.notes && <span className="truncate max-w-[160px] sm:max-w-none">• {acc.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#233763]/60 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(acc)}
                      disabled={isActivationDisabled}
                      title={isActivationDisabled ? 'Activation Locked: Minimum ৳3,000 BDT float balance required.' : ''}
                      className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isEligibleActive
                          ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 hover:bg-[#00c853]/30 cursor-pointer'
                          : isActivationDisabled
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-not-allowed'
                          : 'bg-[#121e3d] text-slate-400 border border-[#233763] hover:text-white cursor-pointer'
                      }`}
                    >
                      {isActivationDisabled ? (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isEligibleActive ? 'Active' : isActivationDisabled ? 'Locked (< ৳3,000)' : 'Disabled'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-[#121e3d] border border-transparent hover:border-rose-500/30 transition-colors shrink-0"
                      title="Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] text-[11px] text-slate-300 space-y-1">
            <span className="font-black text-[#00c853] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real-Time Payment Channel Dispatch:</span>
            </span>
            <p className="leading-relaxed font-medium">
              Active numbers automatically appear on the Customer Payment Gateway for deposit clearance. Floating liquidity balance is required to activate channels.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
