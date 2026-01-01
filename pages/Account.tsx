
import React, { useState, useEffect } from 'react';
import { User, AppSection, MonetisationTier, UserRole, PaymentIntent, MartOrder, DeliveryRequest } from '../types';
import { api } from '../services/data';
import { Button, Card, Badge } from '../components/ui';
import AuthModal from '../components/AuthModal';
import { 
  LogOut, 
  ShieldCheck, 
  Crown, 
  Star,
  Loader2, 
  User as UserIcon,
  LogIn,
  UserPlus,
  Truck,
  Settings,
  Bell,
  ChevronRight,
  PackageCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ExternalLink,
  Store,
  Wrench
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
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile');
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [authConfig, setAuthConfig] = useState<{ role: UserRole; mode: 'LOGIN' | 'SIGNUP' }>({
    role: 'USER',
    mode: 'LOGIN'
  });

  useEffect(() => {
    if (authIntent) {
      setAuthConfig({
        role: authIntent.role,
        mode: 'SIGNUP'
      });
      setIsAuthModalOpen(true);
    }
  }, [authIntent]);

  useEffect(() => {
    if (user && activeTab === 'activity') {
      loadActivity();
    }
  }, [user, activeTab]);

  const loadActivity = async () => {
    if (!user) return;
    setLoadingActivity(true);
    try {
      const [orderData, deliveryData] = await Promise.all([
        api.orders.getMyOrders(user.id),
        api.deliveries.getDeliveries(user.id)
      ]);
      setOrders(orderData);
      setDeliveries(deliveryData);
    } catch (err) {
      console.warn("[Account] Activity Load Error:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleAuthSuccess = async (u: User) => {
    setIsAuthModalOpen(false);
    const target = authIntent?.section || (u.role === 'ADMIN' ? AppSection.ADMIN : undefined);
    clearAuthIntent();
    await refreshUser(target); 
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in pb-32 bg-white">
        <div className="w-28 h-28 bg-kubwa-green/10 rounded-[3rem] flex items-center justify-center mb-10 shadow-inner relative">
          <div className="absolute inset-0 bg-kubwa-green/5 rounded-[3rem] animate-pulse scale-110 opacity-50"></div>
          <UserIcon size={56} className="text-kubwa-green relative z-10" />
        </div>
        
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none">Connect to Kubwa</h2>
        <p className="text-gray-500 font-bold text-sm max-w-xs mb-12 leading-relaxed opacity-70">
          The community super app. Join thousands of residents shopping and growing in Kubwa.
        </p>

        <div className="w-full space-y-4 max-w-sm">
          <Button 
            className="w-full h-16 text-base rounded-3xl shadow-xl shadow-kubwa-green/20" 
            onClick={() => { setAuthConfig({ role: 'USER', mode: 'LOGIN' }); setIsAuthModalOpen(true); }}
          >
            <LogIn size={20} strokeWidth={3} /> SIGN IN TO ACCOUNT
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-16 text-base border-2 border-gray-100 rounded-3xl" 
            onClick={() => { setAuthConfig({ role: 'USER', mode: 'SIGNUP' }); setIsAuthModalOpen(true); }}
          >
            <UserPlus size={20} strokeWidth={3} /> CREATE NEW PROFILE
          </Button>

          <button 
            onClick={() => { setAuthConfig({ role: 'ADMIN', mode: 'LOGIN' }); setIsAuthModalOpen(true); }}
            className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-kubwa-green transition-colors"
          >
            <ShieldAlert size={14} /> Admin Staff Portal
          </button>
        </div>

        {isAuthModalOpen && (
          <AuthModal 
            initialRole={authConfig.role}
            initialMode={authConfig.mode}
            onClose={() => {
               setIsAuthModalOpen(false);
               clearAuthIntent();
            }}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    );
  }

  const isVendor = user.role === 'VENDOR';
  const isProvider = user.role === 'PROVIDER';
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const isApproved = user.status === 'APPROVED';
  const isPending = user.status === 'PENDING';
  const isRejected = user.status === 'REJECTED';

  return (
    <div className="pb-32 pt-8 px-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6 relative">
        <Card className="bg-gray-900 text-white border-none shadow-2xl rounded-[3rem] p-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="p-10 relative z-10">
             <div className="flex justify-between items-start mb-8">
                <div className="w-24 h-24 rounded-[2rem] bg-white/10 flex items-center justify-center text-4xl font-black border border-white/20 shadow-2xl backdrop-blur-md overflow-hidden relative">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name.charAt(0)}
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
                  {user.verificationStatus === 'VERIFIED' && <ShieldCheck size={24} className="text-blue-400 shrink-0" />}
                </div>
                <p className="text-white/50 text-xs font-bold mb-6">{user.email}</p>
                <div className="flex flex-wrap gap-2">
                   <Badge color="bg-kubwa-green text-white border-none px-3 py-1.5">{user.role}</Badge>
                   {isPending && <Badge color="bg-orange-500 text-white border-none px-3 py-1.5 animate-pulse">Pending Review</Badge>}
                </div>
             </div>
          </div>
        </Card>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-[2rem] mb-8">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'activity' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
        >
          Activity
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="space-y-6 animate-fade-in">
          {isPending && (
            <Card className="p-8 border-none rounded-[2.5rem] bg-orange-50 text-orange-900 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-2xl text-orange-600"><Clock size={24} /></div>
                    <div className="flex-1">
                       <h4 className="font-black text-sm uppercase mb-1">Account Under Review</h4>
                       <p className="text-xs font-medium leading-relaxed opacity-80 mb-4">
                         Admins are vetting your {user.role.toLowerCase()} profile. Access to all Phase 1 tools will be granted upon approval.
                       </p>
                    </div>
                </div>
            </Card>
          )}

          {isRejected && (
            <Card className="p-8 border-none rounded-[2.5rem] bg-red-50 text-red-900 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-2xl text-red-600"><AlertTriangle size={24} /></div>
                    <div className="flex-1">
                       <h4 className="font-black text-sm uppercase mb-1">Application Rejected</h4>
                       <p className="text-xs font-medium leading-relaxed opacity-80 mb-4">
                         Your application was not approved. Please contact support to resolve any profile issues.
                       </p>
                       <Button variant="danger" className="h-10 text-[10px] px-6" onClick={() => setSection(AppSection.CONTACT)}>
                          CONTACT SUPPORT
                       </Button>
                    </div>
                </div>
            </Card>
          )}

          {isAdmin && (
            <Card className="p-8 bg-indigo-600 text-white border-none rounded-[2.5rem] shadow-xl shadow-indigo-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl"><ShieldCheck size={24} /></div>
                        <div>
                           <h4 className="font-black text-sm uppercase">Site Admin</h4>
                           <p className="text-[10px] opacity-60 font-bold uppercase">Governance Suite</p>
                        </div>
                    </div>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white h-10 px-4" onClick={() => setSection(AppSection.ADMIN)}>
                        Dashboard
                    </Button>
                </div>
            </Card>
          )}

          {isVendor && (
            <Card className="p-8 bg-kubwa-green text-white border-none rounded-[2.5rem] shadow-xl shadow-kubwa-green/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl"><Store size={24} /></div>
                        <div>
                           <h4 className="font-black text-sm uppercase">Merchant Dashboard</h4>
                           <p className="text-[10px] opacity-60 font-bold uppercase">Manage Your Shop</p>
                        </div>
                    </div>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white h-10 px-4" onClick={() => setSection(AppSection.VENDOR_DASHBOARD)}>
                        Open Tools
                    </Button>
                </div>
            </Card>
          )}

          {isProvider && (
            <Card className="p-8 bg-kubwa-orange text-white border-none rounded-[2.5rem] shadow-xl shadow-kubwa-orange/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl"><Wrench size={24} /></div>
                        <div>
                           <h4 className="font-black text-sm uppercase">Pro Console</h4>
                           <p className="text-[10px] opacity-60 font-bold uppercase">Manage Skills & Jobs</p>
                        </div>
                    </div>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white h-10 px-4" onClick={() => setSection(AppSection.PROVIDER_DASHBOARD)}>
                        Dashboard
                    </Button>
                </div>
            </Card>
          )}

          <Card className="p-6 text-center border-none shadow-sm rounded-[2rem] bg-white">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Status</p>
             <Badge color={isApproved ? 'bg-green-50 text-green-600' : isRejected ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'} className="mx-auto">
                {user.status}
             </Badge>
          </Card>

          <Card className="rounded-[2.5rem] p-4 border-none shadow-sm bg-white divide-y divide-gray-50">
             {[
                { icon: ShieldCheck, label: 'Security', sub: 'Privacy settings', color: 'text-blue-500', bg: 'bg-blue-50' },
                { icon: Bell, label: 'Notifications', sub: 'App alerts', color: 'text-orange-500', bg: 'bg-orange-50' }
             ].map((link, idx) => (
               <div key={idx} className="flex items-center gap-5 py-4 px-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer">
                  <div className={`p-3 rounded-xl ${link.bg} ${link.color}`}><link.icon size={20} /></div>
                  <div className="flex-1">
                     <p className="text-sm font-black text-gray-900 uppercase">{link.label}</p>
                     <p className="text-[10px] font-bold text-gray-400">{link.sub}</p>
                  </div>
                  <ChevronRight className="text-gray-200" size={18} />
               </div>
             ))}
          </Card>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
           {loadingActivity ? (
             <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-green" /></div>
           ) : (
             <>
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Recent Orders</h3>
               {orders.length === 0 ? (
                 <div className="text-center py-10 text-gray-300 uppercase text-[10px] font-black tracking-[0.2em] bg-gray-50 rounded-[2rem] border border-dashed">No recent mart orders</div>
               ) : (
                 <div className="space-y-3">
                    {orders.map(order => (
                      <Card key={order.id} className="p-6 border-none shadow-sm rounded-[2rem] flex justify-between items-center bg-white">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><PackageCheck size={20} /></div>
                            <div>
                               <p className="text-sm font-black text-gray-900 uppercase">Order #{order.id.slice(0, 5)}</p>
                               <p className="text-[10px] font-bold text-gray-400">{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-kubwa-green">₦{order.total.toLocaleString()}</p>
                            <Badge color="bg-gray-100 text-gray-600 mt-1">{order.status}</Badge>
                         </div>
                      </Card>
                    ))}
                 </div>
               )}
             </>
           )}
        </div>
      )}
    </div>
  );
};

export default Account;
