import { cn } from './cn';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { Sheet } from './ui';
import { api } from '../services/data';
import { useData } from '../contexts/DataContext';
import { City, NgState, User, BrowseLocation } from '../types';

interface ScopeChipProps {
  user?: User | null;
  /** 'light' sits on white cards; 'dark' sits on the coloured hero. */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * The "where am I browsing" control used by Home, Mart and FixIt.
 * Options: the member's own city, their state, any live city, or all of Nigeria.
 */
const ScopeChip: React.FC<ScopeChipProps> = ({ user, tone = 'light', className = '' }) => {
  const { browse, setBrowse } = useData();
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [states, setStates] = useState<NgState[]>([]);

  useEffect(() => {
    api.locations.getCities().then(setCities);
    api.locations.getStates().then(setStates);
  }, []);

  const liveCities = cities.filter(c => c.isLive);
  const myCity = user?.cityId ? cities.find(c => c.id === user.cityId) : undefined;
  const myState = user?.stateId ? states.find(s => s.id === user.stateId) : undefined;

  const options: BrowseLocation[] = [];
  if (myCity?.isLive) options.push({ scope: 'CITY', cityId: myCity.id, label: myCity.name });
  if (myState) options.push({ scope: 'STATE', stateId: myState.id, label: myState.name === 'Federal Capital Territory' ? 'All of FCT' : `All of ${myState.name} State` });
  options.push({ scope: 'NATIONAL', label: 'All Nigeria' });
  for (const c of liveCities) {
    if (c.id !== myCity?.id) options.push({ scope: 'CITY', cityId: c.id, label: c.name });
  }

  const isSelected = (o: BrowseLocation) => o.scope === browse.scope && o.cityId === browse.cityId && o.stateId === browse.stateId;

  const chipClass = tone === 'dark'
    ? 'bg-gray-50 text-kubwa-ink'
    : 'bg-white border border-gray-200 text-kubwa-ink';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('rounded-2xl px-4 py-3 flex items-center gap-2 min-w-0 text-xs font-bold', chipClass, className)}
        aria-label={`Browsing ${browse.label}. Change location`}
      >
        <MapPin size={16} className="text-kubwa-primary shrink-0" />
        <span className="truncate">{browse.label}</span>
        <ChevronDown size={14} className="text-gray-500 shrink-0 ml-auto" />
      </button>
      {/* Portalled to <body>: the chip sits inside layered hero/card sections whose
          stacking context would otherwise trap the sheet under the bottom nav. */}
      {open && createPortal(
      <Sheet isOpen={open} onClose={() => setOpen(false)} title="Where are you shopping?">
        <p className="text-xs text-gray-500 font-medium mb-4">
          Rider delivery works inside one city. Anywhere else, you can arrange pickup with the seller.
        </p>
        <div className="space-y-2">
          {options.map(o => (
            <button
              key={`${o.scope}-${o.cityId ?? ''}-${o.stateId ?? ''}`}
              type="button"
              onClick={() => { setBrowse(o); setOpen(false); }}
              className={`w-full p-4 rounded-2xl flex items-center justify-between text-sm font-bold text-left ${isSelected(o) ? 'bg-kubwa-primary/10 text-kubwa-primary' : 'bg-gray-50 text-kubwa-ink'}`}
            >
              <span>{o.label}{o.scope === 'CITY' && o.cityId === myCity?.id ? ' (your city)' : ''}</span>
              {isSelected(o) && <Check size={16} />}
            </button>
          ))}
        </div>
        {myCity && !myCity.isLive && (
          <p className="mt-4 text-xs text-gray-500 font-medium">We're not live in {myCity.name} yet. We'll let you know when it opens.</p>
        )}
      </Sheet>,
      document.body)}
    </>
  );
};

export default ScopeChip;
