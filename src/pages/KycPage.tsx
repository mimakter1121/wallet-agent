import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck,
  Building2,
  Lock,
  Download,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Shield,
  BadgeCheck,
  Eye,
  Check,
  Zap,
  Info,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { KycDocument } from '../types';
import { usdToLocal, formatCurrency } from '../config/currencyRates';

export const KycPage: React.FC = () => {
  const { agent, kycDocs, uploadKycDoc, showToast } = useApp();
  
  const [selectedType, setSelectedType] = useState<KycDocument['documentType']>('National ID (NID)');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Check if document for selectedType is currently pending or verified
  const activeDocForType = kycDocs.find(d => d.documentType === selectedType || d.title === selectedType);
  const isPendingForType = activeDocForType?.status === 'pending';
  const isVerifiedForType = activeDocForType?.status === 'verified';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Maximum allowed file size is 10 MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (isPendingForType) {
      showToast('error', 'Upload Locked', `A ${selectedType} document is already pending review. Please wait for admin approval/rejection.`);
      return;
    }

    if (isVerifiedForType) {
      showToast('info', 'Already Verified', `Your ${selectedType} document is already verified and approved.`);
      return;
    }

    setIsUploading(true);
    await uploadKycDoc(selectedType, selectedFile);
    setIsUploading(false);
    setSelectedFile(null);
  };

  const getTierDetails = (level: string) => {
    const bdt200 = formatCurrency(usdToLocal(200, 'BDT'), 'BDT');
    const bdt1000 = formatCurrency(usdToLocal(1000, 'BDT'), 'BDT');
    const bdt70 = formatCurrency(usdToLocal(70, 'BDT'), 'BDT');

    if (level.includes('Tier 1') || level.includes('Basic')) {
      return { 
        currentTierNum: 1,
        usd: '$200.00 USD', 
        bdt: `${bdt200}`, 
        bdt70,
        bdt200,
        bdt1000,
        fundRange: '$70 – $200 USD',
        nextTier: 'Business Tier (Tier 2)',
        nextReq: 'Add funds $200 – $1,000 USD to upgrade to Tier 2' 
      };
    } else if (level.includes('Tier 2') || level.includes('Business')) {
      return { 
        currentTierNum: 2,
        usd: '$1,000.00 USD', 
        bdt: `${bdt1000}`, 
        bdt70,
        bdt200,
        bdt1000,
        fundRange: '$200 – $1,000 USD',
        nextTier: 'Master Tier (Tier 3)',
        nextReq: 'Add funds > $1,000 USD to upgrade to Master Tier 3' 
      };
    } else {
      return { 
        currentTierNum: 3,
        usd: 'Unlimited USD', 
        bdt: 'Unlimited BDT', 
        bdt70,
        bdt200,
        bdt1000,
        fundRange: '$1,000+ to Unlimited USD',
        nextTier: 'Top Level Active',
        nextReq: 'Maximum Institutional Master Level Unlocked' 
      };
    }
  };

  const tierInfo = getTierDetails(agent.kycLevel);

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* TOP COMPLIANCE & STATUS BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#121e3d] via-[#162750] to-[#121e3d] border border-[#233763] rounded-3xl p-6 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00c853]/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] text-xs font-black">
              <BadgeCheck className="w-4 h-4 text-[#00c853]" />
              <span>KYC Level: {agent.kycLevel}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Merchant Verification & Clearance Tiers
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Automated institutional KYC verification for high-volume liquidity clearing agents. Level progression unlocks higher daily limits and priority settlement.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1 flex-wrap">
              <span className="flex items-center gap-1.5 text-[#00c853] font-bold">
                <ShieldCheck className="w-4 h-4" /> FinCEN MSB Standard
              </span>
              <span>•</span>
              <span className="text-slate-300">256-Bit Encrypted Vault</span>
              <span>•</span>
              <span className="text-slate-300">Instant Admin Verification</span>
            </div>
          </div>

          {/* ACTIVE CLEARANCE SUMMARY CARD */}
          <div className="bg-[#1a294e]/90 p-5 rounded-2xl border border-[#233763] shadow-xl min-w-[260px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Daily Clearance Limit
              </span>
              <span className="px-2 py-0.5 rounded bg-[#00c853]/20 text-[#00c853] text-[10px] font-mono font-bold">
                Active
              </span>
            </div>

            <div className="text-2xl font-black text-[#00c853] font-mono">
              {tierInfo.usd}
            </div>

            <div className="text-xs font-bold text-slate-200">
              Equivalent: <span className="font-mono text-[#00b0ff]">{tierInfo.bdt}</span>
            </div>

            <div className="pt-2 border-t border-[#233763] text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{tierInfo.nextReq}</span>
            </div>
          </div>
        </div>
      </div>

      {/* THREE-TIER PROGRESSION ROADMAP */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00c853]" />
          <span>Tier Progression & Add Fund Qualification</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* TIER 1 */}
          <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
            tierInfo.currentTierNum === 1
              ? 'bg-gradient-to-b from-[#0d2a1a] to-[#121e3d] border-[#00c853] shadow-xl ring-2 ring-[#00c853]/50'
              : 'bg-[#121e3d] border-[#233763] opacity-90'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                  tierInfo.currentTierNum >= 1 ? 'bg-[#00c853] text-white' : 'bg-[#1a294e] text-slate-400'
                }`}>
                  1
                </div>
                <span className="font-black text-sm text-white">Tier 1 • Basic</span>
              </div>
              {tierInfo.currentTierNum === 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#00c853] text-white text-[10px] font-black uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-[#1a294e] border border-[#233763] my-2">
              <div className="text-[11px] font-bold text-amber-400">Required Add Fund:</div>
              <div className="text-sm font-black font-mono text-white">$70.00 – $200.00 USD</div>
              <div className="text-[10px] text-slate-300 font-medium">Equivalent: {tierInfo.bdt70} – {tierInfo.bdt200}</div>
            </div>

            <div className="text-xs font-bold text-[#00c853] font-mono mt-1">
              Daily Limit: $200.00 USD ({tierInfo.bdt200})
            </div>

            <ul className="mt-3 pt-2.5 border-t border-[#233763] space-y-1.5 text-xs text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00c853]" />
                <span>Add $70 – $200 float fund</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00c853]" />
                <span>Standard Cash-in & Cash-out</span>
              </li>
            </ul>
          </div>

          {/* TIER 2 */}
          <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
            tierInfo.currentTierNum === 2
              ? 'bg-gradient-to-b from-[#0d2a1a] to-[#121e3d] border-[#00c853] shadow-xl ring-2 ring-[#00c853]/50'
              : 'bg-[#121e3d] border-[#233763] opacity-90'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                  tierInfo.currentTierNum >= 2 ? 'bg-[#00c853] text-white' : 'bg-[#1a294e] text-slate-400'
                }`}>
                  2
                </div>
                <span className="font-black text-sm text-white">Tier 2 • Business</span>
              </div>
              {tierInfo.currentTierNum === 2 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#00c853] text-white text-[10px] font-black uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-[#1a294e] border border-[#233763] my-2">
              <div className="text-[11px] font-bold text-amber-400">Required Add Fund:</div>
              <div className="text-sm font-black font-mono text-white">$200.00 – $1,000.00 USD</div>
              <div className="text-[10px] text-slate-300 font-medium">Equivalent: {tierInfo.bdt200} – {tierInfo.bdt1000}</div>
            </div>

            <div className="text-xs font-bold text-[#00c853] font-mono mt-1">
              Daily Limit: $1,000.00 USD ({tierInfo.bdt1000})
            </div>

            <ul className="mt-3 pt-2.5 border-t border-[#233763] space-y-1.5 text-xs text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00c853]" />
                <span>Add $200 – $1,000 float fund</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00c853]" />
                <span>NID / Passport clearance</span>
              </li>
            </ul>
          </div>

          {/* TIER 3 */}
          <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
            tierInfo.currentTierNum === 3
              ? 'bg-gradient-to-b from-[#0d2a1a] to-[#121e3d] border-[#00c853] shadow-xl ring-2 ring-[#00c853]/50'
              : 'bg-[#121e3d] border-[#233763] opacity-90'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                  tierInfo.currentTierNum === 3 ? 'bg-[#00c853] text-white' : 'bg-[#1a294e] text-slate-400'
                }`}>
                  3
                </div>
                <span className="font-black text-sm text-white">Tier 3 • Master</span>
              </div>
              {tierInfo.currentTierNum === 3 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#00c853] text-white text-[10px] font-black uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-[#1a294e] border border-[#233763] my-2">
              <div className="text-[11px] font-bold text-amber-400">Required Add Fund:</div>
              <div className="text-sm font-black font-mono text-white">$1,000.00+ to Unlimited</div>
              <div className="text-[10px] text-slate-300 font-medium">Equivalent: {tierInfo.bdt1000}+</div>
            </div>

            <div className="text-xs font-bold text-[#00c853] font-mono mt-1">
              Daily Limit: Unlimited USD Liquidity
            </div>

            <ul className="mt-3 pt-2.5 border-t border-[#233763] space-y-1.5 text-xs text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00c853]" />
                <span>Add &gt; $1,000 USD float fund</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00c853]" />
                <span>Full MSB Trade License</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* UPLOAD FORM & AUDIT LIST GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* UPLOAD FORM */}
        <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#233763]">
            <Upload className="w-4 h-4 text-[#00c853]" />
            <h3 className="text-sm font-black text-white">Upload Verification Document</h3>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-200 font-bold mb-1.5">
                Document Type <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as any);
                  setSelectedFile(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-bold focus:outline-none focus:border-[#00c853] transition-all"
              >
                <option value="National ID (NID)" className="bg-[#121e3d]">National ID (NID)</option>
                <option value="Passport" className="bg-[#121e3d]">Passport</option>
                <option value="Bank Statement" className="bg-[#121e3d]">Bank Statement / Utility Bill</option>
              </select>
            </div>

            {/* PENDING / VERIFIED WARNING BADGE FOR THIS TYPE */}
            {isPendingForType && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Pending Review in Queue</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  A <strong>{selectedType}</strong> document is currently under review by Master Admin. Re-uploading is disabled until Admin approves or rejects it.
                </p>
              </div>
            )}

            {isVerifiedForType && (
              <div className="p-3.5 rounded-2xl bg-[#00c853]/15 border border-[#00c853]/30 text-[#00c853] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Already Verified & Approved</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-200">
                  Your <strong>{selectedType}</strong> document has been successfully cleared.
                </p>
              </div>
            )}

            {/* File Drag Box */}
            <div>
              <label className="block text-slate-200 font-bold mb-1.5">
                Attach File (PDF, PNG, JPG — Max 10MB)
              </label>
              <label className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-colors bg-[#1a294e] ${
                isPendingForType || isVerifiedForType
                  ? 'border-[#233763] opacity-50 cursor-not-allowed'
                  : 'border-[#233763] hover:border-[#00c853] cursor-pointer'
              }`}>
                {isPendingForType || isVerifiedForType ? (
                  <Lock className="w-7 h-7 text-amber-400 mb-2" />
                ) : (
                  <Upload className="w-7 h-7 text-[#00c853] mb-2 animate-bounce" />
                )}
                
                <span className="font-bold text-white text-xs">
                  {isPendingForType 
                    ? 'Upload Locked (Pending Admin Review)' 
                    : isVerifiedForType 
                    ? 'Document Verified' 
                    : selectedFile 
                    ? selectedFile.name 
                    : 'Click or Drag NID / Passport File'}
                </span>
                
                <span className="text-[11px] text-slate-400 mt-1">
                  {selectedFile 
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` 
                    : 'Encrypted with AES-256 SSL for compliance check'}
                </span>
                
                <input
                  type="file"
                  disabled={isPendingForType || isVerifiedForType}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isUploading || isPendingForType || isVerifiedForType}
              className="w-full py-3 bg-[#00c853] hover:bg-[#00e676] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading to Secure Vault...</span>
                </>
              ) : isPendingForType ? (
                <>
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Pending Admin Review</span>
                </>
              ) : isVerifiedForType ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Document Verified</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Document for Clearance</span>
                </>
              )}
            </button>
          </form>

          <div className="p-3.5 rounded-xl bg-[#1a294e] border border-[#233763] text-[11px] text-slate-300 font-medium space-y-1">
            <div className="font-bold text-[#00c853] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Security Guarantee
            </div>
            <p>Your uploaded documents are encrypted with AES-256 and stored in our secure merchant vault strictly for regulatory clearance.</p>
          </div>
        </div>

        {/* UPLOADED DOCUMENTS AUDIT LIST */}
        <div className="lg:col-span-2 bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#00c853]" />
                <span>Submitted Verification Vault</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Live verification record of submitted identity & financial proof documents
              </p>
            </div>
            <span className="text-xs font-black text-[#00c853] bg-[#00c853]/20 px-3 py-1 rounded-full border border-[#00c853]/40">
              {kycDocs.length} Documents
            </span>
          </div>

          {kycDocs.length === 0 ? (
            <div className="text-center py-14 bg-[#1a294e] rounded-2xl border border-[#233763]">
              <FileText className="w-12 h-12 mx-auto text-slate-500 opacity-40 mb-3" />
              <p className="text-sm font-bold text-white">No identity documents uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1">Select National ID (NID), Passport, or Bank Statement above to upload</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kycDocs.map(doc => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#1a294e] border border-[#233763] gap-3 hover:border-[#2d4a7a] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30 flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-2">
                        <span>{doc.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({doc.id})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="text-slate-300">{doc.fileName}</span>
                        <span>•</span>
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span>Uploaded {doc.uploadedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-[#121e3d] hover:bg-[#233763] text-slate-300 hover:text-white border border-[#233763] text-xs font-bold transition-all flex items-center gap-1"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    )}
                    <StatusBadge status={doc.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
