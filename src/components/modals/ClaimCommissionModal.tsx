import React, { useState } from 'react';
import { X, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ClaimCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimCommissionModal: React.FC<ClaimCommissionModalProps> = ({ isOpen, onClose }) => {
  const { agent, claimCommission, showToast } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClaim = () => {
    if (agent.commissionBalance <= 0) {
      showToast('error', 'Zero Unclaimed Yield', 'No commission revenue available to claim.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const claimedAmount = agent.commissionBalance;
      claimCommission(claimedAmount);
      showToast('success', 'Commission Swept', `$${claimedAmount.toFixed(2)} added to available float balance.`);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#233763] flex items-center justify-between bg-[#1a294e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Claim Commission Revenue</h3>
              <p className="text-[11px] text-slate-300 font-medium">Sweep earned yield into main float</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#233763] transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-[#1a294e] border border-[#233763] text-center space-y-1">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Unclaimed Commission Balance
            </div>
            <div className="text-3xl font-black text-[#00c853] font-mono">
              +${agent.commissionBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">
              Ready for instant auto-sweep
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a294e] border border-[#233763]">
              <span className="font-semibold text-slate-400">Current Available Float</span>
              <span className="font-mono font-bold text-white">${agent.balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a294e] border border-[#233763]">
              <span className="font-semibold text-slate-400">New Float After Claim</span>
              <span className="font-mono font-bold text-[#00c853]">${(agent.balance + agent.commissionBalance).toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#1a294e] border border-[#233763] text-[11px] text-slate-300 flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#00c853] shrink-0" />
            <span>Commission yield is non-reversible once swept into cashier float.</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#233763] bg-[#1a294e] text-slate-200 hover:text-white font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClaim}
              disabled={isSubmitting || agent.commissionBalance <= 0}
              className="flex-1 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-white font-black text-xs transition-all shadow-md shadow-emerald-950/50"
            >
              {isSubmitting ? 'Sweeping Yield...' : 'Claim & Sweep Yield'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
