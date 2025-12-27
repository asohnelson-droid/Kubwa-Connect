
import React, { useState, useEffect } from 'react';
import { Search, Star, Loader2, Power, X, Briefcase, MapPin, MessageCircle, Shield, Wrench, Edit2, Plus, Minus, ChevronRight } from 'lucide-react';
import { api, KUBWA_AREAS, FIXIT_SERVICES } from '../services/data';
import { ServiceProvider, User as UserType, Review, AppSection } from '../types';
import { Button, Card, Badge, Breadcrumbs, Input } from '../components/ui';
import AuthModal from '../components/AuthModal';

interface FixItProps {
  user: UserType | null;
  onRequireAuth: () => void;
  onChat?: (orderId: string) => void;
  setSection: (section: AppSection) => void;
  refreshUser: () => void;
}

const FixIt: React.FC<FixItProps> = ({ user, onRequireAuth, onChat, setSection, refreshUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null); 
  const [providerReviews, setProviderReviews] = useState<Review[]>([]);
  const [bookingConfirmation, setBookingConfirmation] = useState(false); 
  const [showConfirmHire, setShowConfirmHire] = useState(false); 
  const [bookingServiceType, setBookingServiceType] = useState('Standard Service'); 
  
  const [bookingTimeMode, setBookingTimeMode] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  
  const [estimatedDuration, setEstimatedDuration] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterRate, setFilterRate] = useState<'any'|'low'|'high'>('any');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterLocation, setFilterLocation] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance'|'rating'|'priceAsc'|'priceDesc'>('relevance');

  const [myProfile, setMyProfile] = useState<ServiceProvider | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingActionProvider, setPendingActionProvider] = useState<ServiceProvider | null>(null);
  const [pendingIntent, setPendingIntent] = useState<'chat' | 'hire' | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await api.getProviders();
      setProviders(data);

      if (user && user.role === 'PROVIDER') {
        const profile = await api.providers.getMyProfile(user.id);
        setMyProfile(profile);
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedProvider) {
       api.reviews.getByTarget(selectedProvider.id).then(setProviderReviews);
    }
  }, [selectedProvider]);

  const handleAuthSuccess = () => {
    refreshUser();
    if (pendingActionProvider) {
       setTimeout(() => {
         if (pendingIntent === 'chat' && onChat) onChat(`new_chat_${pendingActionProvider.id}`);
         else if (pendingIntent === 'hire') { setSelectedProvider(pendingActionProvider); setShowConfirmHire(true); }
         setPendingActionProvider(null);
         setPendingIntent(null);
       }, 500);
    }
  };

  const handleToggleStatus = async () => {
    if (!myProfile) return;
    setTogglingStatus(true);
    const newStatus = !myProfile.available;
    const success = await api.providers.updateStatus(myProfile.id, newStatus);
    if (success) {
      setMyProfile({ ...myProfile, available: newStatus });
      setProviders(prev => prev.map(p => p.id === myProfile.id ? { ...p, available: newStatus } : p));
    }
    setTogglingStatus(false);
  };

  const categories = ['All', ...FIXIT_SERVICES];
  
  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesRate = filterRate === 'any' ? true : filterRate === 'low' ? p.rate <= 5000 : p.rate > 5000;
    const matchesAvail = filterAvailable ? p.available : true;
    const matchesVerified = filterVerified ? p.isVerified : true;
    const matchesLocation = filterLocation === 'All' || p.location === filterLocation;
    return matchesSearch && matchesCategory && matchesRate && matchesAvail && matchesVerified && matchesLocation;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'priceAsc') return a.rate - b.rate;
    if (sortBy === 'priceDesc') return b.rate - a.rate;
    return 0;
  });

  return (
    <div className="pb-24 pt-4 px-4">
      <Breadcrumbs items={[
        { label: 'Home', onClick: () => setSection(AppSection.HOME) },
        { label: 'FixIt' }
      ]} />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">FIXIT SERVICES</h2>
        {myProfile && (
           <button 
             onClick={handleToggleStatus}
             disabled={togglingStatus}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black transition-all ${myProfile.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
           >
             <Power size={14} /> {myProfile.available ? 'Online' : 'Offline'}
           </button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="What do you need fixed?" 
          className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-kubwa-green/20 outline-none font-bold" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)} 
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap ${selectedCategory === cat ? 'bg-kubwa-orange text-white border-kubwa-orange shadow-md' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-kubwa-green" /></div> : 
          filteredProviders.length === 0 ? <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-sm">No providers found</div> :
          filteredProviders.map(provider => (
            <Card key={provider.id} className="p-4 flex gap-4 hover:shadow-lg transition-all cursor-pointer border-none shadow-sm" onClick={() => setSelectedProvider(provider)}>
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                <img src={provider.image} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-gray-900">{provider.name}</h3>
                    <p className="text-[10px] font-black text-kubwa-orange uppercase tracking-widest">{provider.category}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" /> {provider.rating}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                   <span className="text-sm font-black text-gray-900">₦{provider.rate.toLocaleString()}/hr</span>
                   <Badge color={provider.available ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}>
                     {provider.available ? 'Online' : 'Away'}
                   </Badge>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => { setShowAuthModal(false); setPendingActionProvider(null); setPendingIntent(null); }} 
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default FixIt;
