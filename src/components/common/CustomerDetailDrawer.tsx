import React from 'react';
import { X, User, Phone, Mail, ShieldCheck, ArrowDownLeft, ArrowUpRight, Calendar, CreditCard, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, TypeBadge } from './StatusBadge';

export const CustomerDetailDrawer: React.FC = () => {
  const { 
    selectedCustomer, 
    isCustomerDrawerOpen, 
    setIsCustomerDrawerOpen, 
    transactions, 
    setCurrentPage, 
    setSelectedTransaction, 
    setIsDetailOpen 
  } = useApp();

  if (!isCustomerDrawerOpen || !selectedCustomer) return null;

  const cust = selectedCustomer;
  const customerTxs = transactions.filter(t => t.customerId === cust.id);

  const handleDepositClick = () => {
    setIsCustomerDrawerOpen(false);
    setCurrentPage('deposits');
  };

  const handleWithdrawalClick = () => {
    setIsCustomerDrawerOpen(false);
    setCurrentPage('withdrawals');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-lg bg-[#121e3d] h-full shadow-2xl flex flex-col overflow-hidden border-l border-[#233763] animate-slideLeft text-white">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#233763] flex items-center justify-between bg-[#0a1128]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1a294e] text-[#00c853] font-black flex items-center justify-center text-sm border border-[#233763]">
              {cust.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {cust.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-mono">{cust.id}</span>
                <span>•</span>
                <StatusBadge status={cust.kycStatus} size="sm" />
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCustomerDrawerOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a294e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#1a294e] border border-[#233763]">
              <span className="text-[11px] font-black text-[#00c853] uppercase tracking-wider">
                Total Deposited
              </span>
              <div className="text-xl font-black text-white font-mono mt-1">
                ${cust.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40">
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Total Withdrawn
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                ${cust.totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDepositClick}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/20 transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Process Deposit</span>
            </button>
            <button
              onClick={handleWithdrawalClick}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Request Payout</span>
            </button>
          </div>

          {/* Contact & Banking Information */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-1">
              Account Information
            </div>

            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{cust.mobile}</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{cust.email}</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="font-mono">{cust.accountNumber}</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Registered on {cust.joinedDate}</span>
            </div>

            {cust.notes && (
              <p className="text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700 italic">
                "{cust.notes}"
              </p>
            )}
          </div>

          {/* Activity Ledger */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Customer Transaction History ({customerTxs.length})
              </h4>
            </div>

            {customerTxs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No past transactions recorded for this customer.
              </div>
            ) : (
              <div className="space-y-2">
                {customerTxs.map(tx => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      setSelectedTransaction(tx);
                      setIsDetailOpen(true);
                    }}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <TypeBadge type={tx.type} />
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {tx.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {tx.createdAt} • {tx.paymentMethod.split(' ')[0]}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="mt-0.5">
                        <StatusBadge status={tx.status} size="sm" showIcon={false} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
