export interface ExchangeRate {
  code: string;       // BDT, INR, PKR, USD
  name: string;
  symbol: string;
  flag: string;
  ratePerUSD: number; // 1 USD = X Local
  lastUpdated: string;
}

export type ChannelCategory = 'mobile' | 'crypto' | 'bank';
export type AccountCategory = 'agent' | 'personal' | 'merchant';

export interface PaymentChannel {
  id: string;
  name: string;
  category: ChannelCategory;
  accountCategory: AccountCategory; // 'personal' | 'agent' | 'merchant'
  accountNumber: string;            // e.g. 01711-223344
  provider: string;                 // bKash, Nagad, Rocket, Upay, TRC20, etc.
  badgeText: string;
  status: 'active' | 'inactive';
  minDepositUSD: number;
  estFee: string;
  notes?: string;
  createdAt: string;
  qr_code_url?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  balance: number;
  pendingBalance: number;
  commissionBalance: number;
  kycStatus: 'verified' | 'pending' | 'under_review' | 'rejected' | 'unverified';
  active: boolean;
  createdAt: string;
}

export interface PlatformTransaction {
  id: string;
  agentName: string;
  customerName: string;
  type: 'deposit' | 'withdrawal' | 'topup' | 'transfer';
  amountUSD: number;
  localAmount: string;
  paymentMethod: string;
  reference: string;
  status: 'pending' | 'processing' | 'success' | 'rejected';
  createdAt: string;
}

export interface AdminStats {
  totalVolumeUSD: number;
  pendingClearanceUSD: number;
  totalAgents: number;
  activeChannelsCount: number;
  totalCommissionsUSD: number;
}
