import { 
  AgentProfile, 
  Customer, 
  Transaction, 
  CommissionRecord, 
  SubAgent, 
  NotificationItem, 
  SupportTicket, 
  KycDocument, 
  ActiveSession 
} from '../types';

export const initialAgent: AgentProfile = {
  id: '',
  name: '',
  mobile: '',
  email: '',
  role: 'Liquidity Agent',
  kycLevel: 'Tier 1 (Basic)',
  kycStatus: 'unverified',
  balance: 0.00,
  pendingBalance: 0.00,
  commissionBalance: 0.00,
  reserveBalance: 0.00,
  todayVolume: 0.00,
  todayDeposits: 0.00,
  todayWithdrawals: 0.00,
  todayCommission: 0.00,
  activeCustomersCount: 0,
  avatar: '',
  isOnline: true,
  referralCode: '',
  pinSet: false,
  twoFactorEnabled: false,
  registrationDate: new Date().toISOString().substring(0, 10),
  businessName: '',
  address: '',
  city: '',
  district: '',
  nidNumber: '',
  emergencyContact: ''
};

export const initialCustomers: Customer[] = [];
export const initialTransactions: Transaction[] = [];
export const initialCommissions: CommissionRecord[] = [];
export const initialSubAgents: SubAgent[] = [];
export const initialNotifications: NotificationItem[] = [];
export const initialTickets: SupportTicket[] = [];
export const initialKycDocs: KycDocument[] = [];
export const initialSessions: ActiveSession[] = [];
