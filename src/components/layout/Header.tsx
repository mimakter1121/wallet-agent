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
  FileCheck,
  Menu,
  X,
  LayoutDashboard,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  ReceiptText,
  Award,
  Network,
  HelpCircle,
  Settings
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatNotificationTime } from '../../utils/formatters';

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
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isInstallPromptAvailable,
    triggerPwaInstall,
    isOnline,
    pendingDepositsCount,
    pendingWithdrawalsCount,
    pendingTotalCount
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        
        {/* Left: Hamburger (mobile), Brand/Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-[#1a294e] border border-[#233763] text-white hover:border-[#00c853] transition-colors active:scale-95 flex items-center justify-center"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

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

          {/* Urgent Orders Alert Button */}
          {pendingTotalCount > 0 && (
            <button
              onClick={() => setCurrentPage(pendingDepositsCount > 0 ? 'deposits' : 'withdrawals')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/50 text-rose-300 hover:text-white text-xs font-black shadow-lg shadow-rose-950/50 animate-pulse transition-all active:scale-95"
              title="Click to clear pending customer requests"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>🚨 {pendingTotalCount} {pendingTotalCount === 1 ? 'Order' : 'Orders'} Pending</span>
            </button>
          )}

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
              <>
                {/* Backdrop overlay to close on tap outside */}
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none"
                  onClick={() => setShowNotifDropdown(false)}
                />

                <div className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-auto sm:right-0 sm:mt-2 max-w-sm sm:max-w-none sm:w-96 bg-[#121e3d] rounded-2xl shadow-2xl border border-[#233763] py-3 z-50 animate-fadeIn text-white">
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

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#233763]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-medium">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 8).map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            setShowNotifDropdown(false);
                            if (notif.id.includes('DEP') || notif.title.includes('Cash-In')) {
                              setCurrentPage('deposits');
                            } else if (notif.id.includes('WTH') || notif.title.includes('Cash-Out')) {
                              setCurrentPage('withdrawals');
                            } else {
                              setCurrentPage('notifications');
                            }
                          }}
                          className={`p-3.5 hover:bg-[#1a294e] cursor-pointer transition-colors ${!notif.read ? 'bg-[#00c853]/10 border-l-2 border-[#00c853]' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-white break-words flex-1">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                              {formatNotificationTime(notif.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2 break-words">
                            {notif.message}
                          </p>
                          {notif.badge && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                notif.badge === 'Action Required'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                  : notif.badge === 'Approved' || notif.badge === 'Settled'
                                  ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {notif.badge}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
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
              </>
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
              <>
                {/* Backdrop overlay to close on tap outside */}
                <div 
                  className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
                  onClick={() => setShowProfileMenu(false)}
                />

                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-[#121e3d] rounded-2xl shadow-2xl border border-[#233763] py-2 z-50 animate-fadeIn text-white">
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex animate-fadeIn select-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-72 max-w-[85vw] bg-[#121e3d] border-r border-[#233763] h-full flex flex-col justify-between shadow-2xl animate-slideRight text-white"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#233763]">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Baji Agent" className="h-8 object-contain" />
                  <span className="text-[10px] uppercase font-black bg-[#00c853]/20 text-[#00c853] px-2 py-0.5 rounded border border-[#00c853]/40">
                    PORTAL
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-[#1a294e] border border-[#233763] text-slate-300 hover:text-white"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Agent info mini badge */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#1a294e] border border-[#233763]">
                <img
                  src={agent.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                  alt={agent.name}
                  className="w-10 h-10 rounded-xl object-cover border border-[#00c853]"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-white truncate">{agent.name}</div>
                  <div className="text-[10px] text-[#00c853] font-mono font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                    <span>{agent.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div>
                <div className="text-[10px] font-black uppercase text-[#00c853] tracking-wider px-3 pb-1">
                  Financial Operations
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'wallet', label: 'Wallet & Liquidity', icon: Wallet },
                    { id: 'deposits', label: 'Deposit Requests', icon: ArrowDownLeft, badge: pendingDepositsCount },
                    { id: 'withdrawals', label: 'Withdrawal Requests', icon: ArrowUpRight, badge: pendingWithdrawalsCount },
                    { id: 'customers', label: 'Customer Directory', icon: Users },
                    { id: 'transactions', label: 'Transactions & Ledger', icon: ReceiptText },
                  ].map((item: any) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentPage(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#00c853] text-white shadow-md'
                            : 'text-slate-200 hover:bg-[#1a294e] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
                            item.id === 'deposits' 
                              ? 'bg-emerald-500 text-slate-950 animate-pulse' 
                              : 'bg-sky-500 text-slate-950 animate-pulse'
                          }`}>
                            {item.badge} New
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase text-[#00b0ff] tracking-wider px-3 pb-1">
                  Revenue & Partner Growth
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'commission', label: 'Commission Center', icon: Award, highlight: true },
                    { id: 'network', label: 'Sub-Agent Network', icon: Network, highlight: true },
                    { id: 'kyc', label: 'Verification & KYC', icon: ShieldCheck },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentPage(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#00c853] text-white shadow-md'
                            : item.highlight
                            ? 'text-white bg-[#1a294e]/70 border border-[#233763] hover:border-[#00c853]'
                            : 'text-slate-200 hover:bg-[#1a294e] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${item.id === 'commission' ? 'text-amber-400' : item.id === 'network' ? 'text-[#00b0ff]' : ''}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.id === 'commission' && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            Earn
                          </span>
                        )}
                        {item.id === 'network' && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40">
                            Team
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-3 pb-1">
                  Account & Support
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'profile', label: 'Profile & Security', icon: Settings },
                    { id: 'support', label: 'Support & Help Desk', icon: HelpCircle },
                    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentPage(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#00c853] text-white shadow-md'
                            : 'text-slate-200 hover:bg-[#1a294e] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer: Logout */}
            <div className="p-4 border-t border-[#233763]">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
