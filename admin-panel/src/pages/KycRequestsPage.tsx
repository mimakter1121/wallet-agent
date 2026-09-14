import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  Search, 
  Filter,
  Building2,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

interface KycDocumentRecord {
  id: string;
  doc_id: string;
  agent_code: string;
  title: string;
  document_type: string;
  file_name: string;
  file_size?: string;
  file_url?: string;
  storage_path?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

export const KycRequestsPage: React.FC = () => {
  const { showToast } = useAdmin();
  
  const [documents, setDocuments] = useState<KycDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rejection modal states
  const [rejectingDoc, setRejectingDoc] = useState<KycDocumentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchKycDocuments();
  }, []);

  const fetchKycDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching KYC documents:', error);
      } else if (data) {
        setDocuments(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (doc: KycDocumentRecord) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ status: 'verified', updated_at: new Date().toISOString() })
        .eq('id', doc.id);

      if (error) {
        showToast('error', 'Approval Failed', error.message);
        return;
      }

      // Update agent verification_status to verified in agents table
      await supabase
        .from('agents')
        .update({ verification_status: 'verified' })
        .eq('agent_code', doc.agent_code);

      showToast('success', 'KYC Approved', `Document (${doc.title}) for Agent ${doc.agent_code} has been verified.`);
      fetchKycDocuments();
    } catch (err) {
      showToast('error', 'Error', 'Failed to approve document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDoc) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ 
          status: 'rejected', 
          rejection_reason: rejectionReason || 'Document unreadable or invalid',
          updated_at: new Date().toISOString() 
        })
        .eq('id', rejectingDoc.id);

      if (error) {
        showToast('error', 'Rejection Failed', error.message);
        return;
      }

      showToast('info', 'KYC Document Rejected', `Document for Agent ${rejectingDoc.agent_code} was marked as rejected.`);
      setRejectingDoc(null);
      setRejectionReason('');
      fetchKycDocuments();
    } catch (err) {
      showToast('error', 'Error', 'Failed to reject document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
    const matchesSearch = 
      doc.agent_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fadeIn text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
              <span>KYC Verification & Clearance</span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                  {pendingCount} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Review NID, Passport, and Financial documents submitted by liquidity agents for MSB approval.
            </p>
          </div>
        </div>

        <button
          onClick={fetchKycDocuments}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1a294e] hover:bg-[#233763] text-slate-200 text-xs font-bold transition-all border border-[#233763] cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Pending Review</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5 font-mono">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Approved & Verified</div>
            <div className="text-2xl font-black text-[#00c853] mt-0.5 font-mono">{verifiedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00c853]/10 text-[#00c853] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Rejected Documents</div>
            <div className="text-2xl font-black text-rose-400 mt-0.5 font-mono">{rejectedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by Agent Code, Document Title or File..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#1a294e] p-1 rounded-xl text-xs font-bold overflow-x-auto">
            {['all', 'pending', 'verified', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all cursor-pointer ${
                  filterStatus === status
                    ? 'bg-[#00c853] text-white shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* List / Cards View */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00c853]" />
            <p className="text-xs font-bold">Loading KYC clearance queue...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-[#1a294e]/40 rounded-2xl border border-[#233763]">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-sm font-bold text-slate-300">No KYC documents found</p>
            <p className="text-xs text-slate-400 mt-1">Submitted documents from Agent Portal will appear here for Master Admin clearance.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (md:hidden) */}
            <div className="md:hidden space-y-3">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="p-3.5 rounded-xl bg-[#1a294e]/70 border border-[#233763] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs font-black text-[#00c853]">{doc.agent_code}</div>
                      <div className="text-xs font-bold text-white mt-0.5">{doc.title}</div>
                    </div>
                    {doc.status === 'verified' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 inline-flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {doc.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {doc.status === 'rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 inline-flex items-center gap-1 shrink-0" title={doc.rejection_reason}>
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#121e3d] p-2.5 rounded-lg border border-[#233763]/60">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Doc Type</div>
                      <div className="text-blue-400 font-bold text-[11px] truncate">{doc.document_type}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">File Name</div>
                      <div className="text-slate-300 font-mono text-[10px] truncate">{doc.file_name}</div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>Submitted: {doc.created_at?.substring(0, 16).replace('T', ' ')}</span>
                    {doc.file_size && <span>{doc.file_size}</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#233763]">
                    {doc.file_url ? (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-[#121e3d] text-slate-300 hover:text-white border border-[#233763] transition-colors"
                        title="View Attached File"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    ) : null}

                    {doc.status !== 'verified' && (
                      <button
                        onClick={() => handleApprove(doc)}
                        disabled={isSubmitting}
                        className="flex-1 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {doc.status !== 'rejected' && (
                      <button
                        onClick={() => {
                          setRejectingDoc(doc);
                          setRejectionReason('');
                        }}
                        disabled={isSubmitting}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#233763] text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Agent Code</th>
                    <th className="py-3 px-3">Document Title</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">File Info</th>
                    <th className="py-3 px-3">Date Submitted</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233763]/60 font-medium">
                  {filteredDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-[#1a294e]/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-black text-[#00c853]">
                        {doc.agent_code}
                      </td>

                      <td className="py-3.5 px-3 font-bold text-white">
                        {doc.title}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] border border-blue-500/30">
                          {doc.document_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400">
                        {doc.file_name} {doc.file_size ? `(${doc.file_size})` : ''}
                      </td>

                      <td className="py-3.5 px-3 text-slate-400 font-mono">
                        {doc.created_at?.substring(0, 16).replace('T', ' ')}
                      </td>

                      <td className="py-3.5 px-3">
                        {doc.status === 'verified' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {doc.status === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {doc.status === 'rejected' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 inline-flex items-center gap-1" title={doc.rejection_reason}>
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.file_url ? (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-[#1a294e] text-slate-300 hover:text-white border border-[#233763] transition-colors"
                              title="View Attached File"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No File</span>
                          )}

                          {doc.status !== 'verified' && (
                            <button
                              onClick={() => handleApprove(doc)}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 rounded-lg bg-[#00c853] hover:bg-[#00e676] text-white font-bold text-[11px] shadow transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {doc.status !== 'rejected' && (
                            <button
                              onClick={() => {
                                setRejectingDoc(doc);
                                setRejectionReason('');
                              }}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
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

      {/* REJECTION REASON MODAL */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121e3d] border border-[#233763] rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl p-4 sm:p-6 space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Reject KYC Document</span>
              </div>
              <button
                onClick={() => setRejectingDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-bold text-white">Document: {rejectingDoc.title}</div>
              <div className="text-slate-400 font-mono">Agent Code: {rejectingDoc.agent_code}</div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Reason for Rejection
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Blurred NID photo, expired document, or missing back side..."
                  className="w-full p-3 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingDoc(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#233763] text-slate-300 font-bold hover:bg-[#1a294e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-950/40"
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
