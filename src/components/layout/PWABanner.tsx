import React, { useState } from 'react';
import { Download, X, Smartphone, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PWABanner: React.FC = () => {
  const { isInstallPromptAvailable, triggerPwaInstall, isOnline } = useApp();
  const [dismissed, setDismissed] = useState(false);

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2">
        <span>Offline Mode: Working with cached records. Updates will sync upon reconnection.</span>
      </div>
    );
  }

  if (!isInstallPromptAvailable || dismissed) return null;

  return (
    <div className="bg-[#121e3d] text-white px-4 py-3 border-b border-[#233763] flex items-center justify-between text-xs animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#00c853]/20 border border-[#00c853]/40 flex items-center justify-center text-[#00c853] font-bold">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <span className="font-black text-white">Install Wallet Agent on your device</span>
          <span className="hidden sm:inline text-slate-300 ml-1.5 font-medium">— Instant offline ledger access & fast PIN unlock.</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={triggerPwaInstall}
          className="flex items-center gap-1.5 bg-[#00c853] hover:bg-[#00e676] text-white font-black px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-950/50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
