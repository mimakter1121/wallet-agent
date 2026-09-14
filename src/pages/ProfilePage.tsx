import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Smartphone, 
  Mail, 
  Building2, 
  MapPin, 
  PhoneCall, 
  FileText, 
  Save, 
  CheckCircle2, 
  Camera, 
  Download, 
  Laptop, 
  Trash2, 
  Bell, 
  Sparkles,
  Info,
  Shield,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CollectionAccountsModal } from '../components/modals/CollectionAccountsModal';
import { collectionAccountService } from '../services/collectionAccountService';
import { storageService } from '../services/storageService';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

export const ProfilePage: React.FC = () => {
  const { 
    agent, 
    updateAgentProfile,
    sessions, 
    terminateSession, 
    terminateAllOtherSessions,
    showToast,
    triggerPwaInstall,
    isInstallPromptAvailable
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [accountsCount, setAccountsCount] = useState<number>(0);

  const fetchActiveCount = () => {
    const agentCode = agent.id || (agent as any).agentCode || 'AG-55353';
    collectionAccountService.fetchAllAccounts(agentCode, agent.dbId, agent.email).then(accs => {
      setAccountsCount(accs.filter(a => a.status === 'active').length);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchActiveCount();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('profile_collection_accounts_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collection_accounts' }, () => {
          fetchActiveCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [agent.id, (agent as any).agentCode, agent.dbId, agent.email]);
  const [avatarUrl, setAvatarUrl] = useState(agent.avatar);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Keep avatarUrl in sync if agent.avatar changes
  useEffect(() => {
    if (agent.avatar) {
      setAvatarUrl(agent.avatar);
    }
  }, [agent.avatar]);

  // Editable form state for Personal & Outlet Info
  const [formData, setFormData] = useState({
    name: agent.name || '',
    businessName: agent.businessName || '',
    address: agent.address || '',
    city: agent.city || '',
    district: agent.district || '',
    nidNumber: agent.nidNumber || '',
    emergencyContact: agent.emergencyContact || '',
  });

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // Synchronize form initial values once when agent loads
  useEffect(() => {
    setFormData({
      name: agent.name || '',
      businessName: agent.businessName || '',
      address: agent.address || '',
      city: agent.city || '',
      district: agent.district || '',
      nidNumber: agent.nidNumber || '',
      emergencyContact: agent.emergencyContact || '',
    });
  }, [agent.id]);

  // Security form states
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');

  // Notification preferences
  const [txAlerts, setTxAlerts] = useState(true);
  const [commAlerts, setCommAlerts] = useState(true);
  const [secAlerts, setSecAlerts] = useState(true);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Strict 100 KB file size validation
      const MAX_SIZE_BYTES = 100 * 1024; // 100 KB = 102,400 bytes
      if (file.size > MAX_SIZE_BYTES) {
        const sizeInKb = (file.size / 1024).toFixed(1);
        showToast(
          'error',
          'File Too Large (Max 100 KB) ⚠️',
          `Selected file is ${sizeInKb} KB. Profile photo must be 100 KB or smaller.`
        );
        e.target.value = ''; // Reset input
        return;
      }

      // Instant local preview for immediate visual feedback
      const localPreview = URL.createObjectURL(file);
      setAvatarUrl(localPreview);
      setIsUploadingAvatar(true);

      try {
        const { publicUrl, error } = await storageService.uploadAvatar(file, agent.id);
        if (error) {
          showToast('error', 'Avatar Upload Warning', error);
        } else if (publicUrl) {
          setAvatarUrl(publicUrl);
          await updateAgentProfile({ avatar: publicUrl });
          showToast('success', 'Profile Photo Updated 📸', 'Your new profile picture has been saved successfully.');
        }
      } catch (err: any) {
        showToast('error', 'Avatar Error', err.message || 'Could not save profile picture.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);

    try {
      await updateAgentProfile({
        name: formData.name,
        businessName: formData.businessName,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        nidNumber: formData.nidNumber,
        emergencyContact: formData.emergencyContact,
      });
      showToast('success', 'Profile Updated 👤', 'Agent personal & business details saved.');
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('error', 'Save Failed', 'Could not save profile details.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handlePinUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      showToast('error', 'PIN Error', 'New PIN must be exactly 4 digits.');
      return;
    }
    showToast('success', 'Security PIN Updated', 'Your 4-digit authorization PIN has been changed successfully.');
    setOldPin('');
    setNewPin('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* Top Profile Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#121e3d] via-[#162750] to-[#121e3d] border border-[#233763] rounded-3xl p-6 sm:p-7 shadow-2xl">
        {/* Glow overlay */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00c853]/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <label className="relative group cursor-pointer shrink-0 block" title="Click to upload profile photo">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={agent.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-[#00c853]/60 shadow-xl transition-all group-hover:brightness-90"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#00c853] to-[#00701a] flex items-center justify-center text-white text-3xl sm:text-4xl font-black ring-4 ring-[#00c853]/60 shadow-xl transition-all group-hover:brightness-90">
                    {agent.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}

                {/* Visible Camera Badge for both Mobile & Desktop */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#00c853] text-white border-2 border-[#121e3d] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#00e676] transition-all">
                  {isUploadingAvatar ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </div>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarFileChange}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {agent.name || 'Authorized Agent'}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{agent.kycLevel || 'Tier 1 (Basic)'}</span>
                </span>
              </div>

              <div className="text-xs text-slate-300 font-medium flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[#00b0ff] font-bold">Code: {agent.id || 'N/A'}</span>
                {formData.businessName && <span>•</span>}
                {formData.businessName && <span className="text-slate-400">{formData.businessName}</span>}
                <span>•</span>
                <span className="text-slate-400">Registered {agent.registrationDate}</span>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
                  Verified Merchant Float Agent
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {isInstallPromptAvailable && (
              <button
                onClick={triggerPwaInstall}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white text-xs font-black transition-all shadow-md shadow-emerald-950/50"
              >
                <Download className="w-4 h-4" />
                <span>Install PWA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-[#00c853] text-white shadow-md shadow-emerald-950/50'
              : 'bg-[#121e3d] text-slate-300 border border-[#233763] hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal & Outlet Profile</span>
        </button>

        <button
          onClick={() => setIsCollectionModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#121e3d] hover:bg-[#1a294e] border border-[#233763] hover:border-[#00c853]/50 text-slate-300 hover:text-white transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Building2 className="w-4 h-4 text-[#00c853]" />
          <span>Collection Accounts</span>
          <span className="px-2 py-0.5 rounded-full bg-[#00c853]/20 text-[#00c853] text-[10px] font-black border border-[#00c853]/30">
            {accountsCount} Active
          </span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-[#00c853] text-white shadow-md shadow-emerald-950/50'
              : 'bg-[#121e3d] text-slate-300 border border-[#233763] hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & PIN</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'bg-[#00c853] text-white shadow-md shadow-emerald-950/50'
              : 'bg-[#121e3d] text-slate-300 border border-[#233763] hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>
      </div>

      {/* TAB 1: PERSONAL & OUTLET PROFILE FORM */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          
          {/* SECTION A: Non-Editable Security Protected Info */}
          <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  System Verified Credentials (Non-Editable)
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Security Locked</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Email (Gmail) - LOCKED */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Registered Gmail / Email</span>
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Fixed
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    readOnly
                    value={agent.email}
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1a294e]/70 border border-[#233763] text-slate-300 font-mono font-bold cursor-not-allowed select-none opacity-80"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Email address is permanently bound to account authorization.</p>
              </div>

              {/* Phone (Mobile) - LOCKED */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Primary Mobile Number</span>
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Fixed
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    disabled
                    readOnly
                    value={agent.mobile}
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1a294e]/70 border border-[#233763] text-slate-300 font-mono font-bold cursor-not-allowed select-none opacity-80"
                  />
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Mobile number is verified via OTP for 2FA clearance.</p>
              </div>

              {/* Agent ID Code - LOCKED */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Agent Identifier (ID)</span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> System ID
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={agent.id}
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1a294e]/70 border border-[#233763] text-[#00c853] font-mono font-black cursor-not-allowed select-none opacity-80"
                  />
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Unique merchant code assigned by Baji Master Admin.</p>
              </div>
            </div>
          </div>

          {/* SECTION B: Editable Personal & Outlet Details */}
          <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#233763]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#00c853]" />
                <h3 className="text-sm font-black text-white">
                  Editable Personal & Business Information
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/30 text-[10px] font-bold">
                Editable Fields
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              {/* Full Legal Name */}
              <div>
                <label className="block text-slate-200 mb-1.5">
                  Full Legal Name <span className="text-[#00c853]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alexander Morgan"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-bold focus:outline-none focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853]/30 transition-all"
                  />
                  <User className="w-4 h-4 text-[#00c853] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Outlet / Business Name */}
              <div>
                <label className="block text-slate-200 mb-1.5">
                  Business / Outlet Name <span className="text-[#00c853]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Apex Global FinTech Hub"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-bold focus:outline-none focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853]/30 transition-all"
                  />
                  <Building2 className="w-4 h-4 text-[#00b0ff] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-slate-200 mb-1.5">
                  Emergency / Alternate Contact Phone
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-mono font-bold focus:outline-none focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853]/30 transition-all"
                  />
                  <PhoneCall className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* NID / National ID */}
              <div>
                <label className="block text-slate-200 mb-1.5">
                  NID / Smart ID / Tax Identification
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.nidNumber}
                    onChange={e => setFormData({ ...formData, nidNumber: e.target.value })}
                    placeholder="e.g. US-984029103"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-mono font-bold focus:outline-none focus:border-[#00c853] focus:ring-1 focus:ring-[#00c853]/30 transition-all"
                  />
                  <FileText className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* City / Division */}
              <div>
                <label className="block text-slate-200 mb-1.5">City / Region</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. New York"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-bold focus:outline-none focus:border-[#00c853] transition-all"
                  />
                  <MapPin className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-slate-200 mb-1.5">District / District Code</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. Manhattan"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-bold focus:outline-none focus:border-[#00c853] transition-all"
                  />
                  <MapPin className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Full Address */}
              <div className="sm:col-span-2">
                <label className="block text-slate-200 mb-1.5">Full Physical Outlet Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 742 Evergreen Terrace, Suite 100, New York, NY 10001"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-medium focus:outline-none focus:border-[#00c853] transition-all"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-950/50 active:scale-98"
              >
                {isSubmittingProfile ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Agent Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Badge Footer */}
          <div className="p-4 rounded-2xl bg-[#1a294e] border border-[#233763] text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00c853] shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-[#00c853]">Regulatory Compliance Status:</span>
              <p className="text-slate-300 font-medium mt-0.5 leading-relaxed">
                Your agent profile is active under Tier 2 Commercial Agent authorization. Contact Support if you need to update bound mobile numbers or registered Gmail credentials.
              </p>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: SECURITY & SESSIONS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* PIN & Password Section */}
          <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#00c853]" />
              <span>4-Digit Transaction Security PIN</span>
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Required for deposit approvals, withdrawal disbursements, and float sweeps.
            </p>

            <form onSubmit={handlePinUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 font-bold">
              <div>
                <label className="block text-slate-300 mb-1">Current Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-[#00c853]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">New 4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-[#00c853]"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#00c853] hover:bg-[#00e676] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-950/50"
                >
                  Update Security PIN
                </button>
              </div>
            </form>
          </div>

          {/* Active Devices & Sessions */}
          <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#00b0ff]" />
                  <span>Active Authorized Sessions</span>
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Devices authenticated with your Agent certificate
                </p>
              </div>

              <button
                onClick={terminateAllOtherSessions}
                className="text-xs font-bold text-rose-400 hover:underline"
              >
                Sign Out All Other Devices
              </button>
            </div>

            <div className="divide-y divide-[#233763]">
              {sessions.map((sess: any) => (
                <div key={sess.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1a294e] border border-[#233763] flex items-center justify-center text-[#00b0ff]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-white flex items-center gap-2">
                        <span>{sess.device}</span>
                        {sess.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 text-[10px] font-bold">
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {sess.ipAddress} • {sess.location} • {sess.lastActive}
                      </div>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      onClick={() => terminateSession(sess.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Terminate Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALERT PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#00c853]" />
            <span>Notification & Communication Settings</span>
          </h3>

          <div className="space-y-3 text-xs font-bold">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] cursor-pointer">
              <div>
                <div className="font-bold text-white">Deposit & Withdrawal Notifications</div>
                <div className="text-slate-400 text-[11px] font-medium">Instant alerts when a customer requests cash-in or cash-out</div>
              </div>
              <input
                type="checkbox"
                checked={txAlerts}
                onChange={(e) => setTxAlerts(e.target.checked)}
                className="w-4 h-4 text-[#00c853] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] cursor-pointer">
              <div>
                <div className="font-bold text-white">Commission Credit Alerts</div>
                <div className="text-slate-400 text-[11px] font-medium">Receive alerts when commission yield is credited to float balance</div>
              </div>
              <input
                type="checkbox"
                checked={commAlerts}
                onChange={(e) => setCommAlerts(e.target.checked)}
                className="w-4 h-4 text-[#00c853] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1a294e] border border-[#233763] cursor-pointer">
              <div>
                <div className="font-bold text-white">Security & Login Notifications</div>
                <div className="text-slate-400 text-[11px] font-medium">Alert on unrecognized device logins or PIN change requests</div>
              </div>
              <input
                type="checkbox"
                checked={secAlerts}
                onChange={(e) => setSecAlerts(e.target.checked)}
                className="w-4 h-4 text-[#00c853] rounded"
              />
            </label>
          </div>
        </div>
      )}

      {/* Collection Accounts Modal */}
      <CollectionAccountsModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onUpdate={() => {
          const agentCode = agent.id || (agent as any).agentCode || 'AG-55353';
          collectionAccountService.fetchAllAccounts(agentCode, agent.dbId, agent.email).then(accs => {
            setAccountsCount(accs.filter(a => a.status === 'active').length);
          });
        }}
      />
    </div>
  );
};
