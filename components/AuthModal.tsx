
import React, { useState, useEffect } from 'react';
import { X, Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle, RefreshCw, Lock, User as UserIcon, UserPlus, Info, KeyRound } from 'lucide-react';
import { Button, Card, Input } from './ui';
import { api } from '../services/data';
import { User as UserType, UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
  providerName?: string;
  onSuccess?: (user: UserType) => void;
  initialRole?: UserRole;
  initialMode?: 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'UPDATE_PASSWORD';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  onClose, 
  onSuccess, 
  initialRole = 'USER',
  initialMode = 'LOGIN'
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT' | 'UPDATE_PASSWORD'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
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
          const result = await api.auth.signUp(email, password, name, initialRole);
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
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
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
        // Switch view to help user understand they need to check email
        setTimeout(() => setVerificationSent(true), 1500);
      }
    } else {
      setError(result.error || "Failed to resend.");
    }
    setResending(false);
  };

  const isEmailUnconfirmedError = error.toLowerCase().includes("activate your account") || error.toLowerCase().includes("email not confirmed");

  if (verificationSent) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
        <Card className="w-full max-w-sm relative p-8 text-center animate-zoom-in rounded-[3rem] border-none shadow-2xl">
          <div className="w-20 h-20 bg-kubwa-green/10 text-kubwa-green rounded-[2rem] flex items-center justify-center mx-auto mb-6">
             <Mail size={36} />
          </div>
          <h3 className="font-black text-2xl mb-2 uppercase tracking-tight">Check your email</h3>
          <p className="text-gray-500 mb-6 text-xs font-bold leading-relaxed">
            We've sent a secure activation link to:<br/>
            <span className="text-gray-900 font-black">{email}</span>
          </p>
          <div className="bg-gray-50 p-4 rounded-2xl mb-8 flex gap-3 text-left">
             <Info size={16} className="text-kubwa-green shrink-0 mt-1" />
             <p className="text-[10px] font-bold text-gray-500 leading-tight">
                Can't find it? Please check your <span className="text-gray-900">Spam</span> or <span className="text-gray-900">Promotions</span> folder. 
             </p>
          </div>
          <div className="space-y-3">
            <Button onClick={handleResend} disabled={resending || resendTimer > 0} variant="outline" className="w-full h-14 text-[10px] font-black">
              {resending ? <Loader2 size={16} className="animate-spin" /> : (resendTimer > 0 ? `Try again in ${resendTimer}s` : 'Resend Activation Link')}
            </Button>
            <Button onClick={onClose} className="w-full h-14 text-xs font-black">Close & Check Inbox</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-sm relative animate-zoom-in rounded-[3rem] border-none shadow-2xl overflow-hidden p-0">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors z-10">
          <X size={24} strokeWidth={3} />
        </button>
        <form onSubmit={handleSubmit} className="p-10">
          <div className="text-center mb-10">
             <div className="w-20 h-20 bg-kubwa-green/10 text-kubwa-green rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                {mode === 'SIGNUP' ? <UserPlus size={36} /> : mode === 'FORGOT' || mode === 'UPDATE_PASSWORD' ? <KeyRound size={36} /> : <span className="text-3xl">⚡</span>}
             </div>
             <h3 className="text-3xl font-black text-gray-900 mb-1 uppercase tracking-tight leading-none">
               {mode === 'LOGIN' ? 'Welcome' : mode === 'SIGNUP' ? 'Join Us' : mode === 'FORGOT' ? 'Recovery' : 'New Pass'}
             </h3>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
               {mode === 'FORGOT' ? 'Reset your password' : mode === 'UPDATE_PASSWORD' ? 'Set your new password' : 'Kubwa Connect Community'}
             </p>
          </div>

          <div className="space-y-4">
              {mode === 'SIGNUP' && (
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <Input className="pl-14 h-14" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required />
                </div>
              )}
              
              {mode !== 'UPDATE_PASSWORD' && (
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <Input className="pl-14 h-14" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required />
                </div>
              )}

              {mode !== 'FORGOT' && (
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <Input className="pl-14 h-14" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'UPDATE_PASSWORD' ? "New Password" : "Password"} required />
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex flex-col gap-3 animate-fade-in">
                  <div className="flex gap-3 items-center">
                    <AlertCircle size={18} className="shrink-0" />
                    <p className="text-[10px] font-black leading-tight">{error}</p>
                  </div>
                  {isEmailUnconfirmedError && (
                    <button 
                      type="button" 
                      onClick={handleResend}
                      disabled={resending || resendTimer > 0}
                      className="text-[10px] font-black uppercase tracking-widest text-kubwa-green hover:underline flex items-center gap-1 mt-1 disabled:opacity-50"
                    >
                      {resending ? <Loader2 size={12} className="animate-spin" /> : (resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Link Now')}
                    </button>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl flex gap-3 items-center animate-fade-in">
                  <CheckCircle size={18} className="shrink-0" />
                  <p className="text-[10px] font-black leading-tight">{successMsg}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-16 text-xs font-black shadow-xl mt-4">
                  {loading ? <Loader2 size={24} className="animate-spin" /> : 
                   mode === 'LOGIN' ? 'SIGN IN' : 
                   mode === 'SIGNUP' ? 'CREATE ACCOUNT' : 
                   mode === 'FORGOT' ? 'SEND RESET LINK' : 'UPDATE PASSWORD'}
              </Button>
              
              <div className="text-center mt-6 flex flex-col gap-3">
                  {mode === 'LOGIN' && (
                    <button type="button" onClick={() => setMode('FORGOT')} className="text-[10px] font-black text-kubwa-orange uppercase tracking-widest hover:underline">
                      Forgot Password?
                    </button>
                  )}
                  
                  <button type="button" onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    if (mode === 'LOGIN') setMode('SIGNUP');
                    else setMode('LOGIN');
                  }} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-kubwa-green transition-colors">
                      {mode === 'LOGIN' ? "New here? Create Account" : "Back to Sign In"}
                  </button>
              </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AuthModal;
