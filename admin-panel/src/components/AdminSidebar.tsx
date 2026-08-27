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
  Zap,
  ExternalLink
} from 'lucide-react';

export type AdminTab = 'dashboard' | 'customer_portal' | 'exchange_rates' | 'channels' | 'agents' | 'kyc_requests' | 'transactions' | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'customer_portal', label: 'Customer Payment Desk', icon: Smartphone },
    { id: 'exchange_rates', label: 'Exchange Rates (BDT/INR/PKR)', icon: RefreshCw },
    { id: 'channels', label: 'Payment Channels & Numbers', icon: Building2 },
    { id: 'agents', label: 'Agent Liquidity Pool', icon: Users },
    { id: 'kyc_requests', label: 'KYC Requests & Clearance', icon: ShieldCheck },
    { id: 'transactions', label: 'Clearance Ledger', icon: Receipt },
    { id: 'settings', label: 'System Fees & Security', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#121e3d] border-r border-[#233763] flex flex-col justify-between shrink-0 min-h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#233763] flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Baji Admin" 
            className="h-9 object-contain"
          />
          <div>
            <div className="text-[10px] font-black text-[#00c853] uppercase tracking-wider bg-[#00c853]/20 px-2 py-0.5 rounded border border-[#00c853]/40">
              ADMIN TOWER
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as AdminTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-[#00c853] text-white shadow-md shadow-emerald-950/50'
                    : 'text-slate-200 hover:bg-[#1a294e] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 m-4 rounded-xl bg-[#1a294e] border border-[#233763] space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-white font-extrabold">
          <ShieldCheck className="w-4 h-4 text-[#00c853]" />
          <span>Standalone Admin Console</span>
        </div>
        <p className="text-[11px] text-slate-300">
          Independent deployment setup for Vercel, Netlify, or Docker.
        </p>
      </div>
    </aside>
  );
};
