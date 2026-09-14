import React, { useState, Suspense, lazy } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminSidebar, AdminTab } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminLoginGate } from './components/AdminLoginGate';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

// Code-split admin pages for rapid initial load
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CustomerPortalPage = lazy(() => import('./pages/CustomerPortalPage').then(m => ({ default: m.CustomerPortalPage })));
const ExchangeRatesPage = lazy(() => import('./pages/ExchangeRatesPage').then(m => ({ default: m.ExchangeRatesPage })));
const ChannelsPage = lazy(() => import('./pages/ChannelsPage').then(m => ({ default: m.ChannelsPage })));
const AgentsPage = lazy(() => import('./pages/AgentsPage').then(m => ({ default: m.AgentsPage })));
const KycRequestsPage = lazy(() => import('./pages/KycRequestsPage').then(m => ({ default: m.KycRequestsPage })));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const AdminLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-3 border-[#00c853]/20 border-t-[#00c853] rounded-full animate-spin" />
  </div>
);

const AdminContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AdminTab>(() => {
    const saved = sessionStorage.getItem('wa_admin_tab') as AdminTab | null;
    const validTabs: AdminTab[] = ['dashboard', 'customer_portal', 'exchange_rates', 'channels', 'agents', 'kyc_requests', 'transactions', 'settings'];
    return saved && validTabs.includes(saved) ? saved : 'dashboard';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wa_admin_auth') === 'true';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useAdmin();

  const handleTabChange = (tab: AdminTab) => {
    setCurrentTab(tab);
    sessionStorage.setItem('wa_admin_tab', tab);
    setIsMobileMenuOpen(false);
  };

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
      {/* Sidebar (Desktop Static + Mobile Drawer) */}
      <AdminSidebar 
        currentTab={currentTab} 
        onTabChange={handleTabChange}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title={title} 
          subtitle={subtitle} 
          onLogout={handleLogout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 pb-12">
          <Suspense fallback={<AdminLoader />}>
            {currentTab === 'dashboard' && <AdminDashboard onNavigate={handleTabChange} />}
            {currentTab === 'customer_portal' && <CustomerPortalPage />}
            {currentTab === 'exchange_rates' && <ExchangeRatesPage />}
            {currentTab === 'channels' && <ChannelsPage />}
            {currentTab === 'agents' && <AgentsPage />}
            {currentTab === 'kyc_requests' && <KycRequestsPage />}
            {currentTab === 'transactions' && <TransactionsPage />}
            {currentTab === 'settings' && <SettingsPage />}
          </Suspense>
        </main>
      </div>

      {/* Global Admin Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#121e3d] border border-[#233763] shadow-2xl animate-slideUp">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#00c853] shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-[#00b0ff] shrink-0" />}
          <div>
            <div className="text-xs font-bold text-white">{toast.title}</div>
            <div className="text-[11px] text-slate-400">{toast.message}</div>
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
