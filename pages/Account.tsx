

import React, { useState, useEffect } from 'react';
import { User, AppSection, MonetisationTier, UserRole, PaymentIntent, MartOrder, DeliveryRequest, ServiceOrder, Review } from '../types';
import { api } from '../services/data';
import { supabase } from '../services/supabase';
import { Button, Card, Badge, BackButton, Sheet, Input } from '../components/ui';
import AuthModal from '../components/AuthModal';
import VendorDashboard from '../components/VendorDashboard';
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
  Store,
  Wrench,
  CheckCircle
} from 'lucide-react';

interface AccountProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setSection: (section: AppSection) => void;
  refreshUser: (targetSection?: AppSection) => void;
  authIntent: { section: AppSection; role: UserRole } | null;
  clearAuthIntent: () => void;
  goBack?: () => void;
}

const Account: React.FC<AccountProps> = ({ user, setUser, setSection, refreshUser, authIntent, clearAuthIntent, goBack }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'dashboard'>('profile');
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [serviceBookings, setServiceBookings] = useState<ServiceOrder[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Review form
  const [reviewingBooking, setReviewingBooking] = useState<ServiceOrder | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Edit profile form
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  
  // Local state for modal configuration, initialized from intent
  const [authConfig, setAuthConfig] = useState<{ role: UserRole; mode: 'LOGIN' | 'SIGNUP' }>({
    role: authIntent?.role || 'USER',
    mode: authIntent ? 'SIGNUP' : 'LOGIN'
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

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`buyer-orders-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `userId=eq.${user.id}` },
        (payload) => {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } as MartOrder : o));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadActivity = async () => {
    if (!user) return;
    setLoadingActivity(true);
    try {
      const [orderData, deliveryData, bookingData, reviewData] = await Promise.all([
        api.orders.getMyOrders(user.id),
        api.getDeliveries(user.id),
        api.serviceOrders.getMyBookings(user.id),
        api.reviews.getMyReviews(user.id)
      ]);
      setOrders(orderData);
      setDeliveries(deliveryData);
      setServiceBookings(bookingData);
      setMyReviews(reviewData);
    } catch (err) {
      console.warn("[Account] Activity Load Error:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleOpenEditProfile = () => {
    if (!user) return;
    setEditName(user.name || '');
    setEditPhone(user.phoneNumber || '');
    setEditAddress(user.address || '');
    setEditEmail('');
    setEmailChangeRequested(false);
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;
    setSavingProfile(true);
    const result = await api.auth.updateProfile(user.id, {
      name: editName.trim(),
      phoneNumber: editPhone.trim(),
      address: editAddress.trim()
    });
    setSavingProfile(false);
    if (result.success) {
      refreshUser();
      setShowEditProfile(false);
    } else {
      alert(result.error || "Couldn't update your details. Please try again.");
    }
  };

  const handleChangeEmail = async () => {
    if (!editEmail.trim()) return;
    setSavingEmail(true);
    const result = await api.auth.updateEmail(editEmail.trim());
    setSavingEmail(false);
    if (result.success) {
      setEmailChangeRequested(true);
    } else {
      alert(result.error || "Couldn't start the email change. Please try again.");
    }
  };

  const handleOpenReview = (booking: ServiceOrder) => {
    setReviewingBooking(booking);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewingBooking || !reviewComment.trim() || !reviewingBooking.providers?.userId) return;
    setSubmittingReview(true);
    const result = await api.reviews.create({
      userId: user.id,
      targetId: reviewingBooking.providers.userId,
      rating: reviewRating,
      comment: reviewComment.trim()
    });
    setSubmittingReview(false);
    if (result.success) {
      setReviewingBooking(null);
      loadActivity();
    } else {
      alert("Couldn't submit your review. Please try again.");
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
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const isApproved = user.status === 'APPROVED';

  return (
    <div className="pb-32 pt-8 px-6 max-w-2xl mx-auto animate-fade-in">
      {goBack && <BackButton onClick={goBack} />}
      
      {/* Profile Header */}
      <div className="mb-6 relative">
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
                   <button onClick={handleOpenEditProfile} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
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
                </div>
             </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-[2rem] mb-8 overflow-x-auto no-scrollbar gap-1">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all whitespace-nowrap px-4 ${activeTab === 'profile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
        >
          Profile
        </button>
        {isVendor && (
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all whitespace-nowrap px-4 flex items-center justify-center gap-2 ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-kubwa-green' : 'text-gray-400'}`}
          >
            <Store size={14}/> Dashboard
          </button>
        )}
        <button 
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all whitespace-nowrap px-4 ${activeTab === 'activity' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
        >
          History
        </button>
      </div>

      {activeTab === 'dashboard' && isVendor ? (
         <VendorDashboard user={user} />
      ) : activeTab === 'profile' ? (
        <div className="space-y-6 animate-fade-in">
          {isAdmin && (
            <Card className="p-8 bg-indigo-600 text-white border-none rounded-[2.5rem] shadow-xl shadow-indigo-500/20 group">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl"><ShieldCheck size={24} /></div>
                        <div>
                           <h4 className="font-black text-sm uppercase">Site Admin</h4>
                           <p className="text-[10px] opacity-60 font-bold uppercase">Central Control Panel</p>
                        </div>
                    </div>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white h-10 px-4" onClick={() => setSection(AppSection.ADMIN)}>
                        Dashboard
                    </Button>
                </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center border-none shadow-sm rounded-[2rem]">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                 <Badge color={isApproved ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'} className="mx-auto">
                    {isApproved ? 'Verified' : 'Pending'}
                 </Badge>
              </Card>
              <Card className="p-6 text-center border-none shadow-sm rounded-[2rem]">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wallet</p>
                 <p className="font-black text-gray-900">₦0.00</p>
              </Card>
          </div>

          <Card className="rounded-[2.5rem] p-4 border-none shadow-sm bg-white divide-y divide-gray-50">
             {[
                { icon: ShieldCheck, label: 'Privacy', sub: 'Security settings', color: 'text-blue-500', bg: 'bg-blue-50' },
                { icon: Bell, label: 'Alerts', sub: 'Smart notifications', color: 'text-orange-500', bg: 'bg-orange-50' }
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
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Recent Mart Orders</h3>
               {orders.length === 0 ? (
                 <div className="text-center py-10 text-gray-300 uppercase text-[10px] font-black tracking-[0.2em] bg-gray-50 rounded-[2rem] border border-dashed">No orders yet</div>
               ) : (
                 <div className="space-y-3">
                    {orders.map(order => (
                      <Card key={order.id} className="p-6 border-none shadow-sm rounded-[2rem] flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><PackageCheck size={20} /></div>
                            <div>
                               <p className="text-sm font-black text-gray-900 uppercase">Order #{order.id.slice(0, 5)}</p>
                               <p className="text-[10px] font-bold text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-kubwa-green">₦{order.total.toLocaleString()}</p>
                            <Badge color={
                               order.status === 'DELIVERED' ? 'bg-green-100 text-green-700 mt-1' :
                               order.status === 'CANCELLED' ? 'bg-red-50 text-red-500 mt-1' :
                               order.status === 'IN_TRANSIT' || order.status === 'RIDER_ASSIGNED' ? 'bg-blue-100 text-blue-700 mt-1' :
                               'bg-gray-100 text-gray-600 mt-1'
                            }>{order.status.replace('_', ' ')}</Badge>
                         </div>
                      </Card>
                    ))}
                 </div>
               )}

               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2 mt-8">Delivery History</h3>
               {deliveries.length === 0 ? (
                 <div className="text-center py-10 text-gray-300 uppercase text-[10px] font-black tracking-[0.2em] bg-gray-50 rounded-[2rem] border border-dashed">No deliveries yet</div>
               ) : (
                 <div className="space-y-3">
                    {deliveries.map(delivery => (
                      <Card key={delivery.id} className="p-6 border-none shadow-sm rounded-[2rem] flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Truck size={20} /></div>
                            <div>
                               <p className="text-sm font-black text-gray-900 uppercase">{delivery.pickup} → {delivery.dropoff}</p>
                               <p className="text-[10px] font-bold text-gray-400">{delivery.itemType}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <Badge color={delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                               {delivery.status}
                            </Badge>
                         </div>
                      </Card>
                    ))}
                 </div>
               )}

               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2 mt-8">FixIt Bookings</h3>
               {serviceBookings.length === 0 ? (
                 <div className="text-center py-10 text-gray-300 uppercase text-[10px] font-black tracking-[0.2em] bg-gray-50 rounded-[2rem] border border-dashed">No bookings yet</div>
               ) : (
                 <div className="space-y-3">
                    {serviceBookings.map(booking => {
                      const alreadyReviewed = myReviews.some(r => r.targetId === booking.providers?.userId);
                      return (
                        <Card key={booking.id} className="p-6 border-none shadow-sm rounded-[2rem]">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                    {booking.providers?.image ? <img src={booking.providers.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Wrench size={18} /></div>}
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-gray-900 uppercase">{booking.providers?.name || 'Provider'}</p>
                                    <p className="text-[10px] font-bold text-gray-400">{booking.providers?.category}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="font-black text-kubwa-green">₦{booking.amount.toLocaleString()}</p>
                                 <Badge color={
                                    booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                    booking.status === 'CANCELLED' ? 'bg-red-50 text-red-500' :
                                    'bg-gray-100 text-gray-600'
                                 } className="mt-1">{booking.status.replace('_', ' ')}</Badge>
                              </div>
                           </div>
                           {booking.status === 'COMPLETED' && (
                              <div className="mt-4 pt-4 border-t border-gray-50">
                                 {alreadyReviewed ? (
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600">
                                       <CheckCircle size={14} /> Review submitted
                                    </div>
                                 ) : (
                                    <Button variant="outline" className="w-full h-11 text-[10px]" onClick={() => handleOpenReview(booking)}>
                                       <Star size={14} /> Leave a Review
                                    </Button>
                                 )}
                              </div>
                           )}
                        </Card>
                      );
                    })}
                 </div>
               )}
             </>
           )}
        </div>
      )}

      <Sheet isOpen={!!reviewingBooking} onClose={() => setReviewingBooking(null)} title="Rate Your Experience">
        {reviewingBooking && (
          <div className="pb-6 space-y-5">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                  {reviewingBooking.providers?.image ? <img src={reviewingBooking.providers.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Wrench size={20} /></div>}
               </div>
               <div>
                  <p className="font-black text-sm text-gray-900">{reviewingBooking.providers?.name || 'Provider'}</p>
                  <p className="text-[10px] font-black text-kubwa-orange uppercase tracking-widest">{reviewingBooking.providers?.category}</p>
               </div>
            </div>

            <div className="flex justify-center gap-2 py-2">
               {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)}>
                     <Star size={32} className={n <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                  </button>
               ))}
            </div>

            <textarea
              className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold h-28 resize-none outline-none focus:ring-2 focus:ring-kubwa-green"
              placeholder="How was your experience?"
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
            />

            <Button className="w-full h-14" onClick={handleSubmitReview} disabled={submittingReview || !reviewComment.trim()}>
              {submittingReview ? <Loader2 className="animate-spin" /> : 'SUBMIT REVIEW'}
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        {user && (
          <div className="p-6 pb-8 space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Your Details</p>
              <Input placeholder="Full Name" value={editName} onChange={e => setEditName(e.target.value)} />
              <Input placeholder="Phone Number" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              <Input placeholder="Address" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
              <Button className="w-full h-14" onClick={handleSaveProfile} disabled={savingProfile || !editName.trim()}>
                {savingProfile ? <Loader2 className="animate-spin" /> : 'SAVE CHANGES'}
              </Button>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Change Email</p>
              <p className="text-[11px] font-medium text-gray-500">Current: {user.email}</p>
              {emailChangeRequested ? (
                <div className="bg-green-50 text-green-700 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} className="shrink-0" />
                  Check your new inbox for a confirmation link — the change won't take effect until you click it.
                </div>
              ) : (
                <>
                  <Input placeholder="New Email Address" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                  <Button variant="outline" className="w-full h-12" onClick={handleChangeEmail} disabled={savingEmail || !editEmail.trim()}>
                    {savingEmail ? <Loader2 className="animate-spin" /> : 'UPDATE EMAIL'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default Account;