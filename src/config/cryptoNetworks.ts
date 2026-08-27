/**
 * Configurable Payment Channels & Networks System
 *
 * Admin configures channels, exchange rates, and wallet addresses.
 * User interface only displays clean Payment Network details (e.g. TRC20 Network, BEP20 Network, Bank Wire),
 * keeping third-party wallet app branding hidden.
 */

export interface PaymentChannel {
  id: string;
  name: string;            // e.g. "USDT (TRC20 Network)"
  category: 'crypto' | 'fiat' | 'mobile'; // Channel type
  coinSymbol: string;      // e.g. "USDT", "USD", "BDT"
  networkName: string;     // e.g. "TRC20 (Tron)", "BEP20 (BSC)"
  badgeText: string;       // e.g. "Instant", "Low Fee", "Popular"
  badgeColor: string;
  iconBg: string;
  iconColor: string;
  minDepositUSD: number;
  estFee: string;
  processingTime: string;
  popular: boolean;
  enabled: boolean;
}

// Default Channels configured by Admin System
export const DEFAULT_CHANNELS: PaymentChannel[] = [
  {
    id: 'usdt_trc20',
    name: 'USDT (TRC20 Network)',
    category: 'crypto',
    coinSymbol: 'USDT',
    networkName: 'TRC20 Network',
    badgeText: 'Lowest Fee',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    minDepositUSD: 10,
    estFee: '~$0.10',
    processingTime: '< 1 min',
    popular: true,
    enabled: true
  },
  {
    id: 'usdt_bep20',
    name: 'USDT (BEP20 Network)',
    category: 'crypto',
    coinSymbol: 'USDT',
    networkName: 'BEP20 Network (BSC)',
    badgeText: 'Popular',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
    minDepositUSD: 10,
    estFee: '~$0.20',
    processingTime: '1-3 mins',
    popular: true,
    enabled: true
  },
  {
    id: 'usdt_ton',
    name: 'USDT (TON Network)',
    category: 'crypto',
    coinSymbol: 'USDT',
    networkName: 'TON Network',
    badgeText: 'Ultra Fast',
    badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    iconBg: 'bg-sky-50 dark:bg-sky-950/60',
    iconColor: 'text-sky-600 dark:text-sky-400',
    minDepositUSD: 5,
    estFee: '~$0.01',
    processingTime: 'Instant',
    popular: false,
    enabled: true
  },
  {
    id: 'usdt_erc20',
    name: 'USDT (ERC20 Network)',
    category: 'crypto',
    coinSymbol: 'USDT',
    networkName: 'ERC20 Network (Ethereum)',
    badgeText: 'Standard',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    minDepositUSD: 50,
    estFee: '~$3.50',
    processingTime: '3-5 mins',
    popular: false,
    enabled: true
  },
  {
    id: 'bank_wire',
    name: 'Bank Direct Clearance Rail',
    category: 'fiat',
    coinSymbol: 'USD',
    networkName: 'ACH / FedWire Rail',
    badgeText: 'High Limit',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    minDepositUSD: 100,
    estFee: 'Zero Fee',
    processingTime: 'Same Day',
    popular: false,
    enabled: true
  },
  {
    id: 'mobile_momo',
    name: 'Mobile Clearance Gateway',
    category: 'mobile',
    coinSymbol: 'LOCAL',
    networkName: 'Mobile Money Gateway',
    badgeText: 'Local Express',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    iconBg: 'bg-purple-50 dark:bg-purple-950/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
    minDepositUSD: 5,
    estFee: '0.5%',
    processingTime: 'Instant',
    popular: true,
    enabled: true
  }
];

export interface ChannelAddresses {
  [channelId: string]: string; // channelId -> Address / Account Details
}

/** Get configured active channels (Admin editable) */
export const getActiveChannels = (): PaymentChannel[] => {
  try {
    const saved = localStorage.getItem('wa_admin_channels');
    if (saved) return JSON.parse(saved) as PaymentChannel[];
  } catch { /* ignore */ }
  return DEFAULT_CHANNELS;
};

/** Save channels configuration (Admin panel interface) */
export const saveAdminChannels = (channels: PaymentChannel[]): void => {
  localStorage.setItem('wa_admin_channels', JSON.stringify(channels));
};

/** Get channel addresses / accounts set by Admin */
export const getChannelAddresses = (): ChannelAddresses => {
  try {
    const saved = localStorage.getItem('wa_channel_addresses');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {};
};

/** Save channel addresses (Admin panel interface) */
export const saveChannelAddresses = (addresses: ChannelAddresses): void => {
  localStorage.setItem('wa_channel_addresses', JSON.stringify(addresses));
};
