import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconBgColor = 'bg-[#00c853]/15 border-[#00c853]/30',
  iconColor = 'text-[#00c853]',
  onClick,
  className = ''
}) => {
  const valStr = String(value);
  // Auto-scale font size for large numeric/currency strings so they never overflow
  const isExtraLong = valStr.length > 12;
  const isLong = valStr.length > 8;
  const valueFontSize = isExtraLong
    ? 'text-sm sm:text-base md:text-xl'
    : isLong
    ? 'text-base sm:text-lg md:text-2xl'
    : 'text-lg sm:text-2xl';

  return (
    <div 
      onClick={onClick}
      className={`cashier-card p-3 sm:p-4 min-w-0 overflow-hidden flex flex-col justify-between transition-all ${onClick ? 'cursor-pointer hover:border-[#00c853]/50' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 line-clamp-2 leading-tight">
          {title}
        </span>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${iconBgColor} ${iconColor}`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>

      <div className="mt-2 min-w-0">
        <div 
          className={`${valueFontSize} font-black text-white font-mono truncate tracking-tight`}
          title={valStr}
        >
          {value}
        </div>

        {(trend || subtitle) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs min-w-0">
            {trend && (
              <span className={`inline-flex items-center font-bold gap-0.5 flex-shrink-0 ${trend.isPositive ? 'text-[#00c853]' : 'text-rose-400'}`}>
                {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-400 text-[10px] sm:text-[11px] font-medium truncate" title={subtitle}>
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
