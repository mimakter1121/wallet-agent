import React, { useState } from 'react';
import { Users, ShieldCheck, Power, Plus, CheckCircle2, AlertTriangle, XCircle, Clock, Search, ShieldAlert, ChevronDown, Trash2, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Agent } from '../types';

export const AgentsPage: React.FC = () => {
  const { agents, updateAgentStatus, updateAgentKycStatus, addAgent, deleteAgent } = useAdmin();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Liquidity Agent');
  const [balance, setBalance] = useState('1000');
  const [kycStatus, setKycStatus] = useState<'verified' | 'pending' | 'under_review' | 'rejected' | 'unverified'>('verified');
  const [confirmDeleteAgent, setConfirmDeleteAgent] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addAgent({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '01700000000',
      role,
      balance: parseFloat(balance) || 0,
      pendingBalance: 0,
      commissionBalance: 0,
      kycStatus,
      active: true
    });

    setShowAddForm(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  const getKycBadgeClass = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300';
      case 'under_review':
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300';
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fadeIn text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Agent Network & KYC Approvals
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Manage agent accounts, set clearance status, review identity documents, and configure float allocations
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Add New Agent'}</span>
        </button>
      </div>

      {/* Add Agent Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
            <h3 className="text-sm font-bold text-white">Register New Agent Account</h3>
            <span className="text-xs font-bold text-[#00c853]">Admin Clearance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Agent Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahim Chowdhury"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-semibold focus:outline-none focus:border-[#00c853]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="agent@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-semibold focus:outline-none focus:border-[#00c853]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+8801700000000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-mono focus:outline-none focus:border-[#00c853]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Balance (USD)
              </label>
              <input
                type="number"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                KYC Verification Status
              </label>
              <select
                value={kycStatus}
                onChange={e => setKycStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
              >
                <option value="verified">Verified (Approved)</option>
                <option value="under_review">Under Review</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Agent Tier / Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-semibold focus:outline-none focus:border-[#00c853]"
              >
                <option value="Liquidity Agent">Liquidity Agent Tier 2</option>
                <option value="Master Liquidity Agent">Master Liquidity Agent Tier 3</option>
                <option value="Sub-Agent">Sub-Agent Tier 1</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-[#1a294e] border border-[#233763] text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white text-xs font-bold shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              Create Agent Account
            </button>
          </div>
        </form>
      )}

      {/* Agents Directory & KYC Control */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
          <div>
            <h3 className="text-sm font-bold text-white">Registered Agents ({agents.length})</h3>
            <p className="text-xs text-slate-400">Change KYC status directly from the dropdown to grant or revoke clearance</p>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-12 bg-[#1a294e]/40 rounded-2xl border border-[#233763]">
            <Users className="w-10 h-10 mx-auto text-slate-400 opacity-50 mb-2" />
            <p className="text-xs font-bold text-slate-300">No agents registered in system</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click 'Add New Agent' to add liquidity agents</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (md:hidden) */}
            <div className="md:hidden space-y-3">
              {agents.map(ag => (
                <div key={ag.id} className="p-3.5 rounded-xl bg-[#1a294e]/70 border border-[#233763] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-sm">{ag.name}</div>
                      <div className="text-[10px] text-[#00b0ff] font-semibold">{ag.role}</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400 bg-[#121e3d] px-2 py-0.5 rounded border border-[#233763]">
                      {ag.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#121e3d] p-2.5 rounded-lg border border-[#233763]/60">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Float Balance</div>
                      <div className="font-black text-sm text-[#00c853]">
                        ${ag.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Contact</div>
                      <div className="font-mono text-[11px] text-slate-300 truncate">{ag.phone}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate">{ag.email}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-[#233763]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-300">KYC Status:</span>
                      <select
                        value={ag.kycStatus}
                        onChange={(e) => updateAgentKycStatus(ag.id, e.target.value as any)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs border cursor-pointer ${getKycBadgeClass(ag.kycStatus)}`}
                      >
                        <option value="verified">✓ VERIFIED</option>
                        <option value="under_review">⏳ UNDER REVIEW</option>
                        <option value="pending">⚠️ PENDING</option>
                        <option value="rejected">❌ REJECTED</option>
                        <option value="unverified">⚪ UNVERIFIED</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => updateAgentStatus(ag.id, !ag.active)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          ag.active
                            ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {ag.active ? '✓ Account Active' : '⊘ Suspended'}
                      </button>

                      <button
                        onClick={() => setConfirmDeleteAgent(ag)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-[#121e3d] border border-[#233763] hover:border-rose-500/30 transition-all"
                        title="Delete Agent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Full Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#233763] text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Agent Name & Role</th>
                    <th className="py-3 px-3">Agent ID</th>
                    <th className="py-3 px-3">Contact Email & Phone</th>
                    <th className="py-3 px-3">Float Balance</th>
                    <th className="py-3 px-3">KYC Verification Status</th>
                    <th className="py-3 px-3 text-right">Account Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233763]/60">
                  {agents.map(ag => (
                    <tr key={ag.id} className="hover:bg-[#1a294e]/50 transition-colors">
                      <td className="py-4 px-3">
                        <div className="font-bold text-white">{ag.name}</div>
                        <div className="text-[10px] text-slate-400">{ag.role}</div>
                      </td>

                      <td className="py-4 px-3 font-mono font-bold text-slate-300">
                        {ag.id}
                      </td>

                      <td className="py-4 px-3 text-slate-300 font-mono">
                        <div>{ag.email}</div>
                        <div className="text-[10px] text-slate-400">{ag.phone}</div>
                      </td>

                      <td className="py-4 px-3 font-black text-[#00c853] text-sm">
                        ${ag.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* KYC Verification Status Change Dropdown */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={ag.kycStatus}
                            onChange={(e) => updateAgentKycStatus(ag.id, e.target.value as any)}
                            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs border transition-all cursor-pointer ${getKycBadgeClass(ag.kycStatus)}`}
                          >
                            <option value="verified">✓ VERIFIED (Approved)</option>
                            <option value="under_review">⏳ UNDER REVIEW</option>
                            <option value="pending">⚠️ PENDING</option>
                            <option value="rejected">❌ REJECTED</option>
                            <option value="unverified">⚪ UNVERIFIED</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => updateAgentStatus(ag.id, !ag.active)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                              ag.active
                                ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 hover:bg-[#00c853]/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                            }`}
                          >
                            {ag.active ? '✓ Account Active' : '⊘ Account Suspended'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteAgent(ag)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                            title="Delete Agent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121e3d] border border-rose-500/40 rounded-3xl p-6 shadow-2xl w-full max-w-md mx-4 space-y-5 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Confirm Agent Deletion</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
              <p className="font-bold">⚠️ You are about to permanently delete:</p>
              <p><span className="text-white font-black">{confirmDeleteAgent.name}</span> ({confirmDeleteAgent.id})</p>
              <p className="text-rose-400 mt-2">This will also remove all associated KYC documents, transactions, and customer records from the database.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteAgent(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-slate-300 text-sm font-bold hover:bg-[#233763] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  await deleteAgent(confirmDeleteAgent.id);
                  setIsDeleting(false);
                  setConfirmDeleteAgent(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Deleting...</span></>
                ) : (
                  <><Trash2 className="w-4 h-4" /><span>Delete Agent</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
