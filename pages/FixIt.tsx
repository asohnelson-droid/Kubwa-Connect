

import React, { useState, useEffect } from 'react';
import { Search, Star, Loader2, Power, X, Briefcase, MapPin, Shield, Wrench, Plus, Minus, ChevronRight, CheckCircle, Clock, Calendar, ShieldCheck } from 'lucide-react';
import { api, KUBWA_AREAS, FIXIT_SERVICES } from '../services/data';
import { ServiceProvider, User as UserType, Review, AppSection, ServiceOrder, ServiceOrderStatus } from '../types';
import { Button, Card, Badge, Breadcrumbs, Input, BackButton, Sheet } from '../components/ui';
import AuthModal from '../components/AuthModal';
import { useData } from '../contexts/DataContext';

interface FixItProps {
  user: UserType | null;
  onRequireAuth: () => void;
  setSection: (section: AppSection) => void;
  refreshUser: () => void;
  goBack?: () => void;
}

const FixIt: React.FC<FixItProps> = ({ user, onRequireAuth, setSection, refreshUser, goBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Use DataContext for providers
  const { services: providers, loading: contextLoading, fetchServices } = useData();

  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null); 
  const [providerReviews, setProviderReviews] = useState<Review[]>([]);
  const [bookingConfirmation, setBookingConfirmation] = useState(false); 
  const [showConfirmHire, setShowConfirmHire] = useState(false); 
  
  const [bookingTimeMode, setBookingTimeMode] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  
  const [estimatedDuration, setEstimatedDuration] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const [filterRate, setFilterRate] = useState<'any'|'low'|'high'>('any');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterLocation, setFilterLocation] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance'|'rating'|'priceAsc'|'priceDesc'>('relevance');

  const [myProfile, setMyProfile] = useState<ServiceProvider | null>(null);
  const [loadingMyProfile, setLoadingMyProfile] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [myBookings, setMyBookings] = useState<ServiceOrder[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState<string | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<ServiceProvider | null>(null);

  const [showSetupSheet, setShowSetupSheet] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupCategory, setSetupCategory] = useState(FIXIT_SERVICES[0]);
  const [setupRate, setSetupRate] = useState('');
  const [setupBio, setSetupBio] = useState('');
  const [savingSetup, setSavingSetup] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const loadMyProfile = async () => {
      if (user && user.role === 'PROVIDER') {
        setLoadingMyProfile(true);
        const profile = await api.providers.getMyProfile(user.id);
        setMyProfile(profile);
        setLoadingMyProfile(false);
        if (!profile) setSetupName(user.name || '');
      }
    };
    loadMyProfile();
  }, [user]);

  const loadMyBookings = async () => {
    if (!myProfile) return;
    setLoadingBookings(true);
    const data = await api.serviceOrders.getForProvider(myProfile.id);
    setMyBookings(data);
    setLoadingBookings(false);
  };

  useEffect(() => {
    if (myProfile) loadMyBookings();
  }, [myProfile]);

  useEffect(() => {
    if (selectedProvider) {
       api.reviews.getByTarget(selectedProvider.userId).then(setProviderReviews);
    }
  }, [selectedProvider]);

  const handleAuthSuccess = () => {
    refreshUser();
    if (pendingProvider) {
       setTimeout(() => {
         setSelectedProvider(pendingProvider);
         setShowConfirmHire(true);
         setPendingProvider(null);
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
      // We should ideally refresh services list too, but user is local so we wait or trigger re-fetch
      fetchServices();
    }
    setTogglingStatus(false);
  };

  const handleSaveSetup = async () => {
    if (!user || !setupName.trim() || !setupRate.trim()) return;
    setSavingSetup(true);
    const result = await api.providers.upsert(user.id, {
      name: setupName.trim(),
      category: setupCategory,
      rate: Number(setupRate),
      bio: setupBio.trim() || undefined,
      image: user.avatar
    });
    setSavingSetup(false);
    if (result.success) {
      setShowSetupSheet(false);
      const profile = await api.providers.getMyProfile(user.id);
      setMyProfile(profile);
    } else {
      alert("Couldn't save your listing. Please try again.");
    }
  };

  const handleHireClick = () => {
    if (!selectedProvider) return;
    if (!user) {
      setPendingProvider(selectedProvider);
      setShowAuthModal(true);
      return;
    }
    setEstimatedDuration(1);
    setBookingTimeMode('ASAP');
    setBookingDate('');
    setBookingTime('');
    setShowConfirmHire(true);
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedProvider) return;
    if (bookingTimeMode === 'SCHEDULED' && (!bookingDate || !bookingTime)) {
      alert("Please choose a date and time.");
      return;
    }
    setIsBooking(true);
    const amount = selectedProvider.rate * estimatedDuration;
    const result = await api.serviceOrders.create({
      userId: user.id,
      serviceId: selectedProvider.id,
      amount
    });
    setIsBooking(false);
    if (result.success) {
      setShowConfirmHire(false);
      setBookingConfirmation(true);
      setTimeout(() => {
        setBookingConfirmation(false);
        setSelectedProvider(null);
      }, 2500);
    } else {
      alert("Couldn't complete the booking. Please try again.");
    }
  };

  const handleUpdateBookingStatus = async (orderId: string, status: ServiceOrderStatus) => {
    setBookingActionLoading(orderId);
    const success = await api.serviceOrders.updateStatus(orderId, status);
    if (success) {
      setMyBookings(prev => prev.map(b => b.id === orderId ? { ...b, status } : b));
    }
    setBookingActionLoading(null);
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
      {user && goBack ? (
        <BackButton onClick={goBack} />
      ) : (
        <Breadcrumbs items={[
          { label: 'Home', onClick: () => setSection(AppSection.HOME) },
          { label: 'FixIt' }
        ]} />
      )}

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

      {user?.role === 'PROVIDER' && !loadingMyProfile && !myProfile && (
        <Card className="p-6 mb-8 border-none shadow-sm rounded-[2rem] bg-gray-900 text-white flex items-center justify-between gap-4">
          <div>
            <p className="font-black text-sm uppercase tracking-tight">Set up your listing</p>
            <p className="text-[10px] text-white/60 font-bold mt-1">Add your rate and category so residents can find and hire you.</p>
          </div>
          <Button onClick={() => setShowSetupSheet(true)} className="h-11 text-[10px] px-4 shrink-0">Set Up</Button>
        </Card>
      )}

      {myProfile && (
        <div className="mb-8">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">My Bookings</h3>
          {loadingBookings ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-kubwa-green" size={24} /></div>
          ) : myBookings.length === 0 ? (
            <Card className="py-8 text-center rounded-[2rem] border-dashed border-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No booking requests yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {myBookings.map(booking => (
                <Card key={booking.id} className="p-5 border-none shadow-sm rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-sm">Booking #{booking.id.slice(0, 6)}</span>
                    <Badge color={
                      booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      booking.status === 'CANCELLED' ? 'bg-red-50 text-red-500' :
                      booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>{booking.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-kubwa-green">₦{booking.amount.toLocaleString()}</span>
                    <div className="flex gap-2">
                      {booking.status === 'PENDING' && (
                        <Button className="h-10 text-[10px] px-4" disabled={bookingActionLoading === booking.id} onClick={() => handleUpdateBookingStatus(booking.id, 'ACCEPTED')}>
                          {bookingActionLoading === booking.id ? <Loader2 size={14} className="animate-spin" /> : 'Accept'}
                        </Button>
                      )}
                      {booking.status === 'ACCEPTED' && (
                        <Button className="h-10 text-[10px] px-4" disabled={bookingActionLoading === booking.id} onClick={() => handleUpdateBookingStatus(booking.id, 'IN_PROGRESS')}>
                          {bookingActionLoading === booking.id ? <Loader2 size={14} className="animate-spin" /> : 'Start Job'}
                        </Button>
                      )}
                      {booking.status === 'IN_PROGRESS' && (
                        <Button className="h-10 text-[10px] px-4 bg-green-600" disabled={bookingActionLoading === booking.id} onClick={() => handleUpdateBookingStatus(booking.id, 'COMPLETED')}>
                          {bookingActionLoading === booking.id ? <Loader2 size={14} className="animate-spin" /> : 'Mark Complete'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

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
        {contextLoading && providers.length === 0 ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-kubwa-green" /></div> : 
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

      {/* Provider Detail Sheet */}
      <Sheet isOpen={!!selectedProvider && !showConfirmHire} onClose={() => setSelectedProvider(null)} title={selectedProvider?.name}>
        {selectedProvider && (
          <div className="pb-6">
            <div className="h-40 rounded-3xl overflow-hidden mb-4 relative bg-gray-100">
              <img src={selectedProvider.image} className="w-full h-full object-cover" alt="" />
              {selectedProvider.isVerified && (
                <div className="absolute top-3 right-3 bg-white/90 px-3 py-1.5 rounded-full flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-wide">
                  <ShieldCheck size={12} /> Verified
                </div>
              )}
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-kubwa-orange uppercase tracking-widest">{selectedProvider.category}</p>
                {selectedProvider.location && (
                  <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1"><MapPin size={12} /> {selectedProvider.location}</p>
                )}
              </div>
              <div className="flex items-center gap-1 font-black text-sm">
                <Star size={16} className="text-yellow-400 fill-yellow-400" /> {selectedProvider.rating}
                <span className="text-gray-300 font-bold">({selectedProvider.reviews})</span>
              </div>
            </div>

            {selectedProvider.bio && (
              <p className="text-sm font-medium text-gray-600 leading-relaxed mb-4">{selectedProvider.bio}</p>
            )}

            {selectedProvider.skills && selectedProvider.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedProvider.skills.map(skill => (
                  <Badge key={skill} color="bg-gray-100 text-gray-600">{skill}</Badge>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Reviews</h4>
              {providerReviews.length === 0 ? (
                <p className="text-xs text-gray-400 font-bold">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {providerReviews.map(review => (
                    <div key={review.id} className="border-b border-gray-50 pb-3 last:border-none">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rate</span>
              <span className="text-xl font-black text-kubwa-green">₦{selectedProvider.rate.toLocaleString()}<span className="text-xs text-gray-400">/hr</span></span>
            </div>

            <Button className="w-full h-14" onClick={handleHireClick} disabled={!selectedProvider.available}>
              {selectedProvider.available ? 'HIRE NOW' : 'CURRENTLY OFFLINE'}
            </Button>
          </div>
        )}
      </Sheet>

      {/* Booking Confirmation Sheet */}
      <Sheet isOpen={showConfirmHire} onClose={() => setShowConfirmHire(false)} title="Confirm Booking">
        {selectedProvider && (
          <div className="pb-6 space-y-5">
            <Card className="p-4 flex items-center gap-4 border-none bg-gray-50 shadow-none">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                <img src={selectedProvider.image} className="w-full h-full object-cover" alt="" />
              </div>
              <div>
                <p className="font-black text-sm text-gray-900">{selectedProvider.name}</p>
                <p className="text-[10px] font-black text-kubwa-orange uppercase tracking-widest">{selectedProvider.category}</p>
              </div>
            </Card>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">When do you need this?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setBookingTimeMode('ASAP')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${bookingTimeMode === 'ASAP' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  <Clock size={14} /> ASAP
                </button>
                <button
                  onClick={() => setBookingTimeMode('SCHEDULED')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${bookingTimeMode === 'SCHEDULED' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  <Calendar size={14} /> Schedule
                </button>
              </div>
            </div>

            {bookingTimeMode === 'SCHEDULED' && (
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                <Input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} />
              </div>
            )}

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Estimated Duration</p>
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-2">
                <button
                  onClick={() => setEstimatedDuration(d => Math.max(1, d - 1))}
                  className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600"
                >
                  <Minus size={16} />
                </button>
                <span className="font-black text-lg">{estimatedDuration} {estimatedDuration === 1 ? 'hour' : 'hours'}</span>
                <button
                  onClick={() => setEstimatedDuration(d => d + 1)}
                  className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estimated Total</span>
              <span className="text-2xl font-black text-kubwa-green">₦{(selectedProvider.rate * estimatedDuration).toLocaleString()}</span>
            </div>

            <Button className="w-full h-14" onClick={handleConfirmBooking} disabled={isBooking}>
              {isBooking ? <Loader2 className="animate-spin" /> : 'CONFIRM BOOKING'}
            </Button>
          </div>
        )}
      </Sheet>

      {/* Booking Confirmation Overlay */}
      {bookingConfirmation && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <Card className="w-full max-w-sm p-10 text-center animate-zoom-in rounded-[3rem] border-none shadow-2xl">
            <div className="w-20 h-20 bg-kubwa-green/10 text-kubwa-green rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Booking Sent!</h3>
            <p className="text-gray-500 font-bold text-xs mt-3 leading-relaxed">
              {selectedProvider?.name} will confirm your request shortly. You can track it from your Profile.
            </p>
          </Card>
        </div>
      )}

      {/* Provider Setup Sheet */}
      <Sheet isOpen={showSetupSheet} onClose={() => setShowSetupSheet(false)} title="Set Up Your Listing">
        <div className="space-y-4 pb-6">
          <Input placeholder="Your Name / Business Name" value={setupName} onChange={e => setSetupName(e.target.value)} />
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Service Category</label>
            <select
              className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none"
              value={setupCategory}
              onChange={e => setSetupCategory(e.target.value)}
            >
              {FIXIT_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input type="number" placeholder="Rate per hour (₦)" value={setupRate} onChange={e => setSetupRate(e.target.value)} />
          <textarea
            className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold h-28 resize-none outline-none focus:ring-2 focus:ring-kubwa-green"
            placeholder="Tell residents about your experience..."
            value={setupBio}
            onChange={e => setSetupBio(e.target.value)}
          />
          <Button onClick={handleSaveSetup} disabled={savingSetup || !setupName.trim() || !setupRate.trim()} className="w-full h-14">
            {savingSetup ? <Loader2 className="animate-spin" /> : 'PUBLISH LISTING'}
          </Button>
        </div>
      </Sheet>

      {showAuthModal && (
        <AuthModal 
          onClose={() => { setShowAuthModal(false); setPendingProvider(null); }} 
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default FixIt;
