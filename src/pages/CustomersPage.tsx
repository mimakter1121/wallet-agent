import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  Phone, 
  CreditCard, 
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { AddCustomerModal } from '../components/modals/AddCustomerModal';

export const CustomersPage: React.FC = () => {
  const { 
    customers, 
    setSelectedCustomer, 
    setIsCustomerDrawerOpen 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery) ||
      c.accountNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.kycStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (customer: any) => {
    setSelectedCustomer(customer);
    setIsCustomerDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* Top Header */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/40 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Customer Accounts & Directory
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Manage client KYC verification, lifetime clearing metrics, and dedicated liquidity wallets
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-950/50 active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          <span>Enroll New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 shadow-card flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer username, phone number, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder-slate-400 focus:outline-none focus:border-[#00c853]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'verified', label: 'Verified' },
            { id: 'pending', label: 'Pending KYC' },
            { id: 'under_review', label: 'Under Review' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#00c853] text-white shadow'
                  : 'bg-[#1a294e] text-slate-300 hover:text-white border border-[#233763]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#00b0ff]" />
            <p className="text-sm font-bold text-white">No customers found</p>
            <p className="text-xs text-slate-300 mt-1">Try adjusting your search query or status filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#233763] text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Customer Username</th>
                  <th className="py-3 px-3">Phone Number</th>
                  <th className="py-3 px-3">KYC Status</th>
                  <th className="py-3 px-3">Total Deposits</th>
                  <th className="py-3 px-3">Total Cashouts</th>
                  <th className="py-3 px-3 hidden md:table-cell">Account Number</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233763]">
                {filteredCustomers.map(customer => (
                  <tr
                    key={customer.id}
                    onClick={() => handleRowClick(customer)}
                    className="hover:bg-[#1a294e] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1a294e] border border-[#233763] text-[#00c853] flex items-center justify-center font-black text-xs">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-white group-hover:text-[#00c853]">
                            {customer.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-300">
                      {customer.mobile}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={customer.kycStatus} size="sm" />
                    </td>
                    <td className="py-3.5 px-3 font-black text-[#00c853] font-mono">
                      ${customer.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 font-black text-[#00b0ff] font-mono">
                      ${customer.totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 hidden md:table-cell font-mono text-slate-400">
                      {customer.accountNumber}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(customer);
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1a294e] inline-flex items-center gap-1 text-[11px] font-bold"
                      >
                        <span>View Ledger</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />
    </div>
  );
};
