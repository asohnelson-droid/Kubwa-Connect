import React, { useEffect, useState } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { api, AREA_SUGGESTIONS } from '../services/data';
import { NgState, Lga, City } from '../types';

export interface LocationValue {
  stateId?: number;
  lgaId?: number;
  area: string;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  /** Shows the "not live yet" note written for vendors, riders and artisans. */
  role?: string;
  showArea?: boolean;
}

const selectClass = 'w-full p-4 bg-gray-50 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-kubwa-primary/20 disabled:opacity-60';

/**
 * State, then LGA, then a free-text area. State and LGA come from the fixed
 * national list so every listing, rider and delivery can be matched by place.
 */
const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange, role, showArea = true }) => {
  const [states, setStates] = useState<NgState[]>([]);
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingLgas, setLoadingLgas] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([api.locations.getStates(), api.locations.getCities()])
      .then(([s, c]) => {
        setStates(s);
        setCities(c);
        if (!s.length) setLoadError("Couldn't load the list of states. Check your connection and try again.");
      })
      .catch(() => setLoadError("Couldn't load the list of states. Check your connection and try again."));
  }, []);

  useEffect(() => {
    if (!value.stateId) { setLgas([]); return; }
    setLoadingLgas(true);
    api.locations.getLgas(value.stateId)
      .then(setLgas)
      .finally(() => setLoadingLgas(false));
  }, [value.stateId]);

  const selectedLga = lgas.find(l => l.id === value.lgaId);
  const city = selectedLga?.cityId ? cities.find(c => c.id === selectedLga.cityId) : undefined;
  const suggestions = selectedLga ? AREA_SUGGESTIONS[selectedLga.name] || [] : [];
  const isSupplyRole = role === 'VENDOR' || role === 'RIDER' || role === 'PROVIDER';

  let note: string | null = null;
  if (selectedLga) {
    if (city?.isLive) {
      note = null;
    } else if (city) {
      note = isSupplyRole
        ? `We're not live in ${city.name} yet. Sign up now: your ${role === 'RIDER' ? 'rider profile' : role === 'PROVIDER' ? 'services' : 'shop'} goes live the day ${city.name} opens.`
        : `We're not live in ${city.name} yet. You can still shop from live cities and use pickup.`;
    } else {
      note = isSupplyRole
        ? `${selectedLga.name} isn't in one of our launch cities yet. Sign up now and we'll count you towards opening your area.`
        : `${selectedLga.name} isn't in one of our launch cities yet. You can still shop from live cities and use pickup.`;
    }
  }

  return (
    <div className="space-y-3">
      {loadError && <p className="text-xs font-semibold text-red-600 px-2">{loadError}</p>}
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 ml-2">State</label>
        <select
          className={selectClass}
          value={value.stateId ?? ''}
          onChange={e => onChange({ stateId: e.target.value ? Number(e.target.value) : undefined, lgaId: undefined, area: value.area })}
        >
          <option value="">Choose your state</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 ml-2 flex items-center gap-1.5">
          Local government area {loadingLgas && <Loader2 size={12} className="animate-spin" />}
        </label>
        <select
          className={selectClass}
          value={value.lgaId ?? ''}
          disabled={!value.stateId || loadingLgas}
          onChange={e => onChange({ ...value, lgaId: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">{value.stateId ? 'Choose your LGA' : 'Choose a state first'}</option>
          {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      {showArea && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 ml-2">Area or neighbourhood</label>
          <input
            className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-kubwa-primary/20"
            placeholder={suggestions[0] ? `e.g. ${suggestions[0]}` : 'e.g. your estate or district'}
            value={value.area}
            list="area-suggestions"
            onChange={e => onChange({ ...value, area: e.target.value })}
          />
          <datalist id="area-suggestions">
            {suggestions.map(a => <option key={a} value={a} />)}
          </datalist>
        </div>
      )}
      {note && (
        <div className="p-3 bg-kubwa-fixit/10 text-kubwa-fixitText rounded-2xl text-xs font-semibold flex gap-2 items-start">
          <Info size={14} className="shrink-0 mt-0.5" /> {note}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
