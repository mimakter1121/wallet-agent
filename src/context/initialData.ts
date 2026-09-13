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
  id: 'AG-55353',
  dbId: 'e3f85535-3000-4000-8000-000000055353',
  name: 'Maruf Hossain',
  mobile: '01755353888',
  email: 'maruf55353@gmail.com',
  role: 'Liquidity Agent',
  kycLevel: 'Tier 3 (Master Agent)',
  kycStatus: 'verified',
  balance: 39143.42,
  pendingBalance: 0.00,
  commissionBalance: 0.00,
  reserveBalance: 0.00,
  todayVolume: 0.00,
  todayDeposits: 0.00,
  todayWithdrawals: 0.00,
  todayCommission: 0.00,
  activeCustomersCount: 0,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  isOnline: true,
  referralCode: 'AGENT-55353',
  pinSet: true,
  twoFactorEnabled: false,
  registrationDate: '2026-06-09',
  businessName: 'Hossain Digital Agency',
  address: 'House 24, Road 11, Sector 4, Uttara',
  city: 'Dhaka',
  district: 'Dhaka',
  nidNumber: '5538910482910',
  emergencyContact: '01711998877'
};

export const initialCustomers: Customer[] = [];
export const initialTransactions: Transaction[] = [];
export const initialCommissions: CommissionRecord[] = [];
export const initialSubAgents: SubAgent[] = [];
export const initialNotifications: NotificationItem[] = [];
export const initialTickets: SupportTicket[] = [];
export const initialKycDocs: KycDocument[] = [];
export const initialSessions: ActiveSession[] = [];
