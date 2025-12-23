
import React, { useState, useEffect } from 'react';
import { Search, Star, CheckCircle, Loader2, Settings, Power, X, Briefcase, Award, Clock, Activity, MessageCircle, Crown, Filter, Wrench, MapPin, Share2, ShieldCheck, Calendar, Edit2, AlertTriangle, Minus, Plus, ChevronRight, User, Image as ImageIcon, Trash2, Camera, Upload, CheckSquare, Check, Shield } from 'lucide-react';
import { api, KUBWA_AREAS, FIXIT_SERVICES } from '../services/data';
import { ServiceProvider, User as UserType, Review, AppSection, WorkDay } from '../types';
import { Button, Card, Badge, Breadcrumbs, Select, Input } from '../components/ui';
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

  const [showFilter, setShowFilter] = useState(false);
  const [filterRate, setFilterRate] = useState<'any'|'low'|'high'>('any');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterLocation, setFilterLocation] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance'|'rating'|'priceAsc'|'priceDesc'>('relevance');

  const [myProfile, setMyProfile] = useState<ServiceProvider | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState<WorkDay[]>([]);
  const [editProfileForm, setEditProfileForm] = useState({
      bio: '',
      rate: '',
      skills: [] as string[],
      portfolio: [] as string[]
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
        if (profile) {
            setEditProfileForm({
                bio: profile.bio || '',
                rate: profile.rate.toString(),
                skills: profile.skills || [],
                portfolio: profile.portfolio || []
            });
        }
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

  const handleContactClick = (provider: ServiceProvider) => {
    if (!user) {
      setPendingActionProvider(provider);
      setPendingIntent('chat');
      setShowAuthModal(true);
    } else {
      if (onChat) onChat(`new_chat_${provider.id}`);
    }
  };

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

  const handleHireClick = () => {
    if (!user) { setPendingActionProvider(selectedProvider); setPendingIntent('hire'); setShowAuthModal(true); return; }
    if (!selectedProvider) return;
    setBookingServiceType(selectedProvider.category + ' Service'); 
    setBookingTimeMode('ASAP');
    setEstimatedDuration(1);
    setShowConfirmHire(true);
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedProvider) return;
    setIsBooking(true);
    const result = await api.providers.requestService(user.id, selectedProvider.id, selectedProvider.rate * estimatedDuration, bookingServiceType, new Date().toISOString());
    if (result) {
      setShowConfirmHire(false);
      setBookingConfirmation(true);
      setTimeout(() => { setBookingConfirmation(false); setSelectedProvider(null); setIsBooking(false); }, 2500);
    } else { alert("Booking failed."); setIsBooking(false); }
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

  const handleSaveProfile = async () => {
      if (!myProfile) return;
      setIsSavingProfile(true);
      const updates: Partial<ServiceProvider> = { bio: editProfileForm.bio, rate: parseInt(editProfileForm.rate), skills: editProfileForm.skills, portfolio: editProfileForm.portfolio };
      const success = await api.providers.updateProviderProfile(myProfile.id, updates);
      if (success) {
          setMyProfile({ ...myProfile, ...updates });
          setShowEditProfileModal(false);
          setProviders(prev => prev.map(p => p.id === myProfile.id ? { ...p, ...updates } : p));
          alert("Profile updated!");
      }
      setIsSavingProfile(false);
  };

  const getProviderStatus = (isAvailable: boolean, schedule?: WorkDay[]) => {
    if (!isAvailable) return { status: 'Offline', color: 'text-gray-500 bg-gray-100 border-gray-200' };
    return { status: 'Online', color: 'text-green-600 bg-green-50 border-green-200' };
  };

  const categories = ['All', ...FIXIT_SERVICES];
  const locations = ['All', ...KUBWA_AREAS];

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesRate = filterRate === 'any' ? true : filterRate === 'low' ? p.rate <= 5000 : p.rate > 5000;
    const matchesAvail = filterAvailable ? p.available : true;
    const matchesVerified = filterVerified ? p.isVerified : true;
    const matchesLocation = filterLocation === 'All' || p.location === filterLocation;
    return matchesSearch && matchesCategory && matchesRate && matchesAvail && matchesVerified && matchesLocation;
  }).sort((a, b) => {
     if (a.isFeatured && !b.isFeatured) return -1;
     if (a.isPremium && !b.isPremium) return -1;
     return 0;
  });

  if (user?.role === 'PROVIDER' && user?.status === 'PENDING') {
      return (
        <div className="pb-24 pt-4 px-4 relative">
            <Breadcrumbs items={[{ label: 'Home', onClick: () => setSection(AppSection.HOME) }, { label: 'FixIt' }]} />
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck size={40} className="text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Under Review</h2>
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Thanks for applying to be a Fixit Pro! Our admin team is verifying your details. 
                    You will be notified once your profile is approved.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl mt-8 w-full max-w-sm text-left shadow-sm border">
                    <h4 className="font-bold text-sm text-gray-700 mb-2 border-b pb-1">Reviewing Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between"><span>Name</span><span className="font-bold text-gray-900">{user.name}</span></div>
                        <div className="flex justify-between"><span>Status</span><span className="text-orange-600 font-bold uppercase text-[10px] bg-orange-100 px-2 py-0.5 rounded">Pending Approval</span></div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="pb-24 pt-4 px-4 relative">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => setSection(AppSection.HOME) }, { label: 'FixIt' }]} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} providerName={selectedProvider?.name || 'this provider'} onSuccess={handleAuthSuccess} />}
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-kubwa-orange">FixIt Services</h2>
        <p className="text-gray-500 text-sm">Expert artisans in your neighborhood.</p>
      </div>

      <div className="flex gap-2 mb-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search for artisans..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-kubwa-orange/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
         </div>
         <button onClick={() => setShowFilter(!showFilter)} className={`px-3 rounded-xl border flex items-center justify-center transition-colors ${(showFilter || filterLocation !== 'All') ? 'bg-kubwa-orange text-white border-kubwa-orange' : 'bg-white border-gray-200 text-gray-600'}`}><Filter size={20} /></button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-kubwa-orange text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{cat}</button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-kubwa-orange" size={32} /></div>
        ) : (
          filteredProviders.map(provider => {
            const { status, color } = getProviderStatus(provider.available, provider.schedule);
            return (
            <Card key={provider.id} className="flex gap-4 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden" onClick={() => setSelectedProvider(provider)}>
              <img src={provider.image} alt={provider.name} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-1.5">{provider.name} {provider.isVerified && <Shield size={12} className="text-blue-500 fill-blue-500" />}</h3>
                    <p className="text-sm text-gray-500">{provider.category}</p>
                    {provider.location && <p className="text-[10px] text-gray-400 flex items-center"><MapPin size={10}/> {provider.location}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>{status}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Star size={12} className="fill-yellow-400 text-yellow-400" /> {provider.rating}</span>
                  <span className="flex items-center gap-1"><Briefcase size={12}/> {provider.jobsCompleted || 0} jobs</span>
                </div>
              </div>
            </Card>
            );
          })
        )}
      </div>

      {selectedProvider && !showConfirmHire && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden animate-slide-in-bottom relative">
             <button onClick={() => setSelectedProvider(null)} className="absolute top-4 right-4 z-10 bg-black/30 text-white p-2 rounded-full"><X size={20} /></button>
             <div className="h-32 bg-gray-100 overflow-hidden relative">
                <img src={selectedProvider.image} alt={selectedProvider.name} className="w-full h-full object-cover blur-sm opacity-50" />
                <div className="absolute -bottom-10 left-6"><img src={selectedProvider.image} alt={selectedProvider.name} className="w-20 h-20 rounded-full border-4 border-white object-cover" /></div>
             </div>
             <div className="pt-12 px-6 pb-6 flex-1 overflow-y-auto">
                <h2 className="text-xl font-bold flex items-center gap-2">{selectedProvider.name} {selectedProvider.isVerified && <Shield size={16} className="text-blue-500 fill-blue-500" />}</h2>
                <p className="text-gray-500 mb-4">{selectedProvider.category}</p>
                <div className="mb-6 bg-gray-50 p-3 rounded-lg border text-sm text-gray-600">"{selectedProvider.bio || 'No bio provided.'}"</div>
                <div className="space-y-2">
                   <h4 className="text-xs font-bold text-gray-400 uppercase">Service Skills</h4>
                   <div className="flex flex-wrap gap-2">
                      {selectedProvider.skills?.map(s => <span key={s} className="bg-white border px-2 py-1 rounded text-xs text-gray-700">{s}</span>)}
                   </div>
                </div>
             </div>
             <div className="p-4 border-t bg-gray-50 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => handleContactClick(selectedProvider)}><MessageCircle size={18} className="mr-2" /> Chat</Button>
                <Button className="flex-[2] bg-kubwa-orange hover:bg-orange-600" onClick={handleHireClick} disabled={!selectedProvider.available}>{selectedProvider.available ? 'Hire Now' : 'Currently Unavailable'}</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixIt;
