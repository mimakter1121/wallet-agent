import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PlusCircle, 
  ShieldCheck, 
  Filter, 
  Send,
  Building2,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { AutoRequestBotModal } from '../components/AutoRequestBotModal';
import { autoRequestBotService, AutoBotState } from '../services/autoRequestBotService';

interface CustomerRequestItem {
  id: string;
  type: 'deposit' | 'withdrawal';
  requestCode: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: string;
  refOrAccount: string;
  agentCode?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

export const CustomerPortalPage: React.FC = () => {
  const { agents, showToast } = useAdmin();
  const [activeSubTab, setActiveSubTab] = useState<'deposits' | 'withdrawals' | 'create_request'>('deposits');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requests, setRequests] = useState<CustomerRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [botRunningState, setBotRunningState] = useState<AutoBotState>(autoRequestBotService.getState());

  // Listen to auto bot state changes
  useEffect(() => {
    const unsub = autoRequestBotService.subscribe((newState) => {
      setBotRunningState(newState);
    });
    return () => unsub();
  }, []);

  // New Request Form State
  const [requestType, setRequestType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [refOrAccount, setRefOrAccount] = useState('');
  const [targetAgentCode, setTargetAgentCode] = useState('');
  const [activeCollectionAccounts, setActiveCollectionAccounts] = useState<any[]>([]);
  const [selectedAgentNumber, setSelectedAgentNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectAgentNumber = (accountNum: string) => {
    setSelectedAgentNumber(accountNum);
    const matched = activeCollectionAccounts.find(a => a.account_number === accountNum);
    if (matched && matched.agent_code) {
      const foundAg = agents.find(
        ag => ag.id.toLowerCase() === matched.agent_code.toLowerCase() || 
              (ag as any).dbId === matched.agent_code
      );
      setTargetAgentCode(foundAg ? foundAg.id : matched.agent_code);
    }
  };

  const handlePaymentMethodChange = (newMethod: string) => {
    setPaymentMethod(newMethod);
    const filtered = activeCollectionAccounts.filter(acc => 
      acc.provider.toLowerCase() === newMethod.toLowerCase() || 
      (newMethod.includes('USDT') && acc.provider.includes('USDT'))
    );
    if (filtered.length > 0) {
      const firstNum = filtered[0].account_number;
      setSelectedAgentNumber(firstNum);
      if (filtered[0].agent_code) {
        const foundAg = agents.find(
          ag => ag.id.toLowerCase() === filtered[0].agent_code.toLowerCase() || 
                (ag as any).dbId === filtered[0].agent_code
        );
        setTargetAgentCode(foundAg ? foundAg.id : filtered[0].agent_code);
      }
    }
  };

  useEffect(() => {
    if (agents && agents.length > 0 && !targetAgentCode) {
      setTargetAgentCode(agents[0].id);
    }
  }, [agents, targetAgentCode]);

  const fetchActiveCollectionAccounts = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase
        .from('collection_accounts')
        .select('*')
        .eq('status', 'active')
        .not('provider', 'ilike', '%USDT%')
        .order('created_at', { ascending: false });

      const accounts = data || [];
      setActiveCollectionAccounts(accounts);

      if (accounts.length > 0) {
        setSelectedAgentNumber(prev => {
          const exists = accounts.some(a => a.account_number === prev);
          if (exists) return prev;
          const first = accounts[0];
          if (first.agent_code) {
            setTargetAgentCode(first.agent_code);
          }
          return first.account_number;
        });
      } else {
        setSelectedAgentNumber('');
      }
    } catch (err) {
      console.error('Failed to fetch active collection accounts:', err);
    }
  };

