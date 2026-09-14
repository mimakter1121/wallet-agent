import React from 'react';
import { ShieldCheck, Lock, Menu } from 'lucide-react';

export const AdminHeader: React.FC<{
  title: string;
  subtitle: string;
  onLogout?: () => void;
  onOpenMobileMenu?: () => void;
}> = ({ title, subtitle, onLogout, onOpenMobileMenu }) => {
  return (
    <header className="bg-[#121e3d] border-b border-[#233763] px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between sticky top-0 z-30 shadow-md text-white select-none">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-[#1a294e] hover:bg-[#233763] text-slate-200 hover:text-white border border-[#233763] transition-colors shrink-0"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-lg font-black text-white tracking-tight truncate">
              {title}
            </h1>
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 shrink-0">
              SYSTEM ADMIN
            </span>
          </div>
          <p className="hidden sm:block text-xs text-slate-300 font-medium mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a294e] border border-[#233763] text-slate-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-[#00c853]" />
          <span className="text-[#00c853] font-black">Supabase Connected</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l border-[#233763]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#00c853] text-white font-black text-xs flex items-center justify-center shadow-md shadow-emerald-950/40 shrink-0">
            AD
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-black text-white">Master Admin</div>
            <div className="text-[11px] text-[#00c853] font-mono font-bold truncate max-w-[150px]">
              admin@walletagent.internal
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Lock Admin Portal"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock Portal</span>
          </button>
        )}
      </div>
    </header>
  );
};
