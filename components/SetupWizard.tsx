
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check, ArrowRight, User, Loader2, Store, Phone, MapPin, Search, Navigation, AlertTriangle } from 'lucide-react';
import { Button, Input, Card } from './ui';
import { api, KUBWA_AREAS } from '../services/data';
import { User as UserType } from '../types';

interface SetupWizardProps {
  user: UserType;
  onComplete: (updatedUser: UserType) => void; 
}

const KUBWA_LANDMARKS = [
    "Arab Road, Kubwa Village", "Byazhin Across, Phase 4", "Dantata Estate, Phase 3", "Deidei Road, Phase 2",
    "FHA, Phase 2", "Fo1, Kubwa", "Gado Nasko Road", "NYSC Camp Road", "PW Bridge", "Total Station"
];

const SetupWizard: React.FC<SetupWizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState(KUBWA_AREAS[0]);
  const [imageError, setImageError] = useState('');

  const isVendor = user.role === 'VENDOR';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Strict 50KB limit to ensure we don't hit localStorage limits
      if (file.size > 50 * 1024) { 
        setImageError("This photo is too large for your passport. Use a smaller file (< 50KB).");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const updatedUser = await api.users.completeSetup(user.id, {
        bio: bio.trim(),
        avatar: avatarPreview,
        phoneNumber: phoneNumber.trim(),
        address: `${address.trim()}, ${area}`,
        storeName: isVendor ? storeName.trim() : undefined,
      });
      if (updatedUser) {
        onComplete(updatedUser);
      } else {
        alert("Memory Full: We couldn't save your profile because your phone's memory is full. Try using a smaller photo.");
      }
    } catch (err) {
      alert("Error saving profile. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/95 flex items-center justify-center p-4 backdrop-blur-xl">
      <Card className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-zoom-in">
        <div className="p-8 pb-0 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-tight">Step {step} of 2</h2>
            <div className="flex gap-1">
              <div className={`w-8 h-1.5 rounded-full ${step >= 1 ? 'bg-kubwa-green' : 'bg-gray-100'}`} />
              <div className={`w-8 h-1.5 rounded-full ${step >= 2 ? 'bg-kubwa-green' : 'bg-gray-100'}`} />
            </div>
        </div>
        <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
          {step === 1 ? (
            <div className="text-center animate-fade-in">
               <div className="relative w-32 h-32 rounded-[2.5rem] bg-gray-50 mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-gray-100">
                  {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" size={32} />}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
               </div>
               
               {imageError && (
                 <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-2 justify-center">
                   <AlertTriangle size={14} /> {imageError}
                 </div>
               )}

               <h3 className="text-xl font-black mb-2 uppercase">Your Passport</h3>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-8">Upload a small photo for identification.</p>
               <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold h-32 resize-none outline-none focus:ring-2 focus:ring-kubwa-green" placeholder="A short bio about you or your business..." value={bio} onChange={e => setBio(e.target.value)} />
            </div>
          ) : (
            <div className="animate-fade-in space-y-4">
               <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-bold uppercase mb-4 flex gap-2">
                 <Search size={14} /> Enter your contact details so clients can reach you.
               </div>
               {isVendor && <Input placeholder="Business Name" value={storeName} onChange={e => setStoreName(e.target.value)} />}
               <Input placeholder="Active Phone Number" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
               <Input placeholder="Main Street Address" value={address} onChange={e => setAddress(e.target.value)} />
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Area District</label>
                 <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-kubwa-green" value={area} onChange={e => setArea(e.target.value)}>
                   {KUBWA_AREAS.map(a => <option key={a}>{a}</option>)}
                 </select>
               </div>
            </div>
          )}
        </div>
        <div className="p-6 bg-gray-50 flex gap-2">
           {step > 1 && <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>}
           <Button className="flex-[2]" onClick={() => step < 2 ? setStep(2) : handleFinish()} disabled={loading}>
             {loading ? <Loader2 className="animate-spin" /> : step === 2 ? 'FINISH SETUP' : 'NEXT STEP'}
           </Button>
        </div>
      </Card>
    </div>
  );
};

export default SetupWizard;
