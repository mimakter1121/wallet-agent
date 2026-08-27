import React, { useState } from 'react';
import { X, Send, ShieldCheck, DollarSign, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose }) => {
  const { agent, showToast } = useApp();
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid transfer amount.');
      return;
    }
    if (numAmount > agent.balance) {
      showToast('error', 'Insufficient Float', 'Your available float balance is lower than the transfer amount.');
      return;
    }
    if (!recipientId.trim()) {
      showToast('error', 'Missing Recipient', 'Please enter recipient Agent ID.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      showToast('success', 'Transfer Completed', `$${numAmount.toFixed(2)} transferred to Agent ${recipientId}`);
      setIsSubmitting(false);
      setAmount('');
      setRecipientId('');
      setNote('');
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#233763] flex items-center justify-between bg-[#1a294e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Transfer Agent Float</h3>
              <p className="text-[11px] text-slate-300 font-medium">Internal P2P float transfer to partner agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#233763] transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Recipient Agent ID <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. AG-99201"
                value={recipientId}
                onChange={e => setRecipientId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a294e] border border-[#233763] focus:border-[#00b0ff] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none font-mono transition-colors uppercase"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-200">
                Transfer Amount ($ USD) <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-[#00c853] font-mono font-bold">
                Max: ${agent.balance.toFixed(2)}
              </span>
            </div>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a294e] border border-[#233763] focus:border-[#00b0ff] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Reference Note (Optional)
            </label>
            <input
              type="text"
              placeholder="Liquidity rebalance..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1a294e] border border-[#233763] focus:border-[#00b0ff] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#1a294e] border border-[#233763] text-[11px] text-slate-300 flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#00b0ff] shrink-0" />
            <span>Zero fee internal agent transfer. Settlement is instant.</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#233763] bg-[#1a294e] text-slate-200 hover:text-white font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#00b0ff] hover:bg-[#40c4ff] text-white font-black text-xs transition-all shadow-md"
            >
              {isSubmitting ? 'Transferring...' : 'Send Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
