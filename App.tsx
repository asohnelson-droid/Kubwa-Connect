
import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, ShoppingBag, Wrench, Truck, User, Bot, MessageSquare, Shield, Bell, Loader2 } from 'lucide-react';
import { AppSection, UserRole, CartItem, User as UserType, PushNotification } from './types';
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
  const [role, setRole] = useState<UserRole>('USER');
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Persistent Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('kubwa_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error("Failed to load cart", e);
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kubwa_cart', JSON.stringify(cart));
  }, [cart]);
  
  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Navigation Intent State (New)
  const [authIntent, setAuthIntent] = useState<{ section: AppSection; role: UserRole } | null>(null);
  
  // AI State
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    {role: 'model', text: 'Hello! I am KubwaBot. Ask me anything about local services or products.'}
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Push Notification State
  const [pushNotification, setPushNotification] = useState<PushNotification | null>(null);

  // Check for active session and Onboarding status on load
  useEffect(() => {
    const initApp = async () => {
      // Check Auth
      await refreshUser();

      // Check Onboarding
      const hasSeen = localStorage.getItem('kubwa_onboarding_seen');
      
      // Show onboarding if not seen
      if (!hasSeen) {
        setShowOnboarding(true);
      }
      
      // Stop loading
      setIsInitializing(false);
    };
    initApp();

    // Setup Auth Listener for robust session persistence
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole('USER');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update role when user changes
  useEffect(() => {
    if (user) {
      setRole(user.role);
    } else {
      setRole('USER');
    }
  }, [user]);

  const refreshUser = async () => {
    const currentUser = await api.auth.getSession();
    setUser(currentUser);
    if (currentUser) {
       setRole(currentUser.role);
    }
  };

  // Global Chat/Notification Handler (Passed to child pages)
  const handleGlobalNotificationTrigger = async () => {
    // Simulates an incoming push
    const notification = await api.notifications.simulatePush();
    setPushNotification(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setPushNotification(null);
    }, 5000);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('kubwa_onboarding_seen', 'true');
    setShowOnboarding(false);
  };
  
  const handleSetupComplete = async () => {
    // Optimistic update to clear the wizard immediately without waiting for network
    if (user) {
        setUser({ ...user, isSetupComplete: true });
    }
    // Then fetch real state to sync up
    await refreshUser();
  };

  const handleRequireAuth = () => {
    // Redirect guest to Account page to login
    setCurrentSection(AppSection.ACCOUNT);
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

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiInput('');
    setAiLoading(true);

    const result = await askKubwaAssistant(userMsg);
    
    setAiMessages(prev => [...prev, { role: 'model', text: result.message }]);
    setAiLoading(false);

    if (result.suggestedAction === 'SEARCH_MART') setCurrentSection(AppSection.MART);
    if (result.suggestedAction === 'SEARCH_SERVICES') setCurrentSection(AppSection.FIXIT);
    if (result.suggestedAction === 'BOOK_RIDE') setCurrentSection(AppSection.RIDE);
  };

  const renderContent = () => {
    const props = {
      triggerNotification: handleGlobalNotificationTrigger,
      refreshUser: refreshUser
    };

    // --- SECURITY BOUNCER ---
    // 1. If trying to access ADMIN but NOT logged in -> Go to Account (Login)
    if (currentSection === AppSection.ADMIN && !user) {
        return <Account user={null} setUser={setUser} setSection={setCurrentSection} refreshUser={refreshUser} />;
    }
    
    // 2. If trying to access ADMIN but role is NOT 'ADMIN' -> Access Denied, Show Home
    if (currentSection === AppSection.ADMIN && user?.role !== 'ADMIN') {
        return <Home setSection={setCurrentSection} user={user} setAuthIntent={setAuthIntent} />;
    }

    switch (currentSection) {
      case AppSection.HOME: 
        return <Home setSection={setCurrentSection} user={user} setAuthIntent={setAuthIntent} />;
      case AppSection.MART: 
        return <Mart addToCart={addToCart} cart={cart} setCart={setCart} user={user} onRequireAuth={handleRequireAuth} setSection={setCurrentSection} refreshUser={refreshUser} />;
      case AppSection.FIXIT: 
        return <FixIt user={user} onRequireAuth={handleRequireAuth} setSection={setCurrentSection} refreshUser={refreshUser} />;
      case AppSection.RIDE: 
        return <Deliveries user={user} onRequireAuth={handleRequireAuth} setSection={setCurrentSection} refreshUser={refreshUser} />;
      case AppSection.ADMIN: 
        return <Admin currentUser={user} />;
      case AppSection.ACCOUNT: 
        return <Account user={user} setUser={setUser} setSection={setCurrentSection} authIntent={authIntent} {...props} />;
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

  // Full screen loader
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center animate-fade-in">
         <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4">
            <span className="text-3xl">⚡</span>
         </div>
         <Loader2 className="animate-spin text-kubwa-orange mb-2" size={32} />
         <p className="text-gray-500 font-bold text-sm">Starting Kubwa Connect...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans">
      {/* Onboarding Overlay (First Launch) */}
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {/* Post-Signup Setup Wizard (Logged in but incomplete) */}
      {user && !user.isSetupComplete && <SetupWizard userId={user.id} onComplete={handleSetupComplete} />}

      {/* Global Push Notification Banner */}
      {pushNotification && (
        <div 
          onClick={() => {
            if (pushNotification.deepLink) setCurrentSection(pushNotification.deepLink);
            setPushNotification(null);
          }}
          className="fixed top-4 left-4 right-4 z-[100] bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-3 border border-gray-100 flex items-start gap-3 animate-slide-in-bottom cursor-pointer"
        >
          <div className={`p-2 rounded-xl shrink-0 ${pushNotification.icon === 'ride' ? 'bg-blue-100 text-blue-600' : pushNotification.icon === 'mart' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
             {pushNotification.icon === 'ride' && <Truck size={20} />}
             {pushNotification.icon === 'mart' && <ShoppingBag size={20} />}
             {(pushNotification.icon === 'fixit' || !pushNotification.icon) && <Wrench size={20} />}
          </div>
          <div className="flex-1">
             <div className="flex justify-between items-start">
               <h4 className="font-bold text-sm text-gray-900">{pushNotification.title}</h4>
               <span className="text-[10px] text-gray-400">now</span>
             </div>
             <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{pushNotification.body}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="h-screen overflow-y-auto no-scrollbar bg-white">
         {renderContent()}
      </div>

      {/* AI Assistant FAB */}
      <button 
        onClick={() => setAiChatOpen(true)}
        className="fixed bottom-24 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-full shadow-lg z-30 animate-bounce"
        style={{maxWidth: '420px', left: 'auto'}}
      >
        <Bot size={24} />
      </button>

      {/* AI Modal */}
      {aiChatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl h-[500px] flex flex-col shadow-2xl">
             <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl">
               <div className="flex items-center gap-2">
                 <Bot size={20} />
                 <span className="font-bold">KubwaBot</span>
               </div>
               <button onClick={() => setAiChatOpen(false)} className="text-white/80 hover:text-white">✕</button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {aiLoading && <div className="text-xs text-gray-500 ml-2">Thinking...</div>}
             </div>
             <form onSubmit={handleAiSubmit} className="p-3 border-t bg-white flex gap-2">
               <input 
                 className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                 placeholder="Search products or services..."
                 value={aiInput}
                 onChange={e => setAiInput(e.target.value)}
               />
               <button type="submit" className="bg-blue-600 text-white p-2 rounded-full">
                 <MessageSquare size={18} />
               </button>
             </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40">
        <button 
          onClick={() => setCurrentSection(AppSection.HOME)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentSection === AppSection.HOME ? 'text-kubwa-green' : 'text-gray-400'}`}
        >
          <HomeIcon size={24} strokeWidth={currentSection === AppSection.HOME ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => setCurrentSection(AppSection.MART)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentSection === AppSection.MART ? 'text-kubwa-green' : 'text-gray-400'}`}
        >
          <ShoppingBag size={24} strokeWidth={currentSection === AppSection.MART ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Mart</span>
        </button>
        <button 
          onClick={() => setCurrentSection(AppSection.FIXIT)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentSection === AppSection.FIXIT ? 'text-kubwa-green' : 'text-gray-400'}`}
        >
          <Wrench size={24} strokeWidth={currentSection === AppSection.FIXIT ? 2.5 : 2} />
          <span className="text-[10px] font-medium">FixIt</span>
        </button>
        <button 
          onClick={() => setCurrentSection(AppSection.RIDE)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentSection === AppSection.RIDE ? 'text-kubwa-green' : 'text-gray-400'}`}
        >
          <Truck size={24} strokeWidth={currentSection === AppSection.RIDE ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Ride</span>
        </button>
        <button 
          onClick={() => setCurrentSection(AppSection.ACCOUNT)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentSection === AppSection.ACCOUNT ? 'text-kubwa-green' : 'text-gray-400'}`}
        >
          <User size={24} strokeWidth={currentSection === AppSection.ACCOUNT ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{user ? 'Account' : 'Sign In'}</span>
        </button>
      </div>
    </div>
  );
}

export default App;
