
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home as HomeIcon, ShoppingBag, Wrench, Truck, User, Bot, MessageSquare, Loader2, X } from 'lucide-react';
import { AppSection, UserRole, CartItem, User as UserType } from './types';
import Home from './pages/Home';
import Mart from './pages/Mart';
import FixIt from './pages/FixIt';
import Deliveries from './pages/Deliveries';
import Admin from './pages/Admin';
import Account from './pages/Account';
import InfoPages from './pages/InfoPages';
import Onboarding from './pages/Onboarding';
import SetupWizard from './components/SetupWizard';
import { askKubwaAssistant } from './services/ai';
import { api } from './services/data';
import { supabase } from './services/supabase';
import { useData } from './contexts/DataContext';

function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [user, setUser] = useState<UserType | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isRefreshingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Use DataContext for cart state
  const { cart, setCart, addToCart } = useData();
  
  const [authIntent, setAuthIntent] = useState<{ section: AppSection; role: UserRole } | null>(null);

  /**
   * STABLE USER REFRESH
   */
  const refreshUser = useCallback(async (targetSection?: AppSection) => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      const currentUser = await api.auth.getSession();
      setUser(currentUser);
      if (currentUser && targetSection) {
        setCurrentSection(targetSection);
      }
      return currentUser;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  /**
   * APP LIFECYCLE
   */
  useEffect(() => {
    let mounted = true;

    const bootApp = async () => {
      if (hasInitializedRef.current) return;
      
      const currentUser = await refreshUser();
      if (!mounted) return;

      let hasSeenOnboarding = false;
      try {
        hasSeenOnboarding = localStorage.getItem('kubwa_onboarding_seen') === 'true';
      } catch (e) {}
      
      // CRITICAL: Onboarding only if truly first time and NOT logged in
      if (!currentUser && !hasSeenOnboarding) {
        setShowOnboarding(true);
      }

      setIsInitializing(false);
      hasInitializedRef.current = true;
    };

    bootApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Avoid looping if we're already initializing
      if (isInitializing && hasInitializedRef.current) return;

      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        if (mounted) await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setCurrentSection(AppSection.HOME);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUser, isInitializing]);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem('kubwa_onboarding_seen', 'true');
    } catch (e) {
      localStorage.removeItem('kubwa_cart');
      try {
        localStorage.setItem('kubwa_onboarding_seen', 'true');
      } catch (retryErr) {}
    }
    setShowOnboarding(false);
  };

  const renderContent = () => {
    if (currentSection === AppSection.ADMIN && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return <Home setSection={setCurrentSection} user={user} setAuthIntent={setAuthIntent} />;
    }

    switch (currentSection) {
      case AppSection.HOME: return <Home setSection={setCurrentSection} user={user} setAuthIntent={setAuthIntent} />;
      case AppSection.MART: return <Mart addToCart={addToCart} cart={cart} setCart={setCart} user={user} onRequireAuth={() => setCurrentSection(AppSection.ACCOUNT)} setSection={setCurrentSection} refreshUser={refreshUser} />;
      case AppSection.FIXIT: return <FixIt user={user} onRequireAuth={() => setCurrentSection(AppSection.ACCOUNT)} setSection={setCurrentSection} refreshUser={refreshUser} />;
      case AppSection.RIDE: return <Deliveries user={user} onRequireAuth={() => setCurrentSection(AppSection.ACCOUNT)} setSection={setCurrentSection} refreshUser={refreshUser} />;
      case AppSection.ADMIN: return <Admin currentUser={user} />;
      case AppSection.ACCOUNT: return <Account user={user} setUser={setUser} setSection={setCurrentSection} authIntent={authIntent} clearAuthIntent={() => setAuthIntent(null)} refreshUser={refreshUser} />;
      case AppSection.ABOUT:
      case AppSection.PRIVACY:
      case AppSection.TERMS:
      case AppSection.CONTACT:
      case AppSection.FAQ: return <InfoPages section={currentSection} setSection={setCurrentSection} />;
      default: return <Home setSection={setCurrentSection} user={user} setAuthIntent={setAuthIntent} />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
         <div className="w-16 h-16 bg-kubwa-green rounded-3xl animate-bounce flex items-center justify-center shadow-xl">
            <span className="text-white text-2xl font-black">KC</span>
         </div>
         <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing App State...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans border-x border-gray-100">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {user && !user.isSetupComplete && (
        <SetupWizard 
          user={user} 
          onComplete={(updatedUser) => {
            setUser(updatedUser);
            refreshUser(updatedUser.role === 'ADMIN' ? AppSection.ADMIN : AppSection.ACCOUNT);
          }} 
        />
      )}
      
      <div className="h-screen overflow-y-auto no-scrollbar bg-white pb-32">
         {renderContent()}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-5 flex justify-between items-center z-40 rounded-t-[2.5rem] shadow-2xl">
        {[
          { id: AppSection.HOME, icon: HomeIcon, label: 'Home' },
          { id: AppSection.MART, icon: ShoppingBag, label: 'Mart' },
          { id: AppSection.FIXIT, icon: Wrench, label: 'FixIt' },
          { id: AppSection.RIDE, icon: Truck, label: 'Ride' },
          { id: AppSection.ACCOUNT, icon: User, label: user ? 'Profile' : 'Join' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setCurrentSection(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === item.id ? 'text-kubwa-green' : 'text-gray-300'}`}
          >
            <item.icon size={22} strokeWidth={currentSection === item.id ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
