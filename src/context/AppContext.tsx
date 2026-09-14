import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { 
  AgentProfile, 
  Customer, 
  Transaction, 
  CommissionRecord, 
  SubAgent, 
  NotificationItem, 
  SupportTicket, 
  KycDocument, 
  ActiveSession,
  PaymentMethod,
  TransactionStatus
} from '../types';
import { 
  initialAgent, 
  initialCustomers, 
  initialTransactions, 
  initialCommissions, 
  initialSubAgents, 
  initialNotifications, 
  initialTickets, 
  initialKycDocs, 
  initialSessions 
} from './initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { authService } from '../services/authService';
import { agentService } from '../services/agentService';
import { customerService } from '../services/customerService';
import { depositService } from '../services/depositService';
import { withdrawalService } from '../services/withdrawalService';
import { commissionService } from '../services/commissionService';
import { notificationService } from '../services/notificationService';
import { supportService } from '../services/supportService';
import { storageService } from '../services/storageService';
import { subAgentService } from '../services/subAgentService';
import { CurrencyRate, getExchangeRates, saveExchangeRates } from '../config/currencyRates';
import { soundAlert } from '../utils/audioAlert';

export type PageId = 
  | 'dashboard' 
  | 'wallet' 
  | 'deposits' 
  | 'withdrawals' 
  | 'customers' 
  | 'transactions' 
  | 'commission' 
  | 'network' 
  | 'notifications' 
  | 'profile' 
  | 'kyc' 
  | 'support'
  | 'login';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface IncomingRequestAlert {
  id: string;
  type: 'deposit' | 'withdrawal';
  requestCode: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: string;
  trxId?: string;
  createdAt: string;
}

interface AppContextType {
  // Navigation & View
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Auth
  isAuthenticated: boolean;
  login: (customAgentData?: Partial<AgentProfile>) => boolean;
  logout: () => void;
  
  // Agent & Balances
  agent: AgentProfile;
  isMasterAgent: boolean;
  updateAgentProfile: (updates: Partial<AgentProfile>) => void;
  addFunds: (amount: number, method: PaymentMethod, ref: string) => Promise<void>;
  transferFunds: (amount: number, recipient: string, note: string) => void;
  
