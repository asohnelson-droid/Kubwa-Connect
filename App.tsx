
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home as HomeIcon, ShoppingBag, Wrench, Truck, User, Bot, MessageSquare, Shield, Bell, Loader2, X, AlertTriangle } from 'lucide-react';
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
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    {role: 'model', text: 'Hello! I am KubwaBot. Ask me anything about local services or products in Kubwa.'}
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Use a ref to prevent multiple initialization calls
  const initRef = useRef(false);

  /**
   * Refreshes the local user state from the Supabase session
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await api.auth.getSession();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      console.error("User refresh failed", err);
      return null;
    }
  }, []);

  /**
   * Auto-routes merchant roles to their respective dashboards
   */
  const routeToDashboard = useCallback((u: UserType) => {
    if (!u) return;
    if (u.role === 'VENDOR') setCurrentSection(AppSection.MART);
    else if (u.role === 'RIDER') setCurrentSection(AppSection.RIDE);
    else if (u.role === 'PROVIDER') setCurrentSection(AppSection.FIXIT);
    else setCurrentSection(AppSection.HOME);
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initApp = async () => {
      try {
        const currentUser = await refreshUser();
        const hasSeenOnboarding = localStorage.getItem('kubwa_onboarding_seen') === 'true';
        
        // Logical flow: 
        // 1. If not logged in and never seen onboarding -> show onboarding
        // 2. If logged in and setup complete -> route to dashboard
        if (!currentUser && !hasSeenOnboarding) {
          setShowOnboarding(true);
        } else if (currentUser && currentUser.isSetupComplete) {
          routeToDashboard(currentUser);
        }
      } catch (e) {
        console.error("Critical App Init Failure", e);
      } finally {
        // Ensure splash screen always resolves within a reasonable time
        setTimeout(() => setIsInitializing(false), 800);
      }
    };

    initApp();

    // Global Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth Event]: ${event}`);
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        const u = await refreshUser();
        // If they just signed in and are already setup, send them home or to dashboard
        if (event === 'SIGNED_IN' && u?.isSetupComplete) {
           routeToDashboard(u);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentSection(AppSection.HOME);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, routeToDashboard]);

  /**
   * Final step after Setup Wizard completes
   */
  const handleSetupComplete = async () => {
    setIsInitializing(true);
    const updatedUser = await refreshUser();
    setIsInitializing(false);

    if (updatedUser) {
      routeToDashboard(updatedUser);
    }
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
    localStorage.setItem('kubwa_cart', JSON.stringify(cart));
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
    // Admin access guard
    if (currentSection === AppSection.ADMIN && user?.role !== 'ADMIN') {
        return <Home setSection={setCurrentSection} user={user} setAuthIntent={setAuthIntent} />;
    }

    switch (currentSection) {
      case AppSection.HOME: 
        return <Home setSection={setCurrentSection} user={user} setAuthIntent={setAuthIntent} />;
      case AppSection.MART: 
        return <Mart addToCart={addToCart} cart={cart} setCart={setCart} user={user} onRequireAuth={() => setCurrentSection(AppSection.ACCOUNT)} setSection={setCurrentSection} refreshUser={refreshUser} />;
      case AppSection.FIXIT: 
        return <FixIt user={user} onRequireAuth={() => setCurrentSection(AppSection.ACCOUNT)} setSection={setCurrentSection} refreshUser={refreshUser} />;
      case AppSection.RIDE: 
        return <Deliveries user={user} onRequireAuth={() => setCurrentSection(AppSection.ACCOUNT)} setSection={setCurrentSection} refreshUser={refreshUser} />;
      case AppSection.ADMIN: 
        return <Admin currentUser={user} />;
      case AppSection.ACCOUNT: 
        return <Account user={user} setUser={setUser} setSection={setCurrentSection} authIntent={authIntent} refreshUser={refreshUser} />;
      case AppSection.ABOUT:
      case AppSection.PRIVACY:
      case AppSection.TERMS:
      case AppSection.CONTACT:
      case AppSection.FAQ:
        return <InfoPages section={currentSection} setSection={setCurrentSection} />;
      default: 
        return <Home setSection={setCurrentSection} user={user} setAuthIntent={setAuthIntent} />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center animate-fade-in">
         <div className="w-20 h-20 bg-kubwa-green rounded-[2.5rem] shadow-2xl shadow-kubwa-green/20 flex items-center justify-center mb-8 animate-bounce">
            <span className="text-4xl text-white">⚡</span>
         </div>
         <Loader2 className="animate-spin text-kubwa-green mb-4" size={40} strokeWidth={3} />
         <div className="flex flex-col items-center">
            <p className="text-gray-900 font-black uppercase tracking-[0.2em] text-[11px]">Connecting</p>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-1">Kubwa Super App</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans border-x border-gray-100">
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      
      {/* Setup Wizard Overlay - Block interactions until complete profile created */}
      {user && !user.isSetupComplete && (
        <SetupWizard user={user} onComplete={handleSetupComplete} />
      )}

      <div className="h-screen overflow-y-auto no-scrollbar bg-white">
         {renderContent()}
      </div>

      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 py-5 flex justify-between items-center z-40 rounded-t-[3rem] shadow-2xl">
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
            className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${currentSection === item.id ? 'text-kubwa-green' : 'text-gray-300'}`}
          >
            <item.icon size={24} strokeWidth={currentSection === item.id ? 3 : 2} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${currentSection === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* AI Assistant Button */}
      <button 
        onClick={() => setAiChatOpen(true)}
        className="fixed bottom-28 right-6 bg-gray-900 text-white p-5 rounded-[2rem] shadow-2xl z-40 active:scale-90 transition-all group border-4 border-white"
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* AI Chat Modal */}
      {aiChatOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setAiChatOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[3rem] h-[75vh] flex flex-col shadow-2xl overflow-hidden animate-slide-in-bottom">
             <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <div className="bg-kubwa-green p-3 rounded-2xl shadow-xl shadow-kubwa-green/20"><Bot size={20} /></div>
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-widest">Assistant</h3>
                   <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Online</span>
                   </div>
                 </div>
               </div>
               <button onClick={() => setAiChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-gray-50/50">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-bold shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-kubwa-green text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex gap-1.5 p-5 bg-white border border-gray-100 rounded-[2rem] rounded-tl-none w-20 justify-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
             </div>

             <form onSubmit={handleAiSubmit} className="p-6 bg-white border-t border-gray-100 flex gap-3">
               <input 
                 className="flex-1 bg-gray-100 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-kubwa-green/10 transition-all"
                 placeholder="How can I help you today?"
                 value={aiInput}
                 onChange={e => setAiInput(e.target.value)}
               />
               <button type="submit" className="bg-kubwa-green text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center">
                 <MessageSquare size={24} />
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
