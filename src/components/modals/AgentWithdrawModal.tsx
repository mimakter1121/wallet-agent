import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Award,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Smartphone,
  Coins,
  DollarSign,
  Clock,
  Sparkles,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getExchangeRates,
  usdToLocal,
  getPreferredCurrency,
  formatCurrency
} from '../../config/currencyRates';

interface AgentWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSource?: 'float' | 'commission';
}

type PayoutCategory = 'crypto' | 'mobile' | 'bank';

interface PayoutRailOption {
  id: string;
  name: string;
  category: PayoutCategory;
  network?: string;
  feeEstimate: string;
  speed: string;
  placeholder: string;
  iconName: 'crypto' | 'mobile' | 'bank';
  requiresBankFields?: boolean;
}

const PAYOUT_RAILS: PayoutRailOption[] = [
  // Crypto rails
  {
    id: 'USDT (BEP20)',
    name: 'USDT (BEP20 / BSC)',
    category: 'crypto',
    network: 'BNB Smart Chain',
    feeEstimate: 'Free (~$0.00)',
    speed: 'Instant (2-5 min)',
    placeholder: 'Enter BSC BEP20 Wallet Address (0x...)',
    iconName: 'crypto'
  },
  {
    id: 'USDT (TRC20)',
    name: 'USDT (TRC20 / TRON)',
    category: 'crypto',
    network: 'TRON Network',
    feeEstimate: 'Free (~$0.00)',
    speed: 'Instant (3-5 min)',
    placeholder: 'Enter TRON TRC20 Address (starts with T...)',
    iconName: 'crypto'
  },
  {
    id: 'USDT (TON)',
    name: 'USDT (TON)',
    category: 'crypto',
    network: 'TON Network',
    feeEstimate: 'Free (~$0.00)',
    speed: 'Ultra Fast (1-3 min)',
    placeholder: 'Enter TON Wallet Address (UQ... or EQ...)',
    iconName: 'crypto'
  },
  // Mobile Banking rails
  {
    id: 'bKash Personal',
    name: 'bKash (Personal)',
    category: 'mobile',
    network: 'Bangladesh MFS',
    feeEstimate: 'Free (0% Payout)',
    speed: '5-15 min',
    placeholder: 'e.g. 01711223344',
    iconName: 'mobile'
  },
  {
    id: 'bKash Agent',
    name: 'bKash (Agent SIM)',
    category: 'mobile',
    network: 'Bangladesh MFS B2B',
    feeEstimate: 'Free (0% Payout)',
    speed: '5-15 min',
    placeholder: 'e.g. 01799887766',
    iconName: 'mobile'
  },
  {
    id: 'Nagad Personal',
    name: 'Nagad (Personal)',
    category: 'mobile',
    network: 'Bangladesh Post MFS',
    feeEstimate: 'Free (0% Payout)',
    speed: '5-15 min',
    placeholder: 'e.g. 01811223344',
    iconName: 'mobile'
  },
  {
    id: 'Rocket',
    name: 'DBBL Rocket',
    category: 'mobile',
    network: 'Dutch Bangla MFS',
    feeEstimate: 'Free (0% Payout)',
    speed: '10-20 min',
    placeholder: '12-digit Rocket Number with Check Digit',
    iconName: 'mobile'
  },
  // Bank rails
  {
    id: 'Bank Transfer (BD/Global)',
    name: 'Commercial Bank Wire',
    category: 'bank',
    network: 'BEFTN / RTGS / NPSB',
    feeEstimate: 'Free (0% Platform Fee)',
    speed: '15-45 min',
    placeholder: 'Bank Account Number',
    iconName: 'bank',
    requiresBankFields: true
  }
];

