import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const norm = status.toLowerCase();

  let bgClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let icon = <Clock className="w-3.5 h-3.5" />;
  let label = status.charAt(0).toUpperCase() + status.slice(1);

  if (['success', 'approved', 'verified', 'credited', 'active', 'resolved'].includes(norm)) {
    bgClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
  } else if (['pending', 'under_review', 'open'].includes(norm)) {
    bgClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
    icon = <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />;
    if (norm === 'under_review') label = 'Under Review';
  } else if (['processing', 'in_progress'].includes(norm)) {
    bgClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
    icon = <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />;
    if (norm === 'in_progress') label = 'In Progress';
  } else if (['rejected', 'failed', 'suspended'].includes(norm)) {
    bgClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
    icon = <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClass} ${bgClass} transition-colors font-medium`}>
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};

export const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const norm = type.toLowerCase();
  
  if (norm === 'deposit') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40">
        <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        Deposit
      </span>
    );
  }
  if (norm === 'withdrawal') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40">
        <ArrowUpRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
        Withdrawal
      </span>
    );
  }
  if (norm === 'commission' || norm === 'referral') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40">
        Commission
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};
