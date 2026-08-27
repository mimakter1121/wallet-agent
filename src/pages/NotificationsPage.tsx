import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  ShieldAlert, 
  Award, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Info,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    unreadCount 
  } = useApp();

  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const getNotifIcon = (type: string, title: string) => {
    if (title.includes('Cash-In') || title.includes('Deposit')) {
      return <ArrowDownLeft className="w-5 h-5 text-[#00c853]" />;
    }
    if (title.includes('Cash-Out') || title.includes('Withdrawal')) {
      return <ArrowUpRight className="w-5 h-5 text-[#00b0ff]" />;
    }
    if (title.includes('Commission') || title.includes('Topup')) {
      return <TrendingUp className="w-5 h-5 text-amber-400" />;
    }
    switch (type) {
      case 'transaction': return <ArrowDownLeft className="w-5 h-5 text-[#00c853]" />;
      case 'commission': return <Award className="w-5 h-5 text-amber-400" />;
      case 'security': return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      default: return <Info className="w-5 h-5 text-[#00b0ff]" />;
    }
  };

  const getIconBg = (type: string, title: string) => {
    if (title.includes('Cash-In') || title.includes('Deposit')) return 'bg-[#00c853]/20 border-[#00c853]/40';
    if (title.includes('Cash-Out') || title.includes('Withdrawal')) return 'bg-[#00b0ff]/20 border-[#00b0ff]/40';
    if (type === 'commission') return 'bg-amber-500/20 border-amber-500/40';
    if (type === 'security') return 'bg-rose-500/20 border-rose-500/40';
    return 'bg-amber-500/20 border-amber-500/40';
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-10 text-white">
      
      {/* Header */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Notification Center</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#00c853] text-white text-xs font-bold">
                  {unreadCount} Unread
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Real-time audit alerts and transaction confirmations
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center justify-center gap-2 bg-[#1a294e] hover:bg-[#233763] text-white px-4 py-2 rounded-xl font-bold text-xs border border-[#233763] transition-all"
          >
            <CheckCheck className="w-4 h-4 text-[#00c853]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'all', label: 'All' },
          { id: 'transaction', label: 'Transactions' },
          { id: 'commission', label: 'Commission' },
          { id: 'security', label: 'Security' },
          { id: 'system', label: 'System' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#00c853] text-white shadow-md shadow-emerald-950/50'
                : 'bg-[#121e3d] text-slate-300 border border-[#233763] hover:text-white hover:border-[#00c853]/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-12 text-center shadow-card">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-20 text-[#00c853]" />
            <p className="text-sm font-bold text-white">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">Approve customer transactions to see alerts here</p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                !notif.read
                  ? 'bg-[#0d1e0d] border-[#00c853]/50 shadow-sm shadow-emerald-950/30'
                  : 'bg-[#121e3d] border-[#233763] hover:border-[#2d4a7a]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${getIconBg(notif.type, notif.title)}`}>
                  {getNotifIcon(notif.type, notif.title)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-black text-white leading-tight flex items-center gap-2 flex-wrap">
                      <span>{notif.title}</span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#00c853] inline-block shrink-0" />
                      )}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {notif.message}
                  </p>

                  {/* Badge */}
                  {notif.badge && (
                    <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30 text-xs font-bold">
                      💰 {notif.badge}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
