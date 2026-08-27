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
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconBgColor = 'bg-[#00c853]/15 border-[#00c853]/30',
  iconColor = 'text-[#00c853]',
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`cashier-card p-4 transition-all ${onClick ? 'cursor-pointer hover:border-[#00c853]/50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${iconBgColor} ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2">
        <div className="text-xl sm:text-2xl font-black text-white font-mono">
          {value}
        </div>

        {(trend || subtitle) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {trend && (
              <span className={`inline-flex items-center font-bold gap-0.5 ${trend.isPositive ? 'text-[#00c853]' : 'text-rose-400'}`}>
                {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-400 text-[11px] font-medium truncate">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
