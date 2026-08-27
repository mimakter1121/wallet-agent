/**
 * Agent Collection Accounts System
 * 
 * Allows agents/admins to manage collection numbers & accounts (bKash, Nagad, Rocket, Upay)
 * with Account Category (Personal / Agent / Merchant) and Active / Inactive status toggle.
 */

export type CollectionProvider = 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Bank Transfer' | 'Crypto' | 'Other';
export type AccountCategory = 'personal' | 'agent' | 'merchant';

export interface CollectionAccount {
  id: string;
  agentCode?: string;
  provider: CollectionProvider;
  accountCategory: AccountCategory; // 'personal' | 'agent' | 'merchant'
  accountNumber: string;            // Phone number or account number (e.g. 01700-000000)
  accountName: string;              // Friendly title (e.g. "bKash Agent Vault 1")
  status: 'active' | 'inactive';
  dailyLimit?: number;              // Optional daily processing limit
  notes?: string;                   // Audit notes
  createdAt: string;
}

// Initial Collection Accounts — starts blank, added dynamically by agent/admin
export const DEFAULT_COLLECTION_ACCOUNTS: CollectionAccount[] = [];

/** Get all collection accounts from localStorage (or defaults) */
export const getCollectionAccounts = (): CollectionAccount[] => {
  try {
    const saved = localStorage.getItem('wa_collection_accounts');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_COLLECTION_ACCOUNTS;
};

/** Save collection accounts list */
export const saveCollectionAccounts = (accounts: CollectionAccount[]): void => {
  localStorage.setItem('wa_collection_accounts', JSON.stringify(accounts));
};

/** Add a new collection account */
export const addCollectionAccount = (
  account: Omit<CollectionAccount, 'id' | 'createdAt'>
): CollectionAccount => {
  const current = getCollectionAccounts();
  const newAccount: CollectionAccount = {
    ...account,
    id: 'ACC-' + Math.floor(10000 + Math.random() * 90000),
    createdAt: new Date().toISOString().substring(0, 10)
  };
  const updated = [newAccount, ...current];
  saveCollectionAccounts(updated);
  return newAccount;
};

/** Toggle active/inactive status */
export const toggleCollectionAccountStatus = (id: string): CollectionAccount[] => {
  const current = getCollectionAccounts();
  const updated = current.map(acc => {
    if (acc.id === id) {
      return {
        ...acc,
        status: (acc.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive'
      };
    }
    return acc;
  });
  saveCollectionAccounts(updated);
  return updated;
};

/** Delete a collection account */
export const deleteCollectionAccount = (id: string): CollectionAccount[] => {
  const current = getCollectionAccounts();
  const updated = current.filter(acc => acc.id !== id);
  saveCollectionAccounts(updated);
  return updated;
};

/** Get only ACTIVE collection accounts (for deposit select lists) */
export const getActiveCollectionAccounts = (): CollectionAccount[] => {
  return getCollectionAccounts().filter(acc => acc.status === 'active');
};
