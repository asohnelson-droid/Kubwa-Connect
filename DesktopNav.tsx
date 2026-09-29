import React from 'react';
import { ShoppingBag, Wrench, Truck, Home as HomeIcon, ShieldCheck, User as UserIcon, Store } from 'lucide-react';
import BrandMark from './BrandMark';
import ScopeChip from './ScopeChip';
import { SafeImage } from './ui';
import { cn } from './cn';
import { BRAND } from '../config/brand';
import { AppSection, User } from '../types';

interface DesktopNavProps {
  user: User | null;
  currentSection: AppSection;
  navigateTo: (section: AppSection) => void;
}

/**
 * Top navigation for tablets, laptops and desktops (md, 768px and up).
 * Phones keep the bottom tab bar; this bar is hidden below md.
 */
const DesktopNav: React.FC<DesktopNavProps> = ({ user, currentSection, navigateTo }) => {
  const links = [
    { id: AppSection.HOME, label: 'Home', icon: HomeIcon },
    { id: AppSection.MART, label: 'Mart', icon: ShoppingBag },
    { id: AppSection.FIXIT, label: 'FixIt', icon: Wrench },
    { id: AppSection.RIDE, label: 'Ride', icon: Truck },
  ];
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <header className="hidden md:block shrink-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 z-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center gap-4 lg:gap-8">
        <button type="button" onClick={() => navigateTo(AppSection.HOME)} className="flex items-center gap-2.5 shrink-0" aria-label={`${BRAND.name} home`}>
          <span className="w-9 h-9 rounded-xl bg-kubwa-ink p-1.5 flex items-center justify-center"><BrandMark className="w-full h-full" /></span>
          <span className="font-display text-lg font-bold text-kubwa-ink tracking-tight">{BRAND.name}</span>
        </button>

        <nav aria-label="Main" className="flex items-center gap-1">
          {links.map(link => {
            const active = currentSection === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => navigateTo(link.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-sm font-bold transition-colors',
                  active ? 'bg-kubwa-primary/10 text-kubwa-primary' : 'text-gray-600 hover:text-kubwa-ink hover:bg-gray-100'
                )}
              >
                <link.icon size={16} strokeWidth={active ? 2.5 : 2} /> {link.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ScopeChip user={user} className="hidden lg:flex w-56" />
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigateTo(AppSection.ADMIN)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors',
                currentSection === AppSection.ADMIN ? 'bg-kubwa-ink text-white' : 'text-gray-600 hover:bg-gray-100')}
            >
              <ShieldCheck size={16} /> Admin
            </button>
          )}
          {user ? (
            <button
              type="button"
              onClick={() => navigateTo(AppSection.ACCOUNT)}
              className={cn('flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-2xl border transition-colors',
                currentSection === AppSection.ACCOUNT ? 'border-kubwa-primary bg-kubwa-primary/5' : 'border-gray-200 hover:border-gray-300')}
            >
              <span className="w-8 h-8 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                <SafeImage src={user.avatar} alt="" className="w-full h-full object-cover" fallbackIcon={user.role === 'VENDOR' ? <Store size={16} /> : <UserIcon size={16} />} />
              </span>
              <span className="text-sm font-bold text-kubwa-ink max-w-[140px] truncate">{user.storeName || user.name}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigateTo(AppSection.ACCOUNT)}
              className="px-5 py-2.5 rounded-xl bg-kubwa-primary text-white text-sm font-bold hover:brightness-110"
            >
              Sign in / Join
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DesktopNav;
