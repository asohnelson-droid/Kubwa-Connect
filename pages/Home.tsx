
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Wrench, Truck, ChevronRight, Store, Bike, Search, MapPin, Bell, X, Star, Crown, Flame, Clock, Briefcase, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { AppSection, UserRole, User as UserType, Announcement, Product } from '../types';
import { Button, Card, Sheet } from '../components/ui';
import { KUBWA_AREAS, api } from '../services/data';

interface HomeProps {
  setSection: (section: AppSection) => void;
  user?: UserType | null;
  setAuthIntent: (intent: { section: AppSection; role: UserRole } | null) => void;
  refreshUser?: () => void;
}

const Home: React.FC<HomeProps> = ({ setSection, user, setAuthIntent, refreshUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('All Kubwa');
  const [visibleAnnouncement, setVisibleAnnouncement] = useState<Announcement | null>(null);
  const [featuredVendors, setFeaturedVendors] = useState<UserType[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const heroMessages = [
    "Find Trusted Artisans in Kubwa in Minutes.",
    "Order quality products from local vendors.",
    "Send and track packages across Kubwa instantly."
  ];

  useEffect(() => {
    const interval = setInterval(() => setHeroIndex((prev) => (prev + 1) % heroMessages.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.admin.getAnnouncements().then(data => data.length && setVisibleAnnouncement(data[0]));
    
    // For demo/mock purposes, we simulate some featured vendors if the list is empty
    api.users.getFeaturedVendors().then(data => {
      if (data.length === 0) {
        setFeaturedVendors([
          { id: 'f1', name: 'Musa Repairs', storeName: 'Musa Gadgets', role: 'VENDOR', tier: 'FEATURED', avatar: 'https://i.pravatar.cc/150?u=musa', status: 'APPROVED' },
          { id: 'f2', name: 'Sarah Bakes', storeName: 'Sarah’s Delights', role: 'VENDOR', tier: 'FEATURED', avatar: 'https://i.pravatar.cc/150?u=sarah', status: 'APPROVED' },
          { id: 'f3', name: 'John Doe', storeName: 'Tech Hub Kubwa', role: 'VENDOR', tier: 'FEATURED', avatar: 'https://i.pravatar.cc/150?u=john', status: 'APPROVED' }
        ] as any);
      } else {
        setFeaturedVendors(data);
      }
    });

    api.getProducts().then(all => setRecentProducts(all.filter(p => p.status === 'APPROVED').slice(0, 4)));
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    const serviceKeywords = ['plumber', 'electrician', 'cleaner', 'tutor', 'repair', 'mechanic', 'tailor'];
    setSection(serviceKeywords.some(k => query.includes(k)) ? AppSection.FIXIT : AppSection.MART);
  };

  const [upgradeTarget, setUpgradeTarget] = useState<{ role: 'VENDOR' | 'PROVIDER' | 'RIDER'; title: string; desc: string; icon: React.ElementType } | null>(null);
  const [requestingUpgrade, setRequestingUpgrade] = useState(false);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);

  const UPGRADE_OPTIONS: Record<'VENDOR' | 'PROVIDER' | 'RIDER', { section: AppSection; title: string; sub: string; desc: string; icon: React.ElementType; color: string }> = {
    VENDOR: { section: AppSection.MART, title: 'Become a Vendor', sub: 'Sell to Kubwa', desc: "Sell your products to residents across Kubwa. Your application will be reviewed before your shop goes live.", icon: Store, color: 'text-kubwa-green' },
    PROVIDER: { section: AppSection.FIXIT, title: 'Hire out Skills', sub: 'Find fixit jobs', desc: "Offer repairs and home services through FixIt. Your application will be reviewed before you can start receiving bookings.", icon: Briefcase, color: 'text-kubwa-orange' },
    RIDER: { section: AppSection.RIDE, title: 'Become a Rider', sub: 'Deliver & earn', desc: "Deliver orders across Kubwa and earn. Your application will be reviewed before you can start accepting jobs.", icon: Bike, color: 'text-blue-600' },
  };

  const handleRoleAction = (role: 'VENDOR' | 'PROVIDER' | 'RIDER') => {
    const opt = UPGRADE_OPTIONS[role];

    if (!user) {
      setAuthIntent({ section: opt.section, role });
      setSection(AppSection.ACCOUNT);
      return;
    }

    if (user.role === role) {
      if (user.status === 'PENDING') {
        alert(`Your ${opt.title.replace('Become a ', '').replace('Hire out ', '')} application is still under review. We'll let you know once it's approved.`);
      } else {
        setSection(opt.section);
      }
      return;
    }

    if (user.role !== 'USER') {
      alert(`Your account is already registered as a ${user.role}. Contact support if you'd like to change your account type.`);
      return;
    }

    setUpgradeSubmitted(false);
    setUpgradeTarget({ role, title: opt.title, desc: opt.desc, icon: opt.icon });
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradeTarget) return;
    setRequestingUpgrade(true);
    const result = await api.auth.requestRoleUpgrade(upgradeTarget.role);
    setRequestingUpgrade(false);
    if (result.success) {
      setUpgradeSubmitted(true);
      refreshUser?.();
    } else {
      alert(result.error || "Couldn't submit your request. Please try again.");
    }
  };

  return (
    <div className="pb-24">
      {/* Dynamic Hero Section */}
      <div className="bg-kubwa-green text-white rounded-b-[3rem] p-8 pt-16 relative overflow-hidden shadow-2xl min-h-[400px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
             <div className="bg-white p-2.5 rounded-2xl shadow-xl transform rotate-12"><span className="text-3xl">⚡</span></div>
             <span className="text-xl font-black tracking-widest uppercase">KUBWA CONNECT</span>
          </div>
          
          <div className="h-24 mb-6">
             <h1 key={heroIndex} className="text-3xl font-black leading-none tracking-tighter animate-fade-in uppercase">
               {heroMessages[heroIndex]}
             </h1>
          </div>
          
          <div className="bg-white rounded-3xl p-3 shadow-2xl flex flex-col gap-3">
             <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl">
                <Search className="text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="What are you looking for?" 
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm font-black focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
             </div>
             <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2">
                   <MapPin size={16} className="text-kubwa-orange" />
                   <select 
                     className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-900 outline-none w-full appearance-none"
                     value={searchLocation}
                     onChange={(e) => setSearchLocation(e.target.value)}
                   >
                      {['All Kubwa', ...KUBWA_AREAS].map(loc => <option key={loc}>{loc}</option>)}
                   </select>
                </div>
                <Button onClick={handleSearch} className="px-8 shadow-none h-12">Search</Button>
             </div>
          </div>
        </div>
      </div>

      {visibleAnnouncement && (
        <div className="mx-6 -mt-6 relative z-20 bg-gray-900 text-white rounded-3xl shadow-2xl p-4 flex justify-between items-center animate-slide-in-bottom">
           <div className="flex items-center gap-4">
              <div className="bg-kubwa-orange p-2.5 rounded-2xl"><Bell size={18} className="text-white" /></div>
              <div>
                 <h4 className="text-xs font-black uppercase tracking-widest">{visibleAnnouncement.title}</h4>
                 <p className="text-[10px] text-white/60 line-clamp-1">{visibleAnnouncement.message}</p>
              </div>
           </div>
           <button onClick={() => setVisibleAnnouncement(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={18} /></button>
        </div>
      )}

      {/* Featured Merchants Carousel */}
      {featuredVendors.length > 0 && (
        <div className="mt-12 px-6">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Crown className="text-yellow-500 fill-yellow-500" size={18} />
                <h3 className="text-lg font-black tracking-tight text-gray-900 uppercase">Featured Merchants</h3>
              </div>
              <Sparkles className="text-yellow-400 animate-pulse" size={16} />
           </div>
           
           <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              {featuredVendors.map((vendor) => (
                <div key={vendor.id} className="flex flex-col items-center shrink-0 w-24 group cursor-pointer" onClick={() => setSection(AppSection.MART)}>
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-yellow-400 to-orange-500 p-0.5 shadow-xl transition-transform group-hover:scale-110">
                      <div className="w-full h-full rounded-[1.9rem] overflow-hidden bg-white">
                        <img src={vendor.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white p-1.5 rounded-xl border-2 border-white shadow-lg">
                      <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight text-center truncate w-full">
                    {vendor.storeName || vendor.name}
                  </span>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Main Categories Grid */}
      <div className="px-6 mt-12 grid grid-cols-3 gap-4">
         {[
           { section: AppSection.MART, icon: ShoppingBag, label: 'Mart', color: 'bg-green-50 text-green-600', border: 'border-green-100' },
           { section: AppSection.FIXIT, icon: Wrench, label: 'FixIt', color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
           { section: AppSection.RIDE, icon: Truck, label: 'Ride', color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' }
         ].map((cat) => (
           <button 
            key={cat.label}
            onClick={() => setSection(cat.section)} 
            className={`${cat.color} ${cat.border} p-5 rounded-[2rem] border-2 flex flex-col items-center gap-3 hover:scale-105 transition-all group`}
           >
              <div className="bg-white p-3.5 rounded-2xl shadow-sm group-hover:shadow-md transition-all"><cat.icon size={24} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
           </button>
         ))}
      </div>

      {/* Role CTA Section */}
      <div className="px-6 mt-12">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black tracking-tight text-gray-900 uppercase">Start Earning</h3>
         </div>
         <div className="grid grid-cols-3 gap-3">
            {(['VENDOR', 'PROVIDER', 'RIDER'] as const).map(role => {
              const opt = UPGRADE_OPTIONS[role];
              return (
                <div
                  key={role}
                  onClick={() => handleRoleAction(role)}
                  className="bg-gray-50 border border-gray-100 p-4 rounded-[1.75rem] relative overflow-hidden cursor-pointer group hover:bg-white hover:shadow-xl transition-all"
                >
                   <opt.icon size={24} className={`${opt.color} mb-2 group-hover:scale-110 transition-transform`} />
                   <h4 className="font-black text-[10px] uppercase tracking-tight leading-tight">{opt.title}</h4>
                   <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">{opt.sub}</p>
                </div>
              );
            })}
         </div>
      </div>

      {/* Trending Products */}
      <div className="px-6 mt-12">
         <div className="flex justify-between items-end mb-6">
            <div>
               <h3 className="text-lg font-black tracking-tight text-gray-900 uppercase">MART DEALS</h3>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fresh Today</p>
            </div>
            <button onClick={() => setSection(AppSection.MART)} className="text-[10px] font-black text-kubwa-green uppercase tracking-widest flex items-center gap-1">View All <ChevronRight size={14}/></button>
         </div>
         
         <div className="grid grid-cols-2 gap-4">
            {recentProducts.map(product => (
               <div key={product.id} onClick={() => setSection(AppSection.MART)} className="cursor-pointer group">
                  <div className="h-40 bg-gray-100 rounded-3xl overflow-hidden mb-3">
                     <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt=""/>
                  </div>
                  <h4 className="text-xs font-black text-gray-900 px-1">{product.name}</h4>
                  <p className="text-sm font-black text-kubwa-green px-1 mt-1">₦{product.price.toLocaleString()}</p>
               </div>
            ))}
         </div>
      </div>

      <Sheet isOpen={!!upgradeTarget} onClose={() => setUpgradeTarget(null)} title={upgradeSubmitted ? 'Request Submitted' : upgradeTarget?.title}>
        {upgradeTarget && (
          <div className="p-6 pb-8">
            {upgradeSubmitted ? (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-kubwa-green/10 text-kubwa-green rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <CheckCircle size={36} />
                </div>
                <p className="text-sm font-bold text-gray-600 leading-relaxed mb-8">
                  Your application is in for review. We'll let you know as soon as it's approved.
                </p>
                <Button className="w-full h-14" onClick={() => setUpgradeTarget(null)}>DONE</Button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mb-5">
                   <upgradeTarget.icon size={28} className="text-gray-700" />
                </div>
                <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">{upgradeTarget.desc}</p>
                <Button className="w-full h-14" onClick={handleConfirmUpgrade} disabled={requestingUpgrade}>
                   {requestingUpgrade ? <Loader2 className="animate-spin" /> : 'SUBMIT APPLICATION'}
                </Button>
              </>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default Home;
