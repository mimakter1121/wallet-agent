import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Users, 
  ReceiptText, 
  Award, 
  Network, 
  Bell, 
  ShieldCheck, 
  HelpCircle, 
  Settings, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useApp, PageId } from '../../context/AppContext';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, logout, agent, unreadCount } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'wallet', label: 'Wallet & Liquidity', icon: Wallet },
    { id: 'deposits', label: 'Deposit Requests', icon: ArrowDownLeft },
    { id: 'withdrawals', label: 'Withdrawal Requests', icon: ArrowUpRight },
    { id: 'customers', label: 'Customer Directory', icon: Users },
    { id: 'transactions', label: 'Transactions & Ledger', icon: ReceiptText },
    { id: 'commission', label: 'Commission Center', icon: Award },
    { id: 'network', label: 'Sub-Agent Network', icon: Network },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'kyc', label: 'Verification & KYC', icon: ShieldCheck },
    { id: 'support', label: 'Support & Help Desk', icon: HelpCircle },
    { id: 'profile', label: 'Profile & Security', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#121e3d] border-r border-[#233763] h-[calc(100vh-4rem)] sticky top-16 select-none">
      
      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-extrabold text-[#00c853] uppercase tracking-wider">
          Financial Operations
        </div>

        {navItems.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                isActive
                  ? 'bg-[#00c853] text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-200 hover:bg-[#1a294e] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-emerald-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[11px] font-extrabold text-[#00c853] uppercase tracking-wider">
          Management & Growth
        </div>

        {navItems.slice(6).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                isActive
                  ? 'bg-[#00c853] text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-200 hover:bg-[#1a294e] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-emerald-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile card */}
      <div className="p-3 border-t border-[#233763] bg-[#0a1128]/80">
        <div className="p-2.5 rounded-xl bg-[#1a294e] border border-[#233763] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {agent.avatar ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#00c853]/60"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00c853] to-[#00701a] flex items-center justify-center text-white text-xs font-black ring-2 ring-[#00c853]/60 shrink-0">
                {agent.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-xs font-extrabold text-white truncate">
                {agent.name}
              </div>
              <div className="text-[10px] text-[#00c853] font-mono font-bold truncate">
                {agent.id}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
