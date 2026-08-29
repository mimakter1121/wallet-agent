import React, { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminSidebar, AdminTab } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminLoginGate } from './components/AdminLoginGate';
import { AdminDashboard } from './pages/AdminDashboard';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { ExchangeRatesPage } from './pages/ExchangeRatesPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { AgentsPage } from './pages/AgentsPage';
import { KycRequestsPage } from './pages/KycRequestsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const AdminContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wa_admin_auth') === 'true';
  });
  const { toast } = useAdmin();

  if (!isAuthenticated) {
    return <AdminLoginGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem('wa_admin_auth');
    setIsAuthenticated(false);
  };

  const getTabTitles = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Platform Control Tower', subtitle: 'Global financial overview & performance' };
      case 'customer_portal':
        return { title: 'Customer Payment Desk Manager', subtitle: 'Live customer deposit & withdrawal request stream, iframe view & clearance queue' };
      case 'exchange_rates':
        return { title: 'Exchange Rates Management', subtitle: 'Set conversion rates for BDT (৳), INR (₹), and PKR (₨)' };
      case 'channels':
        return { title: 'Payment Collection Numbers', subtitle: 'Manage bKash, Nagad, Rocket, Upay agent/personal/merchant numbers & crypto gateways' };
      case 'agents':
        return { title: 'Agent Liquidity Directory', subtitle: 'Manage active liquidity agents & KYC status' };
      case 'kyc_requests':
        return { title: 'KYC Verification & Clearance Requests', subtitle: 'Review & approve National ID, Passport, and financial documents submitted by agents' };
      case 'transactions':
        return { title: 'Clearance Ledger', subtitle: 'Global transaction audit & manual clearance approvals' };
      case 'settings':
        return { title: 'System Settings', subtitle: 'Platform fee percentages & backend settings' };
    }
  };

  const { title, subtitle } = getTabTitles();

  return (
    <div className="flex h-screen bg-[#080e1e] text-slate-100 overflow-hidden">
      {/* Standalone Sidebar */}
      <AdminSidebar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title={title} subtitle={subtitle} onLogout={handleLogout} />

        <main className="flex-1 pb-12">
          {currentTab === 'dashboard' && <AdminDashboard onNavigate={setCurrentTab} />}
          {currentTab === 'customer_portal' && <CustomerPortalPage />}
          {currentTab === 'exchange_rates' && <ExchangeRatesPage />}
          {currentTab === 'channels' && <ChannelsPage />}
          {currentTab === 'agents' && <AgentsPage />}
          {currentTab === 'kyc_requests' && <KycRequestsPage />}
          {currentTab === 'transactions' && <TransactionsPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Admin Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-slideUp">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">{toast.title}</div>
            <div className="text-[11px] text-slate-500">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}
