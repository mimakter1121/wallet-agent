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
  Check
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';

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
  const { showToast } = useAdmin();
  const [activeSubTab, setActiveSubTab] = useState<'deposits' | 'withdrawals' | 'create_request'>('deposits');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requests, setRequests] = useState<CustomerRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Request Form State
  const [requestType, setRequestType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [refOrAccount, setRefOrAccount] = useState('');
  const [targetAgentCode, setTargetAgentCode] = useState('AG-88402');
  const [activeCollectionAccounts, setActiveCollectionAccounts] = useState<any[]>([]);
  const [selectedAgentNumber, setSelectedAgentNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase
        .from('collection_accounts')
        .select('*')
        .eq('status', 'active')
        .then(({ data }) => {
          if (data && data.length > 0) {
            setActiveCollectionAccounts(data);
            setSelectedAgentNumber(data[0].account_number);
          }
        });
    }
  }, []);

  const fetchLiveRequests = async () => {
    setIsLoading(true);
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
          agentCode: w.agent_code || 'AG-88402',
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
          .update({ status: newStatus })
          .eq('id', item.id);

        showToast('success', 'Status Updated', `Request #${item.requestCode} marked as ${newStatus.toUpperCase()}.`);
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
        if (requestType === 'deposit') {
          await supabase.from('deposit_requests').insert({
            request_code: reqCode,
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
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            amount: numAmt,
            payment_method: paymentMethod,
            recipient_account: refOrAccount.trim(),
            agent_code: targetAgentCode,
            status: 'pending'
          });
        }
        showToast('success', 'Request Created', `${requestType.toUpperCase()} #${reqCode} of ৳${numAmt.toLocaleString()} saved to Supabase.`);
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
    <div className="p-6 space-y-6 animate-fadeIn select-none text-white">
      
      {/* Header Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] flex items-center justify-center font-black">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Customer Payment Desk & Request Clearance
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Native admin desk for player deposits, cashouts, agent routing & instant clearance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveRequests}
            className="px-3.5 py-2 rounded-xl bg-[#1a294e] hover:bg-[#233763] border border-[#233763] text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setActiveSubTab('create_request')}
            className="px-4 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create New Request</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#121e3d] border border-[#233763] p-1.5 rounded-2xl text-xs font-bold">
          
          <button
            onClick={() => setActiveSubTab('deposits')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
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
          <div className="flex items-center gap-1.5 bg-[#121e3d] border border-[#233763] p-1 rounded-xl text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg uppercase text-[10px] font-black transition-all ${
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
                onChange={(e) => setPaymentMethod(e.target.value)}
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
                  onChange={(e) => setSelectedAgentNumber(e.target.value)}
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

            {/* Agent Code for Cashouts */}
            {requestType === 'withdrawal' && (
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Assign Target Agent Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetAgentCode}
                  onChange={(e) => setTargetAgentCode(e.target.value)}
                  placeholder="e.g. AG-88402"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold uppercase focus:outline-none focus:border-[#00c853]"
                />
              </div>
            )}

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
        <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
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
            <div className="overflow-x-auto">
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
                          <span className="px-2.5 py-1 rounded-xl bg-[#1a294e] border border-[#233763] text-amber-400 font-bold text-[11px]">
                            Sent to Agent AG-88402
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic">Settled by Agent</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      )}

    </div>
  );
};
