import React, { Suspense, lazy } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { PWABanner } from './components/layout/PWABanner';
import { ToastContainer } from './components/common/Toast';
import { SecurityPinModal } from './components/common/SecurityPinModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { TransactionDetailModal } from './components/common/TransactionDetailModal';
import { CustomerDetailDrawer } from './components/common/CustomerDetailDrawer';
import { TelegramFloatingButton } from './components/common/TelegramFloatingButton';

// Code-split pages for instant initial load times
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const WalletPage = lazy(() => import('./pages/WalletPage').then(m => ({ default: m.WalletPage })));
const DepositPage = lazy(() => import('./pages/DepositPage').then(m => ({ default: m.DepositPage })));
const WithdrawalPage = lazy(() => import('./pages/WithdrawalPage').then(m => ({ default: m.WithdrawalPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const CommissionPage = lazy(() => import('./pages/CommissionPage').then(m => ({ default: m.CommissionPage })));
const NetworkPage = lazy(() => import('./pages/NetworkPage').then(m => ({ default: m.NetworkPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const KycPage = lazy(() => import('./pages/KycPage').then(m => ({ default: m.KycPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then(m => ({ default: m.SupportPage })));

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-9 h-9 border-3 border-[#00c853]/20 border-t-[#00c853] rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-bold tracking-wide">Loading workspace...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { isAuthenticated, currentPage } = useApp();

  if (!isAuthenticated || currentPage === 'login') {
    return (
      <div className="min-h-full">
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
        <ToastContainer />
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'wallet':
        return <WalletPage />;
      case 'deposits':
        return <DepositPage />;
      case 'withdrawals':
        return <WithdrawalPage />;
      case 'customers':
        return <CustomersPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'commission':
        return <CommissionPage />;
      case 'network':
        return <NetworkPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'kyc':
        return <KycPage />;
      case 'support':
        return <SupportPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080e1e] text-slate-100 flex flex-col transition-colors selection:bg-[#00c853]/30">
      <PWABanner />
      <Header />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
          <Suspense fallback={<PageLoader />}>
            {renderCurrentPage()}
          </Suspense>
        </main>
      </div>

      <BottomNav />

      {/* Global Overlays & Modals */}
      <SecurityPinModal />
      <ReceiptModal />
      <TransactionDetailModal />
      <CustomerDetailDrawer />
      <TelegramFloatingButton />
      <ToastContainer />
    </div>
  );
};
export default App;
