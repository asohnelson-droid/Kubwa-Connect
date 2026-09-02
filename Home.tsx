

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Wrench, Truck, Store, Bike, Search, MapPin, Bell, X, Star, Crown, Briefcase, Loader2, CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import { AppSection, UserRole, User as UserType, Announcement, Product } from '../types';
import { Button, Sheet, SafeImage, SectionHeader } from '../components/ui';
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
    "Find trusted artisans in Kubwa, in minutes.",
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

  const UPGRADE_OPTIONS: Record<'VENDOR' | 'PROVIDER' | 'RIDER', { section: AppSection; title: string; sub: string; desc: string; icon: React.ElementType; color: string; bg: string }> = {
    VENDOR: { section: AppSection.MART, title: 'Become a Vendor', sub: 'Sell to Kubwa', desc: "Sell your products to residents across Kubwa. Your application will be reviewed before your shop goes live.", icon: Store, color: 'text-kubwa-mart', bg: 'bg-kubwa-mart/10' },
    PROVIDER: { section: AppSection.FIXIT, title: 'Hire out Skills', sub: 'Find FixIt jobs', desc: "Offer repairs and home services through FixIt. Your application will be reviewed before you can start receiving bookings.", icon: Briefcase, color: 'text-kubwa-fixit', bg: 'bg-kubwa-fixit/10' },
    RIDER: { section: AppSection.RIDE, title: 'Become a Rider', sub: 'Deliver & earn', desc: "Deliver orders across Kubwa and earn. Your application will be reviewed before you can start accepting jobs.", icon: Bike, color: 'text-kubwa-ride', bg: 'bg-kubwa-ride/10' },
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
      <div className="bg-gradient-to-br from-kubwa-primary to-kubwa-primaryDark text-white rounded-b-[2.5rem] p-8 pt-16 relative overflow-hidden shadow-2xl min-h-[400px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
             <div className="bg-white p-2.5 rounded-2xl shadow-xl transform -rotate-6"><Zap size={22} className="text-kubwa-primary fill-kubwa-primary" /></div>
             <span className="font-display text-lg font-bold tracking-tight">Kubwa Connect</span>
          </div>

          <div className="min-h-[4.5rem] mb-6">
             <h1 key={heroIndex} className="font-display text-[1.75rem] leading-[1.15] font-bold animate-fade-in">
               {heroMessages[heroIndex]}
             </h1>
          </div>

          <div className="bg-white rounded-3xl p-3 shadow-2xl flex flex-col gap-3">
             <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl">
                <Search className="text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="flex-1 bg-transparent text-kubwa-ink placeholder-gray-400 text-sm font-semibold focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
             </div>
             <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 min-w-0">
                   <MapPin size={16} className="text-kubwa-primary shrink-0" />
                   <select
                     className="bg-transparent text-xs font-bold text-kubwa-ink outline-none w-full appearance-none truncate"
                     value={searchLocation}
                     onChange={(e) => setSearchLocation(e.target.value)}
                   >
                      {['All Kubwa', ...KUBWA_AREAS].map(loc => <option key={loc}>{loc}</option>)}
                   </select>
                </div>
                <Button onClick={handleSearch} className="px-8 shadow-none h-12 shrink-0">Search</Button>
             </div>
          </div>
        </div>
      </div>

      {visibleAnnouncement && (
        <div className="mx-6 -mt-6 relative z-20 bg-kubwa-ink text-white rounded-3xl shadow-2xl p-4 flex justify-between items-center animate-slide-in-bottom">
           <div className="flex items-center gap-4 min-w-0">
              <div className="bg-kubwa-fixit p-2.5 rounded-2xl shrink-0"><Bell size={18} className="text-white" /></div>
              <div className="min-w-0">
                 <h4 className="text-xs font-bold truncate">{visibleAnnouncement.title}</h4>
                 <p className="text-[11px] text-white/60 line-clamp-1">{visibleAnnouncement.message}</p>
              </div>
           </div>
           <button onClick={() => setVisibleAnnouncement(null)} className="p-1 hover:bg-white/10 rounded-full shrink-0"><X size={18} /></button>
        </div>
      )}

      {/* Featured Merchants Carousel */}
      {featuredVendors.length > 0 && (
        <div className="mt-10 px-6">
           <SectionHeader
              title="Featured Merchants"
              subtitle="Top-rated shops and services this week"
              icon={<Crown className="text-kubwa-amber fill-kubwa-amber" size={18} />}
           />

           <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
              {featuredVendors.map((vendor) => (
                <div key={vendor.id} className="flex flex-col items-center shrink-0 w-24 group cursor-pointer" onClick={() => setSection(AppSection.MART)}>
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-[1.75rem] ring-2 ring-kubwa-amber/40 group-hover:ring-kubwa-amber transition-all overflow-hidden bg-gray-100 shadow-sm">
                      <SafeImage src={vendor.avatar} alt="" className="w-full h-full object-cover" fallbackIcon={<Store size={24} strokeWidth={1.5} />} />
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 bg-white text-kubwa-mart p-1 rounded-full border-2 border-white shadow-md">
                      <ShieldCheck size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-kubwa-ink text-center truncate w-full">
                    {vendor.storeName || vendor.name}
                  </span>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Main Categories Grid */}
      <div className="px-6 mt-10 grid grid-cols-3 gap-4">
         {[
           { section: AppSection.MART, icon: ShoppingBag, label: 'Mart', color: 'bg-kubwa-mart/10 text-kubwa-mart', border: 'border-kubwa-mart/15' },
           { section: AppSection.FIXIT, icon: Wrench, label: 'FixIt', color: 'bg-kubwa-fixit/10 text-kubwa-fixit', border: 'border-kubwa-fixit/15' },
           { section: AppSection.RIDE, icon: Truck, label: 'Ride', color: 'bg-kubwa-ride/10 text-kubwa-ride', border: 'border-kubwa-ride/15' }
         ].map((cat) => (
           <button
            key={cat.label}
            onClick={() => setSection(cat.section)}
            className={`${cat.color} ${cat.border} p-5 rounded-[1.75rem] border-2 flex flex-col items-center gap-3 hover:scale-[1.03] active:scale-[0.98] transition-all group`}
           >
              <div className="bg-white p-3.5 rounded-2xl shadow-sm group-hover:shadow-md transition-all"><cat.icon size={22} /></div>
              <span className="text-xs font-bold">{cat.label}</span>
           </button>
         ))}
      </div>

      {/* Role CTA Section */}
      <div className="px-6 mt-10">
         <SectionHeader title="Start Earning" subtitle="Turn your skills or shop into income" />
         <div className="grid grid-cols-3 gap-3">
            {(['VENDOR', 'PROVIDER', 'RIDER'] as const).map(role => {
              const opt = UPGRADE_OPTIONS[role];
              return (
                <div
                  key={role}
                  onClick={() => handleRoleAction(role)}
                  className="bg-gray-50 border border-gray-100 p-4 rounded-[1.5rem] relative overflow-hidden cursor-pointer group hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${opt.bg}`}>
                     <opt.icon size={18} className={opt.color} />
                   </div>
                   <h4 className="font-bold text-[11px] leading-tight text-kubwa-ink">{opt.title}</h4>
                   <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{opt.sub}</p>
                </div>
              );
            })}
         </div>
      </div>

      {/* Trending Products */}
      <div className="px-6 mt-10">
         <SectionHeader
            title="Mart Deals"
            subtitle="Fresh listings from local vendors today"
            action={{ label: 'View all', onClick: () => setSection(AppSection.MART) }}
         />

         <div className="grid grid-cols-2 gap-4">
            {recentProducts.map(product => (
               <div key={product.id} onClick={() => setSection(AppSection.MART)} className="cursor-pointer group">
                  <div className="h-40 rounded-2xl overflow-hidden mb-3">
                     <SafeImage src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.name} />
                  </div>
                  <h4 className="text-xs font-bold text-kubwa-ink px-1 truncate">{product.name}</h4>
                  <p className="text-sm font-bold text-kubwa-mart px-1 mt-0.5">₦{product.price.toLocaleString()}</p>
               </div>
            ))}
         </div>
      </div>

      <Sheet isOpen={!!upgradeTarget} onClose={() => setUpgradeTarget(null)} title={upgradeSubmitted ? 'Request Submitted' : upgradeTarget?.title}>
        {upgradeTarget && (
          <div className="p-6 pb-8">
            {upgradeSubmitted ? (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-kubwa-mart/10 text-kubwa-mart rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <CheckCircle size={36} />
                </div>
                <p className="text-sm font-semibold text-gray-600 leading-relaxed mb-8">
                  Your application is in for review. We'll let you know as soon as it's approved.
                </p>
                <Button className="w-full h-14" onClick={() => setUpgradeTarget(null)}>Done</Button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mb-5">
                   <upgradeTarget.icon size={28} className="text-gray-700" />
                </div>
                <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">{upgradeTarget.desc}</p>
                <Button className="w-full h-14" onClick={handleConfirmUpgrade} disabled={requestingUpgrade}>
                   {requestingUpgrade ? <Loader2 className="animate-spin" /> : 'Submit Application'}
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
