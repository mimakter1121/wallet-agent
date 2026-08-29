import React, { useState } from 'react';
import { Send, X, MessageCircle, ExternalLink, Headphones } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TelegramFloatingButton: React.FC = () => {
  const { telegramUsername, telegramSupportUrl } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const displayHandle = telegramUsername.startsWith('http')
    ? telegramUsername.replace('https://t.me/', '@')
    : (telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`);

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 select-none">
      {/* Mini Support Card Popup */}
      {isOpen && (
        <div className="mb-3 w-72 bg-[#121e3d] border border-[#233763] rounded-3xl p-4 shadow-2xl animate-scaleUp text-white relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#229ED9]/15 blur-2xl rounded-full pointer-events-none" />

          <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-md">
                <Send className="w-4 h-4 -rotate-45 -translate-y-0.5 translate-x-0.5" />
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Telegram Support</span>
                  <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-300 font-mono font-medium">24/7 Clearance Desk</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a294e]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 space-y-2">
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Need instant assistance with deposits, withdrawals, or rate clearances? Connect directly with our live Telegram desk.
            </p>
            <div className="p-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-xs font-mono text-[#00b0ff] font-bold flex items-center justify-between truncate">
              <span className="truncate">{displayHandle}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00c853]/20 text-[#00c853] font-sans font-bold shrink-0">ONLINE</span>
            </div>
          </div>

          <a
            href={telegramSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#0088cc] text-white font-black py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-cyan-950/50 active:scale-98"
          >
            <Send className="w-3.5 h-3.5 -rotate-45" />
            <span>Open Telegram Live Chat</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto" />
          </a>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Telegram Live Agent Support"
        className="group relative flex items-center gap-2.5 px-3.5 py-3 rounded-full bg-gradient-to-r from-[#229ED9] to-[#0088cc] hover:from-[#0088cc] hover:to-[#0077bb] text-white font-black text-xs shadow-2xl shadow-cyan-950/80 border border-[#229ED9]/50 transition-all transform hover:scale-105 active:scale-95"
      >
        <div className="relative">
          <Send className="w-5 h-5 -rotate-45 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00c853] border-2 border-[#121e3d] rounded-full animate-ping" />
        </div>
        <span className="hidden md:inline-block pr-1 tracking-wide font-extrabold text-xs">
          Telegram Support
        </span>
      </button>
    </div>
  );
};
