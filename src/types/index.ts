export type TransactionType = 'deposit' | 'withdrawal' | 'commission' | 'transfer' | 'topup';

export type TransactionStatus = 'success' | 'pending' | 'processing' | 'rejected';

export type PaymentMethod = 
  | 'Bank Transfer (ACH/SEPA)' 
  | 'Instant Wire' 
  | 'Mobile Money (M-Pesa/Bkash/Nagad)' 
  | 'Card Settlement (Visa/Mastercard)' 
  | 'Fast Settlement Network'
  | 'Agent Wallet Transfer';

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: TransactionType;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  notes?: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
  channelAccount?: string;
  receiptNumber: string;
}

export type KycStatus = 'verified' | 'pending' | 'under_review' | 'rejected' | 'unverified';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  kycStatus: KycStatus;
  totalDeposits: number;
  totalWithdrawals: number;
  balance: number;
  lastActivity: string;
  joinedDate: string;
  avatar?: string;
  notes?: string;
  accountNumber: string;
}

export interface AgentProfile {
  id: string;
  dbId?: string;
  name: string;
  mobile: string;
  email: string;
  role: string;
  kycLevel: 'Tier 1 (Basic)' | 'Tier 2 (Business)' | 'Tier 3 (Master Agent)';
  kycStatus: KycStatus;
  balance: number;
  pendingBalance: number;
  commissionBalance: number;
  reserveBalance: number;
  todayVolume: number;
  todayDeposits: number;
  todayWithdrawals: number;
  todayCommission: number;
  activeCustomersCount: number;
  avatar: string;
  isOnline: boolean;
  referralCode: string;
  pinSet: boolean;
  twoFactorEnabled: boolean;
  registrationDate: string;
  businessName?: string;
  address?: string;
  city?: string;
  district?: string;
  nidNumber?: string;
  emergencyContact?: string;
}

export interface SubAgent {
  id: string;
  name: string;
  mobile: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  todayVolume: number;
  totalVolume: number;
  commissionEarned: number;
  joinedDate: string;
  directReferrals: number;
  location: string;
}

export interface CommissionRecord {
  id: string;
  date: string;
  transactionId: string;
  type: 'deposit' | 'withdrawal' | 'referral' | 'adjustment';
  transactionAmount: number;
  commissionRate: number; // e.g. 0.015 for 1.5%
  commissionAmount: number;
  status: 'credited' | 'pending' | 'paid';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'transaction' | 'security' | 'commission' | 'system';
  timestamp: string;
  read: boolean;
  link?: string;
  badge?: string;
}

export interface SupportTicketMessage {
  id: string;
  sender: 'agent' | 'support';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: 'Deposit Processing' | 'Withdrawal Issue' | 'KYC & Limits' | 'Commission Claim' | 'Technical / Security';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  lastUpdated: string;
  messages: SupportTicketMessage[];
}

export interface KycDocument {
  id: string;
  title: string;
  documentType: 'National ID (NID)' | 'Passport' | 'Bank Statement';
  fileName: string;
  fileSize: string;
  status: 'verified' | 'pending' | 'rejected';
  uploadedAt: string;
  storagePath?: string;
  fileUrl?: string;
  feedback?: string;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}
