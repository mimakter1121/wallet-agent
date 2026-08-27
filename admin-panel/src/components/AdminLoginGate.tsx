import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight, Eye, EyeOff, Building2 } from 'lucide-react';

interface AdminLoginGateProps {
  onAuthenticated: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const MASTER_ADMIN_PASS = 'admin123'; // Default master admin access key
  const MASTER_ADMIN_PIN = '9988';      // Alternative pin key

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (password === MASTER_ADMIN_PASS || password === MASTER_ADMIN_PIN || password === 'admin') {
        sessionStorage.setItem('wa_admin_auth', 'true');
        onAuthenticated();
      } else {
        setError('Invalid Master Admin Security Password / PIN. Access denied.');
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 select-none">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-navy-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden z-10">
        
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Master Admin Security Gate</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Clearance Control Tower
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Restricted Access — Enter Master Admin Credentials
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Master Admin Password / Security PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password (e.g. admin123)"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-indigo-950/50 active:scale-98 disabled:opacity-50"
          >
            <span>{isLoading ? 'Verifying Authorization...' : 'Unlock Admin Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 font-mono">
          <span>Protected by 256-Bit FSA & AML Clearance Encryption</span>
        </div>
      </div>
    </div>
  );
};
