
import React, { useState } from 'react';
import { X, Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle, Bike } from 'lucide-react';
import { Button, Card, Input } from './ui';
import { api } from '../services/data';
import { User as UserType, UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
  providerName?: string;
  onSuccess?: (user: UserType) => void;
  initialRole?: UserRole; // New prop
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, providerName = "Mart Vendor", onSuccess, initialRole = 'USER' }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    
    try {
      if (mode === 'FORGOT') {
          const { error } = await api.auth.resetPassword(email);
          if (error) {
              setError(error);
          } else {
              setResetSent(true);
          }
      } else if (mode === 'LOGIN') {
          const { user, error } = await api.auth.signIn(email, password);
          if (user) {
             if (onSuccess) onSuccess(user);
             onClose(); 
          } else {
             setError(error || "Invalid email or password");
          }
      } else {
          // Signup
          if (!name) { setError("Name is required"); setLoading(false); return; }
          const { user, error, requiresVerification } = await api.auth.signUp(email, password, name, initialRole);
          
          if (error) {
              setError(error);
          } else if (requiresVerification) {
              setVerificationSent(true);
          } else if (user) {
              if (onSuccess) onSuccess(user);
              onClose();
          }
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'LOGIN' | 'SIGNUP' | 'FORGOT') => {
      setMode(newMode);
      setError('');
      setVerificationSent(false);
      setResetSent(false);
  };

  if (verificationSent) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <Card className="w-full max-w-sm relative p-8 text-center animate-zoom-in">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <Mail size={32} />
          </div>
          <h3 className="font-bold text-xl mb-2">Check your inbox</h3>
          <p className="text-gray-600 mb-6">We sent a confirmation link to <strong>{email}</strong>.</p>
          <Button onClick={onClose} className="w-full">Close</Button>
        </Card>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <Card className="w-full max-w-sm relative p-8 text-center animate-zoom-in">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle size={32} />
          </div>
          <h3 className="font-bold text-xl mb-2">Link Sent</h3>
          <p className="text-gray-600 mb-6">We sent a password reset link to <strong>{email}</strong>.</p>
          <Button onClick={() => switchMode('LOGIN')} className="w-full">Back to Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-sm relative animate-zoom-in">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
           {initialRole === 'RIDER' && mode === 'SIGNUP' && (
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                 <Bike size={24} />
              </div>
           )}
           <h3 className="text-xl font-bold text-gray-900 mb-2">
             {mode === 'LOGIN' ? 'Welcome Back' : mode === 'SIGNUP' ? 'Create Account' : 'Reset Password'}
           </h3>
           <p className="text-sm text-gray-500">
             {mode === 'LOGIN' ? `Sign in to access ${providerName}` : 
              mode === 'SIGNUP' && initialRole === 'RIDER' ? 'Register to start earning as a Rider' :
              mode === 'SIGNUP' ? `Join Kubwa Connect to continue` :
              'Enter your email to reset your password'}
           </p>
        </div>

        <div className="space-y-4">
            {mode === 'SIGNUP' && (
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Full Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Musa Ibrahim" />
                </div>
            )}
            
            <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Email Address</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
            </div>

            {mode !== 'FORGOT' && (
              <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Password</label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                  {mode === 'LOGIN' && (
                    <div className="flex justify-end mt-1">
                        <button 
                          onClick={() => switchMode('FORGOT')}
                          className="text-xs text-kubwa-green hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>
                  )}
              </div>
            )}
            
            {error && <div className="text-xs text-red-500 bg-red-50 p-2 rounded flex gap-2 items-center"><AlertCircle size={14}/> {error}</div>}

            <Button onClick={handleSubmit} disabled={loading} className="w-full py-3 flex justify-center items-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {mode === 'LOGIN' ? 'Sign In' : mode === 'SIGNUP' ? 'Create Account' : 'Send Link'}
            </Button>
            
            <div className="text-center text-xs text-gray-500 mt-4">
                {mode === 'LOGIN' ? (
                    <>
                        Don't have an account? {' '}
                        <button onClick={() => switchMode('SIGNUP')} className="text-kubwa-green font-bold hover:underline">
                            Sign Up
                        </button>
                    </>
                ) : mode === 'SIGNUP' ? (
                    <>
                        Already have an account? {' '}
                        <button onClick={() => switchMode('LOGIN')} className="text-kubwa-green font-bold hover:underline">
                            Log In
                        </button>
                    </>
                ) : (
                    <button onClick={() => switchMode('LOGIN')} className="flex items-center justify-center gap-1 mx-auto text-gray-600 hover:text-kubwa-green">
                        <ArrowLeft size={14} /> Back to Sign In
                    </button>
                )}
            </div>
        </div>
      </Card>
    </div>
  );
};

export default AuthModal;
