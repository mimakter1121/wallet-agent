import React, { useState } from 'react';
import { Users, ShieldCheck, Power, Plus, CheckCircle2, AlertTriangle, XCircle, Clock, Search, ShieldAlert, ChevronDown } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Agent } from '../types';

export const AgentsPage: React.FC = () => {
  const { agents, updateAgentStatus, updateAgentKycStatus, addAgent } = useAdmin();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Liquidity Agent');
  const [balance, setBalance] = useState('1000');
  const [kycStatus, setKycStatus] = useState<'verified' | 'pending' | 'under_review' | 'rejected' | 'unverified'>('verified');

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
    <div className="p-6 space-y-6 animate-fadeIn text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Agent Network & KYC Approvals
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Manage agent accounts, set clearance status, review identity documents, and configure float allocations
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-950/50"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Agent</span>
        </button>
      </div>

      {/* Add Agent Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Register New Agent Account</h3>
            <span className="text-xs font-bold text-emerald-600">Admin Clearance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Agent Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahim Chowdhury"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="agent@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+8801700000000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Balance (USD)
              </label>
              <input
                type="number"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                KYC Verification Status
              </label>
              <select
                value={kycStatus}
                onChange={e => setKycStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="verified">Verified (Approved)</option>
                <option value="under_review">Under Review</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Agent Tier / Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
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
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-900/20"
            >
              Create Agent Account
            </button>
          </div>
        </form>
      )}

      {/* Agents Directory & KYC Control Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registered Agents ({agents.length})</h3>
            <p className="text-xs text-slate-500">Change KYC status directly from the dropdown to grant or revoke clearance</p>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <Users className="w-10 h-10 mx-auto text-slate-400 opacity-50 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No agents registered in system</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click 'Register New Agent' to add liquidity agents</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">Agent Name & Role</th>
                  <th className="py-3 px-3">Agent ID</th>
                  <th className="py-3 px-3">Contact Email & Phone</th>
                  <th className="py-3 px-3">Float Balance</th>
                  <th className="py-3 px-3">KYC Verification Status</th>
                  <th className="py-3 px-3 text-right">Account Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {agents.map(ag => (
                  <tr key={ag.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{ag.name}</div>
                      <div className="text-[10px] text-slate-400">{ag.role}</div>
                    </td>

                    <td className="py-4 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                      {ag.id}
                    </td>

                    <td className="py-4 px-3 text-slate-600 dark:text-slate-400 font-mono">
                      <div>{ag.email}</div>
                      <div className="text-[10px] text-slate-400">{ag.phone}</div>
                    </td>

                    <td className="py-4 px-3 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
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
                      <button
                        onClick={() => updateAgentStatus(ag.id, !ag.active)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all ${
                          ag.active
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                        }`}
                      >
                        {ag.active ? '✓ Account Active' : 'Account Suspended'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
