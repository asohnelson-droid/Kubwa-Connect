
import React, { useState, useEffect } from 'react';
import { X, Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle, RefreshCw, Lock, User as UserIcon, UserPlus, Info, KeyRound, ShieldAlert, WifiOff, ExternalLink, HelpCircle, Activity, Store, Wrench, Truck, Zap } from 'lucide-react';
import { Button, Card, Input } from './ui';
import { api } from '../services/data';
import { testSupabaseConnection } from '../services/supabase';
import { User as UserType, UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
  providerName?: string;
  onSuccess?: (user: UserType) => void;
  initialRole?: UserRole;
  initialMode?: 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'UPDATE_PASSWORD';
}

// The only roles a person can choose for themselves at signup. ADMIN/SUPER_ADMIN
// are never offered here -- see the signup allowlist enforced server-side in
// api.auth.signUp and the handle_new_user DB trigger.
const SIGNUP_ROLE_OPTIONS: { role: UserRole; label: string; sub: string; icon: React.ElementType; activeClasses: string; iconActive: string }[] = [
  { role: 'USER', label: 'Just Browsing', sub: 'Shop & book services', icon: UserIcon, activeClasses: 'border-kubwa-primary bg-kubwa-primary/5', iconActive: 'text-kubwa-primary' },
  { role: 'VENDOR', label: 'Start a Shop', sub: 'Sell in Kubwa Mart', icon: Store, activeClasses: 'border-kubwa-mart bg-kubwa-mart/5', iconActive: 'text-kubwa-mart' },
  { role: 'PROVIDER', label: 'List a Skill', sub: 'Offer repairs & services', icon: Wrench, activeClasses: 'border-kubwa-fixit bg-kubwa-fixit/5', iconActive: 'text-kubwa-fixit' },
  { role: 'RIDER', label: 'Become a Rider', sub: 'Deliver orders & earn', icon: Truck, activeClasses: 'border-kubwa-ride bg-kubwa-ride/5', iconActive: 'text-kubwa-ride' },
];
const PUBLIC_SIGNUP_ROLES: UserRole[] = SIGNUP_ROLE_OPTIONS.map(o => o.role);

