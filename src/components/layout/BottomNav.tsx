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
  X
} from 'lucide-react';
import { useApp, PageId } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentPage, setCurrentPage } = useApp();
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
            <div className="text-xs font-black text-slate-300 uppercase tracking-wider px-2 pb-1">
              Quick Agent Operations
            </div>
            
            <button
              onClick={() => {
                setShowFabMenu(false);
                setCurrentPage('deposits');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] font-black text-xs transition-all active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-[#00c853] text-white flex items-center justify-center font-bold">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-black text-sm text-white">New Deposit Request</div>
                <div className="text-[11px] text-[#00c853]">Collect & credit customer funds</div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                setCurrentPage('withdrawals');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#1a294e] border border-[#233763] text-white font-bold text-xs transition-all active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-[#00b0ff]/20 border border-[#00b0ff]/40 text-[#00b0ff] flex items-center justify-center font-bold">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-white">Process Withdrawal</div>
                <div className="text-[11px] text-slate-300">Disburse customer cashout request</div>
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
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                showFabMenu
                  ? 'bg-[#1a294e] text-white rotate-45 border border-[#233763]'
                  : 'bg-[#00c853] text-white shadow-emerald-950/50 ring-4 ring-[#121e3d]'
              }`}
            >
              <Plus className="w-6 h-6" />
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
