import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Clock, Printer, Shield, ArrowUpRight, ArrowDownLeft, FileText, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, TypeBadge } from './StatusBadge';

export const TransactionDetailModal: React.FC = () => {
  const { 
    selectedTransaction, 
    isDetailOpen, 
    setIsDetailOpen, 
    updateTransactionStatus, 
    openReceipt, 
    requestPinConfirmation 
  } = useApp();

  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [showAdminControls, setShowAdminControls] = useState(false);

  if (!isDetailOpen || !selectedTransaction) return null;

  const tx = selectedTransaction;

  const handleApprove = () => {
    requestPinConfirmation(
      'Approve Transaction',
      `Confirm approval for ${tx.id} ($${tx.amount.toLocaleString()})`,
      () => {
        updateTransactionStatus(tx.id, 'success', adminNoteInput || 'Cleared and approved by authorized agent.');
      }
    );
  };

  const handleReject = () => {
    requestPinConfirmation(
      'Reject Transaction',
      `Reject ${tx.id} and revert pending hold.`,
      () => {
        updateTransactionStatus(tx.id, 'rejected', adminNoteInput || 'Rejected due to compliance review check.');
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#233763] flex items-center justify-between bg-[#0a1128]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Transaction Details
            </span>
            <span className="text-xs font-mono font-black text-[#00c853]">
              #{tx.id}
            </span>
          </div>
          <button
            onClick={() => setIsDetailOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a294e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Card */}
          <div className="bg-[#1a294e] rounded-2xl p-5 border border-[#233763] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TypeBadge type={tx.type} />
                <StatusBadge status={tx.status} />
              </div>
              <div className="text-3xl font-black text-white font-mono mt-2">
                ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-300 font-medium mt-1">
                Net Settled: <span className="font-black text-[#00c853]">${tx.netAmount.toFixed(2)}</span> (Fee: ${tx.fee.toFixed(2)})
              </div>
            </div>

            <button
              onClick={() => {
                setIsDetailOpen(false);
                openReceipt(tx);
              }}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#121e3d] border border-[#233763] text-xs font-bold text-white hover:border-[#00c853] transition-all shadow-sm"
            >
              <Printer className="w-5 h-5 text-[#00c853]" />
              <span>Receipt</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">

            <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1 uppercase font-medium text-[10px]">Submission Time</span>
              <span className="font-medium text-slate-900 dark:text-white text-xs block">{tx.createdAt}</span>
            </div>
          </div>

          {/* Notes & Audit Trail */}
          <div className="space-y-3">
            {tx.notes && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Customer / Agent Note:</span>
                <p className="text-slate-700 dark:text-slate-400">{tx.notes}</p>
              </div>
            )}

            {tx.adminNote && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs">
                <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Compliance & Clearing Note:
                </span>
                <p className="text-amber-900/90 dark:text-amber-300/90">{tx.adminNote}</p>
              </div>
            )}
          </div>

          {/* Admin Control Compatibility Drawer (Requirement #17) */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <button
              onClick={() => setShowAdminControls(!showAdminControls)}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1.5 mb-3"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{showAdminControls ? 'Hide Admin Settlement Controls' : 'Show Admin Settlement & Override Controls'}</span>
            </button>

            {showAdminControls && (
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Admin Liquidity & Clearance Override
                </div>
                <input
                  type="text"
                  placeholder="Optional compliance audit log note..."
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={tx.status === 'success'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve & Settle</span>
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={tx.status === 'rejected'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject / Flag</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-navy-950/80 flex justify-end">
          <button
            onClick={() => setIsDetailOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
