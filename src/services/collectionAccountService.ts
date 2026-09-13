import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { CollectionAccount, getCollectionAccounts, saveCollectionAccounts } from '../config/collectionAccounts';

export const collectionAccountService = {
  // Fetch Agent's own collection accounts (bKash, Nagad, Rocket, Upay) - STRICTLY ISOLATED BY AGENT
  async fetchAllAccounts(agentCode?: string): Promise<CollectionAccount[]> {
    const cleanCode = agentCode?.trim();

    if (isSupabaseConfigured() && cleanCode) {
      try {
        const { data, error } = await supabase
          .from('collection_accounts')
          .select('*')
          .eq('agent_code', cleanCode)
          .not('provider', 'ilike', '%USDT%')
          .not('notes', 'ilike', '%Treasury%')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: CollectionAccount[] = data.map((item: any) => ({
            id: item.id,
            agentCode: item.agent_code,
            provider: item.provider as any,
            accountCategory: item.account_category as any,
            accountNumber: item.account_number,
            accountName: item.account_name,
            status: item.status as any,
            dailyLimit: item.daily_limit,
            notes: item.notes,
            createdAt: item.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10)
          }));

          return mapped;
        }
      } catch (err) {
        console.error('Error fetching collection accounts from Supabase:', err);
      }
    }

    if (cleanCode) {
      return getCollectionAccounts().filter(acc => acc.agentCode === cleanCode);
    }
    return [];
  },

  // Fetch ACTIVE collection accounts for Customer Portal dispatch
  async fetchActiveAccounts(agentCode?: string): Promise<CollectionAccount[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('collection_accounts')
          .select('*')
          .eq('status', 'active')
          .not('provider', 'ilike', '%USDT%')
          .not('notes', 'ilike', '%Treasury%');

        if (agentCode && agentCode.trim()) {
          query = query.eq('agent_code', agentCode.trim());
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            agentCode: item.agent_code,
            provider: item.provider as any,
            accountCategory: item.account_category as any,
            accountNumber: item.account_number,
            accountName: item.account_name,
            status: item.status as any,
            dailyLimit: item.daily_limit,
            notes: item.notes,
            createdAt: item.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10)
          }));
        }
      } catch (err) {
        console.error('Error fetching active collection accounts from Supabase:', err);
      }
    }
    return getCollectionAccounts().filter(acc => 
      acc.status === 'active' && 
      (!agentCode || acc.agentCode === agentCode) &&
      !acc.notes?.includes('Treasury') && 
      !acc.provider.includes('USDT')
    );
  },

  // Fetch Admin Platform Treasury Accounts (for AddFundsModal)
  async fetchTreasuryAccounts(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('treasury_accounts')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.error('Error fetching treasury accounts:', err);
      }
    }
    return [
      {
        id: 'TR-1',
        provider: 'USDT TRC20',
        account_number: '0x71C7656EC7ab88b098defB751B7401B5f6d8WWee',
        account_name: 'USDT Tron',
        status: 'active',
        notes: 'Admin Treasury Wallet (TRC20)'
      },
      {
        id: 'TR-2',
        provider: 'USDT BEP20',
        account_number: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        account_name: 'USDT (BEP20 Network)',
        status: 'active',
        notes: 'Send USDT to BEP20 Wallet'
      }
    ];
  },

  // Save new collection account to Supabase & localStorage
  async saveAccount(account: Omit<CollectionAccount, 'id' | 'createdAt'>): Promise<CollectionAccount> {
    const localAcc: CollectionAccount = {
      ...account,
      id: 'ACC-' + Math.floor(10000 + Math.random() * 90000),
      createdAt: new Date().toISOString().substring(0, 10)
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('collection_accounts')
          .insert({
            agent_code: account.agentCode,
            provider: account.provider,
            account_category: account.accountCategory,
            account_number: account.accountNumber,
            account_name: account.accountName,
            status: account.status,
            daily_limit: account.dailyLimit || 100000,
            notes: account.notes
          })
          .select('*')
          .single();

        if (!error && data) {
          localAcc.id = data.id;
        } else if (error) {
          console.error('Supabase insert error details:', error);
        }
      } catch (err) {
        console.error('Error saving collection account to Supabase:', err);
      }
    }

    if (account.agentCode) {
      const current = getCollectionAccounts();
      const updated = [localAcc, ...current];
      saveCollectionAccounts(updated);
    }

    return localAcc;
  },

  // Toggle active / inactive status in Supabase & localStorage
  async toggleStatus(id: string, newStatus?: 'active' | 'inactive'): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        let statusToSet = newStatus;
        if (!statusToSet) {
          const { data } = await supabase.from('collection_accounts').select('status').eq('id', id).single();
          statusToSet = data?.status === 'active' ? 'inactive' : 'active';
        }
        await supabase
          .from('collection_accounts')
          .update({ status: statusToSet })
          .eq('id', id);
      } catch (err) {
        console.error('Error updating status in Supabase:', err);
      }
    }

    const current = getCollectionAccounts();
    const updated = current.map(acc => {
      if (acc.id === id) {
        return { ...acc, status: newStatus || (acc.status === 'active' ? 'inactive' : 'active') };
      }
      return acc;
    });
    saveCollectionAccounts(updated);
  },

  // Delete collection account from Supabase & localStorage
  async deleteAccount(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('collection_accounts')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.error('Error deleting account in Supabase:', err);
      }
    }
    const current = getCollectionAccounts();
    const updated = current.filter(acc => acc.id !== id);
    saveCollectionAccounts(updated);
  }
};
