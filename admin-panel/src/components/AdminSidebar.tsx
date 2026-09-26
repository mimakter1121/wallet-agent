import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  RefreshCw,
  Building2,
  Users,
  Receipt,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export type AdminTab = 'dashboard' | 'customer_portal' | 'exchange_rates' | 'channels' | 'agents' | 'kyc_requests' | 'transactions' | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  currentTab, 
  onTabChange,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { transactions } = useAdmin();

  const pendingAgentPayouts = transactions.filter(t => 
    (t.status === 'pending' || t.status === 'processing') && 
    (t.type === 'withdrawal' || t.id.startsWith('WD-') || t.agentName?.includes('Agent Settlement') || t.customerName?.includes('Agent Settlement') || t.customerName?.includes('Payout'))
  ).length;

  const menuItems = [
    { id: 'dashboard', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'customer_portal', label: 'Customer Payment Desk', icon: Smartphone, badge: pendingAgentPayouts },
    { id: 'exchange_rates', label: 'Exchange Rates (BDT/INR/PKR)', icon: RefreshCw },
    { id: 'channels', label: 'Payment Channels & Numbers', icon: Building2 },
    { id: 'agents', label: 'Agent Liquidity Pool', icon: Users },
    { id: 'kyc_requests', label: 'KYC Requests & Clearance', icon: ShieldCheck },
    { id: 'transactions', label: 'Clearance Ledger', icon: Receipt, badge: pendingAgentPayouts },
    { id: 'settings', label: 'System Fees & Security', icon: Settings },
  ];

  const renderNavContent = (isMobileView: boolean) => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-[#233763] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="Baji Admin" 
              className="h-8 sm:h-9 object-contain"
            />
            <span className="text-[10px] font-black text-[#00c853] uppercase tracking-wider bg-[#00c853]/20 px-2 py-0.5 rounded border border-[#00c853]/40">
              ADMIN TOWER
            </span>
          </div>

          {isMobileView && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl bg-[#1a294e] hover:bg-[#233763] text-slate-300 hover:text-white border border-[#233763] transition-colors"
              title="Close Menu"
              aria-label="Close Navigation Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 sm:p-4 space-y-1 sm:space-y-1.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id as AdminTab);
                  if (isMobileView && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-[#00c853] text-white shadow-md shadow-emerald-950/50'
                    : 'text-slate-200 hover:bg-[#1a294e] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950 animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 m-3 rounded-xl bg-[#1a294e] border border-[#233763] space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-white font-extrabold">
          <ShieldCheck className="w-4 h-4 text-[#00c853] shrink-0" />
          <span className="truncate">Standalone Admin Console</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-snug">
          Independent deployment setup for Vercel, Netlify, or Docker.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar (lg and above) */}
      <aside className="hidden lg:flex w-64 bg-[#121e3d] border-r border-[#233763] flex-col justify-between shrink-0 h-screen select-none">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Responsive Sliding Drawer (< lg) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-[#121e3d] border-r border-[#233763] flex flex-col justify-between h-full z-10 shadow-2xl animate-slideRight select-none">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
