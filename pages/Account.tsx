
import React, { useState, useEffect } from 'react';
import { User, AppSection, MonetisationTier, UserRole, PaymentIntent } from '../types';
import { api } from '../services/data';
import { PaymentService } from '../services/payments';
import { Button, Card, Badge } from '../components/ui';
import AuthModal from '../components/AuthModal';
import { 
  LogOut, 
  ShieldCheck, 
  Crown, 
  Zap, 
  Loader2, 
  CreditCard, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  ShoppingBag,
  User as UserIcon,
  LogIn,
  UserPlus,
  Heart,
  Truck,
  Wrench,
  Settings,
  Bell,
  X,
  ChevronRight,
  CheckCircle,
  Clock,
  Info,
  TrendingUp,
  BarChart3,
  Star,
  Sparkles
} from 'lucide-react';

interface AccountProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setSection: (section: AppSection) => void;
  refreshUser: (targetSection?: AppSection) => void;
  authIntent: { section: AppSection; role: UserRole } | null;
  clearAuthIntent: () => void;
}

const Account: React.FC<AccountProps> = ({ user, setUser, setSection, refreshUser, authIntent, clearAuthIntent }) => {
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<UserRole>(authIntent?.role || 'USER');
  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>(authIntent ? 'SIGNUP' : 'LOGIN');

  useEffect(() => {
    if (authIntent) {
      setAuthMode(authIntent.role);
      setAuthView('SIGNUP');
      setIsAuthModalOpen(true);
    }
  }, [authIntent]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in pb-32">
        <div className="w-28 h-28 bg-kubwa-green/10 rounded-[3rem] flex items-center justify-center mb-10 shadow-inner relative group">
          <div className="absolute inset-0 bg-kubwa-green/5 rounded-[3rem] animate-ping scale-110 opacity-50"></div>
          <UserIcon size={56} className="text-kubwa-green relative z-10" />
        </div>
        
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none">Connect to Kubwa</h2>
        <p className="text-gray-500 font-bold text-sm max-w-xs mb-12 leading-relaxed opacity-70">
          The heart of your community. Join thousands of residents shopping and earning in Kubwa.
        </p>

        <div className="w-full space-y-4 max-w-sm">
          <Button 
            className="w-full h-16 text-base rounded-3xl shadow-xl shadow-kubwa-green/20" 
            onClick={() => { setAuthView('LOGIN'); setIsAuthModalOpen(true); }}
          >
            <LogIn size={20} strokeWidth={3} /> SIGN IN TO ACCOUNT
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-16 text-base border-2 border-gray-100 rounded-3xl" 
            onClick={() => { setAuthView('SIGNUP'); setAuthMode('USER'); setIsAuthModalOpen(true); }}
          >
            <UserPlus size={20} strokeWidth={3} /> CREATE NEW PROFILE
          </Button>
        </div>

        {isAuthModalOpen && (
          <AuthModal 
            initialRole={authMode}
            initialMode={authView}
            onClose={() => {
               setIsAuthModalOpen(false);
               clearAuthIntent();
            }}
            onSuccess={(u) => {
              setIsAuthModalOpen(false);
              refreshUser(authIntent?.section);
            }}
          />
        )}
      </div>
    );
  }

  const handleStartPayment = async (tier: MonetisationTier) => {
    setProcessingPayment(true);
    setPaymentError(null);

    const intent: PaymentIntent = tier === 'VERIFIED' ? 'VENDOR_VERIFIED' : 'VENDOR_FEATURED';
    const amount = tier === 'VERIFIED' ? 5000 : 15000;

    try {
      const response = await PaymentService.pay(intent, amount, user);
      if (response.success) {
        const fulfilled = await api.payments.fulfillIntent(user.id, intent, response.reference);
        if (fulfilled) {
          await refreshUser();
          setPaymentSuccess(true);
          setTimeout(() => setPaymentSuccess(false), 5000);
        }
      } else {
        setPaymentError(response.error || "Payment was not completed.");
      }
    } catch (err) {
      setPaymentError("An unexpected error occurred during payment.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const isVendor = user.role === 'VENDOR';
  const isProvider = user.role === 'PROVIDER';
  const isRider = user.role === 'RIDER';
  const isApproved = user.status === 'APPROVED';

  return (
    <div className="pb-32 pt-8 px-6 max-w-2xl mx-auto animate-fade-in">
      {/* Profile Header */}
      <div className="mb-10 relative">
        <Card className="bg-gray-900 text-white border-none shadow-2xl rounded-[3rem] p-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="p-10 relative z-10">
             <div className="flex justify-between items-start mb-8">
                <div className="w-24 h-24 rounded-[2rem] bg-white/10 flex items-center justify-center text-4xl font-black border border-white/20 shadow-2xl backdrop-blur-md overflow-hidden relative">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name.charAt(0)}
                  {user.tier === 'FEATURED' && (
                    <div className="absolute top-0 right-0 bg-yellow-500 p-1 rounded-bl-xl border-b border-l border-white/20">
                      <Crown size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                   <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <Settings size={22} />
                   </button>
                   <button onClick={async () => { await api.auth.signOut(); }} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all group">
                      <LogOut size={22} />
                   </button>
                </div>
             </div>
             
             <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none truncate max-w-[220px]">
                    {isVendor && user.storeName ? user.storeName : user.name}
                  </h2>
                  {(user.verificationStatus === 'VERIFIED' || user.tier === 'VERIFIED') && <ShieldCheck size={24} className="text-blue-400 shrink-0" />}
                  {user.tier === 'FEATURED' && <Star size={24} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                </div>
                <p className="text-white/50 text-xs font-bold mb-6">{user.email}</p>
                <div className="flex flex-wrap gap-2">
                   <Badge color="bg-kubwa-green text-white border-none px-3 py-1.5">{user.role}</Badge>
                   {user.tier === 'FEATURED' && (
                      <Badge color="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none px-3 py-1.5 shadow-lg shadow-yellow-500/20">
                        <Crown size={12} className="mr-1 animate-bounce" /> FEATURED MERCHANT
                      </Badge>
                   )}
                </div>
             </div>
          </div>
        </Card>
      </div>

      {/* Verification Status Alerts for Business Users */}
      {(isVendor || isProvider || isRider) && !isApproved && (
        <Card className="mb-8 p-6 bg-orange-50 border-2 border-orange-100 rounded-[2.5rem] flex gap-5 items-start animate-fade-in shadow-sm">
           <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl shrink-0"><Clock size={28} strokeWidth={3} /></div>
           <div>
              <h4 className="font-black text-sm uppercase text-orange-800 tracking-tight">Application Pending</h4>
              <p className="text-xs font-bold text-orange-700/70 mt-1 leading-relaxed">
                The Kubwa Trust Team is currently reviewing your {isVendor ? 'store' : isRider ? 'rider' : 'service'} application. You will be notified once verified.
              </p>
           </div>
        </Card>
      )}

      {/* Business Dashboard */}
      {(isVendor || isProvider) && (
        <div className="mb-12 space-y-8 animate-fade-in">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Business Hub</h3>
              <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full">
                <div className={`w-1.5 h-1.5 ${isApproved ? 'bg-green-500 animate-pulse' : 'bg-orange-400'} rounded-full`}></div>
                <span className={`text-[9px] font-black ${isApproved ? 'text-green-600' : 'text-orange-500'} uppercase tracking-widest`}>
                  {isApproved ? 'Active Profile' : 'Awaiting Review'}
                </span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <Card className="p-8 bg-white border-none shadow-sm text-center flex flex-col items-center group hover:bg-gray-50 transition-colors">
                 <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl mb-3 group-hover:bg-kubwa-green/10 group-hover:text-kubwa-green transition-colors">
                   <ShoppingBag size={20} />
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Listings Limit</p>
                 <p className="text-2xl font-black text-gray-900">
                   {user.productLimit === 999 ? '∞' : user.productLimit}
                 </p>
              </Card>
              <Card className="p-8 bg-white border-none shadow-sm text-center flex flex-col items-center group hover:bg-gray-50 transition-colors">
                 <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                   <TrendingUp size={20} />
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Tier</p>
                 <p className={`text-sm font-black uppercase ${isApproved ? (user.tier === 'FEATURED' ? 'text-yellow-500' : 'text-green-500') : 'text-orange-500'}`}>
                   {user.tier === 'FEATURED' ? 'Featured' : user.tier === 'VERIFIED' ? 'Pro' : 'Basic'}
                 </p>
              </Card>
           </div>
        </div>
      )}

      {/* Common Links */}
      <div className="space-y-4">
         <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Account Management</h3>
         <Card className="rounded-[3rem] p-4 border-none shadow-sm bg-white divide-y divide-gray-50">
            {[
               { icon: ShieldAlert, label: 'Privacy & Security', sub: 'Control your profile visibility', color: 'text-blue-500', bg: 'bg-blue-50' },
               { icon: CreditCard, label: 'Kubwa Wallet', sub: '₦0.00 Outstanding Balance', color: 'text-green-500', bg: 'bg-green-50' },
               { icon: Bell, label: 'Smart Alerts', sub: 'Manage community notifications', color: 'text-orange-500', bg: 'bg-orange-50' }
            ].map((link, idx) => (
              <div key={idx} className="flex items-center gap-5 py-5 px-4 hover:bg-gray-50 rounded-[2rem] transition-all cursor-pointer group">
                 <div className={`p-4 rounded-2xl ${link.bg} ${link.color} group-hover:scale-110 transition-transform`}>
                    <link.icon size={22} />
                 </div>
                 <div className="flex-1">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{link.label}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{link.sub}</p>
                 </div>
                 <ChevronRight className="text-gray-200 group-hover:text-gray-400 transition-colors" size={20} strokeWidth={3} />
              </div>
            ))}
         </Card>
      </div>
    </div>
  );
};

export default Account;
