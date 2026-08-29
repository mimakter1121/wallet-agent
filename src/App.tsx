import React from 'react';
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

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WalletPage } from './pages/WalletPage';
import { DepositPage } from './pages/DepositPage';
import { WithdrawalPage } from './pages/WithdrawalPage';
import { CustomersPage } from './pages/CustomersPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { CommissionPage } from './pages/CommissionPage';
import { NetworkPage } from './pages/NetworkPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { KycPage } from './pages/KycPage';
import { SupportPage } from './pages/SupportPage';

export const App: React.FC = () => {
  const { isAuthenticated, currentPage } = useApp();

  if (!isAuthenticated || currentPage === 'login') {
    return (
      <div className="min-h-full">
        <LoginPage />
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
          {renderCurrentPage()}
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
