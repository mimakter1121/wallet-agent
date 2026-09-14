import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Volume2, 
  X, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundAlert } from '../../utils/audioAlert';

export const IncomingRequestAlertModal: React.FC = () => {
  const { 
    activeUrgentRequest, 
    dismissUrgentRequest, 
    setCurrentPage, 
    pendingDepositsCount, 
    pendingWithdrawalsCount 
  } = useApp();

  if (!activeUrgentRequest) return null;

  const isDeposit = activeUrgentRequest.type === 'deposit';

  const handleOpenAction = () => {
    dismissUrgentRequest();
    if (isDeposit) {
      setCurrentPage('deposits');
    } else {
      setCurrentPage('withdrawals');
    }
  };

  return (
    <div className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounceIn select-none">
      <div className={`relative overflow-hidden rounded-3xl border shadow-2xl p-4 sm:p-5 backdrop-blur-xl text-white transition-all ${
        isDeposit 
          ? 'bg-[#0e241b]/95 border-emerald-500/50 shadow-emerald-950/60 ring-2 ring-emerald-500/30' 
          : 'bg-[#0f1d38]/95 border-sky-500/50 shadow-sky-950/60 ring-2 ring-sky-500/30'
      }`}>
        
        {/* Glowing Ambient Gradient */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 ${
          isDeposit ? 'bg-emerald-400' : 'bg-sky-400'
        }`} />

        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full animate-ping ${isDeposit ? 'bg-emerald-400' : 'bg-sky-400'}`} />
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border flex items-center gap-1 shadow-sm ${
              isDeposit 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
            }`}>
              {isDeposit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              <span>{isDeposit ? 'NEW CASH-IN ORDER' : 'NEW CASH-OUT ORDER'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => soundAlert.playOrderChime()}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Replay Alert Sound"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={dismissUrgentRequest}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Dismiss Alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Amount & Customer Info */}
        <div className="mt-3 relative z-10 space-y-2">
          <div>
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
              {isDeposit ? 'Deposit Amount' : 'Payout Amount'}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                isDeposit ? 'text-emerald-400' : 'text-sky-400'
              }`}>
                ৳{activeUrgentRequest.amount.toLocaleString()} BDT
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white/10 text-white font-mono">
                {activeUrgentRequest.paymentMethod}
              </span>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Customer:</span>
              <span className="font-bold text-white">{activeUrgentRequest.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Phone Number:</span>
              <span className="font-mono font-bold text-slate-200">{activeUrgentRequest.customerPhone}</span>
            </div>
            {activeUrgentRequest.trxId && (
              <div className="flex justify-between items-center pt-0.5 border-t border-white/5">
                <span className="text-slate-400 font-medium">TrxID / Account:</span>
                <span className="font-mono font-bold text-amber-300 text-[11px]">{activeUrgentRequest.trxId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-1 flex items-center gap-2 relative z-10">
          <button
            onClick={handleOpenAction}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
              isDeposit 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-950/40 hover:brightness-110' 
                : 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-sky-950/40 hover:brightness-110'
            }`}
          >
            <span>{isDeposit ? '⚡ Review & Approve Cash-In' : '⚡ Review & Clear Cash-Out'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Queue Summary */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Action Required Immediately</span>
          </span>
          <span className="font-bold text-slate-300">
            Queue: {pendingDepositsCount} Dep • {pendingWithdrawalsCount} Wth
          </span>
        </div>

      </div>
    </div>
  );
};
