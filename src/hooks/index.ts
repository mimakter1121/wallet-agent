import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { agentService } from '../services/agentService';
import { customerService } from '../services/customerService';
import { transactionService } from '../services/transactionService';
import { depositService } from '../services/depositService';
import { withdrawalService } from '../services/withdrawalService';
import { commissionService } from '../services/commissionService';
import { notificationService } from '../services/notificationService';
import { supportService } from '../services/supportService';
import { storageService } from '../services/storageService';

// 1. useAuth Hook
export const useAuth = () => {
  const { isAuthenticated, login, logout } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    const res = await authService.signInWithEmail(email, pass);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return false;
    }
    return login();
  };

  const signOut = async () => {
    await authService.signOut();
    logout();
  };

  return { isAuthenticated, signIn, signOut, loading, error };
};

// 2. useAgent Hook
export const useAgent = () => {
  const { agent } = useApp();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refreshMetrics = async () => {
    setLoading(true);
    const { data } = await agentService.getDashboardMetrics();
    if (data) setMetrics(data);
    setLoading(false);
  };

  return { agent, metrics, loading, refreshMetrics };
};

// 3. useWallet Hook
export const useWallet = () => {
  const { agent, addFunds, transferFunds } = useApp();
  return {
    balance: agent.balance,
    pendingBalance: agent.pendingBalance,
    commissionBalance: agent.commissionBalance,
    addFunds,
    transferFunds
  };
};

// 4. useTransactions Hook
export const useTransactions = () => {
  const { transactions, selectedTransaction, setSelectedTransaction, isDetailOpen, setIsDetailOpen } = useApp();
  return {
    transactions,
    selectedTransaction,
    setSelectedTransaction,
    isDetailOpen,
    setIsDetailOpen
  };
};

// 5. useCustomers Hook
export const useCustomers = () => {
  const { customers, selectedCustomer, setSelectedCustomer, isCustomerDrawerOpen, setIsCustomerDrawerOpen, addCustomer } = useApp();
  return {
    customers,
    selectedCustomer,
    setSelectedCustomer,
    isCustomerDrawerOpen,
    setIsCustomerDrawerOpen,
    addCustomer
  };
};

// 6. useDeposits Hook
export const useDeposits = () => {
  const { createDepositRequest, updateTransactionStatus } = useApp();
  return {
    submitDeposit: createDepositRequest,
    approveDeposit: updateTransactionStatus
  };
};

// 7. useWithdrawals Hook
export const useWithdrawals = () => {
  const { createWithdrawalRequest, updateTransactionStatus } = useApp();
  return {
    submitWithdrawal: createWithdrawalRequest,
    processWithdrawal: updateTransactionStatus
  };
};

// 8. useCommission Hook
export const useCommission = () => {
  const { commissions, claimCommission, agent } = useApp();
  return {
    commissions,
    commissionBalance: agent.commissionBalance,
    claimCommission
  };
};

// 9. useNotifications Hook
export const useNotifications = () => {
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  return {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
  };
};

// 10. useSupport Hook
export const useSupport = () => {
  const { tickets, createTicket, addTicketMessage } = useApp();
  return {
    tickets,
    createTicket,
    addTicketMessage
  };
};

// 11. useKyc Hook
export const useKyc = () => {
  const { kycDocs, uploadKycDoc, agent } = useApp();
  return {
    kycLevel: agent.kycLevel,
    kycStatus: agent.kycStatus,
    kycDocs,
    uploadKycDoc
  };
};
