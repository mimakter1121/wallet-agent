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
    <div className="p-6 space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Global Platform Clearance Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of all agent deposits, payouts, transfers, and clearance requests across the network.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-900/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            No pending agent top-up requests. When an agent submits a liquidity top-up request, it will appear here for Master Admin approval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3 min-w-[130px]">Tx ID</th>
                  <th className="py-3 px-3 min-w-[140px]">Agent</th>
                  <th className="py-3 px-3 min-w-[140px]">Customer</th>
                  <th className="py-3 px-3 min-w-[110px]">Amount (USD)</th>
                  <th className="py-3 px-3 min-w-[130px]">Channel / Method</th>
                  <th className="py-3 px-3 min-w-[120px]">Reference</th>
                  <th className="py-3 px-3 text-right min-w-[180px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{tx.id}</td>
                    <td className="py-3.5 px-3 font-semibold">{tx.agentName}</td>
                    <td className="py-3.5 px-3">{tx.customerName}</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-600">${tx.amountUSD.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-slate-500">{tx.paymentMethod}</td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400">{tx.reference}</td>
                    <td className="py-3.5 px-3 text-right">
                      {tx.status === 'pending' || tx.status === 'processing' ? (
                        <div className="flex justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => approveTransaction(tx.id)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all whitespace-nowrap"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Approve Clearance</span>
                          </button>
                          <button
                            onClick={() => rejectTransaction(tx.id)}
                            className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 font-bold text-[11px] transition-all flex items-center gap-1 whitespace-nowrap"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          tx.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {tx.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
