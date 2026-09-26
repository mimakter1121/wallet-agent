import React from 'react';
import { Receipt, ShieldCheck, CheckCheck, XCircle, Download } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const TransactionsPage: React.FC = () => {
  const { transactions, approveTransaction, rejectTransaction, showToast } = useAdmin();

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      showToast('info', 'No Data', 'No transactions to export.');
      return;
    }
    const headers = ['Tx ID', 'Agent Name', 'Customer Name', 'Type', 'Amount (USD)', 'Local Amount', 'Payment Method', 'Reference', 'Status', 'Date'];
    const rows = transactions.map(t => [
      t.id,
      `"${t.agentName}"`,
      `"${t.customerName}"`,
      t.type.toUpperCase(),
      t.amountUSD,
      `"${t.localAmount}"`,
      `"${t.paymentMethod}"`,
      `"${t.reference}"`,
      t.status.toUpperCase(),
      `"${t.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Admin_Platform_Ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Export Downloaded', 'Admin platform ledger exported to CSV.');
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fadeIn text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Global Platform Clearance Ledger
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Audit log of all agent deposits, payouts, transfers, and clearance requests across the network.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Ledger Container */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            No pending agent top-up requests. When an agent submits a liquidity top-up request, it will appear here for Master Admin approval.
          </div>
        ) : (
          <>
            {/* Mobile Cards View (md:hidden) */}
            <div className="md:hidden space-y-3">
              {transactions.map(tx => {
                const isAgentSettlement = tx.type === 'withdrawal' || tx.agentName?.includes('Agent Settlement') || tx.customerName?.includes('Agent Settlement');
                const isAgentTopup = tx.type === 'topup' || tx.agentName?.includes('Topup') || tx.customerName?.includes('Topup');

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-[#1a294e]/70 border border-[#233763] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
                          <span>{tx.id}</span>
                          {isAgentSettlement ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold uppercase tracking-wider">
                              Agent Withdrawal
                            </span>
                          ) : isAgentTopup ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase">
                              Agent Top-up
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 font-bold uppercase">
                              {tx.type}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Agent: <span className="font-semibold text-white">{tx.agentName}</span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        tx.status === 'success'
                          ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40'
                          : tx.status === 'pending' || tx.status === 'processing'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#121e3d] p-2.5 rounded-lg border border-[#233763]/60">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {isAgentSettlement ? 'Payout Amount' : 'Amount'}
                        </div>
                        <div className="font-black text-sm text-[#00c853]">${tx.amountUSD.toLocaleString()}</div>
                        {tx.localAmount && <div className="text-[10px] text-slate-400 font-mono">{tx.localAmount}</div>}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {isAgentSettlement ? 'Payout Destination' : 'Method & Ref'}
                        </div>
                        <div className="font-semibold text-white truncate">{tx.paymentMethod}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate" title={tx.reference}>
                          {tx.reference || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{isAgentSettlement ? 'Recipient: ' : 'Customer: '}<strong className="text-white">{tx.customerName || 'Direct Platform'}</strong></span>
                      <span className="font-mono text-[10px]">{tx.createdAt?.substring(0, 16).replace('T', ' ')}</span>
                    </div>

                    {(tx.status === 'pending' || tx.status === 'processing') && (
                      <div className="flex gap-2 pt-1 border-t border-[#233763]">
                        <button
                          onClick={() => approveTransaction(tx.id)}
                          className="flex-1 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>{isAgentSettlement ? 'Approve Payout' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => rejectTransaction(tx.id)}
                          className="flex-1 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Full Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#233763] text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3 min-w-[130px]">Tx ID & Type</th>
                    <th className="py-3 px-3 min-w-[140px]">Agent / Request</th>
                    <th className="py-3 px-3 min-w-[140px]">Customer / Beneficiary</th>
                    <th className="py-3 px-3 min-w-[110px]">Amount (USD)</th>
                    <th className="py-3 px-3 min-w-[130px]">Payout Channel</th>
                    <th className="py-3 px-3 min-w-[140px]">Destination / Ref</th>
                    <th className="py-3 px-3 text-right min-w-[180px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233763]/60">
                  {transactions.map(tx => {
                    const isAgentSettlement = tx.type === 'withdrawal' || tx.agentName?.includes('Agent Settlement') || tx.customerName?.includes('Agent Settlement');
                    const isAgentTopup = tx.type === 'topup' || tx.agentName?.includes('Topup') || tx.customerName?.includes('Topup');

                    return (
                      <tr key={tx.id} className="hover:bg-[#1a294e]/50 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-white">
                          <div>{tx.id}</div>
                          {isAgentSettlement ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold uppercase tracking-wider inline-block mt-0.5">
                              Agent Withdrawal
                            </span>
                          ) : isAgentTopup ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase inline-block mt-0.5">
                              Agent Top-up
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-white">{tx.agentName}</td>
                        <td className="py-3.5 px-3 text-slate-300">{tx.customerName}</td>
                        <td className="py-3.5 px-3 font-black text-[#00c853]">
                          <div>${tx.amountUSD.toLocaleString()}</div>
                          {tx.localAmount && <div className="text-[10px] text-slate-400 font-mono font-normal">{tx.localAmount}</div>}
                        </td>
                        <td className="py-3.5 px-3 text-slate-300 font-semibold">{tx.paymentMethod}</td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300 max-w-[180px] truncate" title={tx.reference}>
                          {tx.reference}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {tx.status === 'pending' || tx.status === 'processing' ? (
                            <div className="flex justify-end gap-1.5 whitespace-nowrap">
                              <button
                                onClick={() => approveTransaction(tx.id)}
                                className="px-3 py-1 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>{isAgentSettlement ? 'Approve Payout' : 'Approve Clearance'}</span>
                              </button>
                              <button
                                onClick={() => rejectTransaction(tx.id)}
                                className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 font-bold text-[11px] transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              tx.status === 'success'
                                ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}>
                              {tx.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
