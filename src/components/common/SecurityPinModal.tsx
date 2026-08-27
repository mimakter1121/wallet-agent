import React, { useState, useEffect } from 'react';
import { Lock, Shield, X, Delete } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SecurityPinModal: React.FC = () => {
  const { 
    isPinModalOpen, 
    pinActionTitle, 
    pinActionSubtitle, 
    submitPin, 
    closePinModal 
  } = useApp();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPinModalOpen) {
      setPin('');
      setError(null);
    }
  }, [isPinModalOpen]);

  if (!isPinModalOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(null);
      if (next.length === 4) {
        setTimeout(() => {
          const success = submitPin(next);
          if (!success) {
            setError('Incorrect Security PIN. Please try again.');
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden text-white animate-slideUp">
        {/* Close Button */}
        <button 
          onClick={closePinModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#233763] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-2">
          <div className="w-12 h-12 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 mx-auto flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white">
            {pinActionTitle || 'Security Verification'}
          </h3>
          <p className="text-xs text-slate-300 font-medium mt-1 max-w-[260px] mx-auto">
            {pinActionSubtitle || 'Enter your 4-digit transaction authorization PIN.'}
          </p>
        </div>

        {/* PIN Dots display */}
        <div className="my-6 flex justify-center items-center gap-4">
          {[0, 1, 2, 3].map((index) => {
            const filled = pin.length > index;
            return (
              <div 
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  filled 
                    ? 'bg-[#00c853] scale-125 shadow-md shadow-emerald-950/50' 
                    : 'bg-[#1a294e] border border-[#233763]'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-bold text-rose-400 text-center mb-3">
            {error}
          </p>
        )}

        {/* PIN Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-xl bg-[#1a294e] hover:bg-[#233763] border border-[#233763] text-white font-black text-lg transition-all active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            title="Clear PIN"
            className="h-12 rounded-xl bg-[#1a294e] text-slate-400 hover:text-white border border-[#233763] text-xs font-bold transition-all flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl bg-[#1a294e] hover:bg-[#233763] border border-[#233763] text-white font-black text-lg transition-all active:scale-95 flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-xl bg-[#1a294e] hover:bg-[#233763] border border-[#233763] text-slate-300 font-black transition-all active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Security badge */}
        <div className="mt-6 pt-4 border-t border-[#233763] flex items-center justify-center gap-1.5 text-[11px] text-slate-300 font-medium">
          <Shield className="w-3.5 h-3.5 text-[#00c853]" />
          <span>256-Bit Hardware Encrypted PIN Verification</span>
        </div>
      </div>
    </div>
  );
};
