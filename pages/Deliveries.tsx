
import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Clock, Navigation, Loader2, Crown, CheckCircle, Search, Bookmark, Phone, Power, User as UserIcon, Minus, Plus, RefreshCw } from 'lucide-react';
import { api } from '../services/data';
import { Button, Card, Input, Badge, Breadcrumbs } from '../components/ui';
import { User, DeliveryRequest, Address, AppSection } from '../types';

interface DeliveriesProps {
  user: User | null;
  onRequireAuth: () => void;
  setSection: (section: AppSection) => void;
  refreshUser: () => void;
}

const Deliveries: React.FC<DeliveriesProps> = ({ user, onRequireAuth, setSection, refreshUser }) => {
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
    // Fix: Updated to use consolidated deliveries object
    const data = await api.deliveries.getDeliveries(user?.id);
    setDeliveries(data);
    setLoading(false);
  };
  
  const loadJobs = async () => {
    setLoading(true);
    // Fix: Using consolidated deliveries object
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
    // Fix: Updated to use consolidated deliveries object
    const success = await api.deliveries.requestDelivery({ userId: user.id, pickup, dropoff, itemType: itemType.split(' (')[0], phoneNumber });
    if (success) {
       setRiderFound(true);
       setTimeout(() => { setIsSearching(false); setRiderFound(false); setPickup(''); setDropoff(''); setPhoneNumber(''); setActiveTab('track'); }, 2000);
    } else { setIsSearching(false); alert("Failed."); }
  };
  
  // Rider Actions
  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;
    setAcceptingJob(jobId);
    // Fix: Using consolidated deliveries object
    const success = await api.deliveries.acceptDelivery(jobId, user.id);
    if (success) {
       alert("Job Accepted! Head to the pickup location.");
       setActiveTab('track'); // Switch to tracking so they see the active job
    } else {
       alert("Job no longer available.");
    }
    setAcceptingJob(null);
  };

  const handleUpdateStatus = async (jobId: string, status: 'IN_TRANSIT' | 'DELIVERED') => {
    // Fix: Using consolidated deliveries object
    const success = await api.deliveries.updateStatus(jobId, status);
    if (success) {
      loadDeliveries(); // Refresh list
    }
  };

  if (isRider && !isApprovedRider) {
      return (
          <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <Truck size={32} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Waiting for Approval</h3>
              <p className="text-gray-500 mt-2">Your rider account is pending admin verification. You cannot accept jobs yet.</p>
          </div>
      );
  }

  return (
    <div className="pb-24 pt-4 px-4 relative">
      <Breadcrumbs items={[
        { label: 'Home', onClick: () => setSection(AppSection.HOME) },
        { label: 'Ride' }
      ]} />

      {isSearching && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6 text-center animate-fade-in backdrop-blur-sm">
           {riderFound ? (
             <div className="bg-white p-8 rounded-2xl animate-zoom-in">
               <CheckCircle size={32} className="mx-auto mb-4 text-green-600" />
               <h3 className="text-xl font-bold">Request Sent!</h3>
               <p className="text-gray-500">Nearby riders have been notified.</p>
             </div>
           ) : (
             <div className="bg-white p-8 rounded-2xl animate-pulse">
               <Loader2 className="animate-spin mx-auto mb-4 text-kubwa-green" size={32} />
               <h3 className="text-xl font-bold">Locating riders...</h3>
             </div>
           )}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">KubwaRide</h2>
        {!isRider && isElite && <Badge color="bg-gray-800 text-yellow-400 border border-yellow-600">Elite Benefits</Badge>}
        {isRider && (
           <button 
             onClick={() => setRiderOnline(!riderOnline)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${riderOnline ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
           >
             <Power size={14} /> {riderOnline ? 'Online' : 'Offline'}
           </button>
        )}
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        {!isRider && (
          <button className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'request' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`} onClick={() => setActiveTab('request')}>New Request</button>
        )}
        {isRider && (
           <button className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'jobs' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`} onClick={() => setActiveTab('jobs')}>Job Board</button>
        )}
        <button className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'track' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`} onClick={() => setActiveTab('track')}>
          {isRider ? 'My Active Jobs' : 'Track Order'}
        </button>
      </div>

      {activeTab === 'request' && !isRider && (
        <Card className="space-y-6 animate-fade-in">
          <div>
            <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
              <span className="flex items-center gap-2"><MapPin size={16} className="text-kubwa-green" /> Pickup</span>
              <button onClick={handleUseLocation} className="text-xs text-blue-600 flex items-center gap-1" disabled={isLocating}>
                {isLocating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />} My Location
              </button>
            </label>
            <Input placeholder="e.g. Phase 4" value={pickup} onChange={(e) => setPickup(e.target.value)} />
            {savedAddresses.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {savedAddresses.map(addr => (
                  <button key={addr.id} onClick={() => setPickup(addr.details)} className="text-[10px] bg-gray-100 px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-200">
                    <Bookmark size={10} /> {addr.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><MapPin size={16} className="text-kubwa-orange" /> Drop-off</label>
            <Input placeholder="e.g. Gwarinpa" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
            {savedAddresses.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {savedAddresses.map(addr => (
                  <button key={addr.id} onClick={() => setDropoff(addr.details)} className="text-[10px] bg-gray-100 px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-200">
                    <Bookmark size={10} /> {addr.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
             <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
               <Phone size={16} className="text-blue-500" /> Phone Number (for updates)
             </label>
             <Input 
               placeholder="e.g. 08012345678" 
               value={phoneNumber} 
               onChange={(e) => setPhoneNumber(e.target.value)} 
               type="tel"
             />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><Package size={16} /> Item Details</label>
            <select className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white" value={itemType} onChange={(e) => setItemType(e.target.value)}>
              <option>Small Package (Document, Phone)</option>
              <option>Medium Package (Food, Clothes)</option>
              <option>Large Package (Electronics)</option>
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase">Estimated Fare</p>
              {isElite ? <p className="text-xl font-bold text-green-700">₦0 <span className="text-xs text-gray-500">(Elite)</span></p> : <p className="text-xl font-bold text-blue-900">₦800 - ₦1,200</p>}
            </div>
            <Clock className="text-blue-300" />
          </div>

          <Button className="w-full py-3" onClick={handleFindRider}>Find Rider</Button>
        </Card>
      )}

      {/* RIDER JOB BOARD */}
      {activeTab === 'jobs' && isRider && (
         <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-gray-700">Available Jobs in Kubwa</h3>
               <button onClick={loadJobs} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
               </button>
            </div>
            
            {!riderOnline && (
               <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4 text-orange-700">
                 <p className="font-bold flex items-center gap-2"><Power size={18}/> You are Offline</p>
                 <p className="text-xs">Go online to indicate availability to the system (though you can still accept jobs manually below).</p>
               </div>
            )}
            
            {loading ? <Loader2 className="animate-spin mx-auto text-kubwa-green" /> : (
               availableJobs.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl">
                     <Package size={40} className="mx-auto mb-2 opacity-20" />
                     <p>No pending jobs right now.</p>
                     <p className="text-xs">Check back in a few minutes.</p>
                  </div>
               ) : (
               availableJobs.map(job => (
                  <Card key={job.id} className="border-l-4 border-l-kubwa-green shadow-md">
                     <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                        <div>
                           <Badge color="bg-blue-100 text-blue-700 font-bold">{job.itemType}</Badge>
                           <p className="text-[10px] text-gray-400 mt-1">{new Date(job.date).toLocaleTimeString()}</p>
                        </div>
                        <span className="font-bold text-xl text-green-700">₦{job.price.toLocaleString()}</span>
                     </div>
                     <div className="space-y-3 mb-4 text-sm">
                        <div className="flex gap-3 items-start">
                           <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shadow-sm shrink-0"></div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Pickup From</p>
                              <p className="font-bold text-gray-800">{job.pickup}</p>
                           </div>
                        </div>
                        <div className="flex gap-3 items-start">
                           <div className="mt-1 w-2 h-2 rounded-full bg-orange-500 shadow-sm shrink-0"></div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Deliver To</p>
                              <p className="font-bold text-gray-800">{job.dropoff}</p>
                           </div>
                        </div>
                        {job.phoneNumber && (
                           <div className="flex gap-2 text-xs bg-gray-50 p-2 rounded text-gray-600">
                              <Phone size={14} /> Contact: {job.phoneNumber}
                           </div>
                        )}
                     </div>
                     <Button 
                       className="w-full py-3 font-bold" 
                       onClick={() => handleAcceptJob(job.id)}
                       disabled={!!acceptingJob}
                     >
                       {acceptingJob === job.id ? <Loader2 className="animate-spin" /> : 'Accept Job'}
                     </Button>
                  </Card>
               ))
            ))}
         </div>
      )}

      {/* TRACKING / ACTIVE JOBS */}
      {activeTab === 'track' && (
        <div className="space-y-4 animate-fade-in">
          {loading ? <Loader2 className="animate-spin mx-auto text-kubwa-green" /> : (
            deliveries.map(d => (
              <Card key={d.id} className="relative overflow-hidden shadow-md">
                <div className="flex justify-between mb-2">
                   <h3 className="font-bold text-gray-800">{d.itemType}</h3>
                   <Badge color={d.status==='DELIVERED'?'bg-green-100 text-green-700': d.status==='ACCEPTED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>{d.status}</Badge>
                </div>

                {/* --- LIVE MAP VIEW FOR IN_TRANSIT --- */}
                {d.status === 'IN_TRANSIT' && (
                  <div className="mb-4 relative h-48 w-full bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                     {/* Fake Map Background */}
                     <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_Abuja.png')] bg-cover bg-center"></div>
                     
                     <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-md text-xs font-bold shadow flex items-center gap-1 text-green-600 animate-pulse">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div> Live Tracking
                     </div>

                     {/* Map Controls (Visual Only) */}
                     <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                        <button className="bg-white p-1 rounded shadow text-gray-600 hover:text-black"><Plus size={14}/></button>
                        <button className="bg-white p-1 rounded shadow text-gray-600 hover:text-black"><Minus size={14}/></button>
                     </div>

                     {/* Simulated Path & Movement */}
                     <div className="absolute inset-0 flex items-center px-12">
                        {/* The Road */}
                        <div className="w-full h-1.5 bg-gray-300 rounded-full relative">
                           {/* The Progress Line */}
                           <div className="h-full bg-kubwa-green rounded-full transition-all duration-300" style={{ width: `${transitProgress}%` }}></div>
                           
                           {/* Start Point */}
                           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-green-500 rounded-full"></div>
                           
                           {/* End Point */}
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-orange-500 rounded-full"></div>
                           
                           {/* The Rider (Moving Icon) */}
                           <div 
                             className="absolute top-1/2 -translate-y-1/2 -ml-3 transition-all duration-300 z-10"
                             style={{ left: `${transitProgress}%` }}
                           >
                              <div className="bg-white p-1 rounded-full shadow-md border border-kubwa-green">
                                <Truck size={16} className="text-kubwa-green fill-red-100" />
                              </div>
                              <div className="text-[8px] font-bold bg-black text-white px-1 rounded absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                2 mins away
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
                
                {/* Rider Info (For User) */}
                {!isRider && d.riderId && d.status !== 'PENDING' && (
                   <div className="bg-gray-50 p-2 rounded mb-3 flex items-center gap-3">
                      <div className="bg-gray-200 p-2 rounded-full"><UserIcon size={16} /></div>
                      <div>
                         <p className="text-xs font-bold text-gray-500">Rider Assigned</p>
                         <p className="text-sm font-bold">Musa Rider</p>
                      </div>
                      {/* Call Button */}
                      {d.phoneNumber && (
                        <a href={`tel:${d.phoneNumber}`} className="ml-auto w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                           <Phone size={14} />
                        </a>
                      )}
                   </div>
                )}

                <div className="text-xs text-gray-500 space-y-1 pl-2 border-l-2 border-gray-200 ml-1">
                   <p><span className="font-bold text-gray-700">From:</span> {d.pickup}</p>
                   <p><span className="font-bold text-gray-700">To:</span> {d.dropoff}</p>
                   {d.phoneNumber && <p><span className="font-bold text-gray-700">Contact:</span> {d.phoneNumber}</p>}
                </div>
                
                {/* Rider Controls */}
                {isRider && d.riderId === user?.id && d.status !== 'DELIVERED' && (
                   <div className="mt-4 pt-4 border-t flex gap-2">
                      {d.status === 'ACCEPTED' && (
                        <Button className="flex-1 text-xs font-bold py-2" onClick={() => handleUpdateStatus(d.id, 'IN_TRANSIT')}>Start Trip (Pickup)</Button>
                      )}
                      {d.status === 'IN_TRANSIT' && (
                        <Button className="flex-1 text-xs bg-green-600 hover:bg-green-700 font-bold py-2" onClick={() => handleUpdateStatus(d.id, 'DELIVERED')}>Mark Delivered</Button>
                      )}
                   </div>
                )}
              </Card>
            ))
          )}
          {!loading && deliveries.length === 0 && <p className="text-center text-gray-400 py-8">No active deliveries.</p>}
        </div>
      )}
    </div>
  );
};

export default Deliveries;
