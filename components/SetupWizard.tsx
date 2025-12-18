

import React, { useState } from 'react';
import { Camera, Bell, Check, ArrowRight, User, Tag } from 'lucide-react';
import { Button, Input, Card } from './ui';
import { api } from '../services/data';

interface SetupWizardProps {
  userId: string;
  onComplete: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Profile
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 2: Interests
  const [interests, setInterests] = useState<string[]>([]);
  const interestOptions = ['Groceries', 'Fashion', 'Electronics', 'Home Repairs', 'Cleaning', 'Logistics', 'Tutoring', 'Beauty'];

  // Step 3: Notifications (Permission request is mostly browser/native based, this is visual)
  const [notifsEnabled, setNotifsEnabled] = useState(true);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    // Save data via API
    const success = await api.users.completeSetup(userId, {
      bio,
      interests,
      settings: { notifications: notifsEnabled },
      avatar: avatarPreview // In real app, upload this first
    });
    setLoading(false);
    
    if (success) {
      onComplete();
    } else {
      alert("Failed to save setup. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 w-full">
          <div className="h-full bg-kubwa-green transition-all duration-500" style={{ width: `${(step/3)*100}%` }}></div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="animate-fade-in text-center">
               <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <User size={32} />
               </div>
               <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete your Profile</h2>
               <p className="text-gray-500 text-sm mb-6">Help the community recognize you.</p>
               
               <div className="mb-6 flex flex-col items-center gap-3">
                  <div className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                     {avatarPreview ? (
                       <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <Camera className="text-gray-400" />
                     )}
                     <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                  </div>
                  <span className="text-xs text-blue-600 font-bold">Upload Photo</span>
               </div>

               <div className="text-left">
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Short Bio</label>
                  <textarea 
                    className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:border-kubwa-green" 
                    rows={3}
                    placeholder="e.g. I live in Phase 4 and love fresh fruits."
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in text-center">
               <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Tag size={32} />
               </div>
               <h2 className="text-2xl font-bold text-gray-900 mb-2">What are you into?</h2>
               <p className="text-gray-500 text-sm mb-6">We'll customize your feed based on your needs.</p>
               
               <div className="flex flex-wrap gap-2 justify-center">
                  {interestOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => toggleInterest(opt)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        interests.includes(opt) 
                          ? 'bg-kubwa-orange text-white shadow-md transform scale-105' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in text-center">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Bell size={32} />
               </div>
               <h2 className="text-2xl font-bold text-gray-900 mb-2">Stay Updated</h2>
               <p className="text-gray-500 text-sm mb-6">Get alerts for order updates and rider arrivals.</p>
               
               <div 
                 onClick={() => setNotifsEnabled(!notifsEnabled)}
                 className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${notifsEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
               >
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-full ${notifsEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        <Bell size={20} />
                     </div>
                     <div className="text-left">
                        <h4 className="font-bold text-gray-900">Push Notifications</h4>
                        <p className="text-xs text-gray-500">Instant updates on your activity</p>
                     </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${notifsEnabled ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                     {notifsEnabled && <Check size={14} className="text-white" />}
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
           {step > 1 ? (
             <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
           ) : (
             <div></div>
           )}
           
           <Button 
             className="flex items-center gap-2 px-8" 
             onClick={() => step < 3 ? setStep(step + 1) : handleFinish()}
             disabled={loading}
           >
             {loading ? 'Saving...' : step === 3 ? 'Get Started' : 'Next'} 
             {!loading && <ArrowRight size={18} />}
           </Button>
        </div>
      </Card>
    </div>
  );
};

export default SetupWizard;
