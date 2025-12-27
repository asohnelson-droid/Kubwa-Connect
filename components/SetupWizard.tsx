
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Bell, Check, ArrowRight, User, Tag, Loader2, Store, Phone, MapPin, Search, Navigation } from 'lucide-react';
import { Button, Input, Card } from './ui';
import { api, KUBWA_AREAS } from '../services/data';

interface SetupWizardProps {
  user: any;
  onComplete: () => void;
}

// Extensive list of Kubwa landmarks and streets for high-quality autocomplete simulation
const KUBWA_LANDMARKS = [
    "Arab Road, Kubwa Village",
    "Byazhin Across, Phase 4",
    "Dantata Estate, Phase 3",
    "Deidei Road, Phase 2",
    "Federal Housing Authority (FHA), Phase 2",
    "Fo1, Kubwa",
    "Gado Nasko Road, Kubwa",
    "Hamza Abdullahi Road, Kubwa",
    "Karsana East, Kubwa",
    "Kubwa Village Market Road",
    "Phase 4 Extension, Dutse",
    "PW Bridge, Phase 1",
    "Saint Mary's Road, Phase 4",
    "Sultan Dasuki Way, Phase 2",
    "Total Filling Station, Gado Nasko",
    "NYSC Orientation Camp Road",
    "Unity Clinic Road",
    "Maitama Extension, Kubwa",
    "Dutse Alhaji Market Entrance",
    "Grand Square Road, Kubwa"
];

