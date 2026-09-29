import React, { useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Button, Card } from './ui';
import LocationPicker, { LocationValue } from './LocationPicker';
import { api } from '../services/data';
import { User } from '../types';

interface LocationPromptProps {
  user: User;
  onSaved: () => void;
}

/** One-time prompt for members who finished setup before location was required. */
const LocationPrompt: React.FC<LocationPromptProps> = ({ user, onSaved }) => {
  const [location, setLocation] = useState<LocationValue>({ stateId: user.stateId, lgaId: user.lgaId, area: user.area || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!location.lgaId) { setError('Please choose your state and local government area.'); return; }
    setSaving(true);
    setError('');
    const result = await api.auth.updateProfile(user.id, { lgaId: location.lgaId, area: location.area.trim() || undefined });
    setSaving(false);
    if (result.success) onSaved();
    else setError(result.error || "Couldn't save your location. Please try again.");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-kubwa-ink/95 flex items-center justify-center p-4 backdrop-blur-xl">
      <Card className="w-full max-w-md bg-white rounded-[2.25rem] p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="w-12 h-12 rounded-2xl bg-kubwa-primary/10 text-kubwa-primary flex items-center justify-center mb-4"><MapPin size={22} /></div>
        <h2 className="font-display text-xl font-bold text-kubwa-ink mb-1">Where are you based?</h2>
        <p className="text-sm text-gray-500 font-medium mb-6">We now serve all of Nigeria. Your location decides which shops, artisans and riders you see.</p>
        <LocationPicker value={location} onChange={setLocation} role={user.role} />
        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
        <Button className="w-full mt-6" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : 'Save location'}
        </Button>
      </Card>
    </div>
  );
};

export default LocationPrompt;
