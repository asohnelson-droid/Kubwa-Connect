
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
import AuthModal from './components/AuthModal';
import { askKubwaAssistant } from './services/ai';
import { api } from './services/data';
import { supabase } from './services/supabase';

function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [user, setUser] = useState<UserType | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('kubwa_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });

  const [authIntent, setAuthIntent] = useState<{ section: AppSection; role: UserRole } | null>(null);
  const [recoveryModal, setRecoveryModal] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    {role: 'model', text: 'Hello! I am KubwaBot. Ask me anything about local services or products in Kubwa.'}
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const initRef = useRef(false);

  // Centralized routing logic
  const routeToDashboard = useCallback((u: UserType, targetSection?: AppSection) => {
    if (!u || !u.isSetupComplete) return;
    if (targetSection) {
      setCurrentSection(targetSection);
      return;
    }
    if (u.role === 'VENDOR') setCurrentSection(AppSection.MART);
    else if (u.role === 'RIDER') setCurrentSection(AppSection.RIDE);
    else if (u.role === 'PROVIDER') setCurrentSection(AppSection.FIXIT);
    else if (u.role === 'ADMIN') setCurrentSection(AppSection.ADMIN);
    else setCurrentSection(AppSection.HOME);
  }, []);

  // Fetch session and update user state
  const refreshUser = useCallback(async (targetSection?: AppSection) => {
    try {
      const currentUser = await api.auth.getSession();
      setUser(currentUser);
      if (currentUser && currentUser.isSetupComplete) {
        routeToDashboard(currentUser, targetSection);
      }
      return currentUser;
    } catch (err) {
      console.error("Session refresh failed", err);
      return null;
    }
  }, [routeToDashboard]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initApp = async () => {
      // 1. Resolve Auth State
      const currentUser = await refreshUser();
      
      // 2. Check Onboarding
      const hasSeenOnboarding = localStorage.getItem('kubwa_onboarding_seen') === 'true';
      if (!currentUser && !hasSeenOnboarding) {
        setShowOnboarding(true);
      }

      // 3. Complete Initialization
      setIsInitializing(false);
    };

    initApp();

    // Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth Event]: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const u = await refreshUser();
        // If we were waiting to login to go somewhere specific, do it now
        if (u && authIntent) {
          routeToDashboard(u, authIntent.section);
          setAuthIntent(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentSection(AppSection.HOME);
        setAuthIntent(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, authIntent, routeToDashboard]);

  const handleSetupComplete = (updatedUser: UserType) => {
    setUser(updatedUser);
    routeToDashboard(updatedUser, authIntent?.section);
    setAuthIntent(null);
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  useEffect(() => {
    if (cart.length > 0) {
      try {
        localStorage.setItem('kubwa_cart', JSON.stringify(cart));
      } catch (e) {
        // If storage is full, we stop saving the cart to prioritize the session
        console.warn("Cart storage failed, prioritizing auth session space.");
      }
    }
  }, [cart]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiLoading(true);
    try {
      const result = await askKubwaAssistant(userMsg);
      setAiMessages(prev => [...prev, { role: 'model', text: result.message }]);
      if (result.suggestedAction === 'SEARCH_MART') setCurrentSection(AppSection.MART);
      else if (result.suggestedAction === 'SEARCH_SERVICES') setCurrentSection(AppSection.FIXIT);
      else if (result.suggestedAction === 'BOOK_RIDE') setCurrentSection(AppSection.RIDE);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'model', text: "Connection error. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const renderContent = () => {
    if (currentSection === AppSection.ADMIN && user?.role !== 'ADMIN') {
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
            <span className="text-white text-2xl">⚡</span>
         </div>
         <p className="mt-6 text-xs font-black uppercase tracking-widest text-gray-400">Syncing Community...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans border-x border-gray-100">
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      {user && !user.isSetupComplete && <SetupWizard user={user} onComplete={handleSetupComplete} />}
      {recoveryModal && (
        <AuthModal 
          initialMode="UPDATE_PASSWORD" 
          onClose={() => setRecoveryModal(false)} 
          onSuccess={() => { setRecoveryModal(false); refreshUser(); }}
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
          { id: AppSection.ACCOUNT, icon: User, label: user ? 'Profile' : 'Sign In' }
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
      <button onClick={() => setAiChatOpen(true)} className="fixed bottom-28 right-6 bg-gray-900 text-white p-4 rounded-2xl shadow-xl z-40 active:scale-95 transition-all"><Bot size={24} /></button>
      {aiChatOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAiChatOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-slide-in-bottom">
             <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
               <div className="flex items-center gap-3"><Bot size={20} /><h3 className="text-sm font-black uppercase tracking-widest">KubwaBot</h3></div>
               <button onClick={() => setAiChatOpen(false)}><X size={20} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-gray-50">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-bold ${m.role === 'user' ? 'bg-kubwa-green text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
             </div>
             <form onSubmit={handleAiSubmit} className="p-4 bg-white border-t flex gap-2">
               <input className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" placeholder="Ask anything..." value={aiInput} onChange={e => setAiInput(e.target.value)} />
               <button type="submit" className="bg-kubwa-green text-white p-3 rounded-xl"><MessageSquare size={18} /></button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
