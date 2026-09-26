import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ExchangeRate,
  PaymentChannel,
  Agent,
  PlatformTransaction,
  AdminStats
} from '../types';
import { supabase } from '../lib/supabase';

interface AdminContextType {
  rates: ExchangeRate[];
  channels: PaymentChannel[];
  agents: Agent[];
  transactions: PlatformTransaction[];
  stats: AdminStats;
  updateRate: (code: string, newRate: number) => void;
  toggleChannelStatus: (id: string) => void;
  addChannel: (channel: Omit<PaymentChannel, 'id' | 'createdAt'>) => void;
  deleteChannel: (id: string) => void;
  updateChannelQr: (id: string, qrUrl: string | null) => Promise<void>;
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;
  updateAgentStatus: (id: string, active: boolean) => void;
  updateAgentKycStatus: (id: string, kycStatus: 'verified' | 'pending' | 'under_review' | 'rejected' | 'unverified') => void;
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => void;
  deleteAgent: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  toast: { type: 'success' | 'error' | 'info'; title: string; message: string } | null;
}

const DEFAULT_RATES: ExchangeRate[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', ratePerUSD: 1, lastUpdated: 'Just now' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', ratePerUSD: 110, lastUpdated: 'Just now' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', ratePerUSD: 83, lastUpdated: 'Just now' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', ratePerUSD: 278, lastUpdated: 'Just now' },
];

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rates, setRates] = useState<ExchangeRate[]>(() => {
    const saved = localStorage.getItem('wa_exchange_rates');
    return saved ? JSON.parse(saved) : DEFAULT_RATES;
  });

  const [channels, setChannels] = useState<PaymentChannel[]>(() => {
    const saved = localStorage.getItem('wa_channel_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [commRates, setCommRates] = useState<{ deposit: number; withdrawal: number }>({ deposit: 0.05, withdrawal: 0.03 });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('wa_exchange_rates', JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem('wa_channel_accounts', JSON.stringify(channels));
  }, [channels]);

  // Load live Agents, Transactions & Collection Accounts from Supabase
  const fetchLiveAdminData = async () => {
    try {
      const [txRes, agRes, colRes] = await Promise.all([
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('agents').select('*, profiles(full_name, email, phone, status)'),
        supabase.from('treasury_accounts').select('*').order('created_at', { ascending: false })
      ]);

      const bdtRate = rates.find(r => r.code === 'BDT')?.ratePerUSD || 120;
      let mappedTx: PlatformTransaction[] = [];

      if (txRes.data && txRes.data.length > 0) {
        mappedTx = txRes.data.map((t: any) => {
          const rawCode = t.transaction_code || '';
          const rawNote = t.note || '';
          const isAgentSettlement = rawNote.includes('Agent Settlement') || 
            t.customer_name?.includes('Agent Settlement') || 
            rawCode.startsWith('WD-') || 
            t.type === 'payout';
          const isAgentTopup = rawNote.includes('Topup') || 
            t.customer_name?.includes('Topup') || 
            rawCode.startsWith('TOPUP');

          const mappedType: 'deposit' | 'withdrawal' | 'topup' = 
            isAgentSettlement ? 'withdrawal' : 
            isAgentTopup ? 'topup' : 
            (t.type === 'deposit' ? 'deposit' : (t.type === 'withdrawal' ? 'withdrawal' : 'deposit'));

          const cleanAgentName = t.customer_name?.replace(' (Agent Settlement)', '').replace(' (Agent Topup)', '') || 
            (isAgentSettlement ? 'Maruf Hossain' : 'Agent');

          return {
            id: rawCode || t.id,
            agentId: t.agent_id,
            agentName: cleanAgentName,
            customerName: isAgentSettlement 
              ? `${cleanAgentName} (Payout: ${t.payment_method})` 
              : (t.customer_name || t.note || 'Client Direct'),
            type: mappedType,
            amountUSD: parseFloat(t.amount) || 0,
            localAmount: `৳ ${(parseFloat(t.amount) * bdtRate).toLocaleString()}`,
            paymentMethod: t.payment_method || 'USDT TRC20',
            reference: t.reference || rawCode || '-',
            status: t.status === 'approved' ? 'success' : t.status,
            createdAt: t.created_at?.substring(0, 16) || new Date().toISOString().substring(0, 16)
          };
        });
      }

      // Merge local storage agent topup/withdrawal requests (for instant offline/hybrid reactivity)
      const localTxsRaw = localStorage.getItem('wa_transactions');
      if (localTxsRaw) {
        try {
          const parsed = JSON.parse(localTxsRaw);
          const localMapped: PlatformTransaction[] = parsed
            .filter((t: any) => t.type === 'topup' || t.type === 'withdrawal' || t.customerName?.includes('Agent') || t.notes?.includes('Agent Settlement'))
            .map((t: any) => ({
              id: t.id || t.receiptNumber || 'TX-LOCAL',
              agentId: t.customerId || 'AG-LOCAL',
              agentName: t.notes?.includes('Agent Settlement') ? t.notes : (t.customerName || 'Agent Request'),
              customerName: t.customerName || 'Agent Direct',
              type: t.type === 'withdrawal' ? 'withdrawal' : 'deposit',
              amountUSD: parseFloat(t.amount) || 0,
              localAmount: `৳ ${(parseFloat(t.amount) * bdtRate).toLocaleString()}`,
              paymentMethod: t.paymentMethod || 'USDT TRC20',
              reference: t.reference || t.receiptNumber || '-',
              status: (t.status === 'approved' || t.status === 'completed') ? 'success' : t.status,
              createdAt: t.createdAt || new Date().toISOString().substring(0, 16)
            }));

          // Exclude duplicates that already came from Supabase
          const existingIds = new Set(mappedTx.map(m => m.id));
          localMapped.forEach(lm => {
            if (!existingIds.has(lm.id)) {
              mappedTx.push(lm);
            }
          });
        } catch {}
      }

      setTransactions(mappedTx);

      if (agRes.data) {
        const mappedAg: Agent[] = agRes.data.map((a: any) => ({
          id: a.agent_code || a.id,
          name: a.profiles?.full_name || 'Authorized Agent',
          email: a.profiles?.email || 'agent@walletagent.com',
          phone: a.profiles?.phone || '+8801700000000',
          role: 'Liquidity Agent',
          balance: parseFloat(a.balance) || 0,
          pendingBalance: parseFloat(a.pending_balance) || 0,
          commissionBalance: parseFloat(a.total_commission) || 0,
          active: a.is_active !== false,  // use dedicated is_active field
          kycStatus: a.verification_status || 'pending',
          createdAt: a.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10)
        }));
        setAgents(mappedAg);
      }

      if (colRes.data && colRes.data.length > 0) {
        const mappedCol: PaymentChannel[] = colRes.data.map((c: any) => {
          const pLower = (c.provider || '').toLowerCase();
          const cat: 'mobile' | 'crypto' | 'bank' = 
            pLower.includes('usdt') || pLower.includes('crypto') || pLower.includes('trc') || pLower.includes('bep') ? 'crypto' :
            pLower.includes('bank') ? 'bank' : 'mobile';

          const accCat: 'agent' | 'personal' | 'merchant' = 
            c.account_category === 'personal' ? 'personal' :
            c.account_category === 'agent' ? 'agent' : 'merchant';

          return {
            id: c.id,
            name: c.account_name || c.provider,
            provider: c.provider,
            category: cat,
            accountCategory: accCat,
            accountNumber: c.account_number,
            badgeText: 'ADMIN TREASURY',
            status: c.status === 'active' ? 'active' : 'inactive',
            minDepositUSD: 10,
            estFee: 'Free',
            createdAt: c.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10),
            qr_code_url: c.qr_code_url
          };
        });
        setChannels(mappedCol);
      }

      // Fetch live exchange rates & commission settings from system_settings
      const { data: sysData } = await supabase.from('system_settings').select('*');
      if (sysData && sysData.length > 0) {
        const rateMap: Record<string, number> = {};
        let depR = 0.05;
        let wthR = 0.03;
        sysData.forEach((row: any) => {
          if (row.key === 'usd_bdt_rate') rateMap['BDT'] = parseFloat(row.value);
          if (row.key === 'usd_inr_rate') rateMap['INR'] = parseFloat(row.value);
          if (row.key === 'usd_pkr_rate') rateMap['PKR'] = parseFloat(row.value);
          if (row.key === 'deposit_commission_rate') {
            const val = parseFloat(row.value) / 100;
            if (!isNaN(val)) depR = val;
          }
          if (row.key === 'withdrawal_commission_rate') {
            const val = parseFloat(row.value) / 100;
            if (!isNaN(val)) wthR = val;
          }
        });

        setRates(prev => prev.map(r => rateMap[r.code] ? { ...r, ratePerUSD: rateMap[r.code] } : r));
        setCommRates({ deposit: depR, withdrawal: wthR });
      }
    } catch (err) {
      console.error('Error fetching Supabase admin data:', err);
    }
  };

  useEffect(() => {
    fetchLiveAdminData();
    const interval = setInterval(fetchLiveAdminData, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateRate = async (code: string, newRate: number) => {
    setRates(prev => prev.map(r => r.code === code ? { ...r, ratePerUSD: newRate, lastUpdated: 'Just now' } : r));

    const dbKey = code === 'BDT' ? 'usd_bdt_rate' : (code === 'INR' ? 'usd_inr_rate' : 'usd_pkr_rate');

    try {
      await supabase.from('system_settings').upsert(
        { key: dbKey, value: newRate.toString(), label: `1 USD to ${code} Exchange Rate` },
        { onConflict: 'key' }
      );
      showToast('success', 'Exchange Rate Saved', `1 USD = ${newRate} ${code} saved to database.`);
    } catch (err) {
      showToast('error', 'Save Failed', 'Could not save exchange rate to database.');
    }
  };

  const toggleChannelStatus = async (id: string) => {
    const targetChan = channels.find(c => c.id === id);
    const newStatus = targetChan?.status === 'active' ? 'inactive' : 'active';

    setChannels(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));

    try {
      await supabase
        .from('treasury_accounts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.error('Error toggling channel in Supabase:', err);
    }

    showToast('info', 'Channel Status Updated', `Status changed to ${newStatus.toUpperCase()}`);
  };

  const addChannel = async (data: Omit<PaymentChannel, 'id' | 'createdAt'>) => {
    const tempId = 'CH-' + Math.floor(10000 + Math.random() * 90000);
    const newChan: PaymentChannel = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString().substring(0, 10)
    };
    setChannels(prev => [newChan, ...prev]);

    try {
      const { data: dbData, error } = await supabase
        .from('treasury_accounts')
        .insert({
          provider: data.name || data.provider,
          account_category: data.accountCategory || 'merchant',
          account_number: data.accountNumber,
          account_name: data.name,
          status: 'active',
          daily_limit: 100000,
          notes: `Admin Treasury Wallet (${data.provider})`,
          qr_code_url: data.qr_code_url || null
        })
        .select()
        .single();

      if (error) {
        showToast('error', 'Supabase Insert Warning', error.message);
      } else if (dbData) {
        showToast('success', 'Treasury Address Published', `${data.name} is now live in database & Agent Portal.`);
        fetchLiveAdminData();
      }
    } catch (err) {
      showToast('success', 'Channel Created', `${data.name} is saved.`);
    }
  };

  const deleteChannel = async (id: string) => {
    setChannels(prev => prev.filter(c => c.id !== id));

    try {
      await supabase
        .from('treasury_accounts')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.error('Error deleting channel from Supabase:', err);
    }

    showToast('info', 'Channel Removed', 'Collection channel deleted from database.');
  };

  const updateChannelQr = async (id: string, qrUrl: string | null) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, qr_code_url: qrUrl || undefined } : c));

    try {
      const { error } = await supabase
        .from('treasury_accounts')
        .update({ qr_code_url: qrUrl, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        showToast('error', 'QR Save Error', error.message);
      } else {
        showToast('success', 'Treasury QR Updated', qrUrl ? 'Custom QR Code saved for this address.' : 'Reverted to auto-generated QR code.');
        fetchLiveAdminData();
      }
    } catch (err: any) {
      showToast('error', 'QR Save Error', err.message || 'Failed to update QR code.');
    }
  };

  const approveTransaction = async (id: string) => {
    try {
      const targetTx = transactions.find(t => t.id === id);
      const isAgentSettlement = targetTx?.type === 'withdrawal' || targetTx?.agentName?.includes('Agent Settlement') || targetTx?.customerName?.includes('Agent Settlement');

      if (id.startsWith('WD-') || id.startsWith('TOPUP') || id.startsWith('DEP-') || id.startsWith('WTH-')) {
        await supabase
          .from('transactions')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('transaction_code', id);
      } else {
        await supabase
          .from('transactions')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', id);
      }

      // Also mark approved in withdrawal_requests queue
      try {
        await supabase
          .from('withdrawal_requests')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .or(`request_code.eq.${id},id.eq.${id}`);
      } catch (_) {}

      // If target transaction is associated with an agent, release pending hold or credit balance
      if (targetTx?.agentId) {
        try {
          const { data: agData } = await supabase
            .from('agents')
            .select('id, balance, pending_balance, total_commission')
            .or(`id.eq.${targetTx.agentId},agent_code.eq.${targetTx.agentId}`)
            .maybeSingle();

          if (agData) {
            const currentPending = parseFloat(agData.pending_balance) || 0;
            const currentBal = parseFloat(agData.balance) || 0;
            const txAmt = targetTx.amountUSD;

            if (isAgentSettlement) {
              // Withdrawal: amount was already deducted from available balance upon submission and held in pending.
              // Now that admin approves the payout, release the pending hold.
              await supabase
                .from('agents')
                .update({
                  pending_balance: Math.max(0, currentPending - txAmt)
                })
                .eq('id', agData.id);
            } else {
              // Top-up: credit available balance and release pending hold.
              await supabase
                .from('agents')
                .update({
                  balance: currentBal + txAmt,
                  pending_balance: Math.max(0, currentPending - txAmt)
                })
                .eq('id', agData.id);
            }
          }
        } catch (e) {
          console.warn('Could not sync agent balance on approval:', e);
        }
      }

      // Also update localStorage if present
      try {
        const localTxs = JSON.parse(localStorage.getItem('wa_transactions') || '[]');
        const updated = localTxs.map((t: any) => t.id === id ? { ...t, status: 'approved' } : t);
        localStorage.setItem('wa_transactions', JSON.stringify(updated));
      } catch {}

      showToast('success', isAgentSettlement ? 'Withdrawal Approved ✓' : 'Top-up Approved ✓', isAgentSettlement ? `Payout of $${targetTx?.amountUSD || 0} to agent confirmed.` : 'Agent transaction cleared. Balance credited.');
      fetchLiveAdminData();
    } catch (err: any) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'success' } : t));
      showToast('success', 'Approved', `Transaction ${id} cleared.`);
    }
  };

  const rejectTransaction = async (id: string) => {
    try {
      const targetTx = transactions.find(t => t.id === id);
      const isAgentSettlement = targetTx?.type === 'withdrawal' || targetTx?.agentName?.includes('Agent Settlement') || targetTx?.customerName?.includes('Agent Settlement');

      if (id.startsWith('WD-') || id.startsWith('TOPUP') || id.startsWith('DEP-') || id.startsWith('WTH-')) {
        await supabase
          .from('transactions')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('transaction_code', id);
      } else {
        await supabase
          .from('transactions')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', id);
      }

      // Also mark rejected in withdrawal_requests queue
      try {
        await supabase
          .from('withdrawal_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .or(`request_code.eq.${id},id.eq.${id}`);
      } catch (_) {}

      // If target transaction was an agent withdrawal, refund the held funds back
      if (targetTx?.agentId) {
        try {
          const { data: agData } = await supabase
            .from('agents')
            .select('id, balance, pending_balance, total_commission')
            .or(`id.eq.${targetTx.agentId},agent_code.eq.${targetTx.agentId}`)
            .maybeSingle();

          if (agData) {
            const currentPending = parseFloat(agData.pending_balance) || 0;
            const currentBal = parseFloat(agData.balance) || 0;
            const currentComm = parseFloat(agData.total_commission) || 0;
            const txAmt = targetTx.amountUSD;

            if (isAgentSettlement) {
              const isCommission = targetTx.agentName?.includes('Commission') || targetTx.customerName?.includes('Commission');
              if (isCommission) {
                await supabase
                  .from('agents')
                  .update({
                    total_commission: currentComm + txAmt,
                    pending_balance: Math.max(0, currentPending - txAmt)
                  })
                  .eq('id', agData.id);
              } else {
                await supabase
                  .from('agents')
                  .update({
                    balance: currentBal + txAmt,
                    pending_balance: Math.max(0, currentPending - txAmt)
                  })
                  .eq('id', agData.id);
              }
            } else {
              await supabase
                .from('agents')
                .update({
                  pending_balance: Math.max(0, currentPending - txAmt)
                })
                .eq('id', agData.id);
            }
          }
        } catch (e) {
          console.warn('Could not sync agent balance on rejection:', e);
        }
      }

      // Also update localStorage if present
      try {
        const localTxs = JSON.parse(localStorage.getItem('wa_transactions') || '[]');
        const updated = localTxs.map((t: any) => t.id === id ? { ...t, status: 'rejected' } : t);
        localStorage.setItem('wa_transactions', JSON.stringify(updated));
      } catch {}

      showToast('info', 'Transaction Rejected', `Transaction ${id} marked as rejected. Funds released.`);
      fetchLiveAdminData();
    } catch (err: any) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' } : t));
    }
  };

  const updateAgentStatus = async (id: string, active: boolean) => {
    // Optimistically update UI
    setAgents(prev => prev.map(a => a.id === id ? { ...a, active } : a));
    try {
      // id is agent_code (e.g. AG-12345), look up the actual UUID first
      const { data: agData } = await supabase
        .from('agents')
        .select('id')
        .eq('agent_code', id)
        .maybeSingle();

      const agentUuid = agData?.id;

      if (agentUuid) {
        await supabase
          .from('agents')
          .update({ is_active: active, updated_at: new Date().toISOString() })
          .eq('id', agentUuid);
      } else {
        // fallback: try by id directly
        await supabase
          .from('agents')
          .update({ is_active: active, updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    } catch (err) {
      console.error('Error updating agent status in Supabase:', err);
    }
    showToast('info', active ? '✅ Agent Activated' : '🔴 Agent Suspended', `Agent account ${id} has been ${active ? 'activated' : 'suspended'}.`);
  };

  const updateAgentKycStatus = async (id: string, kycStatus: 'verified' | 'pending' | 'under_review' | 'rejected' | 'unverified') => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, kycStatus } : a));
    try {
      const { data: agData } = await supabase
        .from('agents')
        .select('id')
        .eq('agent_code', id)
        .maybeSingle();

      const agentUuid = agData?.id;
      if (agentUuid) {
        await supabase
          .from('agents')
          .update({ verification_status: kycStatus, updated_at: new Date().toISOString() })
          .eq('id', agentUuid);
      } else {
        await supabase
          .from('agents')
          .update({ verification_status: kycStatus, updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    } catch (err) {
      console.error('Error updating agent KYC in Supabase:', err);
    }
    showToast('success', 'KYC Status Updated', `Agent ${id} KYC status changed to ${kycStatus.toUpperCase()}.`);
  };

  const addAgent = async (data: Omit<Agent, 'id' | 'createdAt'>) => {
    const agentCode = 'AG-' + Math.floor(10000 + Math.random() * 90000);
    const newAg: Agent = {
      ...data,
      id: agentCode,
      createdAt: new Date().toISOString().substring(0, 10)
    };
    setAgents(prev => [newAg, ...prev]);

    try {
      const { data: prof } = await supabase
        .from('profiles')
        .insert({
          full_name: data.name,
          email: data.email,
          phone: data.phone || '+8801700000000',
          role: data.role.toLowerCase().includes('sub') ? 'sub_agent' : 'agent',
          status: 'active'
        })
        .select()
        .single();

      if (prof) {
        await supabase
          .from('agents')
          .insert({
            profile_id: prof.id,
            agent_code: agentCode,
            balance: data.balance,
            verification_status: data.kycStatus
          });
      }
    } catch (err) {
      console.error('Error adding agent to Supabase:', err);
    }

    showToast('success', 'Agent Registered', `${data.name} added to liquidity network.`);
    fetchLiveAdminData();
  };

  const deleteAgent = async (id: string) => {
    // Optimistically update UI
    setAgents(prev => prev.filter(a => a.id !== id));

    try {
      // 1. Find agent record by agent_code or UUID to get all identifiers
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      let query = supabase.from('agents').select('id, agent_code, profile_id');
      if (isUuid) {
        query = query.or(`id.eq.${id},agent_code.eq.${id}`);
      } else {
        query = query.eq('agent_code', id);
      }

      const { data: agData, error: findError } = await query.maybeSingle();

      if (findError) {
        console.error('Error finding agent to delete:', findError);
      }

      if (agData) {
        const agentUuid = agData.id;
        const agentCode = agData.agent_code;

        // Delete all dependent records across tables to avoid foreign key violations
        await Promise.allSettled([
          supabase.from('transactions').delete().or(`agent_id.eq.${agentUuid},agent_code.eq.${agentCode}`),
          supabase.from('deposit_requests').delete().or(`agent_id.eq.${agentUuid},agent_code.eq.${agentCode}`),
          supabase.from('withdrawal_requests').delete().or(`agent_id.eq.${agentUuid},agent_code.eq.${agentCode}`),
          supabase.from('wallet_transactions').delete().eq('agent_id', agentUuid),
          supabase.from('commission_transactions').delete().eq('agent_id', agentUuid),
          supabase.from('kyc_documents').delete().eq('agent_code', agentCode),
          supabase.from('customers').delete().eq('agent_id', agentUuid),
          supabase.from('collection_accounts').update({ agent_code: null }).eq('agent_code', agentCode)
        ]);

        // Delete main agent row
        const { error: delError } = await supabase.from('agents').delete().eq('id', agentUuid);
        if (delError) {
          console.error('Failed to delete agent row:', delError);
          showToast('error', 'Delete Failed', delError.message);
          fetchLiveAdminData();
          return;
        }

        // Delete profile row if linked
        if (agData.profile_id) {
          await supabase.from('profiles').delete().eq('id', agData.profile_id);
        }
      } else {
        // Fallback delete by agent_code string
        await Promise.allSettled([
          supabase.from('transactions').delete().eq('agent_code', id),
          supabase.from('deposit_requests').delete().eq('agent_code', id),
          supabase.from('withdrawal_requests').delete().eq('agent_code', id),
          supabase.from('kyc_documents').delete().eq('agent_code', id),
          supabase.from('agents').delete().eq('agent_code', id)
        ]);
      }

      showToast('info', 'Agent Deleted 🗑️', `Agent account ${id} and associated records removed.`);
      fetchLiveAdminData();
    } catch (err: any) {
      console.error('Error deleting agent from Supabase:', err);
      showToast('error', 'Delete Error', err?.message || 'Could not delete agent from database.');
      fetchLiveAdminData();
    }
  };

  const stats: AdminStats = {
    totalVolumeUSD: transactions.reduce((acc, t) => t.status === 'success' ? acc + t.amountUSD : acc, 0),
    pendingClearanceUSD: transactions.reduce((acc, t) => t.status === 'pending' || t.status === 'processing' ? acc + t.amountUSD : acc, 0),
    totalAgents: agents.length,
    activeChannelsCount: channels.filter(c => c.status === 'active').length,
    totalCommissionsUSD: transactions.reduce((acc, t) => {
      if (t.status !== 'success') return acc;
      const rate = t.type === 'deposit' ? commRates.deposit : commRates.withdrawal;
      return acc + (t.amountUSD * rate);
    }, 0)
  };

  return (
    <AdminContext.Provider value={{
      rates,
      channels,
      agents,
      transactions,
      stats,
      updateRate,
      toggleChannelStatus,
      addChannel,
      deleteChannel,
      updateChannelQr,
      approveTransaction,
      rejectTransaction,
      updateAgentStatus,
      updateAgentKycStatus,
      addAgent,
      deleteAgent,
      showToast,
      toast
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};
