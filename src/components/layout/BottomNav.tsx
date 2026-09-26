import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  ReceiptText, 
  User, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight,
  Award,
  Network,
  ShieldCheck,
  X
} from 'lucide-react';
import { useApp, PageId } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { 
    currentPage, 
    setCurrentPage, 
    pendingDepositsCount, 
    pendingWithdrawalsCount, 
    pendingTotalCount,
    openAgentWithdrawModal
  } = useApp();
  const [showFabMenu, setShowFabMenu] = useState(false);

  const navItems = [
    { id: 'dashboard' as PageId, label: 'Home', icon: LayoutDashboard },
    { id: 'wallet' as PageId, label: 'Wallet', icon: Wallet },
    { id: 'customers' as PageId, label: 'Customers', icon: Users },
    { id: 'transactions' as PageId, label: 'Ledger', icon: ReceiptText },
    { id: 'profile' as PageId, label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Floating Action Menu Overlay on Mobile */}
      {showFabMenu && (
        <div 
          onClick={() => setShowFabMenu(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-end p-4 pb-24 animate-fadeIn select-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121e3d] border border-[#233763] rounded-3xl p-4 shadow-2xl space-y-2 animate-slideUp text-white"
          >
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Quick Operations & Services
              </span>
              <button
                onClick={() => setShowFabMenu(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Agent Withdrawal / Settlement Button */}
            <button
              onClick={() => {
                setShowFabMenu(false);
                openAgentWithdrawModal('float');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xs transition-all active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black flex-shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-black text-xs text-white">↑ Withdraw Funds</div>
                  <div className="text-[10px] text-amber-300">Cash out float or commission yield</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                Payout
              </span>
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                setCurrentPage('deposits');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] font-black text-xs transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#00c853] text-white flex items-center justify-center font-bold flex-shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-black text-xs text-white">Deposit Requests</div>
                  <div className="text-[10px] text-[#00c853]">Collect & credit customer funds</div>
                </div>
              </div>
              {pendingDepositsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse shadow">
                  {pendingDepositsCount} New
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                setCurrentPage('withdrawals');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#1a294e] border border-[#233763] text-white font-bold text-xs transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#00b0ff]/20 border border-[#00b0ff]/40 text-[#00b0ff] flex items-center justify-center font-bold flex-shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-white">Process Withdrawal</div>
                  <div className="text-[10px] text-slate-300">Disburse customer cashout request</div>
                </div>
              </div>
              {pendingWithdrawalsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse shadow">
                  {pendingWithdrawalsCount} New
                </span>
              )}
            </button>

            {/* Direct Mobile Links to Commission & Network */}
            <button
              onClick={() => {
                setShowFabMenu(false);
                setCurrentPage('commission');
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-[#1a294e] border border-[#233763] hover:border-amber-500/50 text-white font-bold text-xs transition-all active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-xs text-white flex items-center justify-between">
                  <span>Commission Center</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">Earn</span>
                </div>
                <div className="text-[10px] text-slate-300">Accrued yields, settlements & claim ledger</div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                setCurrentPage('network');
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-[#1a294e] border border-[#233763] hover:border-[#00b0ff]/50 text-white font-bold text-xs transition-all active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-[#00b0ff]/20 border border-[#00b0ff]/40 text-[#00b0ff] flex items-center justify-center font-bold flex-shrink-0">
                <Network className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-xs text-white flex items-center justify-between">
                  <span>Sub-Agent Network</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#00b0ff]/20 text-[#00b0ff]">Team</span>
                </div>
                <div className="text-[10px] text-slate-300">Partner hierarchy tree & sub-agent referrals</div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                setCurrentPage('kyc');
              }}
              className="w-full flex items-center gap-3 p-2 rounded-2xl bg-[#1a294e]/60 border border-[#233763] text-slate-300 font-bold text-xs transition-all active:scale-98"
            >
              <div className="w-7 h-7 rounded-xl bg-slate-700/50 text-slate-300 flex items-center justify-center font-bold flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-slate-200">KYC & Regulatory Verification</div>
                <div className="text-[10px] text-slate-400">Verification tiers & clearance limits</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121e3d]/95 backdrop-blur-lg border-t border-[#233763] px-2 py-1 select-none text-white">
        <div className="flex items-center justify-around relative">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#00c853] font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}

          {/* Center FAB Button for fast actions */}
          <div className="relative -top-5">
            <button
              onClick={() => setShowFabMenu(!showFabMenu)}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 relative ${
                showFabMenu
                  ? 'bg-[#1a294e] text-white rotate-45 border border-[#233763]'
                  : 'bg-[#00c853] text-white shadow-emerald-950/50 ring-4 ring-[#121e3d]'
              }`}
            >
              <Plus className="w-6 h-6" />
              {pendingTotalCount > 0 && !showFabMenu && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce ring-2 ring-[#121e3d]">
                  {pendingTotalCount}
                </span>
              )}
            </button>
          </div>

          {navItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#00c853] font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
