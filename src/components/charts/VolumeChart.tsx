import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

type TimeRange = 'today' | '7days' | '30days';

interface DataPoint {
  label: string;
  deposit: number;
  withdrawal: number;
  commission: number;
}

export const VolumeChart: React.FC = () => {
  const { transactions, commissionRates } = useApp();
  const [range, setRange] = useState<TimeRange>('7days');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Get UTC date string from stored createdAt
  // transactions.createdAt stored as: "2026-08-27 14:42:49" (UTC from supabase)
  const getUTCDateStr = (createdAt: string): string => {
    // Handle both "2026-08-27 14:42" and "2026-08-27T14:42" formats
    return createdAt.substring(0, 10);
  };

  const getUTCHour = (createdAt: string): number => {
    // Extract hour from "2026-08-27 14:42" -> 14
    return parseInt(createdAt.substring(11, 13) || '0', 10);
  };

  const getLiveData = (): DataPoint[] => {
    const approvedTxs = transactions.filter(t => t.status === 'success');
    const depRate = commissionRates.deposit;
    const wthRate = commissionRates.withdrawal;

    if (range === 'today') {
      // Use UTC today date to match Supabase UTC timestamps
      const nowUTC = new Date();
      const todayUTC = nowUTC.toISOString().substring(0, 10);
      const todayTxs = approvedTxs.filter(t => t.createdAt && getUTCDateStr(t.createdAt) === todayUTC);

      const timeSlots = [
        { label: '00:00', start: 0, end: 4 },
        { label: '04:00', start: 4, end: 8 },
        { label: '08:00', start: 8, end: 12 },
        { label: '12:00', start: 12, end: 16 },
        { label: '16:00', start: 16, end: 20 },
        { label: '20:00', start: 20, end: 24 }
      ];

      return timeSlots.map(slot => {
        const slotTxs = todayTxs.filter(t => {
          const hour = t.createdAt ? getUTCHour(t.createdAt) : 0;
          return hour >= slot.start && hour < slot.end;
        });

        const dep = slotTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const wth = slotTxs.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
        const comm = slotTxs.reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount * depRate : t.type === 'withdrawal' ? t.amount * wthRate : 0), 0);

        return { label: slot.label, deposit: dep, withdrawal: wth, commission: comm };
      });

    } else if (range === '7days') {
      const last7Days: { label: string; dateStr: string }[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        const dateStr = d.toISOString().substring(0, 10); // UTC date
        const dayLabel = dayNames[d.getUTCDay()];
        last7Days.push({ label: dayLabel, dateStr });
      }

      return last7Days.map(item => {
        const dayTxs = approvedTxs.filter(t => t.createdAt && getUTCDateStr(t.createdAt) === item.dateStr);
        const dep = dayTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const wth = dayTxs.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
        const comm = dayTxs.reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount * depRate : t.type === 'withdrawal' ? t.amount * wthRate : 0), 0);

        return { label: item.label, deposit: dep, withdrawal: wth, commission: comm };
      });

    } else {
      // 30 days — group by week
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const now = new Date();

      return weeks.map((label, idx) => {
        const weekEnd = new Date(now);
        weekEnd.setUTCDate(weekEnd.getUTCDate() - (idx * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setUTCDate(weekStart.getUTCDate() - 6);
        const startStr = weekStart.toISOString().substring(0, 10);
        const endStr = weekEnd.toISOString().substring(0, 10);

        const weekTxs = approvedTxs.filter(t => {
          if (!t.createdAt) return false;
          const d = getUTCDateStr(t.createdAt);
          return d >= startStr && d <= endStr;
        });

        const dep = weekTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const wth = weekTxs.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
        const comm = weekTxs.reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount * depRate : t.type === 'withdrawal' ? t.amount * wthRate : 0), 0);

        return { label, deposit: dep, withdrawal: wth, commission: comm };
      }).reverse(); // show oldest week first
    }
  };

  const data = getLiveData();
  const rawMax = Math.max(...data.map(d => Math.max(d.deposit, d.withdrawal)));
  const maxVal = rawMax > 0 ? rawMax : 100;

  const totalDeposit = data.reduce((acc, d) => acc + d.deposit, 0);
  const totalWithdrawal = data.reduce((acc, d) => acc + d.withdrawal, 0);
  const totalComm = data.reduce((acc, d) => acc + d.commission, 0);

  const hasData = totalDeposit > 0 || totalWithdrawal > 0;

  return (
    <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-5 shadow-card text-white">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#233763]">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <span>Transaction Volume & Flow</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/30 font-mono">
              {hasData ? 'Live Feed ●' : 'Live Feed'}
            </span>
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">
            Gross deposit vs. withdrawal volume across authorized clearing rails
          </p>
        </div>

        {/* Time Tabs */}
        <div className="flex items-center bg-[#1a294e] border border-[#233763] p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
          {(['today', '7days', '30days'] as TimeRange[]).map(t => (
            <button
              key={t}
              onClick={() => {
                setRange(t);
                setHoveredIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === t
                  ? 'bg-[#00c853] text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {t === 'today' ? 'Today' : t === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 my-4">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] min-w-0 overflow-hidden flex sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#00c853] shrink-0" />
            <span>Deposits</span>
          </div>
          <div 
            className="text-sm sm:text-base font-black text-white font-mono truncate tracking-tight"
            title={`$${totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          >
            ${totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] min-w-0 overflow-hidden flex sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#00b0ff] shrink-0" />
            <span>Withdrawals</span>
          </div>
          <div 
            className="text-sm sm:text-base font-black text-white font-mono truncate tracking-tight"
            title={`$${totalWithdrawal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          >
            ${totalWithdrawal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] min-w-0 overflow-hidden flex sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>Net Commission</span>
          </div>
          <div 
            className="text-sm sm:text-base font-black text-[#00c853] font-mono truncate tracking-tight"
            title={`+$${totalComm.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          >
            +${totalComm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="pt-3">
        {!hasData ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-500">
            <div className="text-xs font-bold text-slate-400">No transactions in this period</div>
            <div className="text-[10px] text-slate-500 mt-1">Approve customer deposits or withdrawals to see chart data</div>
          </div>
        ) : (
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {data.map((item, index) => {
              const depHeightPercent = rawMax > 0 ? Math.max(4, Math.round((item.deposit / maxVal) * 100)) : 4;
              const wthHeightPercent = rawMax > 0 ? Math.max(4, Math.round((item.withdrawal / maxVal) * 100)) : 4;
              const isHovered = hoveredIndex === index;
              const hasBarData = item.deposit > 0 || item.withdrawal > 0;

              return (
                <div 
                  key={`${item.label}-${index}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-20 z-20 bg-slate-900/95 backdrop-blur-sm text-white text-[11px] py-2 px-3 rounded-xl shadow-xl border border-slate-700 whitespace-nowrap pointer-events-none animate-fadeIn">
                      <div className="font-bold text-[#00c853] mb-1">{item.label}</div>
                      <div className="text-[#00c853]">↓ Dep: ${item.deposit.toFixed(2)}</div>
                      <div className="text-[#00b0ff]">↑ Wth: ${item.withdrawal.toFixed(2)}</div>
                      <div className="text-amber-300">Comm: +${item.commission.toFixed(2)}</div>
                    </div>
                  )}

                  {/* Bars */}
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full max-h-[140px]">
                    {/* Deposit Bar */}
                    <div 
                      style={{ height: `${item.deposit > 0 ? depHeightPercent : 4}%` }}
                      className={`w-3 sm:w-5 rounded-t-md transition-all duration-300 ${
                        item.deposit === 0 ? 'bg-[#233763]/50' : isHovered ? 'bg-[#00e676]' : 'bg-[#00c853]'
                      }`}
                    />

                    {/* Withdrawal Bar */}
                    <div 
                      style={{ height: `${item.withdrawal > 0 ? wthHeightPercent : 4}%` }}
                      className={`w-3 sm:w-5 rounded-t-md transition-all duration-300 ${
                        item.withdrawal === 0 ? 'bg-[#233763]/50' : isHovered ? 'bg-[#40c4ff]' : 'bg-[#00b0ff]'
                      }`}
                    />
                  </div>

                  {/* Axis Label */}
                  <span className={`text-[11px] font-bold mt-2 truncate max-w-full ${hasBarData ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {hasData && (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 pt-3 border-t border-[#233763]">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-[#00c853] shrink-0" />
              <span>Customer Deposit (Cash-In)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-[#00b0ff] shrink-0" />
              <span>Customer Withdrawal (Cash-Out)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
