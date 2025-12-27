
import React, { useState, useEffect } from 'react';
import { X, Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle, Bike, WifiOff, RefreshCw, Send, Lock, User as UserIcon, UserPlus } from 'lucide-react';
import { Button, Card, Input } from './ui';
import { api } from '../services/data';
import { User as UserType, UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
  providerName?: string;
  onSuccess?: (user: UserType) => void;
  initialRole?: UserRole;
  initialMode?: 'LOGIN' | 'SIGNUP' | 'FORGOT';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  onClose, 
  providerName = "Kubwa Connect", 
  onSuccess, 
  initialRole = 'USER',
  initialMode = 'LOGIN'
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>(initialMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendStatus, setResendStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Simple client-side validation
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsNetworkError(false);

    // Basic Validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (mode !== 'FORGOT' && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (mode === 'SIGNUP' && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    
    try {
      if (mode === 'FORGOT') {
          const { error: resetError } = await api.auth.resetPassword(email);
          if (resetError) {
              handleAuthError(resetError);
          } else {
              setResetSent(true);
          }
      } else if (mode === 'LOGIN') {
          const { user, error: loginError } = await api.auth.signIn(email, password);
          if (user) {
             if (onSuccess) onSuccess(user);
             onClose(); 
          } else {
             handleAuthError(loginError);
          }
      } else {
          // Signup
          const result = await api.auth.signUp(email, password, name, initialRole);
          
          if (result.error) {
              handleAuthError(result.error);
          } else if (result.requiresVerification) {
              setVerificationSent(true);
          } else if (result.user) {
              if (onSuccess) onSuccess(result.user);
              onClose();
          }
      }
    } catch (e: any) {
      handleAuthError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    const errStr = String(err).toLowerCase();
    console.error("Auth Error Trace:", err);

    if (errStr.includes('fetch') || errStr.includes('network')) {
        setIsNetworkError(true);
        setError("Connection lost. We couldn't reach the Kubwa servers.");
    } else if (errStr.includes('already registered') || errStr.includes('user_already_exists')) {
        setError("This email is already registered. Try logging in.");
    } else if (errStr.includes('invalid login credentials')) {
        setError("The email or password you entered is incorrect.");
    } else if (errStr.includes('email not confirmed')) {
        setError("Please check your email and verify your account first.");
    } else if (errStr.includes('weak_password')) {
        setError("Password is too weak. Try something harder.");
    } else {
        setError(String(err) || "An unexpected error occurred. Please try again.");
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendStatus('IDLE');
    const result = await api.auth.resendVerification(email);
    if (result.success) {
      setResendStatus('SUCCESS');
      setTimeout(() => setResendStatus('IDLE'), 5000);
    } else {
      setResendStatus('ERROR');
      setError(result.error || "Failed to resend.");
    }
    setResending(false);
  };

  const switchMode = (newMode: 'LOGIN' | 'SIGNUP' | 'FORGOT') => {
      setMode(newMode);
      setError('');
      setIsNetworkError(false);
      setVerificationSent(false);
      setResetSent(false);
  };

  if (verificationSent) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
        <Card className="w-full max-w-sm relative p-8 text-center animate-zoom-in rounded-[3rem]">
          <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
             <Mail size={40} strokeWidth={2.5} />
          </div>
          <h3 className="font-black text-2xl mb-3 uppercase tracking-tight">Check your inbox</h3>
          <p className="text-gray-500 mb-10 text-xs font-bold leading-relaxed px-4">
            We've sent a secure activation link to <span className="text-gray-900">{email}</span>. <br/><br/>
            Click the link in that email to join the Kubwa community.
          </p>
          
          <div className="space-y-4">
            <Button onClick={onClose} className="w-full py-5 h-16 uppercase tracking-widest text-xs font-black">Close & Wait</Button>
            
            <button 
              disabled={resending || resendStatus === 'SUCCESS'}
              onClick={handleResend}
              className={`w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest p-5 rounded-2xl transition-all ${resendStatus === 'SUCCESS' ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-kubwa-green hover:bg-gray-100'}`}
            >
              {resending ? <Loader2 size={14} className="animate-spin" /> : resendStatus === 'SUCCESS' ? <CheckCircle size={14} /> : <RefreshCw size={14} />}
              {resendStatus === 'SUCCESS' ? 'Link Sent Successfully' : 'Didn\'t get it? Resend Link'}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
        <Card className="w-full max-w-sm relative p-8 text-center animate-zoom-in rounded-[3rem]">
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
             <CheckCircle size={40} strokeWidth={2.5} />
          </div>
          <h3 className="font-black text-2xl mb-3 uppercase tracking-tight">Access Link Sent</h3>
          <p className="text-gray-500 mb-8 text-sm font-bold">Check your email for instructions to reset your password.</p>
          <Button onClick={() => switchMode('LOGIN')} className="w-full h-16 uppercase tracking-widest text-xs font-black">Return to Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-sm relative animate-zoom-in rounded-[3rem] border-none shadow-2xl overflow-hidden p-0">
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors z-10"
        >
          <X size={24} strokeWidth={3} />
        </button>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="text-center mb-10">
             <div className="w-20 h-20 bg-kubwa-green/10 text-kubwa-green rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-kubwa-green/5">
                {mode === 'SIGNUP' ? <UserPlus size={36} /> : <span className="text-3xl">⚡</span>}
             </div>
             <h3 className="text-3xl font-black text-gray-900 mb-1 uppercase tracking-tight leading-none">
               {mode === 'LOGIN' ? 'Welcome' : mode === 'SIGNUP' ? 'Join Us' : 'Recover'}
             </h3>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
               {mode === 'LOGIN' ? `Sign in to ${providerName}` : 
                mode === 'SIGNUP' ? `Create your account` :
                'Account Recovery'}
             </p>
          </div>

          <div className="space-y-5">
              {mode === 'SIGNUP' && (
                  <div className="animate-fade-in">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-2">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <Input className="pl-14 h-14" value={name} onChange={e => setName(e.target.value)} placeholder="Musa Ibrahim" required />
                    </div>
                  </div>
              )}
              
              <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <Input className="pl-14 h-14" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" required />
                  </div>
              </div>

              {mode !== 'FORGOT' && (
                <div className="animate-fade-in">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-2">Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <Input className="pl-14 h-14" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    {mode === 'LOGIN' && (
                      <div className="flex justify-end mt-3">
                          <button 
                            type="button"
                            onClick={() => switchMode('FORGOT')}
                            className="text-[10px] font-black text-kubwa-green uppercase tracking-widest hover:underline"
                          >
                              Forgot Access?
                          </button>
                      </div>
                    )}
                </div>
              )}
              
              {error && (
                <div className={`p-5 rounded-2xl flex gap-4 items-center animate-fade-in shadow-sm ${isNetworkError ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {isNetworkError ? <WifiOff size={20} /> : <AlertCircle size={20} />}
                  <div className="flex-1">
                    <p className="text-[11px] font-bold leading-tight">{error}</p>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full py-5 h-16 text-base mt-4 shadow-xl">
                  {loading ? <Loader2 size={24} className="animate-spin" /> : mode === 'LOGIN' ? 'SIGN IN' : mode === 'SIGNUP' ? 'CREATE ACCOUNT' : 'SEND RESET LINK'}
              </Button>
              
              <div className="text-center mt-8">
                  {mode === 'LOGIN' ? (
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          New to the community? {' '}
                          <button type="button" onClick={() => switchMode('SIGNUP')} className="text-kubwa-green hover:underline">
                              Join Now
                          </button>
                      </p>
                  ) : mode === 'SIGNUP' ? (
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Already have an account? {' '}
                          <button type="button" onClick={() => switchMode('LOGIN')} className="text-kubwa-green hover:underline">
                              Log In
                          </button>
                      </p>
                  ) : (
                      <button type="button" onClick={() => switchMode('LOGIN')} className="flex items-center justify-center gap-3 mx-auto text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-kubwa-green transition-colors">
                          <ArrowLeft size={16} strokeWidth={3} /> Return to Login
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
