
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wrench, 
  Power, 
  Star, 
  MessageSquare, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Settings,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';
import { Card, Badge, Button, Input, Breadcrumbs, Sheet } from '../components/ui';
import { api, FIXIT_SERVICES } from '../services/data';
import { User, ServiceProvider, AppSection, Review } from '../types';

interface ProviderDashboardProps {
  currentUser: User | null;
  setSection: (section: AppSection) => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ currentUser, setSection }) => {
  const [profile, setProfile] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ServiceProvider>>({});

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const proProfile = await api.providers.getMyProfile(currentUser.id);
      if (proProfile) {
        setProfile(proProfile);
        setEditForm(proProfile);
        const proReviews = await api.reviews.getByTarget(proProfile.id);
        setReviews(proReviews);
      }
    } catch (err) {
      console.error("[ProviderDashboard] Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async () => {
    if (!profile || saving) return;
    setSaving(true);
    const newStatus = !profile.available;
    const success = await api.providers.updateStatus(profile.id, newStatus);
    if (success) {
      setProfile({ ...profile, available: newStatus });
      api.notifications.send({
        title: newStatus ? "You are Online! 🟢" : "You are Offline ⚪",
        body: newStatus ? "Residents can now find and hire you for services." : "Your profile is now hidden from new search results."
      });
    }
    setSaving(false);
  };

  const handleSaveProfile = async () => {
    if (!currentUser || saving) return;
    setSaving(true);
    try {
      const success = await api.providers.updateProviderProfile(currentUser.id, editForm);
      if (success) {
        setIsEditModalOpen(false);
        await loadData();
        alert("Profile updated successfully!");
      }
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-kubwa-orange" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-black uppercase">Profile Error</h2>
        <p className="text-gray-400 text-xs mt-2">Could not retrieve your provider profile.</p>
        <Button onClick={() => setSection(AppSection.ACCOUNT)} className="mt-8">Back to Safety</Button>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-8 px-6 max-w-2xl mx-auto animate-fade-in">
      <Breadcrumbs items={[
        { label: 'Profile', onClick: () => setSection(AppSection.ACCOUNT) },
        { label: 'Pro Console' }
      ]} />

      <div className="flex justify-between items-start mb-10">
         <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Pro Console</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">Hireable as: {profile.category}</p>
         </div>
         <button 
           onClick={handleToggleStatus} 
           disabled={saving || currentUser?.status !== 'APPROVED'}
           className={`p-4 rounded-2xl shadow-xl transition-all flex items-center gap-3 ${profile.available ? 'bg-green-600 text-white shadow-green-600/20' : 'bg-gray-100 text-gray-400 shadow-none'}`}
         >
            <Power size={20} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest">{profile.available ? 'Online' : 'Offline'}</span>
         </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
         <Card className="p-6 bg-gray-900 text-white border-none rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-white/10 rounded-xl"><Star size={16} className="text-yellow-400 fill-yellow-400" /></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Reputation</span>
            </div>
            <p className="text-2xl font-black tracking-tighter">{profile.rating || '5.0'}</p>
            <p className="text-[8px] font-bold text-white/30 uppercase mt-1">Avg Star Rating</p>
         </Card>
         <Card className="p-6 bg-white border-none shadow-sm rounded-[2.5rem] group border border-gray-50">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-kubwa-orange/10 text-kubwa-orange rounded-xl"><MessageSquare size={16} /></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Jobs</span>
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-tighter">{reviews.length}</p>
            <p className="text-[8px] font-bold text-gray-300 uppercase mt-1">Reviews Received</p>
         </Card>
      </div>

      {currentUser?.status !== 'APPROVED' && (
        <Card className="p-8 bg-orange-50 border-none rounded-[2.5rem] mb-10 flex gap-4">
           <div className="p-3 bg-orange-100 rounded-2xl text-orange-600 h-fit"><Clock size={24}/></div>
           <div>
              <h4 className="font-black text-sm uppercase tracking-tight text-orange-900">Verification Pending</h4>
              <p className="text-[10px] font-bold text-orange-700 leading-relaxed mt-1 uppercase tracking-widest">Your profile will be hidden from FixIt searches until an admin verifies your identity and skills.</p>
           </div>
        </Card>
      )}

      <div className="space-y-6">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">My Service Profile</h3>
            <button onClick={() => setIsEditModalOpen(true)} className="p-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-900 hover:text-white transition-all">
               <Settings size={16} />
            </button>
         </div>

         <Card className="p-8 border-none shadow-sm rounded-[2.5rem] bg-white border border-gray-50">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-50">
               <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                  <img src={profile.image} className="w-full h-full object-cover" alt=""/>
               </div>
               <div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">{profile.name}</h4>
                  <p className="text-[10px] font-black text-kubwa-orange mt-2 uppercase tracking-widest">Verified Pro</p>
                  <div className="flex items-center gap-1 mt-3">
                     <Badge color="bg-green-50 text-green-600 font-black">₦{profile.rate.toLocaleString()}/hr</Badge>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div>
                  <h5 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Professional Bio</h5>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed italic">
                     "{profile.bio || "No professional bio provided yet. Add one to attract more clients."}"
                  </p>
               </div>

               <div>
                  <h5 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Primary Category</h5>
                  <Badge color="bg-gray-100 text-gray-900">{profile.category}</Badge>
               </div>
            </div>
         </Card>

         <div className="mt-12">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 ml-2">Client Reviews</h3>
            {reviews.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">No client feedback yet</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {reviews.map(review => (
                    <Card key={review.id} className="p-6 border-none shadow-sm rounded-[2rem] bg-white">
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-1">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} size={12} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                             ))}
                          </div>
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</span>
                       </div>
                       <p className="text-xs font-medium text-gray-600 italic">"{review.comment}"</p>
                    </Card>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* Edit Profile Sheet */}
      <Sheet isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Pro Profile">
         <div className="p-2 space-y-8 pb-24">
            <div className="space-y-6">
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Main Service Category</label>
                  <select 
                    className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-kubwa-orange transition-all"
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    {FIXIT_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>

               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Hourly Rate (₦)</label>
                  <Input type="number" placeholder="e.g. 5000" value={editForm.rate} onChange={e => setEditForm({ ...editForm, rate: Number(e.target.value) })} />
               </div>

               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Professional Bio</label>
                  <textarea 
                    className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-kubwa-orange transition-all"
                    placeholder="Describe your skills and experience..."
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  />
               </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="w-full h-16 shadow-xl shadow-kubwa-orange/20 bg-kubwa-orange">
               {saving ? <Loader2 className="animate-spin" /> : 'SAVE CHANGES'}
            </Button>
         </div>
      </Sheet>
    </div>
  );
};

export default ProviderDashboard;
