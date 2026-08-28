import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Award, 
  Users, 
  ReceiptText, 
  ArrowRight, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BalanceCard } from '../components/common/BalanceCard';
import { StatCard } from '../components/common/StatCard';
import { VolumeChart } from '../components/charts/VolumeChart';
import { CommissionChart } from '../components/charts/CommissionChart';
import { StatusBadge, TypeBadge } from '../components/common/StatusBadge';
import { AddFundsModal } from '../components/modals/AddFundsModal';
import { TransferModal } from '../components/modals/TransferModal';

import { usdToLocal, formatCurrency } from '../config/currencyRates';

export const DashboardPage: React.FC = () => {
  const { 
    agent, 
    transactions, 
    setCurrentPage, 
    setSelectedTransaction, 
    setIsDetailOpen 
  } = useApp();

  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const nowUTCDate = new Date().toISOString().substring(0, 10);
  const todayTxs = transactions.filter(t => t.status === 'success' && t.createdAt?.substring(0, 10) === nowUTCDate);

  const computedDeposits = todayTxs
    .filter(t => t.type === 'deposit')
    .reduce((acc, t) => acc + t.amount, 0);

  const computedWithdrawals = todayTxs
    .filter(t => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount, 0);

  const computedCommission = todayTxs
    .filter(t => t.type === 'deposit' || t.type === 'withdrawal')
    .reduce((acc, t) => acc + (t.type === 'deposit' ? t.amount * 0.015 : t.amount * 0.012), 0);

  const displayDeposits = computedDeposits;
  const displayWithdrawals = computedWithdrawals;
  const displayCommission = computedCommission;

  const bdt200 = formatCurrency(usdToLocal(200, 'BDT'), 'BDT');
  const bdt1000 = formatCurrency(usdToLocal(1000, 'BDT'), 'BDT');

  const recentTxs = transactions.slice(0, 6);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#121e3d] border border-[#233763] shadow-md text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00c853] text-white flex items-center justify-center font-bold text-xs shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-2">
              <span>{agent.kycLevel} Account Operational</span>
              <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              {agent.kycLevel.includes('Tier 1')
                ? `Basic Tier Clearance Limit: $200.00 USD (~${bdt200}) Daily.`
                : agent.kycLevel.includes('Tier 2')
                ? `Business Tier Clearance Limit: $1,000.00 USD (~${bdt1000}) Daily.`
                : `Master Liquidity Desk Limit: $1,000.00+ to Unlimited USD (~${bdt1000}+) Daily.`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentPage('kyc')}
          className="self-start sm:self-auto text-xs font-black text-[#00c853] hover:text-[#00e676] underline flex items-center gap-1"
        >
          <span>View Clearance Tiers</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Available Balance Card */}
      <BalanceCard
        onAddFunds={() => setIsAddFundsOpen(true)}
        onRequestWithdrawal={() => setCurrentPage('withdrawals')}
        onNewDeposit={() => setCurrentPage('deposits')}
      />

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Today's Deposits"
          value={`$${displayDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Processed today"
          icon={ArrowDownLeft}
          iconBgColor="bg-[#00c853]/15 border-[#00c853]/30"
          iconColor="text-[#00c853]"
          onClick={() => setCurrentPage('deposits')}
        />

        <StatCard
          title="Today's Withdrawals"
          value={`$${displayWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Payouts today"
          icon={ArrowUpRight}
          iconBgColor="bg-[#00b0ff]/15 border-[#00b0ff]/30"
          iconColor="text-[#00b0ff]"
          onClick={() => setCurrentPage('withdrawals')}
        />

        <StatCard
          title="Today's Commission"
          value={`+$${displayCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Earned revenue"
          icon={Award}
          iconBgColor="bg-amber-500/15 border-amber-500/30"
          iconColor="text-amber-400"
          onClick={() => setCurrentPage('commission')}
        />

        <StatCard
          title="Total Customers"
          value={agent.activeCustomersCount}
          subtitle="Registered clients"
          icon={Users}
          iconBgColor="bg-purple-500/15 border-purple-500/30"
          iconColor="text-purple-400"
          onClick={() => setCurrentPage('customers')}
        />
      </div>

      {/* Volume Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VolumeChart />
        </div>
        <div className="lg:col-span-1">
          <CommissionChart />
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-5 shadow-card text-white">
        <div className="flex items-center justify-between pb-4 border-b border-[#233763]">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-[#00c853]" />
              <span>Recent Clearing Transactions</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Live customer deposits, withdrawals, and liquidity settlements
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('transactions')}
            className="text-xs font-black text-[#00c853] hover:underline flex items-center gap-1"
          >
            <span>View All Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Table */}
        {recentTxs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-bold">
            No recent transactions recorded. Use 'Deposit (Cash In)' to begin clearing orders.
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#233763] text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3 hidden md:table-cell">Payment Method</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Date & Time</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233763]">
                {recentTxs.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => {
                      setSelectedTransaction(tx);
                      setIsDetailOpen(true);
                    }}
                    className="hover:bg-[#1a294e] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-3 font-mono font-black text-white group-hover:text-[#00c853]">
                      {tx.id}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-200">
                      <div>{tx.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <TypeBadge type={tx.type} />
                    </td>
                    <td className="py-3.5 px-3 font-black text-white font-mono">
                      ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 hidden md:table-cell text-slate-300 font-medium">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3.5 px-3 hidden sm:table-cell text-slate-400 font-mono">
                      {tx.createdAt}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddFundsModal
        isOpen={isAddFundsOpen}
        onClose={() => setIsAddFundsOpen(false)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />

    </div>
  );
};
