import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
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

export const DepositPage: React.FC = () => {
  const { 
    agent,
    transactions, 
    showToast,
    requestPinConfirmation,
    bdtExchangeRate: bdtRate
  } = useApp();

  const [liveDepositRequests, setLiveDepositRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveDepositRequests = async () => {
    if (isSupabaseConfigured()) {
      setIsLoading(true);
      try {
        if (!agent?.dbId) {
          setLiveDepositRequests([]);
          setIsLoading(false);
          return;
        }

        const { data } = await supabase
          .from('deposit_requests')
          .select('*')
          .eq('agent_id', agent.dbId)
          .order('created_at', { ascending: false });

        if (data) setLiveDepositRequests(data);
      } catch (err) {
        console.error('Error fetching live deposit requests:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!agent?.dbId) return; // wait until agent is loaded before fetching
    fetchLiveDepositRequests();
    const interval = setInterval(fetchLiveDepositRequests, 3000);
    return () => clearInterval(interval);
  }, [agent?.dbId]);

  const handleUpdateLiveDeposit = async (reqId: string, reqCode: string, amount: number, status: 'approved' | 'rejected') => {
    const usdEquivalent = (amount / bdtRate).toFixed(2);

    requestPinConfirmation(
      `${status === 'approved' ? 'Approve Cash-In' : 'Reject'} Deposit Request`,
      `Confirm ${status === 'approved' ? 'approval' : 'rejection'} for request ${reqCode}: ৳${amount.toLocaleString()} BDT (≈ $${usdEquivalent} USD)`,
      async () => {
        if (isSupabaseConfigured()) {
          try {
            if (status === 'approved') {
              const { data, error } = await (supabase.rpc as any)('process_customer_deposit_approval', { p_request_id: reqId });
              if (error) {
                await supabase.from('deposit_requests').update({ status: 'approved' }).eq('id', reqId);
              }
              const deductedUsd = data?.amount_usd || usdEquivalent;
              const commEarned = data?.commission_earned || ((amount / bdtRate) * 0.015).toFixed(2);
              showToast('success', 'Cash-In Approved 💸', `Customer deposit ${reqCode} approved! Float balance decreased by -$${deductedUsd} USD (৳${amount.toLocaleString()} BDT). Commission: +$${commEarned} USD (1.5%)`);
            } else {
              await supabase.from('deposit_requests').update({ status: 'rejected' }).eq('id', reqId);
              showToast('info', 'Deposit Rejected', `Customer deposit ${reqCode} rejected.`);
            }
            fetchLiveDepositRequests();
          } catch (err) {
            showToast('error', 'Update Failed', 'Failed to update deposit request.');
          }
        }
      }
    );
  };

  const depositTransactions = transactions.filter(t => t.type === 'deposit');

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center font-black">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Customer Deposit Requests Queue</h2>
            <p className="text-xs text-slate-300 font-medium">
              Live clearance stream of incoming customer cash-in requests
            </p>
          </div>
        </div>

        <button
          onClick={fetchLiveDepositRequests}
          className="px-3.5 py-2 rounded-xl bg-[#1a294e] hover:bg-[#233763] border border-[#233763] text-slate-200 text-xs font-bold flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Clearance Table */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-[#00c853]" />
            <span>Incoming Customer Deposit Queue ({liveDepositRequests.length})</span>
          </h3>
          <span className="text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 px-2.5 py-1 rounded-full uppercase">
            LIVE AGENT CLEARANCE DESK
          </span>
        </div>

        {liveDepositRequests.length === 0 && depositTransactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ArrowDownLeft className="w-12 h-12 mx-auto mb-3 opacity-20 text-[#00c853]" />
            <p className="text-base font-black text-white">No Pending Deposit Requests</p>
            <p className="text-xs mt-1 text-slate-400">Customer cash-in submissions will appear here in real-time for your approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#233763] text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-3">Req Code / ID</th>
                  <th className="py-3 px-3">Customer Details</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">TrxID / Sender Ref</th>
                  <th className="py-3 px-3">Submission Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Clearance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233763]/60 font-medium">
                {liveDepositRequests.map(req => {
                  const isPending = req.status === 'pending';
                  const reqAmt = parseFloat(req.amount) || 0;
                  const reqCode = req.request_code || 'DEP-' + req.id.substring(0, 5);
                  return (
                    <tr key={req.id} className="hover:bg-[#1a294e]/50 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-black text-white">
                        {reqCode}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">{req.customer_name || 'Tanvir Ahmed'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.customer_phone || '01711223344'}</div>
                      </td>
                      <td className="py-3.5 px-3 font-black text-[#00c853] text-sm font-mono">
                        ৳{reqAmt.toLocaleString()}
                        <div className="text-[10px] text-slate-400 font-mono font-normal">≈ ${(reqAmt / bdtRate).toFixed(2)} USD</div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-200">
                        {req.payment_method}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        {req.transaction_ref || req.sender_number || '-'}
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
                              onClick={() => handleUpdateLiveDeposit(req.id, reqCode, reqAmt, 'approved')}
                              className="px-3 py-1.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Approve Cash-In</span>
                            </button>
                            <button
                              onClick={() => handleUpdateLiveDeposit(req.id, reqCode, reqAmt, 'rejected')}
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
