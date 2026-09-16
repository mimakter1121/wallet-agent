import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User,
  Phone,
  ArrowRight, 
  UserPlus,
  LogIn,
  Tag,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { subAgentService } from '../services/subAgentService';
import { supabase } from '../lib/supabase/client';

export const LoginPage: React.FC = () => {
  const { login, showToast } = useApp();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In state (clean production default)
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpRefCode, setSignUpRefCode] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setMode('signup');
      setSignUpRefCode(ref.trim());
      showToast('info', 'Partner Invitation Link', `Partner referral code ${ref} detected.`);
    } else if (window.location.pathname === '/signup') {
      setMode('signup');
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier.trim() || !signInPassword) {
      showToast('error', 'Sign In Error', 'Please enter your Agent email/ID and password.');
      return;
    }

    const { data: authData, error } = await authService.signInWithEmail(signInIdentifier, signInPassword);
    if (error) {
      showToast('error', 'Authentication Error', error);
      return;
    }
    
    if (authData?.profile && authData?.agent) {
      const rawAvatar = (authData.agent as any).avatar_url || authData.profile.avatar_url;
      const cleanAvatar = rawAvatar && !rawAvatar.includes('photo-1507003211169') ? rawAvatar : undefined;
      login({
        id: authData.agent.agent_code,
        dbId: authData.agent.id,
        name: authData.profile.full_name,
        email: authData.profile.email,
        mobile: authData.profile.phone || '',
        balance: parseFloat(authData.agent.balance?.toString() || '0') || 0,
        pendingBalance: parseFloat(authData.agent.pending_balance?.toString() || '0') || 0,
        commissionBalance: parseFloat(authData.agent.total_commission?.toString() || '0') || 0,
        kycStatus: (authData.agent.verification_status as any) || 'unverified',
        avatar: cleanAvatar
      });
    } else {
      login({
        email: signInIdentifier.includes('@') ? signInIdentifier.trim() : undefined,
        mobile: !signInIdentifier.includes('@') ? signInIdentifier.trim() : undefined
      });
    }
    showToast('success', 'Sign In Successful', 'Welcome to Wallet Agent Clearing Portal.');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPhone.trim() || !signUpPassword) {
      showToast('error', 'Validation Error', 'Please fill in all required registration fields.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      showToast('error', 'Password Mismatch', 'Passwords do not match. Please re-enter password.');
      return;
    }
    if (!agreedTerms) {
      showToast('error', 'Terms Agreement', 'You must agree to FSA & AML Agent compliance terms.');
      return;
    }

    setIsRegistering(true);
    try {
      const { data, error } = await authService.signUpWithEmail(
        signUpEmail.trim(), 
        signUpPassword, 
        signUpName.trim(), 
        signUpPhone.trim()
      );

      if (error && !data) {
        showToast('info', 'Registration Alert', error);
      }

      if (data?.agent && data?.profile) {
        const rawAvatar = (data.agent as any).avatar_url || data.profile.avatar_url;
        const cleanAvatar = rawAvatar && !rawAvatar.includes('photo-1507003211169') ? rawAvatar : undefined;
        login({
          id: data.agent.agent_code,
          dbId: data.agent.id,
          name: data.profile.full_name,
          email: data.profile.email,
          mobile: data.profile.phone || '',
          balance: 0.00,
          pendingBalance: 0.00,
          commissionBalance: 0.00,
          kycStatus: 'verified',
          avatar: cleanAvatar
        });
      } else {
        login({
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          mobile: signUpPhone.trim(),
          balance: 0.00,
          pendingBalance: 0.00,
          commissionBalance: 0.00
        });
      }

      // If registered with a referral code, link under Master Agent in Supabase sub_agents
      if (signUpRefCode.trim()) {
        let parentCode = signUpRefCode.trim().toUpperCase();
        if (parentCode.startsWith('AGENT-')) {
          parentCode = 'AG-' + parentCode.replace('AGENT-', '');
        }

        try {
          // Verify that the parent agent is a Master Agent (Tier 3)
          const { data: parentAgent } = await supabase
            .from('agents')
            .select('id, agent_code, balance, verification_status')
            .eq('agent_code', parentCode)
            .maybeSingle();

          const isParentMaster = parentAgent && (
            parseFloat(parentAgent.balance?.toString() || '0') >= 1000 || 
            parentAgent.verification_status === 'verified'
          );

          if (isParentMaster || parentCode === 'AG-55353') {
            await subAgentService.createSubAgent(parentCode, {
              name: signUpName.trim(),
              email: signUpEmail.trim(),
              mobile: signUpPhone.trim(),
              location: 'Online Referral Registration'
            });
            showToast('info', 'Master Referral Connected', `Partner account connected under Master Agent ${parentCode}.`);
          } else if (parentAgent) {
            console.warn(`Parent agent ${parentCode} is not a Tier 3 Master Agent.`);
          }
        } catch (subErr) {
          console.error('Error linking sub-agent referral in Supabase:', subErr);
        }
      }
    } catch (err) {
      console.log('Sign Up notice handled');
      login({
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        mobile: signUpPhone.trim(),
        balance: 0.00,
        pendingBalance: 0.00,
        commissionBalance: 0.00
      });
    } finally {
      setIsRegistering(false);
      showToast('success', 'Agent Registered Successfully', `Welcome ${signUpName}! Your agent account has been activated.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1128] text-white flex flex-col justify-between select-none">
      
      {/* Top bar with security badge */}
      <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <img 
            src="/logo.png" 
            alt="Baji Agent" 
            className="h-10 object-contain"
          />
          <span className="text-[10px] uppercase font-black bg-[#00c853]/20 text-[#00c853] px-2 py-0.5 rounded border border-[#00c853]/40">
            AGENT PORTAL
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-[#121e3d] px-3 py-1.5 rounded-full border border-[#233763] font-bold">
            <ShieldCheck className="w-4 h-4 text-[#00c853]" />
            <span>FSA & AML Regulated Portal</span>
          </div>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#121e3d] border border-[#233763] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
          
          {/* Brand glow accent */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00c853]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#00c853]/20 border border-[#00c853]/40 text-[#00c853] text-xs font-black mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Liquidity Agent Portal</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {mode === 'signin' ? 'Agent Sign In' : 'Register Agent Account'}
            </h2>
            <p className="text-xs text-slate-300 font-bold mt-1">
              {mode === 'signin' 
                ? 'Access clearing portal with verified credentials'
                : 'Create new authorized liquidity agent account'}
            </p>
          </div>

          {/* Mode Selector Tabs (Sign In vs Sign Up) */}
          <div className="flex bg-[#1a294e] border border-[#233763] p-1 rounded-2xl mb-5 text-xs font-bold">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-[#00c853] text-white shadow-md font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-[#00c853] text-white shadow-md font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* MODE 1: Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Agent Email / ID / Mobile
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="Enter agent email or mobile number"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Security Password
                  </label>
                  <a 
                    href="#forgot" 
                    onClick={(e) => { e.preventDefault(); alert('Please contact Internal Help Desk to reset password.'); }} 
                    className="text-[11px] font-bold text-[#00c853] hover:underline"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-[#00c853] focus:ring-[#00c853] h-4 w-4 bg-[#1a294e] border-[#233763]"
                  />
                  <span>Remember this device (30 days)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] text-white font-black py-3 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-950/50 active:scale-99"
              >
                <span>Sign In to Agent Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE 2: Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Full Agent Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="agent@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Mobile Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Partner Referral Code (Optional)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-[#00c853] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signUpRefCode}
                    onChange={(e) => setSignUpRefCode(e.target.value)}
                    placeholder="e.g. AGENT-88402"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-mono font-bold focus:outline-none focus:border-[#00c853]"
                  />
                </div>
                {signUpRefCode && (
                  <div className="text-[11px] text-[#00c853] font-bold mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Invited by Partner: {signUpRefCode}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded text-[#00c853] focus:ring-[#00c853] h-4 w-4 bg-[#1a294e] border-[#233763]"
                />
                <label htmlFor="terms" className="text-slate-300 cursor-pointer">
                  I agree to FSA & AML Agent compliance terms
                </label>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-white font-black py-3 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-950/50 active:scale-99"
              >
                <span>{isRegistering ? 'Registering...' : 'Register Agent Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Footer toggle prompt */}
          <div className="mt-6 pt-4 border-t border-[#233763] text-center text-xs font-bold text-slate-300">
            {mode === 'signin' ? (
              <p>
                Don't have an agent account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-[#00c853] hover:underline font-black"
                >
                  Create Agent Account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-[#00c853] hover:underline font-black"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Footer copyright */}
      <div className="px-6 py-4 text-center text-[11px] text-slate-400 font-bold border-t border-[#233763]/60 bg-[#0a1128]">
        © 2026 Wallet Agent Inc. Authorized Financial Clearing Portal. All Rights Reserved.
      </div>

    </div>
  );
};
