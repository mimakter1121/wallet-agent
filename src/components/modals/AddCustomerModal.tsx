import React, { useState } from 'react';
import { X, UserPlus, ShieldAlert, Phone, User, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addCustomer, showToast } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('error', 'Validation Error', 'Customer Username and Phone Number are required.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      addCustomer({
        name: name.trim(),
        mobile: phone.trim(),
        email: `${name.toLowerCase().replace(/\s+/g, '')}@customer.com`,
        accountNumber: `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
        kycStatus: 'verified'
      });

      showToast('success', 'Customer Registered', `Username: ${name} added to directory.`);
      setIsSubmitting(false);
      setName('');
      setPhone('');
      if (onSuccess) onSuccess();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#233763] flex items-center justify-between bg-[#1a294e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Register New Customer</h3>
              <p className="text-[11px] text-slate-300 font-medium">Add verified client to cashier directory</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Customer Username <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. john_doe99"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a294e] border border-[#233763] focus:border-[#00c853] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Customer Phone Number <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="+1 (555) 019-2834"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a294e] border border-[#233763] focus:border-[#00c853] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none font-mono transition-colors"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#1a294e] border border-[#233763] text-[11px] text-slate-300 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#00c853] shrink-0" />
            <span>Customer will be auto-verified for instant deposit & withdrawal processing.</span>
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
              className="flex-1 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs transition-all shadow-md shadow-emerald-950/50"
            >
              {isSubmitting ? 'Registering...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
