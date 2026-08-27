import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

export const AdminHeader: React.FC<{
  title: string;
  subtitle: string;
  onLogout?: () => void;
}> = ({ title, subtitle, onLogout }) => {
  return (
    <header className="bg-[#121e3d] border-b border-[#233763] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md text-white select-none">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black text-white tracking-tight">{title}</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40">
            SYSTEM ADMIN
          </span>
        </div>
        <p className="text-xs text-slate-300 font-medium mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a294e] border border-[#233763] text-slate-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-[#00c853]" />
          <span className="text-[#00c853] font-black">Supabase Connected</span>
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-[#233763]">
          <div className="w-9 h-9 rounded-xl bg-[#00c853] text-white font-black text-xs flex items-center justify-center shadow-md shadow-emerald-950/40">
            AD
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-black text-white">Master Admin</div>
            <div className="text-[11px] text-[#00c853] font-mono font-bold">admin@walletagent.internal</div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Lock Admin Portal"
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock Portal</span>
          </button>
        )}
      </div>
    </header>
  );
};
