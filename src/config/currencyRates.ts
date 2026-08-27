/**
 * Currency Exchange Rates Configuration
 *
 * Flow: Agent receives USD from Binance → system shows local currency equivalent.
 * Internal balance is always stored as USD. Display converts USD → local currency.
 *
 * Admin panel (coming soon) will allow updating rates via the dashboard.
 * Rates are stored in localStorage: 'wa_exchange_rates'
 */

export interface CurrencyRate {
  code: string;       // ISO code e.g. 'BDT'
  name: string;       // Display name
  symbol: string;     // Currency symbol
  flag: string;       // Emoji flag
  ratePerUSD: number; // 1 USD = X local units  (e.g. 1 USD = 110 BDT)
}

// Default rates — admin will override these via the rate settings panel
const DEFAULT_RATES: CurrencyRate[] = [
  { code: 'USD', name: 'US Dollar',          symbol: '$',  flag: '🇺🇸', ratePerUSD: 1     },
  { code: 'BDT', name: 'Bangladeshi Taka',   symbol: '৳',  flag: '🇧🇩', ratePerUSD: 110   },
  { code: 'INR', name: 'Indian Rupee',        symbol: '₹',  flag: '🇮🇳', ratePerUSD: 83    },
  { code: 'PKR', name: 'Pakistani Rupee',     symbol: '₨',  flag: '🇵🇰', ratePerUSD: 278   },
];

/** Get current exchange rates (from localStorage if admin has set, else defaults) */
export const getExchangeRates = (): CurrencyRate[] => {
  try {
    const saved = localStorage.getItem('wa_exchange_rates');
    if (saved) return JSON.parse(saved) as CurrencyRate[];
  } catch { /* ignore */ }
  return DEFAULT_RATES;
};

/** Get a single currency by code */
export const getCurrency = (code: string): CurrencyRate => {
  const rates = getExchangeRates();
  return rates.find(r => r.code === code) ?? rates[0];
};

/** Save rates (used by admin panel) */
export const saveExchangeRates = (rates: CurrencyRate[]): void => {
  localStorage.setItem('wa_exchange_rates', JSON.stringify(rates));
};

/**
 * Convert USD → local currency
 * e.g. usdToLocal(100, 'BDT') → 11000
 */
export const usdToLocal = (usdAmount: number, currencyCode: string): number => {
  if (currencyCode === 'USD') return usdAmount;
  const c = getCurrency(currencyCode);
  return parseFloat((usdAmount * c.ratePerUSD).toFixed(2));
};

/**
 * Convert local currency → USD
 * e.g. localToUsd(11000, 'BDT') → 100
 */
export const localToUsd = (localAmount: number, currencyCode: string): number => {
  if (currencyCode === 'USD') return localAmount;
  const c = getCurrency(currencyCode);
  if (c.ratePerUSD === 0) return 0;
  return parseFloat((localAmount / c.ratePerUSD).toFixed(2));
};

/** Format with currency symbol */
export const formatCurrency = (amount: number, currencyCode: string): string => {
  const c = getCurrency(currencyCode);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: currencyCode === 'USD' ? 2 : 0,
    maximumFractionDigits: currencyCode === 'USD' ? 2 : 0,
  });
  return `${c.symbol}${formatted}`;
};

/** Get the agent's preferred display currency from localStorage */
export const getPreferredCurrency = (): string => {
  return localStorage.getItem('wa_preferred_currency') || 'BDT';
};

/** Save the agent's preferred display currency */
export const setPreferredCurrency = (code: string): void => {
  localStorage.setItem('wa_preferred_currency', code);
};
