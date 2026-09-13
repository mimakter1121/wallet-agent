import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, 
  ShieldCheck, 
  CheckCircle2, 
  CheckCheck,
  XCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

import { getExchangeRates } from '../config/currencyRates';

export const WithdrawalPage: React.FC = () => {
  const { 
    agent,
    transactions, 
    showToast,
    requestPinConfirmation,
    bdtExchangeRate: bdtRate,
    commissionRates
  } = useApp();

  const [liveWithdrawalRequests, setLiveWithdrawalRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchLiveWithdrawalRequests = async () => {
    if (isFetchingRef.current || !isSupabaseConfigured()) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const conds: string[] = [];
      if (agent?.dbId) conds.push(`agent_id.eq.${agent.dbId}`);
      if (agent?.id) conds.push(`agent_code.eq.${agent.id}`);

      if (conds.length === 0) {
        setLiveWithdrawalRequests([]);
        return;
      }

      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .or(conds.join(','))
        .order('created_at', { ascending: false });

      if (data) setLiveWithdrawalRequests(data);
    } catch (err) {
      console.error('Error fetching live withdrawal requests:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveWithdrawalRequests();

    if (!isSupabaseConfigured()) return undefined;

    const channel = supabase
      .channel('withdrawal_page_requests_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => {
        fetchLiveWithdrawalRequests();
      })
      .subscribe();

    const interval = setInterval(fetchLiveWithdrawalRequests, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [agent?.dbId, agent?.id]);

  const handleUpdateLiveWithdrawal = async (reqId: string, reqCode: string, amount: number, status: 'approved' | 'rejected') => {
    const isCrypto = false; // BDT fiat default
    const usdEquivalent = (amount / bdtRate).toFixed(2);

    requestPinConfirmation(
      `${status === 'approved' ? 'Approve Cash-Out Payout' : 'Reject'} Cashout Request`,
      `Confirm ${status === 'approved' ? 'payout approval' : 'rejection'} for cashout ${reqCode}: ৳${amount.toLocaleString()} BDT (≈ $${usdEquivalent} USD)`,
      async () => {
        if (isSupabaseConfigured()) {
          try {
            if (status === 'approved') {
              const { data, error } = await (supabase.rpc as any)('process_customer_withdrawal_approval', { p_request_id: reqId });
              if (error) {
                await supabase.from('withdrawal_requests').update({ status: 'approved' }).eq('id', reqId);
              }
              const creditedUsd = data?.amount_usd || usdEquivalent;
              const commEarned = data?.commission_earned || ((amount / bdtRate) * commissionRates.withdrawal).toFixed(2);
              showToast('success', 'Cash-Out Approved 💰', `Customer cashout ${reqCode} approved! Float balance increased by +$${creditedUsd} USD (৳${amount.toLocaleString()} BDT). Commission: +$${commEarned} USD (${(commissionRates.withdrawal * 100).toFixed(1)}%)`);
            } else {
              await supabase.from('withdrawal_requests').update({ status: 'rejected' }).eq('id', reqId);
              showToast('info', 'Cashout Rejected', `Customer cashout ${reqCode} rejected.`);
            }
            fetchLiveWithdrawalRequests();
          } catch (err) {
            showToast('error', 'Update Failed', 'Failed to update withdrawal request.');
          }
        }
      }
    );
  };

  const withdrawalTransactions = transactions.filter(t => t.type === 'withdrawal');

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-4 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 flex items-center justify-center font-black shrink-0">
            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-white">Customer Cashout & Payout Queue</h2>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium">
              Live clearance stream of incoming player withdrawal and payout requests
            </p>
          </div>
        </div>

        <button
          onClick={fetchLiveWithdrawalRequests}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-[#1a294e] hover:bg-[#233763] border border-[#233763] text-slate-200 text-xs font-bold flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Clearance Table */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-4 sm:p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#233763]">
          <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-[#00b0ff] shrink-0" />
            <span>Incoming Customer Cashout Queue ({liveWithdrawalRequests.length})</span>
          </h3>
          <span className="text-[9px] sm:text-[10px] font-black bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 px-2.5 py-1 rounded-full uppercase shrink-0">
            LIVE CASHOUT CLEARANCE DESK
          </span>
        </div>

        {liveWithdrawalRequests.length === 0 && withdrawalTransactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ArrowUpRight className="w-12 h-12 mx-auto mb-3 opacity-20 text-[#00b0ff]" />
            <p className="text-base font-black text-white">No Pending Cashout Requests</p>
            <p className="text-xs mt-1 text-slate-400">Customer withdrawal submissions will appear here in real-time for your payout authorization.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#233763] text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-3">Req Code / ID</th>
                  <th className="py-3 px-3">Customer Details</th>
                  <th className="py-3 px-3">Payout Amount</th>
                  <th className="py-3 px-3">Gateway</th>
                  <th className="py-3 px-3">Recipient Account</th>
                  <th className="py-3 px-3">Submission Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Clearance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233763]/60 font-medium">
                {liveWithdrawalRequests.map(req => {
                  const isPending = req.status === 'pending';
                  const reqAmt = parseFloat(req.amount) || 0;
                  const reqCode = req.request_code || 'WTH-' + req.id.substring(0, 5);
                  return (
                    <tr key={req.id} className="hover:bg-[#1a294e]/50 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-black text-white">
                        {reqCode}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">{req.customer_name || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.customer_phone || '-'}</div>
                      </td>
                      <td className="py-3.5 px-3 font-black text-[#00b0ff] text-sm font-mono">
                        ৳{reqAmt.toLocaleString()}
                        <div className="text-[10px] text-slate-400 font-mono font-normal">≈ ${(reqAmt / bdtRate).toFixed(2)} USD</div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-200">
                        {req.payment_method}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        {req.recipient_number || req.recipient_account || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono whitespace-nowrap">
                        {req.created_at?.substring(0, 16) || 'Just now'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <StatusBadge status={req.status === 'approved' ? 'success' : req.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateLiveWithdrawal(req.id, reqCode, reqAmt, 'approved')}
                              className="px-3 py-1.5 rounded-xl bg-[#00b0ff] hover:bg-[#40c4ff] text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Approve Payout</span>
                            </button>
                            <button
                              onClick={() => handleUpdateLiveWithdrawal(req.id, reqCode, reqAmt, 'rejected')}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 font-black text-xs transition-colors flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 italic uppercase">{req.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