const AuthModal: React.FC<AuthModalProps> = ({ 
  onClose, 
  onSuccess, 
  initialRole = 'USER',
  initialMode = 'LOGIN'
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT' | 'UPDATE_PASSWORD'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(PUBLIC_SIGNUP_ROLES.includes(initialRole) ? initialRole : 'USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Connection Testing State
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Resend/Timer State
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setConnectionResult(null);
    setLoading(true);
    
    try {
      if (mode === 'LOGIN') {
          const result = await api.auth.signIn(email, password);
          if (result.user) {
             if (onSuccess) onSuccess(result.user);
             onClose(); 
          } else {
             setError(result.error || "Login failed.");
          }
      } else if (mode === 'SIGNUP') {
          const result = await api.auth.signUp(email, password, name, selectedRole);
          if (result.error) {
              setError(result.error);
          } else if (result.requiresVerification) {
              setVerificationSent(true);
          } else if (result.user) {
              if (onSuccess) onSuccess(result.user);
              onClose();
          }
      } else if (mode === 'FORGOT') {
          const result = await api.auth.resetPassword(email);
          if (result.success) {
              setSuccessMsg("Reset link sent! Please check your inbox.");
          } else {
              setError(result.error || "Failed to send reset link.");
          }
      } else if (mode === 'UPDATE_PASSWORD') {
          const result = await api.auth.updatePassword(password);
          if (result.success) {
              setSuccessMsg("Password updated successfully! You can now sign in.");
              setTimeout(() => {
                setMode('LOGIN');
                setSuccessMsg('');
              }, 2000);
          } else {
              setError(result.error || "Failed to update password.");
          }
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setTestingConnection(true);
    const result = await testSupabaseConnection();
    setConnectionResult(result);
    setTestingConnection(false);
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !email) return;
    setResending(true);
    setError('');
    const result = await api.auth.resendVerification(email);
    if (result.success) {
      setResendTimer(60); 
      setSuccessMsg("Verification link resent! Check your inbox.");
      if (mode === 'LOGIN') {
        setTimeout(() => setVerificationSent(true), 1500);
      }
    } else {
      setError(result.error || "Failed to resend.");
    }
    setResending(false);
  };

  const isNetworkError = error.toLowerCase().includes("failed to fetch") || 
                        error.toLowerCase().includes("network error") || 
                        error.toLowerCase().includes("blocked");
  const isAlreadyRegistered = mode === 'SIGNUP' && error.toLowerCase().includes("already registered");
  const ErrorIcon = isNetworkError ? WifiOff : isAlreadyRegistered ? UserIcon : AlertCircle;
  const errorHeader = isNetworkError ? 'Connection Failure'
    : isAlreadyRegistered ? 'Account Already Exists'
    : mode === 'LOGIN' ? 'Sign In Failed'
    : mode === 'SIGNUP' ? 'Sign Up Failed'
    : mode === 'FORGOT' ? 'Reset Failed'
    : 'Update Failed';

  if (verificationSent) {
    return (
      <div className="fixed inset-0 z-[200] bg-kubwa-ink/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
        <Card className="w-full max-w-sm relative p-8 text-center animate-zoom-in rounded-[2.5rem] border-none shadow-2xl">
          <div className="w-20 h-20 bg-kubwa-primary/10 text-kubwa-primary rounded-[1.75rem] flex items-center justify-center mx-auto mb-6">
             <Mail size={32} />
          </div>
          <h3 className="font-display font-bold text-2xl mb-2 text-kubwa-ink">Check your email</h3>
          <p className="text-gray-500 mb-6 text-sm font-medium leading-relaxed">
            We've sent a secure activation link to:<br/>
            <span className="text-kubwa-ink font-bold">{email}</span>
          </p>
          <div className="bg-gray-50 p-4 rounded-2xl mb-8 flex gap-3 text-left">
             <Info size={16} className="text-kubwa-primary shrink-0 mt-1" />
             <p className="text-xs font-semibold text-gray-500 leading-tight">
                Can't find it? Please check your <span className="text-kubwa-ink">Spam</span> or <span className="text-kubwa-ink">Promotions</span> folder. 
             </p>
          </div>
          <div className="space-y-3">
            <Button onClick={handleResend} disabled={resending || resendTimer > 0} variant="outline" className="w-full h-14 text-xs">
              {resending ? <Loader2 size={16} className="animate-spin" /> : (resendTimer > 0 ? `Try again in ${resendTimer}s` : 'Resend activation link')}
            </Button>
            <Button onClick={onClose} className="w-full h-14">Close &amp; check inbox</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-kubwa-ink/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-sm relative animate-zoom-in rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-kubwa-ink transition-colors z-10">
          <X size={22} strokeWidth={2.5} />
        </button>
        <form onSubmit={handleSubmit} className="p-10 max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="text-center mb-10">
             <div className="w-20 h-20 bg-kubwa-primary/10 text-kubwa-primary rounded-[1.75rem] flex items-center justify-center mx-auto mb-6">
                {mode === 'SIGNUP' ? <UserPlus size={32} /> : mode === 'FORGOT' || mode === 'UPDATE_PASSWORD' ? <KeyRound size={32} /> : <Zap size={32} className="fill-kubwa-primary" />}
             </div>
             <h3 className="font-display text-3xl font-bold text-kubwa-ink mb-1 leading-none">
               {mode === 'LOGIN' ? 'Welcome' : mode === 'SIGNUP' ? 'Join us' : mode === 'FORGOT' ? 'Recovery' : 'New password'}
             </h3>
             <p className="text-xs font-bold text-gray-400">
               {mode === 'FORGOT' ? 'Reset your password' : mode === 'UPDATE_PASSWORD' ? 'Set your new password' : 'Kubwa Connect Community'}
             </p>
          </div>

          <div className="space-y-4">
              {mode === 'SIGNUP' && (
                <div className="mb-2">
                  <p className="text-xs font-bold text-gray-400 mb-3 text-center">How will you use Kubwa Connect?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {SIGNUP_ROLE_OPTIONS.map(opt => (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => setSelectedRole(opt.role)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedRole === opt.role ? opt.activeClasses : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                      >
                        <opt.icon size={18} className={selectedRole === opt.role ? opt.iconActive : 'text-gray-400'} />
                        <p className="text-xs font-bold text-kubwa-ink mt-2">{opt.label}</p>
                        <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'SIGNUP' && (
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <Input className="pl-14 h-14" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />
                </div>
              )}
              
              {mode !== 'UPDATE_PASSWORD' && (
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <Input className="pl-14 h-14" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required />
                </div>
              )}

              {mode !== 'FORGOT' && (
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <Input className="pl-14 h-14" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'UPDATE_PASSWORD' ? "New password" : "Password"} required />
                </div>
              )}

              {error && (
                <div className="p-5 bg-red-50 text-red-700 rounded-[1.75rem] flex flex-col gap-4 animate-fade-in border border-red-100">
                  <div className="flex gap-3 items-start">
                    <ErrorIcon size={20} className="shrink-0" />
                    <div className="space-y-2">
                      <p className="text-xs font-bold leading-tight">{errorHeader}</p>
                      <p className="text-xs font-medium leading-relaxed opacity-80">
                        {error}
                      </p>
                    </div>
                  </div>

                  {isAlreadyRegistered && (
                    <Button
                      type="button"
                      className="w-full h-11 text-xs"
                      onClick={() => { setError(''); setPassword(''); setMode('LOGIN'); }}
                    >
                      Sign in instead
                    </Button>
                  )}
                  
                  {isNetworkError && (
                    <div className="space-y-3 bg-white/50 p-4 rounded-2xl border border-red-100/50">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                         <HelpCircle size={12} /> Diagnostic tools
                       </div>
                       
                       <Button 
                         type="button" 
                         variant="outline" 
                         className="w-full h-10 text-[10px] border-red-100 bg-white"
                         onClick={handleRunDiagnostics}
                         disabled={testingConnection}
                       >
                         {testingConnection ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />} Test project connection
                       </Button>

                       {connectionResult && (
                         <div className={`p-2 rounded-xl text-[10px] font-semibold ${connectionResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                           {connectionResult.ok ? '✅ ' : '❌ '}{connectionResult.message}
                         </div>
                       )}

                       {!connectionResult?.ok && (
                         <ul className="text-[10px] font-semibold text-gray-600 space-y-1.5 list-disc pl-4 mt-2">
                            <li>Check for <b>adblockers</b> (uBlock, Ghostery).</li>
                            <li>Brave users: turn off <b>Brave Shields</b> for this site.</li>
                            <li>Ensure you are not on a restricted office or public Wi-Fi.</li>
                            <li>Open this app in <b>incognito mode</b>.</li>
                         </ul>
                       )}
                    </div>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl flex gap-3 items-center animate-fade-in">
                  <CheckCircle size={18} className="shrink-0" />
                  <p className="text-xs font-bold leading-tight">{successMsg}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-16 shadow-xl mt-4">
                  {loading ? <Loader2 size={22} className="animate-spin" /> : 
                   mode === 'LOGIN' ? 'Sign in' : 
                   mode === 'SIGNUP' ? 'Create account' : 
                   mode === 'FORGOT' ? 'Send reset link' : 'Update password'}
              </Button>
              
              <div className="text-center mt-6 flex flex-col gap-3">
                  {mode === 'LOGIN' && (
                    <button type="button" onClick={() => setMode('FORGOT')} className="text-xs font-bold text-kubwa-fixit hover:underline">
                      Forgot password?
                    </button>
                  )}
                  
                  {!(mode === 'LOGIN' && initialRole === 'ADMIN') && (
                    <button type="button" onClick={() => {
                      setError('');
                      setSuccessMsg('');
                      setConnectionResult(null);
                      if (mode === 'LOGIN') setMode('SIGNUP');
                      else setMode('LOGIN');
                    }} className="text-xs font-bold text-gray-400 hover:text-kubwa-primary transition-colors">
                        {mode === 'LOGIN' ? "New here? Create account" : "Back to sign in"}
                    </button>
                  )}
              </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AuthModal;