  useEffect(() => {
    fetchActiveCollectionAccounts();

    if (!isSupabaseConfigured()) return undefined;

    const channel = supabase
      .channel('admin_portal_collection_accounts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collection_accounts' }, () => {
        fetchActiveCollectionAccounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLiveRequests = async () => {
    setIsLoading(true);
    fetchActiveCollectionAccounts();
    if (isSupabaseConfigured()) {
      try {
        const [depRes, wthRes] = await Promise.all([
          supabase.from('deposit_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false })
        ]);

        const deposits: CustomerRequestItem[] = (depRes.data || []).map((d: any) => ({
          id: d.id,
          type: 'deposit',
          requestCode: d.request_code || 'DEP-' + d.id.substring(0, 5),
          customerName: d.customer_name || 'Customer',
          customerPhone: d.customer_phone || '-',
          amount: parseFloat(d.amount) || 0,
          paymentMethod: d.payment_method || 'bKash',
          refOrAccount: d.transaction_ref || d.sender_number || '-',
          agentCode: d.agent_code || 'General',
          status: d.status || 'pending',
          createdAt: d.created_at?.substring(0, 16) || new Date().toISOString().substring(0, 16)
        }));

        const withdrawals: CustomerRequestItem[] = (wthRes.data || []).map((w: any) => ({
          id: w.id,
          type: 'withdrawal',
          requestCode: w.request_code || 'WTH-' + w.id.substring(0, 5),
          customerName: w.customer_name || 'Customer',
          customerPhone: w.customer_phone || '-',
          amount: parseFloat(w.amount) || 0,
          paymentMethod: w.payment_method || 'Nagad',
          refOrAccount: w.recipient_account || '-',
          agentCode: w.agent_code || 'General',
          status: w.status || 'pending',
          createdAt: w.created_at?.substring(0, 16) || new Date().toISOString().substring(0, 16)
        }));

        const combined = [...deposits, ...withdrawals].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setRequests(combined);
      } catch (err) {
        console.error('Error fetching live customer requests:', err);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLiveRequests();
    const interval = setInterval(fetchLiveRequests, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (item: CustomerRequestItem, newStatus: 'approved' | 'rejected') => {
    if (isSupabaseConfigured()) {
      try {
        const table = item.type === 'deposit' ? 'deposit_requests' : 'withdrawal_requests';
        await supabase
          .from(table)
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        const isAgentSettlement = item.requestCode.startsWith('WD-') || 
          item.customerName?.includes('Agent Settlement') || 
          item.customerName?.includes('Agent Payout');

        if (isAgentSettlement) {
          // 1. Update transactions table
          await supabase
            .from('transactions')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .or(`transaction_code.eq.${item.requestCode},id.eq.${item.requestCode}`);

          // 2. Sync agent balance and pending hold in Supabase
          const targetAgentCode = item.agentCode;
          const { data: agData } = await supabase
            .from('agents')
            .select('id, balance, pending_balance, total_commission')
            .or(`agent_code.eq.${targetAgentCode},id.eq.${targetAgentCode}`)
            .maybeSingle();

          if (agData) {
            const currentPending = parseFloat(agData.pending_balance) || 0;
            const currentBal = parseFloat(agData.balance) || 0;
            const currentComm = parseFloat(agData.total_commission) || 0;
            const txAmt = item.amount;

            if (newStatus === 'approved') {
              // Withdrawal approved: release pending hold
              await supabase
                .from('agents')
                .update({ pending_balance: Math.max(0, currentPending - txAmt) })
                .eq('id', agData.id);
            } else {
              // Withdrawal rejected: refund held funds back to agent
              const isCommission = item.customerName?.includes('Commission');
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
            }
          }
        }

        showToast('success', isAgentSettlement ? (newStatus === 'approved' ? 'Agent Payout Approved ✓' : 'Agent Payout Rejected & Refunded ✕') : 'Status Updated', `Request #${item.requestCode} marked as ${newStatus.toUpperCase()}.`);
        fetchLiveRequests();
      } catch (err) {
        showToast('error', 'Update Failed', 'Failed to update status in Supabase.');
      }
    } else {
      setRequests(prev =>
        prev.map(r => (r.id === item.id ? { ...r, status: newStatus } : r))
      );
      showToast('success', 'Status Updated', `Request #${item.requestCode} marked as ${newStatus.toUpperCase()}.`);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('error', 'Missing Customer Details', 'Please enter customer name and phone number.');
      return;
    }

    setIsSubmitting(true);
    const reqCode = (requestType === 'deposit' ? 'DEP-' : 'WTH-') + Math.floor(10000 + Math.random() * 90000);

    if (isSupabaseConfigured()) {
      try {
        // Resolve agent UUID and details
        let targetAgentUuid: string | null = null;
        let targetAgentName: string | null = null;
        const selectedAg = agents.find(a => a.id === targetAgentCode);
        if (selectedAg) {
          targetAgentName = selectedAg.name;
        }

        if (targetAgentCode) {
          const { data: agData } = await supabase
            .from('agents')
            .select('id, full_name, profiles(full_name)')
            .eq('agent_code', targetAgentCode)
            .maybeSingle();
          if (agData?.id) {
            targetAgentUuid = agData.id;
            targetAgentName = (agData as any)?.profiles?.full_name || (agData as any)?.full_name || targetAgentName;
          }
        }

        if (requestType === 'deposit') {
          await supabase.from('deposit_requests').insert({
            request_code: reqCode,
            agent_id: targetAgentUuid || null,
            agent_code: targetAgentCode || null,
            agent_name: targetAgentName || null,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            amount: numAmt,
            payment_method: paymentMethod,
            sender_number: refOrAccount.trim(),
            transaction_ref: refOrAccount.trim(),
            status: 'pending'
          });
        } else {
          await supabase.from('withdrawal_requests').insert({
            request_code: reqCode,
            agent_id: targetAgentUuid || null,
            agent_code: targetAgentCode || null,
            agent_name: targetAgentName || null,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            amount: numAmt,
            payment_method: paymentMethod,
            recipient_account: refOrAccount.trim(),
            status: 'pending'
          });
        }
        showToast('success', 'Request Created', `${requestType.toUpperCase()} #${reqCode} of ৳${numAmt.toLocaleString()} assigned to agent ${targetAgentCode || 'General'}.`);
      } catch (err) {
        showToast('error', 'Database Error', 'Failed to save request to Supabase.');
      }
    }

    setIsSubmitting(false);
    setAmount('');
    setCustomerName('');
    setCustomerPhone('');
    setRefOrAccount('');
    setActiveSubTab(requestType === 'deposit' ? 'deposits' : 'withdrawals');
    fetchLiveRequests();
  };

  const filteredRequests = requests.filter(r => {
    if (activeSubTab === 'deposits' && r.type !== 'deposit') return false;
    if (activeSubTab === 'withdrawals' && r.type !== 'withdrawal') return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const pendingDepositsCount = requests.filter(r => r.type === 'deposit' && r.status === 'pending').length;
  const pendingWithdrawalsCount = requests.filter(r => r.type === 'withdrawal' && r.status === 'pending').length;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fadeIn select-none text-white">
      
      {/* Header Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-4 sm:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] flex items-center justify-center font-black shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Customer Payment Desk & Request Clearance
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Native admin desk for player deposits, cashouts, agent routing & instant clearance.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={fetchLiveRequests}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-[#1a294e] hover:bg-[#233763] border border-[#233763] text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Auto Bot Trigger Button */}
          <button
            onClick={() => setIsBotModalOpen(true)}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md ${
              botRunningState.status === 'running'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-950/50 animate-pulse'
                : botRunningState.status === 'paused'
                ? 'bg-amber-500 text-slate-950 shadow-amber-950/50'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/40'
            }`}
          >
            <Zap className={`w-4 h-4 ${botRunningState.status === 'running' ? 'animate-bounce' : ''}`} />
            <span className="truncate">
              {botRunningState.status === 'running' 
                ? `🤖 Auto Bot (${botRunningState.sentCount}/${botRunningState.config.totalRequests})` 
                : botRunningState.status === 'paused'
                ? `⏸️ Auto Bot (Paused)`
                : '⚡ Auto Request Bot'}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('create_request')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create New Request</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#121e3d] border border-[#233763] p-1.5 rounded-2xl text-xs font-bold overflow-x-auto max-w-full">
          
          <button
            onClick={() => setActiveSubTab('deposits')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeSubTab === 'deposits'
                ? 'bg-[#00c853] text-white font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit Requests</span>
            {pendingDepositsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">
                {pendingDepositsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('withdrawals')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeSubTab === 'withdrawals'
                ? 'bg-[#00b0ff] text-white font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Cashout / Withdrawals</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">
                {pendingWithdrawalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('create_request')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeSubTab === 'create_request'
                ? 'bg-[#1a294e] text-white font-black border border-[#233763]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-[#00c853]" />
            <span>Submit Entry Form</span>
          </button>

        </div>

        {/* Status Filter (Only when in table tabs) */}
        {activeSubTab !== 'create_request' && (
          <div className="flex items-center gap-1 bg-[#121e3d] border border-[#233763] p-1 rounded-xl text-xs font-bold overflow-x-auto self-start sm:self-auto max-w-full">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 shrink-0" />
            {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-black whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-[#1a294e] text-white border border-[#233763]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'create_request' ? (

        /* Native Request Entry Form */
        <div className="max-w-3xl mx-auto bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#233763] pb-4">
            <div>
              <h3 className="text-sm font-black text-white">Create & Dispatch Customer Request</h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Submit a new deposit or cashout request directly to the Supabase database ledger.
              </p>
            </div>
            <span className="text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 px-2.5 py-1 rounded-full uppercase">
              NATIVE ENTRY FORM
            </span>
          </div>

          <form onSubmit={handleCreateRequest} className="space-y-4">
            
            {/* Request Type Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Request Operation Type <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestType('deposit')}
                  className={`py-3 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                    requestType === 'deposit'
                      ? 'bg-[#00c853]/20 border-[#00c853] text-[#00c853] shadow-md'
                      : 'bg-[#1a294e] border-[#233763] text-slate-300'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Customer Deposit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('withdrawal')}
                  className={`py-3 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                    requestType === 'withdrawal'
                      ? 'bg-[#00b0ff]/20 border-[#00b0ff] text-[#00b0ff] shadow-md'
                      : 'bg-[#1a294e] border-[#233763] text-slate-300'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Customer Cashout</span>
                </button>
              </div>
            </div>

            {/* Gateway Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Payment Method Gateway <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
              >
                <option value="bKash">bKash (Mobile Wallet)</option>
                <option value="Nagad">Nagad (Mobile Wallet)</option>
                <option value="Rocket">Rocket (DBBL Wallet)</option>
                <option value="Upay">Upay (UCB Wallet)</option>
                <option value="USDT (TRC20)">USDT (Crypto TRC20)</option>
                <option value="Bank Transfer">Bank Transfer (Wire)</option>
              </select>
            </div>

            {/* Active Agent Deposit Number Dropdown */}
            {requestType === 'deposit' && (
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Active Agent {paymentMethod} Deposit Number <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedAgentNumber}
                  onChange={(e) => handleSelectAgentNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-[#00c853] font-mono text-xs font-black focus:outline-none focus:border-[#00c853]"
                >
                  {activeCollectionAccounts.filter(acc => acc.provider.toLowerCase() === paymentMethod.toLowerCase() || (paymentMethod.includes('USDT') && acc.provider.includes('USDT'))).length > 0 ? (
                    activeCollectionAccounts
                      .filter(acc => acc.provider.toLowerCase() === paymentMethod.toLowerCase() || (paymentMethod.includes('USDT') && acc.provider.includes('USDT')))
                      .map(acc => (
                        <option key={acc.id} value={acc.account_number}>
                          {acc.account_number} — [{acc.account_name} / {acc.account_category.toUpperCase()}]
                        </option>
                      ))
                  ) : (
                    <option value="">No Active Number Enabled for {paymentMethod}</option>
                  )}
                </select>
              </div>
            )}

            {/* Player Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Player Username <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter player username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder:text-slate-500 text-xs font-bold focus:outline-none focus:border-[#00c853]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Player Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter mobile phone number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder:text-slate-500 text-xs font-bold focus:outline-none focus:border-[#00c853]"
                />
              </div>
            </div>

            {/* Amount & TrxID/Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Amount (৳ BDT) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder:text-slate-500 text-sm font-mono font-black focus:outline-none focus:border-[#00c853]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  {requestType === 'deposit' ? 'TrxID / Transaction Ref' : 'Recipient Account Number'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={refOrAccount}
                  onChange={(e) => setRefOrAccount(e.target.value)}
                  placeholder={requestType === 'deposit' ? 'Enter TrxID (e.g. 9B2X8199A)' : 'Enter wallet/bank number'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder:text-slate-500 text-xs font-bold focus:outline-none focus:border-[#00c853]"
                />
              </div>
            </div>

            {/* Assign Target Agent Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Assign Target Agent <span className="text-[#00c853]">• Live Routing</span>
              </label>
              <select
                value={targetAgentCode}
                onChange={(e) => setTargetAgentCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id} className="bg-[#121e3d] text-white py-1">
                    {ag.name} ({ag.id}) — Float: ${ag.balance.toLocaleString()} USD
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-white font-black text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : `Submit ${requestType === 'deposit' ? 'Deposit' : 'Cashout'} Request`}</span>
            </button>

          </form>
        </div>

      ) : (

        /* Native Requests Clearance Table */
        <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-4 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">
              {activeSubTab === 'deposits' ? 'Customer Deposit Requests' : 'Customer Cashout / Withdrawal Requests'} ({filteredRequests.length})
            </h3>
            <span className="text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 px-2.5 py-1 rounded-full uppercase">
              LIVE CLEARANCE DESK
            </span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              No {activeSubTab} requests found for selected status filter.
            </div>
          ) : (
            <>
              {/* Mobile Responsive Cards (md:hidden) */}
              <div className="md:hidden space-y-3">
                {filteredRequests.map(req => (
                  <div 
                    key={req.id} 
                    className="bg-[#1a294e]/70 border border-[#233763] rounded-2xl p-3.5 space-y-2.5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[#233763]/60 pb-2">
                      <div>
                        <div className="font-mono font-black text-white text-xs flex items-center gap-1.5">
                          <span>{req.requestCode}</span>
                          {req.type === 'deposit' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40">
                              DEPOSIT
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40">
                              CASHOUT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{req.createdAt}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-[#00c853]">
                          ৳{req.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Customer:</div>
                        <div className="font-bold text-white truncate">{req.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.customerPhone}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Gateway & Details:</div>
                        <div className="font-bold text-white">{req.paymentMethod}</div>
                        <div className="text-[10px] text-slate-300 font-mono truncate">{req.refOrAccount}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#233763]/60">
                      <div>
                        {req.status === 'approved' || req.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        ) : req.status === 'rejected' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Agent: <span className="text-amber-400 font-bold">{req.agentCode || 'General'}</span>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-[#233763]">
                        <button
                          onClick={() => handleUpdateStatus(req, 'approved')}
                          className="flex-1 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{req.requestCode.startsWith('WD-') || req.customerName?.includes('Agent') ? 'Approve Payout' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req, 'rejected')}
                          className="flex-1 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#233763] text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-3">Req Code</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Player Details</th>
                      <th className="py-3 px-3">Gateway</th>
                      <th className="py-3 px-3">{activeSubTab === 'deposits' ? 'TrxID / Sender' : 'Recipient A/C'}</th>
                      {activeSubTab === 'withdrawals' && <th className="py-3 px-3">Target Agent</th>}
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Clearance Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#233763]/60 font-medium">
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-[#1a294e]/50 transition-colors">
                        
                        <td className="py-3.5 px-3 font-mono font-black text-white">
                          {req.requestCode}
                          <div className="text-[10px] text-slate-400 font-mono">{req.createdAt}</div>
                        </td>

                        <td className="py-3.5 px-3">
                          {req.type === 'deposit' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center gap-1 w-fit">
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>DEPOSIT</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 flex items-center gap-1 w-fit">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>CASHOUT</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-white">{req.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{req.customerPhone}</div>
                        </td>

                        <td className="py-3.5 px-3 font-bold text-white">
                          {req.paymentMethod}
                        </td>

                        <td className="py-3.5 px-3 font-mono font-bold text-slate-200">
                          {req.refOrAccount}
                        </td>

                        {activeSubTab === 'withdrawals' && (
                          <td className="py-3.5 px-3 font-mono text-xs font-bold text-[#00b0ff]">
                            {req.agentCode || '-'}
                          </td>
                        )}

                        <td className="py-3.5 px-3 font-mono font-black text-sm text-[#00c853]">
                          ৳{req.amount.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-3">
                          {req.status === 'approved' || req.status === 'completed' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>APPROVED BY AGENT</span>
                            </span>
                          ) : req.status === 'rejected' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" />
                              <span>REJECTED BY AGENT</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 w-fit animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>PENDING AGENT CLEARANCE</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(req, 'approved')}
                                className="px-2.5 py-1.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-[11px] shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                                title="Approve and confirm payout"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{req.requestCode.startsWith('WD-') || req.customerName?.includes('Agent') ? 'Approve Payout' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(req, 'rejected')}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                                title="Reject request and refund balance"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">
                              {req.status === 'approved' ? 'Cleared & Completed' : 'Rejected'}
                            </span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      )}

      {/* AUTO REQUEST BOT MODAL */}
      <AutoRequestBotModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        agents={agents}
        onRequestDispatched={fetchLiveRequests}
      />

    </div>
  );
};
