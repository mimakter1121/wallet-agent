import React, { useState } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Search, 
  ShieldCheck, 
  User, 
  LogOut, 
  ChevronDown, 
  Wifi, 
  WifiOff, 
  Download,
  Building2,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { 
    agent, 
    currentPage, 
    setCurrentPage, 
    isDarkMode, 
    toggleDarkMode, 
    logout, 
    unreadCount, 
    notifications, 
    markAllNotificationsAsRead,
    isInstallPromptAvailable,
    triggerPwaInstall,
    isOnline
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Agent Financial Dashboard';
      case 'wallet': return 'Liquidity & Wallet Management';
      case 'deposits': return 'Customer Deposit Processing';
      case 'withdrawals': return 'Customer Withdrawal Processing';
      case 'customers': return 'Customer Accounts Directory';
      case 'transactions': return 'Transaction Ledger & Audit';
      case 'commission': return 'Commission & Revenue Center';
      case 'network': return 'Sub-Agent Partner Network';
      case 'notifications': return 'System & Transaction Alerts';
      case 'profile': return 'Agent Profile & Security Settings';
      case 'kyc': return 'KYC & Regulatory Verification';
      case 'support': return 'Agent Support & Help Desk';
      default: return 'Wallet Agent Portal';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#121e3d] border-b border-[#233763] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand/Logo & Title */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <img 
              src="/logo.png" 
              alt="Baji Agent" 
              className="h-9 object-contain"
            />
            <span className="text-[10px] uppercase font-black bg-[#00c853]/20 text-[#00c853] px-2 py-0.5 rounded border border-[#00c853]/40">
              AGENT PORTAL
            </span>
          </div>

          <div className="h-5 w-px bg-[#233763] hidden lg:block mx-1" />

          <div className="hidden md:block">
            <h1 className="text-sm font-black text-white tracking-wide">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* PWA Install Button if available */}
          {isInstallPromptAvailable && (
            <button
              onClick={triggerPwaInstall}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] text-xs font-black hover:bg-[#00c853]/30 transition-all animate-pulse"
              title="Install Wallet Agent App"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Network Connection Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a294e] text-[11px] font-bold text-white border border-[#233763]">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
                <span className="text-[#00c853] font-black">ONLINE</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-400 font-black">OFFLINE</span>
              </>
            )}
          </div>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-xl text-slate-200 hover:text-white bg-[#1a294e] border border-[#233763] transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00c853] rounded-full ring-2 ring-[#121e3d]" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121e3d] rounded-2xl shadow-2xl border border-[#233763] py-3 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-[#233763] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#00c853]/20 text-[#00c853] text-[10px] font-bold">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] font-bold text-[#00c853] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#233763]">
                  {notifications.slice(0, 4).map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        setShowNotifDropdown(false);
                        setCurrentPage('notifications');
                      }}
                      className={`p-3.5 hover:bg-[#1a294e] cursor-pointer transition-colors ${!notif.read ? 'bg-[#00c853]/10' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="px-4 pt-2 border-t border-[#233763] text-center">
                  <button
                    onClick={() => {
                      setShowNotifDropdown(false);
                      setCurrentPage('notifications');
                    }}
                    className="text-xs font-bold text-[#00c853] hover:underline"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl bg-[#1a294e] hover:bg-[#233763] border border-[#233763] transition-colors"
            >
              {agent.avatar ? (
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-8 h-8 rounded-xl object-cover ring-2 ring-[#00c853]"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00c853] to-[#00701a] flex items-center justify-center text-white text-xs font-black ring-2 ring-[#00c853] shrink-0">
                  {agent.name?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-black text-white leading-tight">
                  {agent.name}
                </div>
                <div className="text-[11px] text-[#00c853] font-mono font-bold">
                  {agent.id}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-white hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#121e3d] rounded-2xl shadow-2xl border border-[#233763] py-2 z-50 animate-fadeIn text-white">
                <div className="px-4 py-3 border-b border-[#233763]">
                  <div className="text-xs font-black text-white">{agent.name}</div>
                  <div className="text-[11px] text-slate-300 truncate font-mono mt-0.5">{agent.email}</div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#00c853]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{agent.kycLevel}</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setCurrentPage('profile');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-200 hover:bg-[#1a294e] hover:text-white flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-[#00c853]" />
                    <span>Agent Profile & PIN</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setCurrentPage('kyc');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-200 hover:bg-[#1a294e] hover:text-white flex items-center gap-2.5"
                  >
                    <FileCheck className="w-4 h-4 text-[#00c853]" />
                    <span>Verification & Limits</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#233763]">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
