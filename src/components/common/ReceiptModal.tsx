import React from 'react';
import { Printer, Download, X, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from './StatusBadge';

export const ReceiptModal: React.FC = () => {
  const { receiptTx, isReceiptOpen, closeReceipt, agent } = useApp();

  if (!isReceiptOpen || !receiptTx) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Top bar with action controls */}
        <div className="px-6 py-4 border-b border-[#233763] flex items-center justify-between bg-[#0a1128]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00c853]" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Official Transaction Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-[#1a294e] border border-[#233763] text-white hover:bg-[#233763] transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4 text-[#00c853]" />
            </button>
            <button
              onClick={closeReceipt}
              className="p-2 rounded-xl bg-[#1a294e] border border-[#233763] text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 overflow-y-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] text-xs font-black">
              <Building2 className="w-3.5 h-3.5" />
              <span>Wallet Agent Clearing Network</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white pt-1">
              Payment Voucher
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {receiptTx.receiptNumber}
            </p>
          </div>

          {/* Amount Hero */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700/60">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {receiptTx.type === 'deposit' ? 'Deposited Amount' : 'Disbursed Amount'}
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              ${receiptTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex justify-center">
              <StatusBadge status={receiptTx.status} />
            </div>
          </div>

          {/* Line Item Breakdown */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Transaction ID</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{receiptTx.id}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Customer Name</span>
              <span className="font-semibold text-slate-900 dark:text-white">{receiptTx.customerName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Customer Contact</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{receiptTx.customerPhone}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Payment Channel</span>
              <span className="font-medium text-slate-900 dark:text-white">{receiptTx.paymentMethod}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Channel Reference</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{receiptTx.reference}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Timestamp</span>
              <span className="text-slate-700 dark:text-slate-300">{receiptTx.createdAt}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Service Fee (0.5%)</span>
              <span className="text-slate-700 dark:text-slate-300">${receiptTx.fee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Net Settled</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">${receiptTx.netAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Authorized Agent</span>
              <span className="font-semibold text-slate-900 dark:text-white">{agent.name} ({agent.id})</span>
            </div>
          </div>

          {/* Security stamp & QR simulation */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-bold text-slate-700 dark:text-slate-200">Electronic Verification Hash:</div>
              <div className="font-mono text-[10px] text-slate-400 break-all">
                SHA256: 8f4a9b...7c12e9-VERIFIED-SECURE
              </div>
            </div>
            <div className="w-12 h-12 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center font-mono text-[8px] text-center">
              QR AUTH
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-emerald-900/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={closeReceipt}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
