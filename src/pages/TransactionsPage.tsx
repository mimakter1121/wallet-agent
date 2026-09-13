import React, { useState } from 'react';
import { 
  ReceiptText, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Printer, 
  ArrowDownLeft, 
  ArrowUpRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge, TypeBadge } from '../components/common/StatusBadge';

export const TransactionsPage: React.FC = () => {
  const { 
    transactions, 
    setSelectedTransaction, 
    setIsDetailOpen, 
    openReceipt,
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 8;

  const filteredTransactions = transactions.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (t.id || '').toLowerCase().includes(q) ||
      (t.customerName || '').toLowerCase().includes(q) ||
      (t.reference || '').toLowerCase().includes(q) ||
      (t.channelAccount || '').toLowerCase().includes(q);

    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || (t.paymentMethod || '').includes(methodFilter);

    return matchesSearch && matchesType && matchesStatus && matchesMethod;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPageNum - 1) * itemsPerPage,
    currentPageNum * itemsPerPage
  );

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      showToast('info', 'No Data', 'No transactions to export.');
      return;
    }
    const headers = ['Transaction ID', 'Customer Name', 'Type', 'Amount (USD)', 'Fee', 'Net Amount', 'Method', 'Reference', 'Status', 'Date'];
    const rows = transactions.map(t => [
      t.id,
      `"${t.customerName}"`,
      t.type.toUpperCase(),
      t.amount,
      t.fee,
      t.netAmount,
      `"${t.paymentMethod}"`,
      `"${t.reference}"`,
      t.status.toUpperCase(),
      `"${t.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WalletAgent_Ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Export Completed', 'Transaction ledger CSV generated and downloaded.');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* Header */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center font-bold">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Transaction History & Audit Ledger
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Complete historical record of all deposits, payouts, transfers, and commission accruals
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-2 bg-[#1a294e] hover:bg-[#233763] border border-[#233763] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-98"
        >
          <Download className="w-4 h-4 text-[#00c853]" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Customer Username, TrxID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder-slate-400 focus:outline-none focus:border-[#00c853]"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            {/* Type Select */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none truncate"
            >
              <option value="all" className="bg-[#121e3d]">All Types</option>
              <option value="deposit" className="bg-[#121e3d]">Deposit (Cash In)</option>
              <option value="withdrawal" className="bg-[#121e3d]">Withdrawal (Payout)</option>
              <option value="transfer" className="bg-[#121e3d]">Agent Transfer</option>
              <option value="commission" className="bg-[#121e3d]">Commission Yield</option>
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none truncate"
            >
              <option value="all" className="bg-[#121e3d]">All Statuses</option>
              <option value="success" className="bg-[#121e3d]">Cleared (Success)</option>
              <option value="pending" className="bg-[#121e3d]">Pending</option>
              <option value="processing" className="bg-[#121e3d]">Processing</option>
              <option value="rejected" className="bg-[#121e3d]">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-4 sm:p-6 shadow-card">
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ReceiptText className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#00c853]" />
            <p className="text-sm font-bold text-white">No transactions match search criteria</p>
            <p className="text-xs text-slate-300 mt-1">Try resetting filters or search term</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#233763] text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3 min-w-[130px]">Tx ID</th>
                    <th className="py-3 px-3 min-w-[140px]">Customer Username</th>
                    <th className="py-3 px-3 min-w-[100px]">Type</th>
                    <th className="py-3 px-3 min-w-[110px]">Gross Amount</th>
                    <th className="py-3 px-3 min-w-[110px]">Net Settled</th>
                    <th className="py-3 px-3 min-w-[120px]">Payment Method</th>
                    <th className="py-3 px-3 min-w-[130px]">Date & Time</th>
                    <th className="py-3 px-3 min-w-[100px]">Status</th>
                    <th className="py-3 px-3 text-right min-w-[70px]">Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233763]">
                  {paginatedTransactions.map(tx => {
                    const isDebit = tx.type === 'withdrawal' || tx.type === 'transfer';
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => {
                          setSelectedTransaction(tx);
                          setIsDetailOpen(true);
                        }}
                        className="hover:bg-[#1a294e] cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-3">
                          <div className="font-mono font-black text-white group-hover:text-[#00c853]">
                            {tx.id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{tx.reference}</div>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-white">
                          <div className="truncate max-w-[130px]">{tx.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{tx.customerPhone}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <TypeBadge type={tx.type} />
                        </td>
                        <td className="py-3.5 px-3 font-black font-mono">
                          <span className={isDebit ? 'text-rose-400' : 'text-[#00c853]'}>
                            {isDebit ? '-' : '+'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-300 font-mono">
                          ${tx.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          {tx.paymentMethod}
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 font-mono whitespace-nowrap">
                          {tx.createdAt}
                        </td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={tx.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openReceipt(tx)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1a294e]"
                            title="Print Voucher Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#233763] text-xs font-bold text-slate-300 text-center sm:text-left">
              <div>
                Showing {(currentPageNum - 1) * itemsPerPage + 1} to {Math.min(currentPageNum * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPageNum === 1}
                  onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-[#1a294e] border border-[#233763] disabled:opacity-40 hover:bg-[#233763] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>Page {currentPageNum} of {totalPages}</span>
                <button
                  disabled={currentPageNum === totalPages}
                  onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-[#1a294e] border border-[#233763] disabled:opacity-40 hover:bg-[#233763] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
