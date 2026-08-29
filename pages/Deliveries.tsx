

import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Clock, Navigation, Loader2, Crown, CheckCircle, Search, Bookmark, Phone, Power, User as UserIcon, Minus, Plus, RefreshCw, Bell, X } from 'lucide-react';
import { api } from '../services/data';
import { supabase } from '../services/supabase';
import { Button, Card, Input, Badge, Breadcrumbs, BackButton, SectionHeader } from '../components/ui';
import { User, DeliveryRequest, Address, AppSection, DeliveryStatus } from '../types';

interface DeliveriesProps {
  user: User | null;
  onRequireAuth: () => void;
  setSection: (section: AppSection) => void;
  refreshUser: () => void;
  goBack?: () => void;
}

const Deliveries: React.FC<DeliveriesProps> = ({ user, onRequireAuth, setSection, refreshUser, goBack }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'track' | 'jobs' | 'orders'>('request');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [itemType, setItemType] = useState('Small Package (Document, Phone)');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [riderFound, setRiderFound] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Rider State
  const [riderOnline, setRiderOnline] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<DeliveryRequest[]>([]);
  const [acceptingJob, setAcceptingJob] = useState<string | null>(null);
  const [newJobAlert, setNewJobAlert] = useState<DeliveryRequest | null>(null);

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  // Map Simulation State
  const [transitProgress, setTransitProgress] = useState(0);

  // Fix: Safe access to subscription tier
  const isElite = user?.subscription?.tier === 'ELITE';
  const isRider = user?.role === 'RIDER';

  // SECURITY: Ensure only approved riders can access jobs
  // Fix: Comparison between status and 'APPROVED' (since types match)
  const isApprovedRider = isRider && user?.status === 'APPROVED';

  useEffect(() => {
    // Determine default tab based on role
    if (isRider) {
        if (activeTab === 'request') setActiveTab('jobs');
    }

    if (activeTab === 'track') loadDeliveries();
    if (activeTab === 'jobs' && isApprovedRider) loadJobs();
    if (user) api.users.getAddresses(user.id).then(setSavedAddresses);
  }, [activeTab, user, isRider]);

  useEffect(() => {
    if (!isApprovedRider || !user) return;

    const channel = supabase
      .channel(`rider-jobs-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deliveries', filter: 'status=eq.PENDING' },
        (payload) => {
          const newJob = payload.new as DeliveryRequest;
          setAvailableJobs(prev => prev.some(j => j.id === newJob.id) ? prev : [newJob, ...prev]);
          setNewJobAlert(newJob);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isApprovedRider, user?.id]);

  useEffect(() => {
    if (!newJobAlert) return;
    const timer = setTimeout(() => setNewJobAlert(null), 8000);
    return () => clearTimeout(timer);
  }, [newJobAlert]);

  // Simulation Loop for Map Movement
  useEffect(() => {
    let interval: any;
    const hasInTransit = deliveries.some(d => d.status === 'IN_TRANSIT');
    
    if (hasInTransit && activeTab === 'track') {
      interval = setInterval(() => {
        setTransitProgress(prev => {
          if (prev >= 100) return 0; // Loop the animation
          return prev + 0.5; // Speed of movement
        });
      }, 100);
    } else {
      setTransitProgress(0);
    }
    return () => clearInterval(interval);
  }, [deliveries, activeTab]);

  const loadDeliveries = async () => {
    setLoading(true);
    const data = await api.getDeliveries(user?.id);
    setDeliveries(data);
    setLoading(false);
  };
  
  const loadJobs = async () => {
    setLoading(true);
    const jobs = await api.deliveries.getAvailableJobs();
    setAvailableJobs(jobs);
    setLoading(false);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPickup(`Lat: ${pos.coords.latitude.toFixed(4)}, Long: ${pos.coords.longitude.toFixed(4)} (My Location)`); setIsLocating(false); },
      () => { alert("Unable to retrieve location"); setIsLocating(false); }
    );
  };

  const handleFindRider = async () => {
    if (!user) { 
      onRequireAuth();
      return; 
    }
    if (!pickup || !dropoff) { alert("Enter locations."); return; }
    if (!phoneNumber) { alert("Please enter a phone number."); return; }
    setIsSearching(true);
    const success = await api.requestDelivery({ userId: user.id, pickup, dropoff, itemType: itemType.split(' (')[0], phoneNumber });
    if (success) {
       setRiderFound(true);
       setTimeout(() => { setIsSearching(false); setRiderFound(false); setPickup(''); setDropoff(''); setPhoneNumber(''); setActiveTab('track'); }, 2000);
    } else { setIsSearching(false); alert("Failed."); }
  };
  
  // Rider Actions
  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;
    setAcceptingJob(jobId);
    const success = await api.deliveries.acceptDelivery(jobId, user.id);
    if (success) {
       alert("Job accepted! Head to the pickup location.");
       setActiveTab('track'); // Switch to tracking so they see the active job
    } else {
       alert("Job no longer available.");
    }
    setAcceptingJob(null);
  };

  const handleUpdateStatus = async (jobId: string, status: DeliveryStatus) => {
    const success = await api.deliveries.updateStatus(jobId, status);
    if (success) {
      loadDeliveries(); // Refresh list
    }
  };

  if (isRider && !isApprovedRider) {
      return (
          <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                  <Truck size={32} className="text-amber-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-kubwa-ink">Waiting for approval</h3>
              <p className="text-gray-500 mt-2 text-sm font-medium">Your rider account is pending admin verification. You cannot accept jobs yet.</p>
          </div>
      );
  }

  return (
    <div className="pb-24 pt-4 px-4 relative">
      {user && goBack ? (
        <BackButton onClick={goBack} />
      ) : (
        <Breadcrumbs items={[
          { label: 'Home', onClick: () => setSection(AppSection.HOME) },
          { label: 'Ride' }
        ]} />
      )}

      {isSearching && (
        <div className="fixed inset-0 z-50 bg-kubwa-ink/80 flex flex-col items-center justify-center p-6 text-center animate-fade-in backdrop-blur-sm">
           {riderFound ? (
             <div className="bg-white p-8 rounded-[1.75rem] animate-zoom-in">
               <CheckCircle size={32} className="mx-auto mb-4 text-kubwa-mart" />
               <h3 className="font-display text-xl font-bold text-kubwa-ink">Request sent!</h3>
               <p className="text-gray-500 text-sm font-medium">Nearby riders have been notified.</p>
             </div>
           ) : (
             <div className="bg-white p-8 rounded-[1.75rem] animate-pulse">
               <Loader2 className="animate-spin mx-auto mb-4 text-kubwa-ride" size={32} />
               <h3 className="font-display text-xl font-bold text-kubwa-ink">Locating riders...</h3>
             </div>
           )}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-kubwa-ink tracking-tight">Kubwa Ride</h2>
        {!isRider && isElite && <Badge color="bg-kubwa-ink text-kubwa-amber border border-kubwa-amber/40">Elite Benefits</Badge>}
        {isRider && (
           <button 
             onClick={() => setRiderOnline(!riderOnline)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${riderOnline ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
           >
             <Power size={14} /> {riderOnline ? 'Online' : 'Offline'}
           </button>
        )}
      </div>

      {isApprovedRider && newJobAlert && (
         <div className="bg-kubwa-ink text-white p-5 rounded-[1.75rem] flex items-center justify-between gap-4 animate-slide-in-bottom shadow-xl mb-6">
            <div className="flex items-center gap-4 min-w-0">
               <div className="bg-kubwa-ride p-2.5 rounded-2xl shrink-0"><Bell size={18} /></div>
               <div className="min-w-0">
                  <p className="text-xs font-bold">New job available!</p>
                  <p className="text-[11px] text-white/60 font-semibold mt-0.5 truncate">{newJobAlert.pickup} → {newJobAlert.dropoff}</p>
               </div>
            </div>
            <button onClick={() => setNewJobAlert(null)} className="p-1 hover:bg-white/10 rounded-full shrink-0"><X size={18} /></button>
         </div>
      )}

      <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
        {!isRider && (
          <button className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'request' ? 'bg-white shadow text-kubwa-ride' : 'text-gray-500'}`} onClick={() => setActiveTab('request')}>New Request</button>
        )}
        {isRider && (
           <button className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'jobs' ? 'bg-white shadow text-kubwa-ride' : 'text-gray-500'}`} onClick={() => setActiveTab('jobs')}>Job Board</button>
        )}
        <button className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'track' ? 'bg-white shadow text-kubwa-ride' : 'text-gray-500'}`} onClick={() => setActiveTab('track')}>
          {isRider ? 'My Active Jobs' : 'Track Order'}
        </button>
      </div>

      {activeTab === 'request' && !isRider && (
        <Card className="space-y-6 animate-fade-in">
          <div>
            <label className="flex items-center justify-between text-sm font-bold text-kubwa-ink mb-2">
              <span className="flex items-center gap-2"><MapPin size={16} className="text-kubwa-mart" /> Pickup</span>
              <button onClick={handleUseLocation} className="text-xs text-kubwa-ride flex items-center gap-1 font-semibold" disabled={isLocating}>
                {isLocating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />} My location
              </button>
            </label>
            <Input placeholder="e.g. Phase 4" value={pickup} onChange={(e) => setPickup(e.target.value)} />
            {savedAddresses.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                {savedAddresses.map(addr => (
                  <button key={addr.id} onClick={() => setPickup(addr.details)} className="text-[11px] font-semibold bg-gray-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-200 shrink-0">
                    <Bookmark size={10} /> {addr.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-kubwa-ink mb-2"><MapPin size={16} className="text-kubwa-primary" /> Drop-off</label>
            <Input placeholder="e.g. Gwarinpa" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
            {savedAddresses.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                {savedAddresses.map(addr => (
                  <button key={addr.id} onClick={() => setDropoff(addr.details)} className="text-[11px] font-semibold bg-gray-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-200 shrink-0">
                    <Bookmark size={10} /> {addr.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
             <label className="flex items-center gap-2 text-sm font-bold text-kubwa-ink mb-2">
               <Phone size={16} className="text-kubwa-ride" /> Phone number (for updates)
             </label>
             <Input 
               placeholder="e.g. 08012345678" 
               value={phoneNumber} 
               onChange={(e) => setPhoneNumber(e.target.value)} 
               type="tel"
             />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-kubwa-ink mb-2"><Package size={16} /> Item details</label>
            <select className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/60 text-sm font-semibold outline-none" value={itemType} onChange={(e) => setItemType(e.target.value)}>
              <option>Small Package (Document, Phone)</option>
              <option>Medium Package (Food, Clothes)</option>
              <option>Large Package (Electronics)</option>
            </select>
          </div>

          <div className="bg-kubwa-ride/5 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-xs text-kubwa-ride font-bold">Estimated fare</p>
              {isElite ? <p className="text-xl font-bold text-kubwa-mart">₦0 <span className="text-xs text-gray-500 font-medium">(Elite)</span></p> : <p className="text-xl font-bold text-kubwa-ink">₦800 - ₦1,200</p>}
            </div>
            <Clock className="text-kubwa-ride/30" />
          </div>

          <Button className="w-full py-3" onClick={handleFindRider} disabled={isSearching}>
            {isSearching ? (
              <><Loader2 size={18} className="animate-spin" /> {riderFound ? 'Request sent!' : 'Finding rider...'}</>
            ) : 'Find rider'}
          </Button>
        </Card>
      )}

      {/* RIDER JOB BOARD */}
      {activeTab === 'jobs' && isRider && (
         <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-sm text-kubwa-ink">Available jobs in Kubwa</h3>
               <button onClick={loadJobs} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
               </button>
            </div>
            
            {!riderOnline && (
               <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl text-amber-700">
                 <p className="font-bold text-sm flex items-center gap-2"><Power size={16}/> You are offline</p>
                 <p className="text-xs font-medium mt-0.5">Go online to indicate availability to the system (though you can still accept jobs manually below).</p>
               </div>
            )}
            
            {loading ? <Loader2 className="animate-spin mx-auto text-kubwa-ride" /> : (
               availableJobs.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                     <Package size={40} className="mx-auto mb-2 opacity-20" />
                     <p className="text-sm font-semibold">No pending jobs right now.</p>
                     <p className="text-xs">Check back in a few minutes.</p>
                  </div>
               ) : (
               availableJobs.map(job => (
                  <Card key={job.id} className="border-l-4 border-l-kubwa-ride shadow-sm">
                     <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                        <div>
                           <Badge color="bg-kubwa-ride/10 text-kubwa-ride">{job.itemType}</Badge>
                           <p className="text-[11px] text-gray-400 mt-1 font-medium">{new Date(job.created_at).toLocaleTimeString()}</p>
                        </div>
                        <span className="font-bold text-xl text-kubwa-mart">₦{job.price.toLocaleString()}</span>
                     </div>
                     <div className="space-y-3 mb-4 text-sm">
                        <div className="flex gap-3 items-start">
                           <div className="mt-1 w-2 h-2 rounded-full bg-kubwa-mart shadow-sm shrink-0"></div>
                           <div>
                              <p className="text-xs text-gray-400 font-bold">Pickup from</p>
                              <p className="font-bold text-kubwa-ink">{job.pickup}</p>
                           </div>
                        </div>
                        <div className="flex gap-3 items-start">
                           <div className="mt-1 w-2 h-2 rounded-full bg-kubwa-primary shadow-sm shrink-0"></div>
                           <div>
                              <p className="text-xs text-gray-400 font-bold">Deliver to</p>
                              <p className="font-bold text-kubwa-ink">{job.dropoff}</p>
                           </div>
                        </div>
                        {job.phoneNumber && (
                           <div className="flex gap-2 text-xs bg-gray-50 p-2.5 rounded-xl text-gray-600 font-semibold">
                              <Phone size={14} /> Contact: {job.phoneNumber}
                           </div>
                        )}
                     </div>
                     <Button 
                       className="w-full py-3" 
                       onClick={() => handleAcceptJob(job.id)}
                       disabled={!!acceptingJob}
                     >
                       {acceptingJob === job.id ? <Loader2 className="animate-spin" /> : 'Accept job'}
                     </Button>
                  </Card>
               ))
            ))}
         </div>
      )}

      {/* TRACKING / ACTIVE JOBS */}
      {activeTab === 'track' && (
        <div className="space-y-4 animate-fade-in">
          {loading ? <Loader2 className="animate-spin mx-auto text-kubwa-ride" /> : (
            deliveries.map(d => (
              <Card key={d.id} className="relative overflow-hidden shadow-sm">
                <div className="flex justify-between mb-2">
                   <h3 className="font-bold text-kubwa-ink">{d.itemType}</h3>
                   <Badge color={d.status==='DELIVERED'?'bg-green-100 text-green-700': d.status==='ACCEPTED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>{d.status.replace('_', ' ')}</Badge>
                </div>

                {/* --- LIVE MAP VIEW FOR IN_TRANSIT --- */}
                {d.status === 'IN_TRANSIT' && (
                  <div className="mb-4 relative h-48 w-full bg-gray-200 rounded-2xl overflow-hidden border border-gray-300">
                     {/* Fake Map Background */}
                     <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_Abuja.png')] bg-cover bg-center"></div>
                     
                     <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-md text-xs font-bold shadow flex items-center gap-1 text-green-600 animate-pulse">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div> Live tracking
                     </div>

                     {/* Map Controls (Visual Only) */}
                     <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                        <button className="bg-white p-1 rounded shadow text-gray-600 hover:text-kubwa-ink"><Plus size={14}/></button>
                        <button className="bg-white p-1 rounded shadow text-gray-600 hover:text-kubwa-ink"><Minus size={14}/></button>
                     </div>

                     {/* Simulated Path & Movement */}
                     <div className="absolute inset-0 flex items-center px-12">
                        {/* The Road */}
                        <div className="w-full h-1.5 bg-gray-300 rounded-full relative">
                           {/* The Progress Line */}
                           <div className="h-full bg-kubwa-ride rounded-full transition-all duration-300" style={{ width: `${transitProgress}%` }}></div>
                           
                           {/* Start Point */}
                           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-kubwa-mart rounded-full"></div>
                           
                           {/* End Point */}
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-kubwa-primary rounded-full"></div>
                           
                           {/* The Rider (Moving Icon) */}
                           <div 
                             className="absolute top-1/2 -translate-y-1/2 -ml-3 transition-all duration-300 z-10"
                             style={{ left: `${transitProgress}%` }}
                           >
                              <div className="bg-white p-1 rounded-full shadow-md border border-kubwa-ride">
                                <Truck size={16} className="text-kubwa-ride" />
                              </div>
                              <div className="text-[8px] font-bold bg-kubwa-ink text-white px-1 rounded absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                2 mins away
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
                
                {/* Rider Info (For User) */}
                {!isRider && d.riderId && d.status !== 'PENDING' && (
                   <div className="bg-gray-50 p-3 rounded-2xl mb-3 flex items-center gap-3">
                      <div className="bg-gray-200 p-2 rounded-full"><UserIcon size={16} /></div>
                      <div>
                         <p className="text-xs font-bold text-gray-500">Rider assigned</p>
                         <p className="text-sm font-bold text-kubwa-ink">{d.rider?.name || 'Your rider'}</p>
                      </div>
                      {/* Call Button */}
                      {d.phoneNumber && (
                        <a href={`tel:${d.phoneNumber}`} className="ml-auto w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                           <Phone size={14} />
                        </a>
                      )}
                   </div>
                )}

                <div className="text-xs text-gray-500 font-medium space-y-1 pl-3 border-l-2 border-gray-200 ml-1">
                   <p><span className="font-bold text-kubwa-ink">From:</span> {d.pickup}</p>
                   <p><span className="font-bold text-kubwa-ink">To:</span> {d.dropoff}</p>
                   {d.phoneNumber && <p><span className="font-bold text-kubwa-ink">Contact:</span> {d.phoneNumber}</p>}
                </div>
                
                {/* Rider Controls */}
                {isRider && d.riderId === user?.id && d.status !== 'DELIVERED' && (
                   <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      {d.status === 'ACCEPTED' && (
                        <Button className="flex-1 text-xs py-2.5" onClick={() => handleUpdateStatus(d.id, 'IN_TRANSIT')}>Start trip (pickup)</Button>
                      )}
                      {d.status === 'IN_TRANSIT' && (
                        <Button className="flex-1 text-xs py-2.5 bg-green-600 shadow-none" onClick={() => handleUpdateStatus(d.id, 'DELIVERED')}>Mark delivered</Button>
                      )}
                   </div>
                )}
              </Card>
            ))
          )}
          {!loading && deliveries.length === 0 && <p className="text-center text-gray-400 py-8 text-sm font-medium">No active deliveries.</p>}
        </div>
      )}

      {riderFound && (
        <div className="fixed inset-0 z-[200] bg-kubwa-ink/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <Card className="w-full max-w-sm p-10 text-center animate-zoom-in rounded-[2.5rem] border-none shadow-2xl">
            <div className="w-20 h-20 bg-kubwa-mart/10 text-kubwa-mart rounded-[1.75rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h3 className="font-display text-2xl font-bold text-kubwa-ink tracking-tight">Request sent!</h3>
            <p className="text-gray-500 font-semibold text-xs mt-3 leading-relaxed">
              We're finding you a rider. You can track progress from the Track Order tab.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Deliveries;
