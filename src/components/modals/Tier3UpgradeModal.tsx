import React from 'react';
import { X, Lock, Sparkles, ArrowRight, ShieldCheck, DollarSign, Users, Zap, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Tier3UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddFunds?: () => void;
}

export const Tier3UpgradeModal: React.FC<Tier3UpgradeModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenAddFunds 
}) => {
  const { agent, setCurrentPage } = useApp();

  if (!isOpen) return null;

  const hasRequiredBalance = agent.balance >= 1000;
  const isKycVerified = agent.kycStatus === 'verified';

  const handleGoToKyc = () => {
    onClose();
    setCurrentPage('kyc');
  };

  const handleGoToAddFunds = () => {
    onClose();
    if (onOpenAddFunds) {
      onOpenAddFunds();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#121e3d] border border-amber-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp text-white">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#233763] flex items-center justify-between bg-gradient-to-r from-[#0a1128] via-[#121e3d] to-[#0a1128]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">
                  Tier 3 (Master Agent) Required
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Exclusive
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                রেফারেল সুবিধা শুধুমাত্র মাস্টার এজেন্টদের জন্য সংরক্ষিত
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#1a294e] border border-[#233763] text-slate-400 hover:text-white hover:bg-[#233763] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Main message banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed">
            <p className="font-medium">
              পার্টনার রেফারেল লিংক তৈরি ও সাব-এজেন্ট নেটওয়ার্ক টিম গঠন সুবিধাটি কেবল <strong>Master Agent (Tier 3)</strong>-দের জন্য একটি বিশেষ প্রিভিলেজ। আপনি বর্তমানে <strong>{agent.kycLevel || 'Tier 1 / 2'}</strong>-এ আছেন।
            </p>
          </div>

          {/* Requirements Progress */}
          <div className="bg-[#0a1128] border border-[#233763] rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tier 3 (Master Agent) আনলক করার শর্তাবলী</span>
            </h4>

            {/* Requirement 1: Float Balance */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#121e3d] border border-[#233763]">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasRequiredBalance ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">ফ্লোট ব্যালেন্স $১,০০০+ USD</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    বর্তমান ব্যালেন্স: ${agent.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </div>
                </div>
              </div>
              {hasRequiredBalance ? (
                <span className="flex items-center gap-1 text-[11px] font-black text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Complete
                </span>
              ) : (
                <button
                  onClick={handleGoToAddFunds}
                  className="px-3 py-1.5 rounded-lg bg-[#00c853] hover:bg-[#00e676] text-white font-black text-[11px] shadow-sm transition-all"
                >
                  Add Funds
                </button>
              )}
            </div>

            {/* Requirement 2: KYC */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#121e3d] border border-[#233763]">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isKycVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">KYC ডকুমেন্ট ভেরিফিকেশন</div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    স্ট্যাটাস: {agent.kycStatus === 'verified' ? 'ভেরিফাইড' : agent.kycStatus === 'pending' ? 'রিভিউধীন' : 'অসম্পূর্ণ'}
                  </div>
                </div>
              </div>
              {isKycVerified ? (
                <span className="flex items-center gap-1 text-[11px] font-black text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </span>
              ) : (
                <button
                  onClick={handleGoToKyc}
                  className="px-3 py-1.5 rounded-lg bg-[#00b0ff] hover:bg-[#40c4ff] text-slate-950 font-black text-[11px] shadow-sm transition-all"
                >
                  Verify KYC
                </button>
              )}
            </div>
          </div>

          {/* Master Agent Perks */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Master Agent হলে আপনি যা যা পাবেন:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#1a294e]/60 border border-[#233763] flex items-start gap-2">
                <Users className="w-4 h-4 text-[#00b0ff] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">নিজস্ব রেফারেল লিংক</div>
                  <div className="text-[10px] text-slate-400">আনলিমিটেড সাব-এজেন্ট নেটওয়ার্ক</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#1a294e]/60 border border-[#233763] flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">০.৫% ওভাররাইড ইল্ড</div>
                  <div className="text-[10px] text-slate-400">টিমের প্রতিটি ট্রানজেকশনে কমিশন</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#1a294e]/60 border border-[#233763] flex items-start gap-2">
                <Zap className="w-4 h-4 text-[#00c853] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">আনলিমিটেড ভলিউম</div>
                  <div className="text-[10px] text-slate-400">কোনো দৈনিক লেনদেন ক্যাপ নেই</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#1a294e]/60 border border-[#233763] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">VIP প্রায়োরিটি</div>
                  <div className="text-[10px] text-slate-400">ইনস্ট্যান্ট লিকুইডিটি ট্রেজারি</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#233763] bg-[#0a1128] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-1/3 py-3 rounded-xl bg-[#1a294e] border border-[#233763] hover:bg-[#233763] text-slate-300 font-bold text-xs transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleGoToAddFunds}
            className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            <span>Deposit to Upgrade (Tier 3)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
