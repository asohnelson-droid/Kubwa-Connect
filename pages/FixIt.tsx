
import React, { useState, useEffect } from 'react';
// Added Check to the imports from lucide-react to fix the "Cannot find name 'Check'" error on line 740
import { Search, Star, CheckCircle, Loader2, Settings, Power, X, Briefcase, Award, Clock, Activity, MessageCircle, Crown, Filter, Wrench, MapPin, Share2, ShieldCheck, Calendar, Edit2, AlertTriangle, Minus, Plus, ChevronRight, User, Image as ImageIcon, Trash2, Camera, Upload, CheckSquare, Check } from 'lucide-react';
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
  
  // Modals
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null); // For Profile View
  const [providerReviews, setProviderReviews] = useState<Review[]>([]);
  const [bookingConfirmation, setBookingConfirmation] = useState(false); // For Success State
  const [showConfirmHire, setShowConfirmHire] = useState(false); // For Confirmation Step
  const [bookingServiceType, setBookingServiceType] = useState('Standard Service'); // New: Service Type Selection
  
  // Scheduling State
  const [bookingTimeMode, setBookingTimeMode] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  
  // Duration Estimation State
  const [estimatedDuration, setEstimatedDuration] = useState(1);
  
  const [isBooking, setIsBooking] = useState(false);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Modals
  const [showFilter, setShowFilter] = useState(false);
  const [filterRate, setFilterRate] = useState<'any'|'low'|'high'>('any');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterLocation, setFilterLocation] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance'|'rating'|'priceAsc'|'priceDesc'>('relevance');

  // Provider Self-Management State
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

  // Auth Gate for Guest Contact
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

  // Load reviews when provider is selected
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
         if (pendingIntent === 'chat' && onChat) {
            onChat(`new_chat_${pendingActionProvider.id}`);
         } else if (pendingIntent === 'hire') {
            setSelectedProvider(pendingActionProvider);
            setShowConfirmHire(true);
         }
         setPendingActionProvider(null);
         setPendingIntent(null);
       }, 500);
    }
  };

  const handleHireClick = () => {
    if (!user) {
      setPendingActionProvider(selectedProvider);
      setPendingIntent('hire');
      setShowAuthModal(true);
      return;
    }
    if (!selectedProvider) return;
    setBookingServiceType(selectedProvider.category + ' Service'); 
    setBookingTimeMode('ASAP');
    setEstimatedDuration(1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
    setBookingTime('09:00');
    
    setShowConfirmHire(true);
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedProvider) return;

    if (bookingTimeMode === 'SCHEDULED' && (!bookingDate || !bookingTime)) {
        alert("Please select both a date and time for your scheduled booking.");
        return;
    }

    setIsBooking(true);
    
    let finalDate = new Date().toISOString();
    if (bookingTimeMode === 'SCHEDULED' && bookingDate && bookingTime) {
        finalDate = new Date(`${bookingDate}T${bookingTime}`).toISOString();
    }
    
    const estimatedCost = selectedProvider.rate * estimatedDuration;

    const result = await api.providers.requestService(user.id, selectedProvider.id, estimatedCost, bookingServiceType, finalDate);
    
    if (result) {
      setShowConfirmHire(false);
      setBookingConfirmation(true);
      setTimeout(() => {
        setBookingConfirmation(false);
        setSelectedProvider(null);
        setIsBooking(false);
      }, 2500);
    } else {
      alert("Booking failed. Please try again.");
      setIsBooking(false);
      setShowConfirmHire(false);
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

  const openScheduleEditor = () => {
    if (myProfile?.schedule) {
      setEditSchedule([...myProfile.schedule]);
    } else {
        // Init default schedule
        const days: WorkDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({
            day: d as any,
            start: '09:00',
            end: '18:00',
            isOpen: d !== 'Sun'
        }));
        setEditSchedule(days);
    }
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!myProfile) return;
    const success = await api.providers.updateSchedule(myProfile.id, editSchedule);
    if (success) {
      setMyProfile({ ...myProfile, schedule: editSchedule });
      setShowScheduleModal(false);
      alert("Schedule updated successfully!");
    } else {
      alert("Failed to update schedule.");
    }
  };

  const handleSaveProfile = async () => {
      if (!myProfile) return;
      setIsSavingProfile(true);
      
      const updates: Partial<ServiceProvider> = {
          bio: editProfileForm.bio,
          rate: parseInt(editProfileForm.rate),
          skills: editProfileForm.skills,
          portfolio: editProfileForm.portfolio
      };

      const success = await api.providers.updateProviderProfile(myProfile.id, updates);
      
      if (success) {
          setMyProfile({ ...myProfile, ...updates });
          setShowEditProfileModal(false);
          // Update the public list locally
          setProviders(prev => prev.map(p => p.id === myProfile.id ? { ...p, ...updates } : p));
          alert("Profile updated successfully!");
      } else {
          alert("Failed to update profile.");
      }
      setIsSavingProfile(false);
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditProfileForm(prev => ({
                  ...prev,
                  portfolio: [...prev.portfolio, reader.result as string].slice(0, 5) // Max 5
              }));
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const removePortfolioItem = (index: number) => {
      setEditProfileForm(prev => ({
          ...prev,
          portfolio: prev.portfolio.filter((_, i) => i !== index)
      }));
  };

  const toggleSkill = (skill: string) => {
      setEditProfileForm(prev => {
          const has = prev.skills.includes(skill);
          return {
              ...prev,
              skills: has ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
          };
      });
  };

  const handleShare = (provider: ServiceProvider) => {
    api.shareContent(provider.name, `Hire ${provider.name} (${provider.category}) on Kubwa Connect! Rate: ₦${provider.rate}/hr`);
  };

  const getProviderStatus = (isAvailable: boolean, schedule?: WorkDay[]) => {
    if (!isAvailable) {
      return { status: 'Offline', color: 'text-gray-500 bg-gray-100 border-gray-200' };
    }
    if (!schedule) {
       return { status: 'Online', color: 'text-green-600 bg-green-50 border-green-200' };
    }
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = days[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const todaySchedule = schedule.find(s => s.day === currentDay);
    if (!todaySchedule || !todaySchedule.isOpen) {
       return { status: 'Closed Today', color: 'text-red-600 bg-red-50 border-red-200' };
    }
    if (currentTime >= todaySchedule.start && currentTime <= todaySchedule.end) {
      return { status: `Open until ${todaySchedule.end}`, color: 'text-green-600 bg-green-50 border-green-200' };
    }
    return { status: 'Closed Now', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  const categories = ['All', 'Plumbing', 'Electrician', 'Cleaning', 'Tailor', 'Home Tutor', 'Makeup Artist', 'Carpenter', 'AC Repair'];
  const locations = ['All', ...KUBWA_AREAS];

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
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
     if (a.isFeatured && !b.isFeatured) return -1;
     if (!a.isFeatured && b.isFeatured) return 1;
     if (a.available && !b.available) return -1;
     if (!a.available && b.available) return 1;
     if (a.isPremium && !b.isPremium) return -1;
     if (!a.isPremium && b.isPremium) return 1;
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
                    You will be notified once your profile is approved and visible to customers.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl mt-8 w-full max-w-sm text-left">
                    <h4 className="font-bold text-sm text-gray-700 mb-2">Submitted Details</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between border-b pb-2">
                            <span>Name</span>
                            <span className="font-medium">{user.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span>Phone</span>
                            <span className="font-medium">{user.phoneNumber || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="pb-24 pt-4 px-4 relative">
      <Breadcrumbs items={[
        { label: 'Home', onClick: () => setSection(AppSection.HOME) },
        { label: 'FixIt', onClick: () => setSelectedCategory('All') },
        ...(selectedCategory !== 'All' ? [{ label: selectedCategory }] : [])
      ]} />
      
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          providerName={selectedProvider?.name || pendingActionProvider?.name || 'this provider'} 
          onSuccess={handleAuthSuccess}
        />
      )}

      {user?.role === 'PROVIDER' && user?.status === 'ACTIVE' && myProfile && (
        <Card className="mb-8 border-kubwa-orange border-l-4 bg-orange-50/50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Settings size={18} /> My Pro Dashboard
            </h3>
            <div className="flex items-center gap-2">
                <button 
                   onClick={() => setShowEditProfileModal(true)}
                   className="p-1.5 bg-white border border-gray-200 rounded text-gray-600 hover:text-kubwa-orange"
                   title="Edit Profile"
                >
                   <Edit2 size={16} />
                </button>
                <Badge color={myProfile.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                {myProfile.available ? 'Online' : 'Offline'}
                </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
             <span className="text-sm text-gray-600">
               {myProfile.available 
                 ? "You are visible to clients." 
                 : "You are currently hidden from new bookings."}
             </span>
             <button 
               onClick={handleToggleStatus}
               disabled={togglingStatus}
               className={`w-12 h-6 rounded-full p-1 transition-colors relative ${myProfile.available ? 'bg-green-500' : 'bg-gray-300'}`}
             >
               <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${myProfile.available ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-orange-200">
             <div>
               <p className="text-xs text-gray-500 uppercase font-bold">Total Earnings</p>
               <p className="text-xl font-bold text-gray-900">₦{(myProfile.earnings || 0).toLocaleString()}</p>
             </div>
             <div className="flex items-center justify-end gap-2">
               <Button onClick={openScheduleEditor} variant="outline" className="py-1.5 px-3 text-xs flex items-center gap-1 bg-white">
                 <Calendar size={14} /> Schedule
               </Button>
               <Button className="py-1.5 px-3 text-xs" variant="secondary">Withdraw</Button>
             </div>
          </div>
        </Card>
      )}

      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-kubwa-orange">FixIt Services</h2>
          <p className="text-gray-500 text-sm">Expert artisans in your neighborhood.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search for artisans..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-kubwa-orange/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <button 
           onClick={() => setShowFilter(!showFilter)}
           className={`px-3 rounded-xl border flex items-center justify-center transition-colors ${
              (showFilter || filterLocation !== 'All' || filterRate !== 'any' || filterVerified) ? 'bg-kubwa-orange border-kubwa-orange text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
           }`}
        >
           <Filter size={20} />
        </button>
      </div>

      {showFilter && (
        <div className="bg-white p-4 rounded-xl shadow-lg border mb-4 animate-fade-in relative z-10">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Filter Services</h3>
              <button onClick={() => setShowFilter(false)}><X size={16} className="text-gray-400"/></button>
           </div>
           <div className="space-y-4">
             <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hourly Rate</label>
                <div className="flex gap-2">
                   {['any', 'low', 'high'].map((opt) => (
                      <button 
                        key={opt}
                        onClick={() => setFilterRate(opt as any)}
                        className={`flex-1 py-2 text-xs rounded border transition-all ${filterRate === opt ? 'bg-orange-100 border-orange-500 text-orange-800 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                      >
                         {opt === 'any' ? 'Any Price' : opt === 'low' ? '< ₦5k' : '> ₦5k'}
                      </button>
                   ))}
                </div>
             </div>
             <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Location</label>
                <Select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="py-2 text-sm bg-gray-50">
                   {locations.map(loc => (
                     <option key={loc} value={loc}>{loc}</option>
                   ))}
                </Select>
             </div>
             <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Sort By</label>
                <Select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="py-2 text-sm bg-gray-50">
                   <option value="relevance">Relevance (Default)</option>
                   <option value="rating">Highest Rated</option>
                   <option value="priceAsc">Price: Low to High</option>
                   <option value="priceDesc">Price: High to Low</option>
                </Select>
             </div>
             <div className="flex flex-col gap-2">
               <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded border border-gray-200">
                  <input type="checkbox" checked={filterAvailable} onChange={e => setFilterAvailable(e.target.checked)} className="rounded text-kubwa-orange" />
                  <span className="text-sm font-medium text-gray-700">Available Now</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded border border-gray-200">
                  <input type="checkbox" checked={filterVerified} onChange={e => setFilterVerified(e.target.checked)} className="rounded text-kubwa-orange" />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">Verified Only <ShieldCheck size={14} className="text-blue-500" /></span>
               </label>
             </div>
             <div className="flex gap-2 mt-4 pt-2 border-t">
                 <Button variant="outline" className="flex-1 py-2 text-xs" onClick={() => { setFilterRate('any'); setFilterLocation('All'); setFilterAvailable(false); setFilterVerified(false); setSortBy('relevance'); }}>Reset</Button>
                 <Button className="flex-[2] py-2 text-xs" variant="secondary" onClick={() => setShowFilter(false)}>Show Results</Button>
              </div>
           </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-kubwa-orange text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{cat}</button>
        ))}
      </div>

      {selectedCategory === 'All' && !searchTerm && (
        <div className="mb-6 animate-fade-in">
          <h3 className="font-bold text-gray-700 mb-3 text-sm">Service Categories</h3>
          <div className="grid grid-cols-3 gap-3">
             {categories.filter(c => c !== 'All').map(cat => (
               <div key={cat} onClick={() => setSelectedCategory(cat)} className="bg-gray-50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-kubwa-orange"><Wrench size={18} /></div>
                  <span className="text-xs font-bold text-gray-600 text-center leading-tight">{cat}</span>
               </div>
             ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-kubwa-orange" size={32} /></div>
        ) : (
          filteredProviders.map(provider => {
            const { status, color } = getProviderStatus(provider.available, provider.schedule);
            return (
            <Card key={provider.id} className={`flex gap-4 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden ${provider.isFeatured ? 'border-yellow-300 ring-1 ring-yellow-200 shadow-md' : provider.isPremium ? 'border-orange-200 ring-1 ring-orange-100' : ''}`} onClick={() => setSelectedProvider(provider)}>
              <img src={provider.image} alt={provider.name} className={`w-20 h-20 rounded-lg object-cover bg-gray-100 ${!provider.available ? 'grayscale' : ''}`} />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                      {provider.name} 
                      {provider.isVerified && (
                         <Badge color="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] px-1.5 py-0.5 flex items-center gap-1"><ShieldCheck size={10} /> Verified</Badge>
                      )}
                      {provider.isFeatured && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                      {provider.isPremium && <Crown size={12} className="text-orange-500 fill-orange-500" />}
                    </h3>
                    <div className="flex flex-col">
                       <p className="text-sm text-gray-500">{provider.category}</p>
                       {provider.location && <p className="text-[10px] text-gray-400 flex items-center"><MapPin size={10} className="mr-0.5"/> {provider.location}</p>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>{status}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Star size={12} className="fill-yellow-400 text-yellow-400" /> {provider.rating}</span>
                  <span className="flex items-center gap-1"><Briefcase size={12} className="text-gray-400"/> {provider.jobsCompleted || 0} jobs</span>
                </div>
                <div className="mt-3 flex justify-between items-center">
                   <span className="font-bold text-kubwa-orange">Starting at ₦{provider.rate.toLocaleString()}</span>
                   <Button variant="secondary" className="py-1 px-3 text-sm h-8" onClick={(e) => { e.stopPropagation(); setSelectedProvider(provider); }}>View Profile</Button>
                </div>
              </div>
            </Card>
            );
          })
        )}
        {!loading && filteredProviders.length === 0 && (
          <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed"><Search className="mx-auto mb-2 opacity-20" size={32} /> No providers found.</div>
        )}
      </div>

      {selectedProvider && !showConfirmHire && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden animate-slide-in-bottom relative">
             <div className="relative h-32 bg-gray-100">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button onClick={() => handleShare(selectedProvider)} className="bg-black/30 text-white p-2 rounded-full hover:bg-black/50 backdrop-blur-sm"><Share2 size={20} /></button>
                  <button onClick={() => { setSelectedProvider(null); setProviderReviews([]); }} className="bg-black/30 text-white p-2 rounded-full hover:bg-black/50 backdrop-blur-sm"><X size={20} /></button>
                </div>
                <img src={selectedProvider.image} alt={selectedProvider.name} className={`w-full h-full object-cover opacity-90 blur-sm ${!selectedProvider.available ? 'grayscale' : ''}`} />
                <div className="absolute -bottom-10 left-6"><img src={selectedProvider.image} alt={selectedProvider.name} className={`w-20 h-20 rounded-full border-4 border-white object-cover ${!selectedProvider.available ? 'grayscale' : ''}`} /></div>
             </div>
             <div className="pt-12 px-6 pb-6 flex-1 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">{selectedProvider.name} {selectedProvider.isVerified && <Badge color="bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 flex items-center gap-1"><ShieldCheck size={12} /> Verified</Badge>}</h2>
                    <p className="text-gray-500">{selectedProvider.category}</p>
                  </div>
                  <div className="text-right"><p className="text-xl font-bold text-kubwa-orange">₦{selectedProvider.rate.toLocaleString()}</p><p className="text-xs text-gray-400">per hour</p></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-6">
                   <div className="bg-gray-50 p-2 rounded-lg text-center"><p className="text-xs text-gray-400">Experience</p><p className="font-bold text-gray-800">{selectedProvider.experience || 'N/A'}</p></div>
                   <div className="bg-gray-50 p-2 rounded-lg text-center"><p className="text-xs text-gray-400">Response</p><p className="font-bold text-green-600">{selectedProvider.responseRate || 100}%</p></div>
                   <div className="bg-gray-50 p-2 rounded-lg text-center"><p className="text-xs text-gray-400">Avg. Reply</p><p className="font-bold">{selectedProvider.responseTime || '1 hr'}</p></div>
                </div>

                {selectedProvider.bio && (
                  <div className="mb-6"><h4 className="font-bold text-gray-800 mb-1 text-sm">About</h4><p className="text-sm text-gray-600 leading-relaxed">{selectedProvider.bio}</p></div>
                )}
                
                {selectedProvider.portfolio && selectedProvider.portfolio.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-2 text-sm">Portfolio</h4>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {selectedProvider.portfolio.map((img, i) => (
                            <img key={i} src={img} className="w-24 h-24 rounded-lg object-cover border" alt="Work" />
                        ))}
                    </div>
                  </div>
                )}

                {selectedProvider.skills && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-2 text-sm">Services Offered</h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedProvider.skills.map(skill => (
                            <span key={skill} className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs border border-orange-100">{skill}</span>
                        ))}
                    </div>
                  </div>
                )}

                <div>
                   <h4 className="font-bold text-gray-800 mb-3 text-sm">Reviews</h4>
                   {providerReviews.length > 0 ? (
                      <div className="space-y-3">
                         {providerReviews.map(r => (
                            <div key={r.id} className="text-sm border-b border-gray-100 pb-2">
                               <div className="flex justify-between mb-1">
                                  <span className="font-bold text-gray-700">{r.userName || 'Client'}</span>
                                  <div className="flex text-yellow-400"><Star size={10} fill="currentColor"/> <span className="text-gray-400 ml-1 text-xs">{r.rating}</span></div>
                               </div>
                               <p className="text-gray-600 text-xs">"{r.comment}"</p>
                            </div>
                         ))}
                      </div>
                   ) : (<p className="text-xs text-gray-400 italic">No reviews yet.</p>)}
                </div>
             </div>
             <div className="p-4 border-t bg-gray-50 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => handleContactClick(selectedProvider)}><MessageCircle size={18} className="mr-2" /> Chat</Button>
                <Button className="flex-[2] bg-kubwa-orange hover:bg-orange-600" onClick={handleHireClick} disabled={!selectedProvider.available}>{selectedProvider.available ? 'Hire Now' : 'Currently Unavailable'}</Button>
             </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditProfileModal && myProfile && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-md h-[90vh] overflow-y-auto animate-zoom-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Edit Professional Profile</h3>
                    <button onClick={() => setShowEditProfileModal(false)}><X size={20}/></button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Portfolio Images (Max 5)</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {editProfileForm.portfolio.map((img, i) => (
                                <div key={i} className="relative w-20 h-20 shrink-0 border rounded-lg bg-gray-100">
                                    <img src={img} className="w-full h-full object-cover rounded-lg" alt="Work" />
                                    <button onClick={() => removePortfolioItem(i)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"><Trash2 size={12}/></button>
                                </div>
                            ))}
                            {editProfileForm.portfolio.length < 5 && (
                                <div className="w-20 h-20 shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 relative cursor-pointer hover:bg-gray-100">
                                    <Camera className="text-gray-400 mb-1" size={20} />
                                    <span className="text-[10px] text-gray-500">Add Photo</span>
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePortfolioUpload} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Hourly Rate (₦)</label>
                            <Input 
                                type="number" 
                                value={editProfileForm.rate} 
                                onChange={e => setEditProfileForm({...editProfileForm, rate: e.target.value})} 
                                placeholder="5000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Short Bio / About Me</label>
                        <textarea 
                            className="w-full p-3 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kubwa-orange"
                            rows={4}
                            placeholder="Tell potential clients about your experience..."
                            value={editProfileForm.bio}
                            onChange={e => setEditProfileForm({...editProfileForm, bio: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Skills & Specialties</label>
                        <div className="grid grid-cols-2 gap-2">
                            {FIXIT_SERVICES.map(service => (
                                <button
                                    key={service}
                                    onClick={() => toggleSkill(service)}
                                    className={`text-[10px] py-2 px-1 rounded border transition-all text-left flex items-center gap-2 ${editProfileForm.skills.includes(service) ? 'bg-orange-100 border-orange-500 text-orange-800 font-bold' : 'bg-white border-gray-200 text-gray-600'}`}
                                >
                                    {editProfileForm.skills.includes(service) ? <CheckCircle size={12}/> : <div className="w-3 h-3 border border-gray-300 rounded-full"></div>}
                                    {service}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full py-3 flex items-center justify-center gap-2 bg-kubwa-orange shadow-lg">
                        {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <CheckSquare size={18} />} Save Changes
                    </Button>
                </div>
            </Card>
          </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
           <Card className="w-full max-w-sm animate-zoom-in">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg">Weekly Schedule</h3>
                 <button onClick={() => setShowScheduleModal(false)}><X size={20}/></button>
              </div>
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                 {editSchedule.map((d, i) => (
                    <div key={d.day} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border">
                       <button 
                         onClick={() => {
                            const newSched = [...editSchedule];
                            newSched[i].isOpen = !newSched[i].isOpen;
                            setEditSchedule(newSched);
                         }}
                         className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${d.isOpen ? 'bg-kubwa-orange border-kubwa-orange text-white' : 'bg-white border-gray-300'}`}
                       >
                         {/* Correctly using the imported Check icon from lucide-react */}
                         {d.isOpen && <Check size={10} />}
                       </button>
                       <span className="text-xs font-bold w-10">{d.day}</span>
                       <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="time" 
                            disabled={!d.isOpen}
                            value={d.start} 
                            onChange={(e) => { const n = [...editSchedule]; n[i].start = e.target.value; setEditSchedule(n); }}
                            className="bg-white border rounded p-1 text-[10px] w-full disabled:opacity-30" 
                          />
                          <span className="text-xs text-gray-400">-</span>
                          <input 
                            type="time" 
                            disabled={!d.isOpen}
                            value={d.end} 
                            onChange={(e) => { const n = [...editSchedule]; n[i].end = e.target.value; setEditSchedule(n); }}
                            className="bg-white border rounded p-1 text-[10px] w-full disabled:opacity-30" 
                          />
                       </div>
                    </div>
                 ))}
              </div>
              <Button className="w-full py-2 bg-kubwa-orange" onClick={handleSaveSchedule}>Save Schedule</Button>
           </Card>
        </div>
      )}

      {showConfirmHire && selectedProvider && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <Card className="w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in relative">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold text-gray-800 text-lg">Confirm Booking</h3><button onClick={() => setShowConfirmHire(false)} className="bg-gray-200 p-1 rounded-full text-gray-500 hover:text-black"><X size={16}/></button></div>
              <div className="p-5 space-y-5 overflow-y-auto">
                 <div className="flex items-center gap-3"><img src={selectedProvider.image} alt={selectedProvider.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" /><div><h4 className="font-bold text-gray-800">{selectedProvider.name}</h4><p className="text-xs text-gray-500">{selectedProvider.category}</p></div><div className="ml-auto text-right"><p className="font-bold text-kubwa-orange">₦{selectedProvider.rate.toLocaleString()}<span className="text-xs font-normal text-gray-400">/hr</span></p></div></div>
                 <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Service Type</label><Select value={bookingServiceType} onChange={e => setBookingServiceType(e.target.value)} className="bg-gray-50"><option>Standard Service</option><option>Emergency Repair</option><option>Consultation</option><option>Installation</option></Select></div>
                 <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Estimated Duration</label><div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border"><button onClick={() => setEstimatedDuration(Math.max(1, estimatedDuration - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow text-gray-600 hover:text-black"><Minus size={14} /></button><span className="font-bold text-sm">{estimatedDuration} Hour{estimatedDuration > 1 ? 's' : ''}</span><button onClick={() => setEstimatedDuration(estimatedDuration + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow text-gray-600 hover:text-black"><Plus size={14} /></button></div></div>
                 <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Time</label><div className="flex bg-gray-100 p-1 rounded-lg mb-3"><button onClick={() => setBookingTimeMode('ASAP')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${bookingTimeMode === 'ASAP' ? 'bg-white shadow text-kubwa-orange' : 'text-gray-500'}`}>ASAP</button><button onClick={() => setBookingTimeMode('SCHEDULED')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${bookingTimeMode === 'SCHEDULED' ? 'bg-white shadow text-kubwa-orange' : 'text-gray-500'}`}>Schedule</button></div>{bookingTimeMode === 'SCHEDULED' && (<div className="grid grid-cols-2 gap-3 animate-fade-in"><div><label className="text-[10px] font-bold text-gray-400 mb-1 block">Date</label><Input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="text-xs py-2" /></div><div><label className="text-[10px] font-bold text-gray-400 mb-1 block">Time</label><Input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="text-xs py-2" /></div></div>)}</div>
                 <div className="bg-orange-50 p-4 rounded-xl border border-orange-100"><div className="flex justify-between items-center mb-1"><span className="text-xs text-orange-800 font-bold uppercase">Estimate</span><span className="text-xl font-bold text-gray-900">₦{(selectedProvider.rate * estimatedDuration).toLocaleString()}</span></div></div>
              </div>
              <div className="p-4 border-t bg-gray-50 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowConfirmHire(false)}>Cancel</Button><Button className="flex-[2] bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg" onClick={handleConfirmBooking} disabled={isBooking}>{isBooking ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18} />}</Button></div>
           </Card>
        </div>
      )}

      {bookingConfirmation && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-8 text-center max-w-sm animate-zoom-in shadow-2xl"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-green-600" /></div><h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Sent!</h3><p className="text-gray-500 mb-6">Request sent to <strong>{selectedProvider?.name}</strong>.</p><Button onClick={() => setBookingConfirmation(false)} className="w-full">Okay</Button></div>
        </div>
      )}
    </div>
  );
};

export default FixIt;
