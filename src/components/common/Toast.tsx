import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let icon = <CheckCircle2 className="w-5 h-5 text-[#00c853] shrink-0" />;
        let border = 'border-[#00c853]/40';
        let bg = 'bg-[#121e3d] text-white';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          border = 'border-rose-500/40';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          border = 'border-amber-500/40';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-[#00b0ff] shrink-0" />;
          border = 'border-[#00b0ff]/40';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border ${border} ${bg} flex items-start gap-3 animate-slideLeft transition-all`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-black text-white">
                {toast.title}
              </h5>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug font-medium">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