export const AgentWithdrawModal: React.FC<AgentWithdrawModalProps> = ({
  isOpen,
  onClose,
  initialSource = 'float'
}) => {
  const { agent, withdrawFunds, requestPinConfirmation, showToast } = useApp();

  const rates = useMemo(() => getExchangeRates(), []);
  const displayCurrency = useMemo(
    () => rates.find(r => r.code === getPreferredCurrency()) ?? rates.find(r => r.code === 'BDT') ?? rates[1],
    [rates]
  );

  const [source, setSource] = useState<'float' | 'commission'>(initialSource);
  const [activeCategory, setActiveCategory] = useState<PayoutCategory>('crypto');
  const [selectedRailId, setSelectedRailId] = useState<string>('USDT (BEP20)');
  const [usdAmount, setUsdAmount] = useState<string>('100');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [branchRouting, setBranchRouting] = useState<string>('');
  const [userNote, setUserNote] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSource(initialSource);
      const avail = initialSource === 'commission' ? agent.commissionBalance : agent.balance;
      if (avail > 0) {
        setUsdAmount(Math.min(100, Math.floor(avail)).toString() || '50');
      } else {
        setUsdAmount('0');
      }
    }
  }, [isOpen, initialSource, agent.balance, agent.commissionBalance]);

  if (!isOpen) return null;

  const currentAvailable = source === 'commission' ? agent.commissionBalance : agent.balance;
  const numUsd = parseFloat(usdAmount) || 0;
  const localEquivalent = usdToLocal(numUsd, displayCurrency?.code ?? 'BDT');
  const selectedRail = PAYOUT_RAILS.find(r => r.id === selectedRailId) || PAYOUT_RAILS[0];

  const filteredRails = PAYOUT_RAILS.filter(r => r.category === activeCategory);

  const isAmountValid = numUsd >= 10 && numUsd <= currentAvailable;
  const isAddressValid = destinationAddress.trim().length >= 5;
  const isBankValid = !selectedRail.requiresBankFields || (bankName.trim().length >= 2 && accountHolderName.trim().length >= 2);
  const canSubmit = isAmountValid && isAddressValid && isBankValid;

  const handleQuickAmount = (val: number) => {
    const capped = Math.min(val, currentAvailable);
    setUsdAmount(capped.toFixed(2));
  };

  const handleMaxAmount = () => {
    setUsdAmount(currentAvailable.toFixed(2));
  };

  const handleCategoryChange = (cat: PayoutCategory) => {
    setActiveCategory(cat);
    const firstInCat = PAYOUT_RAILS.find(r => r.category === cat);
    if (firstInCat) {
      setSelectedRailId(firstInCat.id);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      if (numUsd < 10) {
        showToast('error', 'Minimum Withdrawal', 'Minimum withdrawal threshold is $10.00 USD.');
        return;
      }
      if (numUsd > currentAvailable) {
        showToast('error', 'Insufficient Balance', `Available ${source === 'commission' ? 'commission' : 'float'} is $${currentAvailable.toFixed(2)}.`);
        return;
      }
      if (!isAddressValid) {
        showToast('error', 'Missing Destination', 'Please input a valid payout destination address or phone number.');
        return;
      }
      return;
    }

    const fullDestination = selectedRail.requiresBankFields
      ? `${bankName} | A/C: ${destinationAddress} | Branch: ${branchRouting || 'Main'} | Holder: ${accountHolderName}`
      : destinationAddress;

    const sourceLabel = source === 'commission' ? 'Earned Commission Yield' : 'Main Float Balance';

    requestPinConfirmation(
      `Authorize ${selectedRail.name} Withdrawal`,
      `Withdraw $${numUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD (${formatCurrency(localEquivalent, displayCurrency.code)}) from ${sourceLabel} to ${selectedRail.name}: ${destinationAddress}`,
      async () => {
        await withdrawFunds(
          numUsd,
          source,
          selectedRail.id,
          fullDestination,
          accountHolderName || agent.name
        );
        onClose();
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-white animate-slideUp my-6">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#233763] flex items-center justify-between bg-[#1a294e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">Agent Withdrawal / Settlement</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Instant Rail
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Cash out float or claim commission to your external wallet/bank
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#233763] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
          
          {/* 1. Source Selector (Float vs Commission) */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Step 1: Select Withdrawal Source</span>
              <span className="text-slate-400 font-normal">Choose which balance to withdraw from</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Float Balance Option */}
              <button
                type="button"
                onClick={() => setSource('float')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  source === 'float'
                    ? 'bg-[#1a294e] border-[#00c853] shadow-md shadow-emerald-950/30'
                    : 'bg-[#121e3d] border-[#233763] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-white">Main Float Balance</span>
                  </div>
                  {source === 'float' && (
                    <span className="w-2 h-2 rounded-full bg-[#00c853]" />
                  )}
                </div>
                <div className="mt-2.5">
                  <div className="text-lg font-black text-[#00c853] font-mono">
                    ${agent.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Operational liquidity float
                  </div>
                </div>
              </button>

              {/* Commission Balance Option */}
              <button
                type="button"
                onClick={() => setSource('commission')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  source === 'commission'
                    ? 'bg-[#1a294e] border-amber-400 shadow-md shadow-amber-950/30'
                    : 'bg-[#121e3d] border-[#233763] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-white">Commission Yield</span>
                  </div>
                  {source === 'commission' && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </div>
                <div className="mt-2.5">
                  <div className="text-lg font-black text-amber-400 font-mono">
                    +${agent.commissionBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Unclaimed profit & earnings
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Amount Input & Quick Chips */}
          <div className="p-4 rounded-2xl bg-[#1a294e] border border-[#233763] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Step 2: Enter Withdrawal Amount
              </label>
              <div className="text-[11px] font-mono text-slate-300">
                Available: <span className="font-bold text-white">${currentAvailable.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-black text-lg">
                $
              </div>
              <input
                type="number"
                min="10"
                step="any"
                max={currentAvailable}
                value={usdAmount}
                onChange={e => setUsdAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#121e3d] border border-[#233763] rounded-xl pl-9 pr-24 py-3 text-lg sm:text-xl font-mono font-black text-white focus:outline-none focus:border-[#00c853] transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                USD
              </div>
            </div>

            {/* Local Currency Dynamic Preview */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <span className="text-slate-400">
                Local Value ({displayCurrency.code}):
              </span>
              <span className="font-black text-emerald-400 font-mono">
                ≈ {formatCurrency(localEquivalent, displayCurrency.code)}
              </span>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Quick:</span>
              {[25, 50, 100, 250, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  disabled={val > currentAvailable}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    numUsd === val
                      ? 'bg-[#00c853] text-white'
                      : 'bg-[#121e3d] hover:bg-[#233763] text-slate-300 border border-[#233763] disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  ${val}
                </button>
              ))}
              <button
                type="button"
                onClick={handleMaxAmount}
                disabled={currentAvailable <= 0}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40 transition-colors ml-auto cursor-pointer disabled:opacity-40"
              >
                MAX (ALL)
              </button>
            </div>

            {/* Validation Message */}
            {numUsd > currentAvailable && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Amount exceeds available {source} balance by ${(numUsd - currentAvailable).toFixed(2)} USD.</span>
              </div>
            )}
            {numUsd > 0 && numUsd < 10 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                <Info className="w-4 h-4 shrink-0" />
                <span>Minimum withdrawal threshold is $10.00 USD.</span>
              </div>
            )}
          </div>

          {/* 3. Payout Channel Rail Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Step 3: Select Payout Rail
              </label>
              <div className="flex items-center gap-1 bg-[#1a294e] p-1 rounded-xl border border-[#233763]">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('crypto')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === 'crypto' ? 'bg-[#00c853] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Crypto (USDT)
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('mobile')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === 'mobile' ? 'bg-[#00c853] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mobile Banking
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('bank')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === 'bank' ? 'bg-[#00c853] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bank Wire
                </button>
              </div>
            </div>

            {/* Rail Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredRails.map(rail => {
                const isSelected = selectedRailId === rail.id;
                return (
                  <button
                    key={rail.id}
                    type="button"
                    onClick={() => setSelectedRailId(rail.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#1a294e] border-[#00c853] shadow-md ring-1 ring-[#00c853]'
                        : 'bg-[#121e3d] border-[#233763] hover:border-slate-500'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">{rail.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#00c853] shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {rail.network} • <span className="text-emerald-400 font-semibold">{rail.speed}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#121e3d] text-slate-300 font-mono border border-[#233763] shrink-0">
                      {rail.feeEstimate}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Destination Address & Info */}
          <div className="p-4 rounded-2xl bg-[#1a294e] border border-[#233763] space-y-3">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Step 4: Payout Destination Details
            </label>

            {/* Recipient Address / Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>
                  {activeCategory === 'crypto'
                    ? `${selectedRail.name} Recipient Address`
                    : activeCategory === 'mobile'
                    ? `${selectedRail.name} Account Number`
                    : 'Bank Account Number'}
                </span>
                <span className="text-[10px] text-rose-400 font-bold">*Required</span>
              </label>
              <input
                type="text"
                value={destinationAddress}
                onChange={e => setDestinationAddress(e.target.value)}
                placeholder={selectedRail.placeholder}
                className="w-full bg-[#121e3d] border border-[#233763] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-[#00c853] transition-colors"
              />
            </div>

            {/* Bank Additional Fields if Bank Wire */}
            {selectedRail.requiresBankFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. BRAC Bank / City Bank"
                    className="w-full bg-[#121e3d] border border-[#233763] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00c853]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={e => setAccountHolderName(e.target.value)}
                    placeholder="Account Name as per Bank"
                    className="w-full bg-[#121e3d] border border-[#233763] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00c853]"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300">Branch Name & Routing Number (Optional)</label>
                  <input
                    type="text"
                    value={branchRouting}
                    onChange={e => setBranchRouting(e.target.value)}
                    placeholder="e.g. Gulshan Branch, Routing: 060271234"
                    className="w-full bg-[#121e3d] border border-[#233763] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00c853]"
                  />
                </div>
              </div>
            )}

            {/* Account holder for mobile if desired */}
            {activeCategory === 'mobile' && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-slate-300">Account Name / Note (Optional)</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={e => setAccountHolderName(e.target.value)}
                  placeholder="e.g. Personal SIM / Agent Niyog"
                  className="w-full bg-[#121e3d] border border-[#233763] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00c853]"
                />
              </div>
            )}
          </div>

          {/* 5. Summary Card */}
          <div className="p-4 rounded-2xl bg-[#121e3d] border border-[#233763] space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Withdrawal Source</span>
              <span className="font-bold text-white capitalize">{source} Balance</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Payout Method</span>
              <span className="font-bold text-white">{selectedRail.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Settlement Fee</span>
              <span className="font-bold text-emerald-400">0.00 USD (Waived)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Estimated Execution SLA</span>
              <span className="font-semibold text-cyan-400">{selectedRail.speed}</span>
            </div>
            <div className="border-t border-[#233763] pt-2 flex items-center justify-between">
              <span className="font-bold text-slate-300">Net Payout to Receive</span>
              <span className="font-mono font-black text-sm text-[#00c853]">
                ${numUsd.toFixed(2)} USD ({formatCurrency(localEquivalent, displayCurrency.code)})
              </span>
            </div>
          </div>

          {/* Clearance Notice */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Withdrawals are reviewed and dispatched via the Master Admin Liquidity Desk. Once confirmed with your 4-digit Security PIN, funds are placed on temporary clearance hold until tx broadcast.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#233763] flex items-center justify-between gap-3 bg-[#1a294e]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#233763] hover:bg-[#233763] text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00c853] hover:from-emerald-400 hover:to-[#00e676] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Authorize Withdrawal (${numUsd.toFixed(2)})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
