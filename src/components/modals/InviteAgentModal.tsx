import React, { useState } from 'react';
import { X, Network, Copy, Check, QrCode, Send, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface InviteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteAgentModal: React.FC<InviteAgentModalProps> = ({ isOpen, onClose }) => {
  const { agent, isMasterAgent, inviteSubAgent, showToast, setCurrentPage } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('Dhaka, Central Hub');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  if (!isMasterAgent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
        <div className="bg-[#121e3d] border border-amber-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp text-white p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-base font-black text-white">Sub-Agent Invite Locked</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Tier 3 Only
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              সাব-এজেন্ট ইনভাইটেশন ও রেফারেল সুবিধাটি শুধুমাত্র <strong>Tier 3 (Master Agent)</strong>-দের জন্য একটি এক্সক্লুসিভ ফিচার। আপনি বর্তমানে <strong>{agent.kycLevel || 'Tier 1 / 2'}</strong>-এ আছেন। রেফারেল সুবিধা আনলক করতে $১,০০০+ ফ্লোট ব্যালেন্স ও KYC সম্পন্ন করে Tier 3-এ আপগ্রেড করুন।
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#233763] text-slate-300 hover:text-white bg-[#1a294e] text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                setCurrentPage('kyc');
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade Tier 3</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeRefCode = agent.referralCode || (agent.id ? 'AGENT-' + agent.id.replace('AG-', '') : 'AGENT-PARTNER');
  const inviteLink = `${window.location.origin}/signup?ref=${activeRefCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    showToast('info', 'Link Copied', 'Partner referral link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    inviteSubAgent(name, email, mobile, location);
    onClose();
    setName('');
    setEmail('');
    setMobile('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#233763] flex items-center justify-between bg-[#0a1128]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 flex items-center justify-center font-bold">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Invite Sub-Agent Partner
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                Earn 0.5% perpetual override on sub-agent transaction volume
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a294e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Referral link box */}
          <div className="p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Your Master Referral Link</span>
              <span className="font-mono text-[#00c853] font-black">{agent.referralCode}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-2 text-xs bg-[#121e3d] rounded-xl border border-[#233763] text-white font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white text-xs font-black transition-colors flex items-center gap-1 shadow-md shadow-emerald-950/50"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Direct Invite Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="text-xs font-black text-white">
              Or Send Direct Onboarding Invitation:
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Sub-Agent Name / Business Entity
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Clearing Hub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="agent@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 555-019-2834"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-mono font-bold focus:outline-none focus:border-[#00c853]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Operating Location / Region
              </label>
              <input
                type="text"
                placeholder="e.g. Global Financial Hub"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#233763] text-slate-300 hover:text-white bg-[#1a294e] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white text-xs font-black shadow-md shadow-emerald-950/50 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Invitation</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