const SetupWizard: React.FC<SetupWizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState(KUBWA_AREAS[0]);

  // Autocomplete State
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const isVendor = user.role === 'VENDOR';
  const isRider = user.role === 'RIDER';
  const isProvider = user.role === 'PROVIDER';

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (address.length > 2) {
      const filtered = KUBWA_LANDMARKS.filter(loc => 
        loc.toLowerCase().includes(address.toLowerCase())
      );
      setAddressSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [address]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const validateStep = () => {
    if (step === 1) return true;
    if (step === 2) {
      if (isVendor && !storeName) return false;
      if (!phoneNumber || phoneNumber.length < 10) return false;
      if (!address || address.length < 5) return false;
    }
    return true;
  };

  const handleFinish = async () => {
    if (!validateStep()) {
       alert("Please fill in all required fields accurately.");
       return;
    }

    try {
      setLoading(true);
      const setupData = {
        bio,
        avatar: avatarPreview,
        phoneNumber,
        address: `${address}, ${area}`,
        storeName: isVendor ? storeName : undefined,
      };
      
      const success = await api.users.completeSetup(user.id, setupData);
      if (success) {
        onComplete();
      } else {
        alert("We couldn't save your profile. Please check your connection and try again.");
      }
    } catch (err) {
      alert("An unexpected error occurred during setup.");
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
          setAddress(`GPS Location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
       });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/90 flex items-center justify-center p-4 backdrop-blur-md">
      <Card className="w-full max-w-md bg-white overflow-hidden flex flex-col max-h-[90vh] shadow-2xl rounded-[2.5rem] border-none animate-zoom-in">
        <div className="p-8 pb-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-kubwa-green uppercase tracking-[0.2em]">Profile Configuration</span>
              <span className="text-xl font-black text-gray-900 uppercase tracking-tight">Step {step} of 2</span>
            </div>
            <div className="flex gap-1.5">
              <div className={`w-8 h-2 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-kubwa-green' : 'bg-gray-100'}`} />
              <div className={`w-8 h-2 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-kubwa-green' : 'bg-gray-100'}`} />
            </div>
          </div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
          {step === 1 && (
            <div className="animate-fade-in text-center">
               <div className="w-24 h-24 bg-green-50 text-kubwa-green rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
                 <User size={48} strokeWidth={2.5} />
               </div>
               <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Your Identity</h2>
               <p className="text-gray-400 text-sm mb-8 font-medium px-4">Help the Kubwa community recognize and trust you.</p>
               
               <div className="mb-8 flex flex-col items-center gap-4">
                  <div className="relative w-36 h-36 rounded-[3rem] bg-gray-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden hover:scale-105 transition-transform group cursor-pointer ring-1 ring-gray-100">
                     {avatarPreview ? (
                       <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <Camera className="text-gray-300 group-hover:text-kubwa-green transition-colors" size={40} />
                     )}
                     <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} title="Change Profile Photo" />
                     <div className="absolute bottom-0 inset-x-0 bg-black/40 py-2 text-[8px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Change</div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-kubwa-green flex items-center gap-2">
                    <Check size={14} strokeWidth={3} /> Uploaded Profile Photo
                  </span>
               </div>

               <div className="text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-2">Short Bio (About You)</label>
                  <textarea 
                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm focus:bg-white transition-all font-medium h-28 resize-none focus:outline-none focus:ring-4 focus:ring-kubwa-green/5" 
                    placeholder="E.g. Professional tailor specializing in native wear and suits in Kubwa Phase 3..."
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
               <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-orange-50 text-kubwa-orange rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-orange-100">
                    {isVendor ? <Store size={48} /> : isRider ? <Phone size={48} /> : <MapPin size={48} />}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Locality Details</h2>
                  <p className="text-gray-400 text-sm font-medium">Verify where you're based in Kubwa.</p>
               </div>
               
               <div className="space-y-6">
                  {isVendor && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-2">Business / Store Name</label>
                      <Input placeholder="e.g. Musa's Provisions & Electronics" value={storeName} onChange={e => setStoreName(e.target.value)} />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-2">WhatsApp / Contact Phone</label>
                    <Input placeholder="080 1234 5678" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                  </div>

                  <div className="relative">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Street Address</label>
                        <button onClick={useMyLocation} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline">
                            <Navigation size={10} /> Use My Location
                        </button>
                    </div>
                    <div className="relative">
                      <Input 
                        placeholder="Start typing your street or landmark..." 
                        value={address} 
                        onChange={e => {
                            setAddress(e.target.value);
                            setShowSuggestions(true);
                        }} 
                        onFocus={() => address.length > 2 && setShowSuggestions(true)}
                      />
                      <Search size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>
                    
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div ref={suggestionRef} className="absolute z-50 w-full mt-2 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-zoom-in max-h-48 overflow-y-auto no-scrollbar">
                        {addressSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            className="w-full px-6 py-4 text-left text-sm font-bold hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3 active:bg-gray-100"
                            onClick={() => {
                              setAddress(suggestion);
                              setShowSuggestions(false);
                            }}
                          >
                            <MapPin size={16} className="text-kubwa-orange shrink-0" />
                            <span className="truncate">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-2">Select Kubwa Region</label>
                    <select 
                      className="w-full px-6 py-4 rounded-[1.2rem] border border-gray-200 bg-gray-50 text-sm font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-kubwa-green/10 transition-all appearance-none cursor-pointer"
                      value={area}
                      onChange={e => setArea(e.target.value)}
                    >
                      {KUBWA_AREAS.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex gap-4">
           {step > 1 && (
             <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading} className="flex-1 bg-white h-14 rounded-[1.2rem]">Back</Button>
           )}
           
           <Button 
             className="flex-[2] h-14 text-base rounded-[1.2rem] shadow-kubwa-green/30" 
             onClick={() => {
                if (step < 2) {
                   setStep(step + 1);
                } else {
                   handleFinish();
                }
             }}
             disabled={loading}
           >
             {loading ? <Loader2 className="animate-spin" /> : step === 2 ? 'JOIN THE COMMUNITY' : 'CONTINUE'} 
             {!loading && <ArrowRight size={20} strokeWidth={3} className="ml-2" />}
           </Button>
        </div>
      </Card>
    </div>
  );
};

export default SetupWizard;