  // Customers
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  isCustomerDrawerOpen: boolean;
  setIsCustomerDrawerOpen: (open: boolean) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'joinedDate' | 'totalDeposits' | 'totalWithdrawals' | 'balance' | 'lastActivity'>) => Promise<Customer>;
  
  // Transactions
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  isDetailOpen: boolean;
  setIsDetailOpen: (open: boolean) => void;
  createDepositRequest: (data: { customerId: string; amount: number; paymentMethod: PaymentMethod; reference: string; notes?: string }) => Promise<Transaction>;
  createWithdrawalRequest: (data: { customerId: string; amount: number; paymentMethod: PaymentMethod; channelAccount: string; reference: string; notes?: string }) => Promise<Transaction>;
  updateTransactionStatus: (txId: string, status: TransactionStatus, adminNote?: string) => Promise<void>;
  
  // Receipts
  receiptTx: Transaction | null;
  isReceiptOpen: boolean;
  openReceipt: (tx: Transaction) => void;
  closeReceipt: () => void;

  // Security PIN Verification
  isPinModalOpen: boolean;
  pinActionTitle: string;
  pinActionSubtitle: string;
  requestPinConfirmation: (actionTitle: string, actionSubtitle: string, onVerified: () => void) => void;
  submitPin: (pin: string) => boolean;
  closePinModal: () => void;

  // Commissions
  commissions: CommissionRecord[];
  claimCommission: (amount: number) => Promise<void>;

  // Sub-agents
  subAgents: SubAgent[];
  inviteSubAgent: (name: string, email: string, mobile: string, location: string) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Support
  tickets: SupportTicket[];
  createTicket: (subject: string, category: SupportTicket['category'], priority: SupportTicket['priority'], message: string) => Promise<void>;
  addTicketMessage: (ticketId: string, message: string) => void;

  // KYC
  kycDocs: KycDocument[];
  uploadKycDoc: (docType: KycDocument['documentType'], file: File) => Promise<void>;

  // Active Sessions
  sessions: ActiveSession[];
  terminateSession: (sessionId: string) => void;
  terminateAllOtherSessions: () => void;

  // Toast
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Live Exchange Rates & System Settings
  exchangeRates: CurrencyRate[];
  telegramUsername: string;
  telegramSupportUrl: string;
  bdtExchangeRate: number;
  commissionRates: {
    deposit: number;
    withdrawal: number;
    clearance: number;
  };
  allTierRates: {
    tier1: { deposit: number; withdrawal: number };
    tier2: { deposit: number; withdrawal: number };
    tier3: { deposit: number; withdrawal: number };
    clearance: number;
  };
  agentTierNum: 1 | 2 | 3;

  // PWA & Backend Status
  isInstallPromptAvailable: boolean;
  triggerPwaInstall: () => void;
  isOnline: boolean;
  isSupabaseBackendActive: boolean;

  // Live Pending Orders & Realtime Audio Alerts
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
  pendingTotalCount: number;
  activeUrgentRequest: IncomingRequestAlert | null;
  dismissUrgentRequest: () => void;
  refreshPendingRequestsCount: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme initialization
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('wa_dark_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('wa_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('wa_auth') === 'true';
  });

  const [currentPage, setCurrentPageState] = useState<PageId>(() => {
    const isLoggedIn = localStorage.getItem('wa_auth') === 'true';
    if (!isLoggedIn) return 'login';
    const validPages: PageId[] = ['dashboard', 'wallet', 'deposits', 'withdrawals', 'customers', 'transactions', 'commission', 'network', 'notifications', 'profile', 'kyc', 'support'];
    const saved = sessionStorage.getItem('wa_current_page') as PageId | null;
    return saved && validPages.includes(saved) ? saved : 'dashboard';
  });

  const setCurrentPage = (page: PageId) => {
    setCurrentPageState(page);
    if (page !== 'login') {
      sessionStorage.setItem('wa_current_page', page);
    } else {
      sessionStorage.removeItem('wa_current_page');
    }
  };

  // Data version check — wipes old cached data when version changes
  const DATA_VERSION = 'v12_pwa_cache_purged';
  const storedVersion = localStorage.getItem('wa_data_version');
  if (storedVersion !== DATA_VERSION) {
    // Clear all old stored demo data
    ['wa_customers', 'wa_transactions', 'wa_commissions', 'wa_subagents', 'wa_notifications', 'wa_tickets', 'wa_agent', 'wa_agent_profile', 'wa_collection_accounts', 'wa_auth', 'wa_notif_read_ids'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('wa_data_version', DATA_VERSION);
  }

  // State Stores with Local Fallback & Seed Data
  const [agent, setAgent] = useState<AgentProfile>(() => {
    const saved = localStorage.getItem('wa_agent');
    return saved ? JSON.parse(saved) : initialAgent;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('wa_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('wa_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => {
    const saved = localStorage.getItem('wa_commissions');
    return saved ? JSON.parse(saved) : initialCommissions;
  });

  // Live Dynamic Exchange Rates & Telegram Setting (Synced from Supabase system_settings)
  const [exchangeRates, setExchangeRates] = useState<CurrencyRate[]>(getExchangeRates);
  const bdtExchangeRate = exchangeRates.find(r => r.code === 'BDT')?.ratePerUSD || 120;

  const [telegramUsername, setTelegramUsername] = useState<string>(() => {
    return localStorage.getItem('wa_telegram_username') || '@baji999_agent_support';
  });

  const telegramSupportUrl = telegramUsername.startsWith('http')
    ? telegramUsername
    : `https://t.me/${telegramUsername.replace('@', '')}`;

  // Tier-based Commission Rates (Tier 1: 4%/2.5%, Tier 2: 5%/3%, Tier 3: 6%/3.5%)
  const [allTierRates, setAllTierRates] = useState<{
    tier1: { deposit: number; withdrawal: number };
    tier2: { deposit: number; withdrawal: number };
    tier3: { deposit: number; withdrawal: number };
    clearance: number;
  }>(() => {
    const cached = localStorage.getItem('wa_tier_commission_rates');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }
    return {
      tier1: { deposit: 0.04, withdrawal: 0.025 },
      tier2: { deposit: 0.05, withdrawal: 0.030 },
      tier3: { deposit: 0.06, withdrawal: 0.035 },
      clearance: 0.005
    };
  });
  const allTierRatesRef = useRef(allTierRates);
  useEffect(() => {
    allTierRatesRef.current = allTierRates;
  }, [allTierRates]);

  const agentTierNum: 1 | 2 | 3 = useMemo(() => {
    const level = (agent.kycLevel || '').toLowerCase();
    if (level.includes('tier 3') || level.includes('master') || agent.balance >= 1000) return 3;
    if (level.includes('tier 2') || level.includes('business') || agent.balance >= 200) return 2;
    return 1;
  }, [agent.kycLevel, agent.balance]);

  // Dynamic commission rates for current agent based on active Tier
  const commissionRates = useMemo(() => {
    const t = agentTierNum === 3 ? allTierRates.tier3 : agentTierNum === 2 ? allTierRates.tier2 : allTierRates.tier1;
    return {
      deposit: t.deposit,
      withdrawal: t.withdrawal,
      clearance: allTierRates.clearance
    };
  }, [agentTierNum, allTierRates]);

  const commissionRatesRef = useRef(commissionRates);
  useEffect(() => {
    commissionRatesRef.current = commissionRates;
  }, [commissionRates]);

  const [subAgents, setSubAgents] = useState<SubAgent[]>(() => {
    const saved = localStorage.getItem('wa_subagents');
    return saved ? JSON.parse(saved) : initialSubAgents;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('wa_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('wa_tickets');
    return saved ? JSON.parse(saved) : initialTickets;
  });

  const [kycDocs, setKycDocs] = useState<KycDocument[]>(() => {
    const saved = localStorage.getItem('wa_kycdocs');
    return saved ? JSON.parse(saved) : initialKycDocs;
  });
  
  const [sessions, setSessions] = useState<ActiveSession[]>(() => {
    const saved = localStorage.getItem('wa_sessions');
    return saved ? JSON.parse(saved) : initialSessions;
  });

  // Automatically Persist State to LocalStorage on every update
  useEffect(() => {
    if (agent && agent.id) {
      localStorage.setItem('wa_agent_profile', JSON.stringify(agent));
      localStorage.setItem('wa_agent', JSON.stringify(agent));
    }
  }, [agent]);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      localStorage.setItem('wa_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (customers && customers.length > 0) {
      localStorage.setItem('wa_customers', JSON.stringify(customers));
    }
  }, [customers]);

  useEffect(() => {
    if (commissions && commissions.length > 0) {
      localStorage.setItem('wa_commissions', JSON.stringify(commissions));
    }
  }, [commissions]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      localStorage.setItem('wa_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Modals & Drawers
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState<boolean>(false);

  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Security PIN
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinActionTitle, setPinActionTitle] = useState('');
  const [pinActionSubtitle, setPinActionSubtitle] = useState('');
  const [pendingPinCallback, setPendingPinCallback] = useState<(() => void) | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // PWA Prompt & Network
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallPromptAvailable, setIsInstallPromptAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const isSupabaseBackendActive = isSupabaseConfigured();

  // Supabase Realtime Listener Setup
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Listen to Auth State Changes
    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session) {
        setIsAuthenticated(true);
        localStorage.setItem('wa_auth', 'true');
        const currentData = await authService.getCurrentAgentSession();
        if (currentData?.agent) {
          setAgent(prev => ({
            ...prev,
            balance: Number(currentData.agent?.balance || prev.balance),
            pendingBalance: Number(currentData.agent?.pending_balance || prev.pendingBalance),
            commissionBalance: Number(currentData.agent?.total_commission || prev.commissionBalance),
            id: currentData.agent?.agent_code || prev.id,
            dbId: currentData.agent?.id || prev.dbId
          }));
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        localStorage.setItem('wa_auth', 'false');
        setCurrentPage('login');
      }
    });

    // Realtime Notifications Listener
    const unsubscribeNotif = notificationService.subscribeToNotifications((newNotif) => {
      const item: NotificationItem = {
        id: newNotif.id,
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type as any,
        timestamp: 'Just now',
        read: false
      };
      setNotifications(prev => [item, ...prev]);
    });

    // Realtime Sub-Agents Listener
    const subAgentChannel = supabase
      .channel('agent_sub_agents_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_agents' }, async () => {
        const targetCode = agent.id || 'AG-55353';
        const freshSubs = await subAgentService.getSubAgents(targetCode);
        if (freshSubs && freshSubs.length > 0) {
          setSubAgents(freshSubs);
        }
      })
      .subscribe();

    return () => {
      authSubscription?.subscription?.unsubscribe();
      unsubscribeNotif();
      supabase.removeChannel(subAgentChannel);
    };
  }, [agent.id]);

  const isSyncingRef = useRef(false);

  // 1. Static platform settings (exchange rates & telegram) fetched once on mount & every 60s
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const fetchSystemSettings = async () => {
      try {
        const { data: sysSettingsRes } = await supabase.from('system_settings').select('*');
        if (sysSettingsRes && sysSettingsRes.length > 0) {
          const currentRates = getExchangeRates();
          const rateMap: Record<string, number> = {};
          let t1Dep = allTierRatesRef.current.tier1.deposit;
          let t1Wth = allTierRatesRef.current.tier1.withdrawal;
          let t2Dep = allTierRatesRef.current.tier2.deposit;
          let t2Wth = allTierRatesRef.current.tier2.withdrawal;
          let t3Dep = allTierRatesRef.current.tier3.deposit;
          let t3Wth = allTierRatesRef.current.tier3.withdrawal;
          let clr = allTierRatesRef.current.clearance;
          let tierUpdated = false;

          sysSettingsRes.forEach((row: any) => {
            if (row.key === 'telegram_username') {
              setTelegramUsername(row.value);
              localStorage.setItem('wa_telegram_username', row.value);
            }
            if (row.key === 'usd_bdt_rate') rateMap['BDT'] = parseFloat(row.value);
            if (row.key === 'usd_inr_rate') rateMap['INR'] = parseFloat(row.value);
            if (row.key === 'usd_pkr_rate') rateMap['PKR'] = parseFloat(row.value);

            if (row.key === 'tier1_deposit_rate') {
              const val = parseFloat(row.value) / 100;
              if (!isNaN(val)) { t1Dep = val; tierUpdated = true; }
            }
            if (row.key === 'tier1_withdrawal_rate') {
              const val = parseFloat(row.value) / 100;
              if (!isNaN(val)) { t1Wth = val; tierUpdated = true; }
            }
            if (row.key === 'tier2_deposit_rate') {
              const val = parseFloat(row.value) / 100;
              if (!isNaN(val)) { t2Dep = val; tierUpdated = true; }
            }
            if (row.key === 'tier2_withdrawal_rate') {
              const val = parseFloat(row.value) / 100;
              if (!isNaN(val)) { t2Wth = val; tierUpdated = true; }
            }
            if (row.key === 'tier3_deposit_rate') {
              const val = parseFloat(row.value) / 100;
              if (!isNaN(val)) { t3Dep = val; tierUpdated = true; }
            }
            if (row.key === 'tier3_withdrawal_rate') {
              const val = parseFloat(row.value) / 100;
              if (!isNaN(val)) { t3Wth = val; tierUpdated = true; }
            }
            if (row.key === 'clearance_fee_rate') {
              const val = parseFloat(row.value) / 100;
              if (!isNaN(val)) { clr = val; tierUpdated = true; }
            }
          });

          if (tierUpdated) {
            const updated = {
              tier1: { deposit: t1Dep, withdrawal: t1Wth },
              tier2: { deposit: t2Dep, withdrawal: t2Wth },
              tier3: { deposit: t3Dep, withdrawal: t3Wth },
              clearance: clr
            };
            allTierRatesRef.current = updated;
            setAllTierRates(updated);
            localStorage.setItem('wa_tier_commission_rates', JSON.stringify(updated));
          }

          const updatedRates = currentRates.map(r => 
            rateMap[r.code] ? { ...r, ratePerUSD: rateMap[r.code] } : r
          );
          saveExchangeRates(updatedRates);
          setExchangeRates(updatedRates);
        }
      } catch (err) {
        console.error('Error fetching system settings:', err);
      }
    };

    fetchSystemSettings();
    const interval = setInterval(fetchSystemSettings, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. KYC documents status fetched on mount & when agent changes
  useEffect(() => {
    if (!isSupabaseConfigured() || !agent.id) return;
    const fetchKycDocs = async () => {
      try {
        const { data } = await supabase
          .from('kyc_documents')
          .select('*')
          .eq('agent_code', agent.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const mappedDocs: KycDocument[] = data.map((d: any) => ({
            id: d.doc_id || d.id,
            title: d.title || d.document_type,
            documentType: d.document_type as any,
            fileName: d.file_name,
            fileSize: d.file_size || '1.5 MB',
            status: d.status as any,
            uploadedAt: d.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10),
            fileUrl: d.file_url || undefined,
            storagePath: d.storage_path || undefined
          }));
          setKycDocs(mappedDocs);
        }
      } catch (err) {
        console.error('Error fetching KYC documents:', err);
      }
    };
    fetchKycDocs();
  }, [agent.id]);

  // 3. Ultra-fast Real-time Agent Float Balance & Transactions Sync (Parallelized via Promise.all + Realtime WebSocket)
  useEffect(() => {
    if (!isAuthenticated) return;

    const targetDbId = agent.dbId || 'e3f85535-3000-4000-8000-000000055353';
    const targetAgentCode = agent.id || 'AG-55353';

    const syncAgentFloatData = async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        // Parallel queries via Promise.all (1 single round-trip instead of 6 sequential awaits)
        const [agentRes, txRes, subAgentsList] = await Promise.all([
          targetDbId
            ? supabase.from('agents').select('*').eq('id', targetDbId).maybeSingle()
            : supabase.from('agents').select('*').eq('agent_code', targetAgentCode).maybeSingle(),
          supabase
            .from('transactions')
            .select('*')
            .eq('agent_id', targetDbId)
            .order('created_at', { ascending: false })
            .limit(60),
          subAgentService.getSubAgents(targetAgentCode)
        ]);

        if (subAgentsList && subAgentsList.length > 0) {
          setSubAgents(subAgentsList);
        }

        let agentData = agentRes.data;

        // Fallback: If agent not found by ID, query by email once
        if (!agentData && agent.email && agent.email !== 'agent@walletagent.com') {
          const { data: profRows } = await supabase
            .from('profiles')
            .select('id, agents(*)')
            .eq('email', agent.email)
            .limit(1);
          if (profRows && profRows.length > 0 && (profRows[0] as any).agents?.[0]) {
            agentData = (profRows[0] as any).agents[0];
          }
        }

        // Process transactions
        let mappedDbTx: Transaction[] = [];
        if (txRes.data && txRes.data.length > 0) {
          mappedDbTx = txRes.data.map((t: any) => {
            const rawCode = t.transaction_code || '';
            const rawType = t.type || '';
            const isDeposit = rawType === 'deposit' || rawCode.startsWith('DEP');
            const isWithdrawal = rawType === 'withdrawal' || rawCode.startsWith('WTH');
            const mappedType: 'deposit' | 'withdrawal' | 'topup' = isDeposit ? 'deposit' : (isWithdrawal ? 'withdrawal' : 'topup');

            const displayName = t.customer_name 
              || (t.note && !t.note.startsWith('Agent Topup') ? t.note.replace('Customer Cash-In Approved: ', '').replace('Customer Cash-Out Approved: ', '') : (isDeposit ? 'Customer Cash-In' : (isWithdrawal ? 'Customer Cash-Out' : `${agent.name || 'Agent'} Topup`)));
            const displayPhone = t.customer_phone || agent.mobile || '01700000000';

            return {
              id: t.transaction_code || 'TX-' + t.id.substring(0, 5),
              customerId: t.agent_id || 'AGENT-SELF',
              customerName: displayName,
              customerPhone: displayPhone,
              type: mappedType,
              amount: parseFloat(t.amount) || 0,
              fee: 0,
              netAmount: parseFloat(t.amount) || 0,
              paymentMethod: t.payment_method || 'USDT TRC20',
              reference: t.reference || t.transaction_code || '-',
              status: t.status === 'approved' ? 'success' : (t.status === 'rejected' ? 'rejected' : 'pending'),
              createdAt: t.created_at?.substring(0, 16) || new Date().toISOString().substring(0, 16),
              updatedAt: t.updated_at?.substring(0, 16) || new Date().toISOString().substring(0, 16),
              adminNote: t.note || 'Master Admin Clearance',
              receiptNumber: 'RCP-TX-' + Math.floor(10000 + Math.random() * 90000)
            };
          });
          setTransactions(mappedDbTx);
        }

        // Metrics computation
        const nowUTCDate = new Date().toISOString().substring(0, 10);
        const localToday = new Date().toLocaleDateString('en-CA');
        const todaySuccessTxs = mappedDbTx.filter(t => t.status === 'success' && (t.createdAt?.startsWith(localToday) || t.createdAt?.startsWith(nowUTCDate)));
        const computedTodayVol = todaySuccessTxs.reduce((sum, t) => sum + t.amount, 0);
        const computedTodayDep = todaySuccessTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const computedTodayWth = todaySuccessTxs.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
        const currentDepRate = commissionRatesRef.current.deposit;
        const currentWthRate = commissionRatesRef.current.withdrawal;
        const computedTodayComm = todaySuccessTxs.reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount * currentDepRate : (t.type === 'withdrawal' ? t.amount * currentWthRate : 0)), 0);

        if (agentData) {
          const freshBal = parseFloat(agentData.balance) || 0;
          const freshPending = parseFloat(agentData.pending_balance) || 0;
          const freshComm = parseFloat(agentData.total_commission) || 0;

          const pendingTxsSum = mappedDbTx.filter(t => t.status === 'pending' && t.type === 'topup').reduce((sum, t) => sum + t.amount, 0);
          const effectivePending = Math.max(freshPending, pendingTxsSum);

          const dbKycStatus = agentData.verification_status || 'pending';
          const isKycVerified = dbKycStatus === 'verified';

          let mappedKycLevel: string;
          if (dbKycStatus === 'under_review' || dbKycStatus === 'pending') {
            mappedKycLevel = freshBal >= 1000 ? 'Tier 3 (Master Agent)' : freshBal >= 200 ? 'Tier 2 (Business)' : 'Under Review';
          } else if (dbKycStatus === 'rejected') {
            mappedKycLevel = 'Verification Rejected';
          } else if (isKycVerified && freshBal >= 1000) {
            mappedKycLevel = 'Tier 3 (Master Agent)';
          } else if (isKycVerified && freshBal >= 200) {
            mappedKycLevel = 'Tier 2 (Business)';
          } else {
            mappedKycLevel = 'Tier 1 (Basic)';
          }

          setAgent(prev => ({
            ...prev,
            id: agentData.agent_code || prev.id,
            dbId: agentData.id || prev.dbId,
            name: prev.name || agentData.full_name || agentData.name || 'Agent User',
            businessName: prev.businessName || agentData.business_name || '',
            address: prev.address || agentData.address || '',
            city: prev.city || agentData.city || '',
            district: prev.district || agentData.district || '',
            nidNumber: prev.nidNumber || agentData.nid_number || '',
            emergencyContact: prev.emergencyContact || agentData.emergency_contact || '',
            kycStatus: dbKycStatus as any,
            kycLevel: mappedKycLevel,
            balance: freshBal,
            pendingBalance: effectivePending,
            commissionBalance: freshComm > 0 ? freshComm : computedTodayComm,
            todayVolume: computedTodayVol,
            todayDeposits: computedTodayDep,
            todayWithdrawals: computedTodayWth,
            todayCommission: computedTodayComm
          }));
        }

        // Auto-generate notifications
        const readIds: Set<string> = new Set(
          JSON.parse(localStorage.getItem('wa_notif_read_ids') || '[]')
        );
        const autoNotifs: NotificationItem[] = mappedDbTx
          .filter(t => t.status === 'success')
          .map(t => {
            const isDeposit = t.type === 'deposit';
            const isWithdrawal = t.type === 'withdrawal';
            const commission = isDeposit
              ? (t.amount * currentDepRate).toFixed(2)
              : isWithdrawal
              ? (t.amount * currentWthRate).toFixed(2)
              : '0.00';
            const notifId = 'NOTIF-' + t.id;

            return {
              id: notifId,
              type: (isDeposit || isWithdrawal ? 'transaction' : 'system') as 'transaction' | 'commission' | 'security' | 'system',
              title: isDeposit
                ? `✅ Cash-In Approved: +$${t.amount.toFixed(2)}`
                : isWithdrawal
                ? `✅ Cash-Out Approved: $${t.amount.toFixed(2)}`
                : `💰 Agent Topup: $${t.amount.toFixed(2)}`,
              message: isDeposit
                ? `Customer ${t.customerName || 'Unknown'} cash-in of $${t.amount.toFixed(2)} via ${t.paymentMethod} approved. Commission earned: +$${commission}. Float balance updated.`
                : isWithdrawal
                ? `Customer ${t.customerName || 'Unknown'} cash-out of $${t.amount.toFixed(2)} via ${t.paymentMethod} approved. Commission earned: +$${commission}. Float balance updated.`
                : `Liquidity topup of $${t.amount.toFixed(2)} via ${t.paymentMethod} approved and credited to float balance.`,
              timestamp: t.createdAt || new Date().toISOString().substring(0, 16),
              read: readIds.has(notifId),
              badge: isDeposit
                ? `Commission +$${commission} (${(currentDepRate * 100).toFixed(1)}%)`
                : isWithdrawal
                ? `Commission +$${commission} (${(currentWthRate * 100).toFixed(1)}%)`
                : undefined
            };
          })
          .reverse();

        setNotifications(autoNotifs);
      } catch (err) {
        console.error('Error syncing live agent balance & transactions from Supabase:', err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Initial instant sync
    syncAgentFloatData();

    // Supabase Realtime Channel: Instantly updates whenever transactions or agent row change in DB
    let channel: any = null;
    if (isSupabaseConfigured() && targetDbId) {
      channel = supabase
        .channel(`agent_live_sync_${targetDbId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `agent_id=eq.${targetDbId}` }, () => {
          syncAgentFloatData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agents', filter: `id=eq.${targetDbId}` }, () => {
          syncAgentFloatData();
        })
        .subscribe();
    }

    // Relaxed fallback poll: every 15s instead of aggressive 3s
    const interval = setInterval(syncAgentFloatData, 15000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isAuthenticated, agent.id, agent.dbId]);

  // Live Pending Requests & Realtime Audio Alert System
  const [pendingDepositsCount, setPendingDepositsCount] = useState<number>(0);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState<number>(0);
  const [activeUrgentRequest, setActiveUrgentRequest] = useState<IncomingRequestAlert | null>(null);

  const seenDepositIdsRef = useRef<Set<string>>(new Set());
  const seenWithdrawalIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef<boolean>(true);

  const pendingTotalCount = pendingDepositsCount + pendingWithdrawalsCount;

  const dismissUrgentRequest = () => {
    setActiveUrgentRequest(null);
  };

  const refreshPendingRequestsCount = async () => {
    if (!isAuthenticated) return;
    try {
      const conds: string[] = [];
      if (agent.dbId) conds.push(`agent_id.eq.${agent.dbId}`);
      if (agent.id) conds.push(`agent_code.eq.${agent.id}`);

      if (conds.length === 0) return;

      const [depRes, wthRes] = await Promise.all([
        supabase
          .from('deposit_requests')
          .select('id, request_code, amount, payment_method, transaction_ref, customer_name, customer_phone, status, created_at')
          .eq('status', 'pending')
          .or(conds.join(','))
          .order('created_at', { ascending: false }),
        supabase
          .from('withdrawal_requests')
          .select('id, request_code, amount, payment_method, account_number, recipient_account, reference, customer_name, customer_phone, status, created_at')
          .eq('status', 'pending')
          .or(conds.join(','))
          .order('created_at', { ascending: false })
      ]);

      const pendingDeps = depRes.data || [];
      const pendingWths = wthRes.data || [];

      setPendingDepositsCount(pendingDeps.length);
      setPendingWithdrawalsCount(pendingWths.length);

      // Check for brand new requests to play sound & show urgent alert
      if (isInitialFetchRef.current) {
        pendingDeps.forEach((d: any) => seenDepositIdsRef.current.add(d.id));
        pendingWths.forEach((w: any) => seenWithdrawalIdsRef.current.add(w.id));
        isInitialFetchRef.current = false;
      } else {
        // Find new deposit
        const newDep = pendingDeps.find((d: any) => !seenDepositIdsRef.current.has(d.id));
        if (newDep) {
          seenDepositIdsRef.current.add(newDep.id);
          soundAlert.playOrderChime(
            '🚨 New Cash-In Order!',
            `Customer ${newDep.customer_name || 'Player'} sent ৳${parseFloat(newDep.amount).toLocaleString()} via ${newDep.payment_method}`
          );
          setActiveUrgentRequest({
            id: newDep.id,
            type: 'deposit',
            requestCode: newDep.request_code,
            customerName: newDep.customer_name || 'Customer',
            customerPhone: newDep.customer_phone || '-',
            amount: parseFloat(newDep.amount) || 0,
            paymentMethod: newDep.payment_method || 'bKash',
            trxId: newDep.transaction_ref || '-',
            createdAt: newDep.created_at
          });
          showToast('warning', '🚨 New Cash-In Order!', `Customer deposit #${newDep.request_code} (৳${parseFloat(newDep.amount).toLocaleString()}) received for clearance.`);
        }

        // Find new withdrawal
        const newWth = pendingWths.find((w: any) => !seenWithdrawalIdsRef.current.has(w.id));
        if (newWth) {
          seenWithdrawalIdsRef.current.add(newWth.id);
          soundAlert.playOrderChime(
            '💸 New Cash-Out Order!',
            `Customer ${newWth.customer_name || 'Player'} requested payout of ৳${parseFloat(newWth.amount).toLocaleString()} via ${newWth.payment_method}`
          );
          setActiveUrgentRequest({
            id: newWth.id,
            type: 'withdrawal',
            requestCode: newWth.request_code,
            customerName: newWth.customer_name || 'Customer',
            customerPhone: newWth.customer_phone || '-',
            amount: parseFloat(newWth.amount) || 0,
            paymentMethod: newWth.payment_method || 'Rocket',
            trxId: newWth.recipient_account || newWth.reference || '-',
            createdAt: newWth.created_at
          });
          showToast('warning', '💸 New Cash-Out Order!', `Customer payout #${newWth.request_code} (৳${parseFloat(newWth.amount).toLocaleString()}) requested for clearance.`);
        }
      }
    } catch (err) {
      console.error('Failed to sync live pending orders count:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    soundAlert.requestNotificationPermission();
    refreshPendingRequestsCount();

    if (!isSupabaseConfigured()) return undefined;

    const channel = supabase
      .channel(`agent_pending_orders_${agent.id || agent.dbId || 'global'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_requests' }, () => {
        refreshPendingRequestsCount();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => {
        refreshPendingRequestsCount();
      })
      .subscribe();

    const interval = setInterval(refreshPendingRequestsCount, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isAuthenticated, agent.id, agent.dbId]);

  // PWA Events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallPromptAvailable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerPwaInstall = async () => {
    if (!deferredPrompt) {
      showToast('info', 'Install App', 'To install on this device, select "Install App" or "Add to Home Screen" in your browser menu.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('success', 'App Installed', 'Wallet Agent App installed successfully on your device.');
    }
    setDeferredPrompt(null);
    setIsInstallPromptAvailable(false);
  };

  // Sync state to localStorage for offline / demo persistence
  useEffect(() => {
    localStorage.setItem('wa_agent', JSON.stringify(agent));
  }, [agent]);

  useEffect(() => {
    localStorage.setItem('wa_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('wa_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('wa_commissions', JSON.stringify(commissions));
  }, [commissions]);

  useEffect(() => {
    localStorage.setItem('wa_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('wa_tickets', JSON.stringify(tickets));
  }, [tickets]);

  // Toast Helper
  const showToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Handlers
  const login = (customAgentData?: Partial<AgentProfile>) => {
    setIsAuthenticated(true);
    localStorage.setItem('wa_auth', 'true');

    // ALWAYS wipe all cached data on every login — DB sync will repopulate fresh data
    ['wa_transactions', 'wa_customers', 'wa_commissions', 'wa_notifications', 'wa_kycdocs'].forEach(k => localStorage.removeItem(k));
    setTransactions([]);
    setCustomers([]);
    setCommissions([]);
    setNotifications([]);

    const agentCode = customAgentData?.id || ('AG-' + Math.floor(10000 + Math.random() * 90000));
    const agentName = customAgentData?.name || (customAgentData?.email ? customAgentData.email.split('@')[0] : 'Agent User');
    const agentEmail = customAgentData?.email || 'agent@walletagent.com';
    const agentMobile = customAgentData?.mobile || '+8801700000000';

    const freshProfile: AgentProfile = {
      ...initialAgent,
      ...customAgentData,
      id: agentCode,
      name: agentName,
      email: agentEmail,
      mobile: agentMobile,
      balance: customAgentData?.balance ?? 0,
      pendingBalance: customAgentData?.pendingBalance ?? 0,
      commissionBalance: customAgentData?.commissionBalance ?? 0,
      todayDeposits: 0,
      todayWithdrawals: 0,
      todayVolume: 0,
      todayCommission: 0,
      referralCode: customAgentData?.referralCode || ('AGENT-' + agentCode.replace('AG-', ''))
    };

    setAgent(freshProfile);
    localStorage.setItem('wa_agent_profile', JSON.stringify(freshProfile));
    localStorage.setItem('wa_agent', JSON.stringify(freshProfile));

    setCurrentPage('dashboard');
    showToast('success', 'Authenticated', 'Welcome back, ' + agentName + '.');
    return true;
  };

  const logout = async () => {
    await authService.signOut();
    setIsAuthenticated(false);
    localStorage.setItem('wa_auth', 'false');
    ['wa_agent', 'wa_agent_profile', 'wa_transactions', 'wa_customers', 'wa_commissions', 'wa_notifications', 'wa_tickets', 'wa_kycdocs', 'wa_sessions'].forEach(k => localStorage.removeItem(k));
    setAgent(initialAgent);
    setCustomers(initialCustomers);
    setTransactions(initialTransactions);
    setCommissions(initialCommissions);
    setNotifications(initialNotifications);
    setCurrentPage('login');
    sessionStorage.removeItem('wa_current_page');
    showToast('info', 'Logged Out', 'Your session has been securely closed.');
  };

  // Security PIN Handlers
  const requestPinConfirmation = (title: string, subtitle: string, onVerified: () => void) => {
    setPinActionTitle(title);
    setPinActionSubtitle(subtitle);
    setPendingPinCallback(() => onVerified);
    setIsPinModalOpen(true);
  };

  const submitPin = (pin: string) => {
    if (pin.length === 4) {
      setIsPinModalOpen(false);
      if (pendingPinCallback) {
        pendingPinCallback();
        setPendingPinCallback(null);
      }
      return true;
    }
    showToast('error', 'Invalid PIN', 'Please enter a 4-digit numeric security PIN.');
    return false;
  };

  const closePinModal = () => {
    setIsPinModalOpen(false);
    setPendingPinCallback(null);
  };

  // Receipt Helpers
  const openReceipt = (tx: Transaction) => {
    setReceiptTx(tx);
    setIsReceiptOpen(true);
  };

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    setReceiptTx(null);
  };

  // Deposit Request with Supabase RPC
  const createDepositRequest = async (data: { 
    customerId: string; 
    amount: number; 
    paymentMethod: PaymentMethod; 
    reference: string; 
    notes?: string 
  }): Promise<Transaction> => {
    const cust = customers.find(c => c.id === data.customerId) || {
      name: 'Customer #' + data.customerId,
      mobile: '+1 (555) 000-0000'
    };

    const currentDepRate = commissionRatesRef.current.deposit;
    const currentClearanceRate = commissionRatesRef.current.clearance;
    const fee = parseFloat((data.amount * currentClearanceRate).toFixed(2));
    const netAmount = parseFloat((data.amount - fee).toFixed(2));
    const commissionEarned = parseFloat((data.amount * currentDepRate).toFixed(2));

    // Execute atomic Supabase RPC if live backend is connected
    if (isSupabaseConfigured()) {
      const res = await depositService.submitDepositRequest({
        customerId: data.customerId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        note: data.notes
      });
      if (res.error) {
        showToast('error', 'Deposit Failed', res.error);
      }
    }

    const newTx: Transaction = {
      id: 'TX-' + Math.floor(90000 + Math.random() * 9999),
      customerId: data.customerId,
      customerName: cust.name,
      customerPhone: cust.mobile,
      type: 'deposit',
      amount: data.amount,
      fee,
      netAmount,
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      notes: data.notes || '',
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      adminNote: 'Submitted via Authorized Agent Portal (Atomic RPC)',
      channelAccount: 'CITI-CLR-8900',
      receiptNumber: 'RCP-2026-' + Math.floor(10000 + Math.random() * 90000)
    };

    setTransactions(prev => [newTx, ...prev]);

    setAgent(prev => ({
      ...prev,
      pendingBalance: prev.pendingBalance + data.amount,
      todayVolume: prev.todayVolume + data.amount,
      todayDeposits: prev.todayDeposits + data.amount
    }));

    const newComm: CommissionRecord = {
      id: 'COM-' + Math.floor(5000 + Math.random() * 9999),
      date: newTx.createdAt,
      transactionId: newTx.id,
      type: 'deposit',
      transactionAmount: data.amount,
      commissionRate: currentDepRate,
      commissionAmount: commissionEarned,
      status: 'pending'
    };
    setCommissions(prev => [newComm, ...prev]);

    const notif: NotificationItem = {
      id: 'NOTIF-' + Date.now(),
      title: 'New Deposit Request Submitted',
      message: `Deposit of $${data.amount.toLocaleString()} for ${cust.name} is queued for automated clearing.`,
      type: 'transaction',
      timestamp: 'Just now',
      read: false,
      badge: `+$${data.amount.toLocaleString()}`
    };
    setNotifications(prev => [notif, ...prev]);

    showToast('success', 'Deposit Request Created', `Deposit #${newTx.id} submitted for $${data.amount.toLocaleString()}`);
    return newTx;
  };

  // Withdrawal Request with Supabase RPC
  const createWithdrawalRequest = async (data: { 
    customerId: string; 
    amount: number; 
    paymentMethod: PaymentMethod; 
    channelAccount: string;
    reference: string; 
    notes?: string 
  }): Promise<Transaction> => {
    const cust = customers.find(c => c.id === data.customerId) || {
      name: 'Customer #' + data.customerId,
      mobile: '+1 (555) 000-0000'
    };

    const currentWthRate = commissionRatesRef.current.withdrawal;
    const currentClearanceRate = commissionRatesRef.current.clearance;
    const fee = parseFloat((data.amount * currentClearanceRate).toFixed(2));
    const netAmount = parseFloat((data.amount - fee).toFixed(2));
    const commissionEarned = parseFloat((data.amount * currentWthRate).toFixed(2));

    if (isSupabaseConfigured()) {
      const res = await withdrawalService.submitWithdrawalRequest({
        customerId: data.customerId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        accountNumber: data.channelAccount,
        reference: data.reference,
        note: data.notes
      });
      if (res.error) {
        showToast('error', 'Withdrawal Error', res.error);
      }
    }

    const newTx: Transaction = {
      id: 'TX-' + Math.floor(90000 + Math.random() * 9999),
      customerId: data.customerId,
      customerName: cust.name,
      customerPhone: cust.mobile,
      type: 'withdrawal',
      amount: data.amount,
      fee,
      netAmount,
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      notes: data.notes || '',
      status: 'processing',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      adminNote: 'Routed to Instant Settlement Gateway (Atomic RPC)',
      channelAccount: data.channelAccount,
      receiptNumber: 'RCP-2026-' + Math.floor(10000 + Math.random() * 90000)
    };

    setTransactions(prev => [newTx, ...prev]);

    setAgent(prev => ({
      ...prev,
      balance: Math.max(0, prev.balance - data.amount),
      todayVolume: prev.todayVolume + data.amount,
      todayWithdrawals: prev.todayWithdrawals + data.amount,
      commissionBalance: prev.commissionBalance + commissionEarned
    }));

    const newComm: CommissionRecord = {
      id: 'COM-' + Math.floor(5000 + Math.random() * 9999),
      date: newTx.createdAt,
      transactionId: newTx.id,
      type: 'withdrawal',
      transactionAmount: data.amount,
      commissionRate: currentWthRate,
      commissionAmount: commissionEarned,
      status: 'credited'
    };
    setCommissions(prev => [newComm, ...prev]);

    const notif: NotificationItem = {
      id: 'NOTIF-' + Date.now(),
      title: 'Withdrawal Processing',
      message: `Withdrawal of $${data.amount.toLocaleString()} for ${cust.name} is executing.`,
      type: 'transaction',
      timestamp: 'Just now',
      read: false,
      badge: `-$${data.amount.toLocaleString()}`
    };
    setNotifications(prev => [notif, ...prev]);

    showToast('success', 'Withdrawal Processing', `Withdrawal #${newTx.id} of $${data.amount.toLocaleString()} has been dispatched.`);
    return newTx;
  };

  // Add Funds via Supabase RPC (Submitted as PENDING for Master Admin clearance)
  const addFunds = async (amount: number, method: PaymentMethod, ref: string) => {
    if (isSupabaseConfigured()) {
      await agentService.addFunds(amount, method, ref, agent.dbId, agent.name);
    }

    const newTx: Transaction = {
      id: 'TX-' + Math.floor(90000 + Math.random() * 9999),
      customerId: 'AGENT-SELF',
      customerName: agent.name + ' (Agent Topup)',
      customerPhone: agent.mobile,
      type: 'topup',
      amount,
      fee: 0,
      netAmount: amount,
      paymentMethod: method,
      reference: ref || 'BANK-WIRE-' + Math.floor(100000 + Math.random() * 900000),
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      adminNote: 'Pending Master Admin Clearance Approval',
      receiptNumber: 'RCP-TOPUP-' + Math.floor(10000 + Math.random() * 90000)
    };

    setTransactions(prev => [newTx, ...prev]);

    // Persist to localStorage for admin panel hybrid sync
    try {
      const existing = JSON.parse(localStorage.getItem('wa_transactions') || '[]');
      localStorage.setItem('wa_transactions', JSON.stringify([newTx, ...existing]));
    } catch {}

    setAgent(prev => ({
      ...prev,
      pendingBalance: prev.pendingBalance + amount
    }));

    showToast('info', 'Top-up Request Submitted ⏳', `Liquidity top-up of $${amount.toLocaleString()} submitted. Awaiting Master Admin clearance approval.`);
  };

  // Internal Transfer
  const transferFunds = (amount: number, recipient: string, note: string) => {
    if (amount > agent.balance) {
      showToast('error', 'Insufficient Funds', 'Available balance is less than transfer amount.');
      return;
    }

    const newTx: Transaction = {
      id: 'TX-' + Math.floor(90000 + Math.random() * 9999),
      customerId: recipient,
      customerName: recipient,
      customerPhone: 'N/A',
      type: 'transfer',
      amount,
      fee: 0,
      netAmount: amount,
      paymentMethod: 'Agent Wallet Transfer',
      reference: 'TRF-' + Math.floor(100000 + Math.random() * 900000),
      notes: note,
      status: 'success',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      adminNote: 'Peer Liquidity Transfer',
      receiptNumber: 'RCP-TRF-' + Math.floor(10000 + Math.random() * 90000)
    };

    setTransactions(prev => [newTx, ...prev]);
    setAgent(prev => ({
      ...prev,
      balance: prev.balance - amount
    }));

    showToast('success', 'Transfer Completed', `Successfully transferred $${amount.toLocaleString()} to ${recipient}.`);
  };

  // Status update with correct balance adjustments for all scenarios
  const updateTransactionStatus = async (txId: string, newStatus: TransactionStatus, adminNote?: string) => {
    // Find the transaction first to determine correct balance adjustments
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // ── DEPOSIT: Approved (pending → success) ─────────────────────────────────
    // Agent receives net amount into balance + commission is credited
    if (tx.type === 'deposit' && tx.status === 'pending' && newStatus === 'success') {
      const depRate = commissionRatesRef.current.deposit;
      const commissionEarned = parseFloat((tx.amount * depRate).toFixed(2));
      setAgent(ag => ({
        ...ag,
        balance: ag.balance + tx.netAmount,
        pendingBalance: Math.max(0, ag.pendingBalance - tx.amount),
        commissionBalance: ag.commissionBalance + commissionEarned,
        todayCommission: ag.todayCommission + commissionEarned
      }));
      // Add commission record
      const commRec: CommissionRecord = {
        id: 'COM-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        transactionId: tx.id,
        type: 'deposit',
        transactionAmount: tx.amount,
        commissionRate: depRate,
        commissionAmount: commissionEarned,
        status: 'credited'
      };
      setCommissions(prev => [commRec, ...prev]);
      // Notification
      const notif: NotificationItem = {
        id: 'NOTIF-' + Date.now(),
        title: 'Deposit Approved',
        message: `Deposit of $${tx.amount.toLocaleString()} for ${tx.customerName} cleared. Commission +$${commissionEarned.toFixed(2)} earned.`,
        type: 'transaction',
        timestamp: 'Just now',
        read: false,
        badge: `+$${tx.netAmount.toLocaleString()}`
      };
      setNotifications(prev => [notif, ...prev]);
      showToast('success', 'Deposit Approved ✓', `+$${tx.netAmount.toLocaleString()} added to balance. Commission: +$${commissionEarned.toFixed(2)}`);
    }

    // ── DEPOSIT: Rejected (pending → rejected) ─────────────────────────────────
    // ── TOPUP: Approved by Admin (pending → success) ───────────────────────────
    // Credit agent available balance after Master Admin confirmation
    else if (tx.type === 'topup' && tx.status === 'pending' && newStatus === 'success') {
      setAgent(ag => {
        const newBal = ag.balance + tx.amount;
        const isVerified = ag.kycStatus === 'verified';
        // Tier 2: $200+ AND KYC verified. Tier 3: $1000+ AND KYC verified. Otherwise Tier 1.
        const newTier = (isVerified && newBal >= 1000)
          ? 'Tier 3 (Master Agent)'
          : (isVerified && newBal >= 200)
          ? 'Tier 2 (Business)'
          : 'Tier 1 (Basic)';
        return {
          ...ag,
          balance: newBal,
          pendingBalance: Math.max(0, ag.pendingBalance - tx.amount),
          kycLevel: newTier
        };
      });
      showToast('success', 'Top-up Approved ✓', `Master Admin approved $${tx.amount.toLocaleString()} top-up. Available balance updated.`);
    }

    // ── TOPUP: Rejected by Admin (pending → rejected) ──────────────────────────
    else if (tx.type === 'topup' && tx.status === 'pending' && newStatus === 'rejected') {
      setAgent(ag => ({
        ...ag,
        pendingBalance: Math.max(0, ag.pendingBalance - tx.amount)
      }));
      showToast('warning', 'Top-up Rejected', `Top-up #${tx.id} for $${tx.amount.toLocaleString()} rejected by Master Admin.`);
    }

    // ── WITHDRAWAL: Completed (processing → success) ───────────────────────────
    // Balance was already deducted when created; just confirm and add commission
    else if (tx.type === 'withdrawal' && tx.status === 'processing' && newStatus === 'success') {
      const wthRate = commissionRatesRef.current.withdrawal;
      const commissionEarned = parseFloat((tx.amount * wthRate).toFixed(2));
      setAgent(ag => ({
        ...ag,
        commissionBalance: ag.commissionBalance + commissionEarned,
        todayCommission: ag.todayCommission + commissionEarned
      }));
      const commRec: CommissionRecord = {
        id: 'COM-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        transactionId: tx.id,
        type: 'withdrawal',
        transactionAmount: tx.amount,
        commissionRate: wthRate,
        commissionAmount: commissionEarned,
        status: 'credited'
      };
      setCommissions(prev => [commRec, ...prev]);
      const notif: NotificationItem = {
        id: 'NOTIF-' + Date.now(),
        title: 'Withdrawal Completed',
        message: `Withdrawal of $${tx.amount.toLocaleString()} to ${tx.customerName} has been completed. Commission +$${commissionEarned.toFixed(2)} earned.`,
        type: 'transaction',
        timestamp: 'Just now',
        read: false,
        badge: `+$${commissionEarned.toFixed(2)}`
      };
      setNotifications(prev => [notif, ...prev]);
      showToast('success', 'Withdrawal Completed ✓', `Payout confirmed. Commission: +$${commissionEarned.toFixed(2)}`);
    }

    // ── WITHDRAWAL: Cancelled (processing → rejected) ──────────────────────────
    // Balance was already deducted — must be RESTORED to agent float
    else if (tx.type === 'withdrawal' && tx.status === 'processing' && newStatus === 'rejected') {
      setAgent(ag => ({
        ...ag,
        balance: ag.balance + tx.amount,
        todayWithdrawals: Math.max(0, ag.todayWithdrawals - tx.amount)
      }));
      const notif: NotificationItem = {
        id: 'NOTIF-' + Date.now(),
        title: 'Withdrawal Cancelled',
        message: `Withdrawal #${tx.id} cancelled. $${tx.amount.toLocaleString()} has been returned to your balance.`,
        type: 'security',
        timestamp: 'Just now',
        read: false,
        badge: `+$${tx.amount.toLocaleString()} refunded`
      };
      setNotifications(prev => [notif, ...prev]);
      showToast('info', 'Withdrawal Cancelled', `$${tx.amount.toLocaleString()} returned to your available balance.`);
    }

    // Update the transaction record itself
    setTransactions(prev => prev.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          status: newStatus,
          adminNote: adminNote || t.adminNote,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return t;
    }));

    if (selectedTransaction && selectedTransaction.id === txId) {
      setSelectedTransaction(prev => prev ? { ...prev, status: newStatus, adminNote: adminNote || prev.adminNote } : null);
    }
  };

  // Enroll Customer via Supabase customerService
  const addCustomer = async (data: Omit<Customer, 'id' | 'joinedDate' | 'totalDeposits' | 'totalWithdrawals' | 'balance' | 'lastActivity'>): Promise<Customer> => {
    if (isSupabaseConfigured()) {
      await customerService.createCustomer({
        full_name: data.name,
        phone: data.mobile,
        status: data.kycStatus === 'verified' ? 'active' : 'pending_verification'
      });
    }

    const newCust: Customer = {
      id: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
      ...data,
      totalDeposits: 0,
      totalWithdrawals: 0,
      balance: 0,
      lastActivity: 'Just added',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => [newCust, ...prev]);
    setAgent(prev => ({ ...prev, activeCustomersCount: prev.activeCustomersCount + 1 }));
    showToast('success', 'Customer Enrolled', `${data.name} has been added to your customer directory.`);
    return newCust;
  };

  // Commission Claim via Supabase RPC
  const claimCommission = async (amount: number) => {
    if (amount <= 0) {
      showToast('error', 'Invalid Amount', 'No commission balance available to claim.');
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('claim_agent_commission', { p_amount: amount });
        if (error) {
          // fallback: update directly
          const agentRes = await supabase.from('agents').select('id, balance, total_commission').limit(1).single();
          if (agentRes.data) {
            const newBal = (parseFloat(agentRes.data.balance) || 0) + amount;
            const newComm = Math.max(0, (parseFloat(agentRes.data.total_commission) || 0) - amount);
            await supabase.from('agents').update({ balance: newBal, total_commission: newComm }).eq('id', agentRes.data.id);
          }
        }
      } catch (err) {
        console.error('Commission claim error:', err);
      }
    }

    setAgent(prev => ({
      ...prev,
      commissionBalance: Math.max(0, prev.commissionBalance - amount),
      balance: prev.balance + amount,
      todayCommission: Math.max(0, prev.todayCommission - amount)
    }));
    showToast('success', '💰 Commission Claimed!', `$${amount.toFixed(2)} successfully swept into your available float balance.`);
  };

  // Sub-agents
  const inviteSubAgent = async (name: string, email: string, mobile: string, location: string) => {
    const parentCode = agent.id || 'AG-55353';
    const newSub = await subAgentService.createSubAgent(parentCode, { name, email, mobile, location });
    setSubAgents(prev => [newSub, ...prev.filter(s => s.id !== newSub.id)]);
    showToast('success', 'Invitation Dispatched', `Partner invite registered in Supabase database. Tracking ID: ${newSub.id}`);
  };

  // Notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    // Persist read state separately so it survives app restarts
    const readIds: string[] = JSON.parse(localStorage.getItem('wa_notif_read_ids') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('wa_notif_read_ids', JSON.stringify(readIds));
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Persist all current notification IDs as read
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('wa_notif_read_ids', JSON.stringify(allIds));
    showToast('info', 'Notifications Cleared', 'All notifications marked as read.');
  };

  // Support
  const createTicket = async (subject: string, category: SupportTicket['category'], priority: SupportTicket['priority'], message: string) => {
    if (isSupabaseConfigured()) {
      await supportService.createTicket({
        subject,
        category,
        message
      });
    }

    const newTicket: SupportTicket = {
      id: 'TCK-' + Math.floor(8000 + Math.random() * 9999),
      subject,
      category,
      priority,
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      lastUpdated: 'Just now',
      messages: [
        {
          id: 'M-' + Date.now(),
          sender: 'agent',
          senderName: agent.name + ' (Agent)',
          text: message,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ]
    };
    setTickets(prev => [newTicket, ...prev]);
    showToast('success', 'Support Ticket Created', `Ticket #${newTicket.id} logged. A treasury analyst will respond shortly.`);
  };

  const addTicketMessage = (ticketId: string, message: string) => {
    const userMsg = {
      id: 'M-' + Date.now(),
      sender: 'agent' as const,
      senderName: agent.name + ' (Agent)',
      text: message,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          lastUpdated: 'Just now',
          messages: [...t.messages, userMsg]
        };
      }
      return t;
    }));

    setTimeout(() => {
      const autoResp = {
        id: 'M-' + (Date.now() + 1),
        sender: 'support' as const,
        senderName: 'Fintech Operations Specialist #109',
        text: 'Thank you for the update. Our treasury ops team is reviewing the settlement logs and will update the transaction pipeline.',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'in_progress',
            lastUpdated: 'Just now',
            messages: [...t.messages, autoResp]
          };
        }
        return t;
      }));
    }, 2000);
  };

  // KYC Storage Upload & Supabase Record Creation
  const uploadKycDoc = async (docType: KycDocument['documentType'], file: File) => {
    let storagePath: string | undefined = undefined;
    let fileUrl: string | undefined = undefined;

    const { path, url, error } = await storageService.uploadKycDocument(file, agent.id);
    if (error) {
      showToast('error', 'Upload Warning', error);
    } else if (path) {
      storagePath = path;
      fileUrl = url || undefined;
    }

    const docId = 'DOC-' + Math.floor(1000 + Math.random() * 9000);

    const newDoc: KycDocument = {
      id: docId,
      title: docType,
      documentType: docType,
      fileName: file.name,
      fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      status: 'pending',
      uploadedAt: new Date().toISOString().split('T')[0],
      storagePath,
      fileUrl
    };

    // Insert into Supabase kyc_documents table for Master Admin review
    try {
      await supabase.from('kyc_documents').insert({
        doc_id: docId,
        agent_code: agent.id,
        title: docType,
        document_type: docType,
        file_name: file.name,
        file_size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        file_url: fileUrl || null,
        storage_path: storagePath || null,
        status: 'pending'
      });

      if (agent.dbId) {
        await supabase.from('agents').update({ verification_status: 'under_review' }).eq('id', agent.dbId);
      }
    } catch (err) {
      console.error('Supabase KYC insert error:', err);
    }

    setAgent(prev => ({ ...prev, kycStatus: 'pending', kycLevel: 'Under Review' }));
    setKycDocs(prev => [newDoc, ...prev]);
    showToast('success', 'Submitted for Review 📄', `${file.name} uploaded & dispatched to Master Admin clearance queue.`);
  };

  // Sessions
  const terminateSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    showToast('info', 'Session Terminated', 'Selected device has been signed out.');
  };

  const terminateAllOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    showToast('success', 'Security Reset', 'All other active sessions have been disconnected.');
  };

  const updateAgentProfile = async (updates: Partial<AgentProfile>) => {
    setAgent(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('wa_agent', JSON.stringify(updated));
      localStorage.setItem('wa_agent_profile', JSON.stringify(updated));
      return updated;
    });

    const activeDbId = agent.dbId;
    if (activeDbId) {
      try {
        const updatePayload: Record<string, any> = {};
        if (updates.businessName !== undefined) updatePayload.business_name = updates.businessName;
        if (updates.address !== undefined) updatePayload.address = updates.address;
        if (updates.city !== undefined) updatePayload.city = updates.city;
        if (updates.district !== undefined) updatePayload.district = updates.district;
        if (updates.nidNumber !== undefined) updatePayload.nid_number = updates.nidNumber;
        if (updates.emergencyContact !== undefined) updatePayload.emergency_contact = updates.emergencyContact;
        if (updates.avatar !== undefined) updatePayload.avatar_url = updates.avatar;

        if (Object.keys(updatePayload).length > 0) {
          await supabase.from('agents').update(updatePayload).eq('id', activeDbId);
        }
      } catch (err) {
        console.error('Failed to sync profile update to Supabase:', err);
      }
    }
  };

  const isMasterAgent = Boolean(
    agent.kycLevel?.toLowerCase().includes('tier 3') || 
    agent.kycLevel?.toLowerCase().includes('master') || 
    agent.balance >= 1000
  );

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        isDarkMode,
        toggleDarkMode,
        isAuthenticated,
        login,
        logout,
        agent,
        isMasterAgent,
        updateAgentProfile,
        addFunds,
        transferFunds,
        customers,
        selectedCustomer,
        setSelectedCustomer,
        isCustomerDrawerOpen,
        setIsCustomerDrawerOpen,
        addCustomer,
        transactions,
        selectedTransaction,
        setSelectedTransaction,
        isDetailOpen,
        setIsDetailOpen,
        createDepositRequest,
        createWithdrawalRequest,
        updateTransactionStatus,
        receiptTx,
        isReceiptOpen,
        openReceipt,
        closeReceipt,
        isPinModalOpen,
        pinActionTitle,
        pinActionSubtitle,
        requestPinConfirmation,
        submitPin,
        closePinModal,
        commissions,
        claimCommission,
        subAgents,
        inviteSubAgent,
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        tickets,
        createTicket,
        addTicketMessage,
        kycDocs,
        uploadKycDoc,
        sessions,
        terminateSession,
        terminateAllOtherSessions,
        toasts,
        showToast,
        removeToast,
        exchangeRates,
        telegramUsername,
        telegramSupportUrl,
        bdtExchangeRate,
        commissionRates,
        allTierRates,
        agentTierNum,
        isInstallPromptAvailable,
        triggerPwaInstall,
        isOnline,
        isSupabaseBackendActive,
        pendingDepositsCount,
        pendingWithdrawalsCount,
        pendingTotalCount,
        activeUrgentRequest,
        dismissUrgentRequest,
        refreshPendingRequestsCount
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
