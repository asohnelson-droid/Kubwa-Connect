
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
  BarChart3
} from 'lucide-react';

interface AccountProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setSection: (section: AppSection) => void;
  refreshUser: () => void;
  authIntent: { section: AppSection; role: UserRole } | null;
}

const Account: React.FC<AccountProps> = ({ user, setUser, setSection, refreshUser, authIntent }) => {
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
            onClick={() => { setAuthView('SIGNUP'); setIsAuthModalOpen(true); }}
          >
            <UserPlus size={20} strokeWidth={3} /> CREATE NEW PROFILE
          </Button>
        </div>

        {isAuthModalOpen && (
          <AuthModal 
            initialRole={authMode}
            initialMode={authView}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={(u) => {
              setIsAuthModalOpen(false);
              refreshUser();
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
  const isApproved = user.status === 'APPROVED';

  return (
    <div className="pb-32 pt-8 px-6 max-w-2xl mx-auto animate-fade-in">
      {/* 1. PROFILE HEADER CARD */}
      <div className="mb-10 relative">
        <Card className="bg-gray-900 text-white border-none shadow-2xl rounded-[3rem] p-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="p-10 relative z-10">
             <div className="flex justify-between items-start mb-8">
                <div className="w-24 h-24 rounded-[2rem] bg-white/10 flex items-center justify-center text-4xl font-black border border-white/20 shadow-2xl backdrop-blur-md overflow-hidden">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                   <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <Settings size={22} />
                   </button>
                   <button onClick={async () => { await api.auth.signOut(); refreshUser(); setSection(AppSection.HOME); }} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all group">
                      <LogOut size={22} />
                   </button>
                </div>
             </div>
             
             <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none truncate max-w-[220px]">
                    {isVendor && user.storeName ? user.storeName : user.name}
                  </h2>
                  {user.verificationStatus === 'VERIFIED' && <ShieldCheck size={24} className="text-blue-400 shrink-0" />}
                </div>
                <p className="text-white/50 text-xs font-bold mb-6">{user.email}</p>
                <div className="flex flex-wrap gap-2">
                   <Badge color="bg-kubwa-green text-white border-none px-3 py-1.5">{user.role}</Badge>
                   {user.tier === 'FEATURED' && (
                      <Badge color="bg-yellow-500 text-black border-none px-3 py-1.5">
                        <Crown size={12} className="mr-1" /> FEATURED MERCHANT
                      </Badge>
                   )}
                   {user.tier === 'VERIFIED' && (
                      <Badge color="bg-blue-600 text-white border-none px-3 py-1.5">
                         <ShieldCheck size={12} className="mr-1" /> VERIFIED PRO
                      </Badge>
                   )}
                </div>
             </div>
          </div>
        </Card>
      </div>

      {/* 2. VENDOR STATUS ALERTS */}
      {isVendor && !isApproved && (
        <Card className="mb-8 p-6 bg-orange-50 border-2 border-orange-100 rounded-[2.5rem] flex gap-5 items-start animate-fade-in shadow-sm">
           <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl shrink-0"><Clock size={28} strokeWidth={3} /></div>
           <div>
              <h4 className="font-black text-sm uppercase text-orange-800 tracking-tight">Profile Under Review</h4>
              <p className="text-xs font-bold text-orange-700/70 mt-1 leading-relaxed">
                The Kubwa Trust Team is verifying your store details. You can setup your profile, but your shop isn't visible to residents just yet.
              </p>
           </div>
        </Card>
      )}

      {/* 3. DASHBOARD / BUSINESS HEALTH */}
      {(isVendor || isProvider) && (
        <div className="mb-12 space-y-8 animate-fade-in">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Merchant Hub</h3>
              <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Store Online</span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <Card className="p-8 bg-white border-none shadow-sm text-center flex flex-col items-center group hover:bg-gray-50 transition-colors">
                 <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl mb-3 group-hover:bg-kubwa-green/10 group-hover:text-kubwa-green transition-colors">
                   <ShoppingBag size={20} />
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Product Limit</p>
                 <p className="text-2xl font-black text-gray-900">
                   {user.productLimit === 999 ? '∞' : user.productLimit}
                 </p>
              </Card>
              <Card className="p-8 bg-white border-none shadow-sm text-center flex flex-col items-center group hover:bg-gray-50 transition-colors">
                 <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                   <TrendingUp size={20} />
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Store Rank</p>
                 <p className={`text-sm font-black uppercase ${isApproved ? 'text-green-500' : 'text-orange-500'}`}>
                   {user.tier === 'FEATURED' ? 'Top Tier' : user.tier === 'VERIFIED' ? 'Pro Tier' : 'Basic Tier'}
                 </p>
              </Card>
           </div>

           {/* GROWTH UPGRADES */}
           {isApproved && user.tier !== 'FEATURED' && (
             <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Upgrade Center</h4>
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Boost Visibility <ChevronRight size={10} className="inline" /></span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   {user.tier === 'FREE' && (
                      <Card className="p-8 border-2 border-blue-50 bg-white rounded-[2.5rem] flex flex-col items-center text-center relative hover:border-blue-500 transition-all group overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />
                         <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 mb-5 relative z-10"><ShieldCheck size={36} strokeWidth={2.5}/></div>
                         <h4 className="font-black text-base uppercase tracking-tight relative z-10">Verified Pro</h4>
                         <p className="text-[10px] font-bold text-gray-400 mt-2 mb-8 leading-relaxed relative z-10">Get the blue badge, unlimited listings, and priority in service searches.</p>
                         <Button onClick={() => handleStartPayment('VERIFIED')} className="w-full h-14 bg-blue-600 text-xs shadow-lg shadow-blue-600/20 relative z-10">Unlock for ₦5,000</Button>
                      </Card>
                   )}

                   <Card className="p-8 border-2 border-yellow-100 bg-white rounded-[2.5rem] flex flex-col items-center text-center relative hover:border-yellow-500 transition-all group overflow-hidden">
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-4 py-2 rounded-bl-2xl uppercase tracking-widest shadow-md z-20">Recommended</div>
                      <div className="absolute inset-0 bg-yellow-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="p-4 bg-yellow-50 rounded-2xl text-yellow-600 mb-5 relative z-10 group-hover:scale-110 transition-transform"><Crown size={36} strokeWidth={2.5}/></div>
                      <h4 className="font-black text-base uppercase tracking-tight relative z-10">Featured Shop</h4>
                      <p className="text-[10px] font-bold text-gray-400 mt-2 mb-8 leading-relaxed relative z-10">Homepage Hero Banner + Pinned at Mart top + Premium 24/7 Support.</p>
                      <Button onClick={() => handleStartPayment('FEATURED')} className="w-full h-14 bg-yellow-500 text-black hover:bg-yellow-600 text-xs shadow-lg shadow-yellow-500/20 relative z-10 border-none">Promote for ₦15,000</Button>
                   </Card>
                </div>
             </div>
           )}
        </div>
      )}

      {/* 4. SETTINGS & QUICK LINKS */}
      <div className="space-y-4">
         <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Account Management</h3>
         <Card className="rounded-[3rem] p-4 border-none shadow-sm bg-white divide-y divide-gray-50">
            {[
               { icon: ShieldAlert, label: 'Privacy & Permissions', sub: 'Control who sees your data', color: 'text-blue-500', bg: 'bg-blue-50' },
               { icon: CreditCard, label: 'Payments & Wallet', sub: '₦0.00 Outstanding Balance', color: 'text-green-500', bg: 'bg-green-50' },
               { icon: Bell, label: 'Notifications', sub: '3 Pending community alerts', color: 'text-orange-500', bg: 'bg-orange-50' }
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

      {/* MODALS & OVERLAYS */}
      {processingPayment && (
        <div className="fixed inset-0 z-[300] bg-black/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl animate-fade-in">
           <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl animate-zoom-in max-w-sm w-full border border-gray-100">
              <div className="relative mb-8">
                <Loader2 className="animate-spin text-kubwa-green mx-auto" size={72} strokeWidth={3} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl">⚡</span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">Securing Upgrade</h3>
              <p className="text-sm font-bold text-gray-500 mt-4 leading-relaxed">
                Confirming transaction with the Paystack network. Please do not close your app.
              </p>
           </div>
        </div>
      )}

      {paymentSuccess && (
        <div className="fixed bottom-32 inset-x-6 z-[250] max-w-md mx-auto animate-slide-in-bottom">
          <div className="p-6 bg-gray-900 text-white rounded-[2.5rem] shadow-2xl flex items-center gap-5 border-2 border-white/10 ring-8 ring-black/5">
             <div className="bg-kubwa-green p-4 rounded-2xl shrink-0 shadow-lg shadow-kubwa-green/40"><CheckCircle size={28} strokeWidth={3} /></div>
             <div className="flex-1">
                <p className="text-sm font-black uppercase tracking-widest">Growth Plan Active!</p>
                <p className="text-[10px] font-bold text-white/50 mt-1 uppercase">Your store limits are now unlimited.</p>
             </div>
             <button onClick={() => setPaymentSuccess(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
          </div>
        </div>
      )}

      {paymentError && (
        <div className="fixed bottom-32 inset-x-6 z-[250] max-w-md mx-auto animate-slide-in-bottom">
          <div className="p-6 bg-red-600 text-white rounded-[2.5rem] shadow-2xl flex items-center gap-5 border-2 border-white/10">
             <div className="bg-white/20 p-4 rounded-2xl shrink-0"><AlertTriangle size={28} strokeWidth={3} /></div>
             <div className="flex-1">
                <p className="text-sm font-black uppercase tracking-tight">Payment Issue</p>
                <p className="text-xs font-bold text-white/70 mt-0.5">{paymentError}</p>
             </div>
             <button onClick={() => setPaymentError(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
