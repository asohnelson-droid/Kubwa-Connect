
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home as HomeIcon, ShoppingBag, Wrench, Truck, User, Bot, MessageSquare, Loader2, X, AlertTriangle, Clock, Bell } from 'lucide-react';
import { AppSection, UserRole, CartItem, User as UserType, PushNotification } from './types';
import Home from './pages/Home';
import Mart from './pages/Mart';
import FixIt from './pages/FixIt';
import Deliveries from './pages/Deliveries';
import Admin from './pages/Admin';
import Account from './pages/Account';
import VendorDashboard from './pages/VendorDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import InfoPages from './pages/InfoPages';
import Onboarding from './pages/Onboarding';
import SetupWizard from './components/SetupWizard';
import { askKubwaAssistant } from './services/ai';
import { api } from './services/data';
import { supabase } from './services/supabase';

const NotificationToast: React.FC<{ notification: PushNotification; onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm animate-slide-in-bottom">
      <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-[2.5rem] shadow-2xl flex items-start gap-4 text-white">
        <div className="bg-kubwa-green p-3 rounded-2xl shadow-lg shadow-kubwa-green/20">
          <Bell size={20} className="animate-bounce" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-black uppercase tracking-wider mb-1">{notification.title}</h4>
          <p className="text-[10px] font-bold text-white/70 leading-relaxed">{notification.body}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [user, setUser] = useState<UserType | null>(null);
  const userRef = useRef<UserType | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeNotification, setActiveNotification] = useState<PushNotification | null>(null);
  
  // Keep ref in sync for navigation guards without triggering effects
  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
    {role: 'model', text: 'Hello! I am KubwaBot. Ask me anything about local services in Kubwa.'}
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  /**
   * CENTRALIZED NAVIGATION WITH PERMISSION GUARDS
   */
  const navigateTo = useCallback((section: AppSection, overrideUser?: UserType | null) => {
    const activeUser = overrideUser !== undefined ? overrideUser : userRef.current;
    
    // 1. Unauthenticated Guard for Protected Sections
    const protectedSections = [AppSection.ADMIN, AppSection.VENDOR_DASHBOARD, AppSection.PROVIDER_DASHBOARD];
    if (protectedSections.includes(section) && !activeUser) {
      setAuthIntent({ 
        section, 
        role: section === AppSection.ADMIN ? 'ADMIN' : section === AppSection.VENDOR_DASHBOARD ? 'VENDOR' : 'PROVIDER' 
      });
      setCurrentSection(AppSection.ACCOUNT);
      return;
    }

    // 2. Role-Based Guards
    if (section === AppSection.ADMIN) {
      if (activeUser?.role !== 'ADMIN' && activeUser?.role !== 'SUPER_ADMIN') {
        setCurrentSection(AppSection.HOME);
        return;
      }
    }

    if (section === AppSection.VENDOR_DASHBOARD) {
      if (activeUser?.role !== 'VENDOR') {
        setCurrentSection(AppSection.HOME);
        return;
      }
    }

    if (section === AppSection.PROVIDER_DASHBOARD) {
      if (activeUser?.role !== 'PROVIDER') {
        setCurrentSection(AppSection.HOME);
        return;
      }
    }

    // 3. Success: Perform Navigation
    setCurrentSection(section);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await api.auth.getSession();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      console.error("[Auth] Refresh failed:", err);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const currentUser = await refreshUser();
      if (!mounted) return;

      let hasSeenOnboarding = false;
      try {
        hasSeenOnboarding = localStorage.getItem('kubwa_onboarding_seen') === 'true';
      } catch (e) {}

      if (!currentUser && !hasSeenOnboarding) {
        setShowOnboarding(true);
      }

      setIsInitializing(false);
    };

    init();

    // Subscribe to internal notifications
    const unsubscribeNotifications = api.notifications.subscribe((notif) => {
      setActiveNotification(notif);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentSection(prev => {
          const protectedSections = [AppSection.ACCOUNT, AppSection.ADMIN, AppSection.VENDOR_DASHBOARD, AppSection.PROVIDER_DASHBOARD];
          return protectedSections.includes(prev) ? AppSection.HOME : prev;
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsubscribeNotifications();
    };
  }, [refreshUser]);

  useEffect(() => {
    try {
      localStorage.setItem('kubwa_cart', JSON.stringify(cart.slice(0, 15)));
    } catch (e) {}
  }, [cart]);

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
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiLoading(true);
    try {
      const result = await askKubwaAssistant(userMsg);
      setAiMessages(prev => [...prev, { role: 'model', text: result.message }]);
      if (result.suggestedAction === 'SEARCH_MART') navigateTo(AppSection.MART);
      else if (result.suggestedAction === 'SEARCH_SERVICES') navigateTo(AppSection.FIXIT);
      else if (result.suggestedAction === 'BOOK_RIDE') navigateTo(AppSection.RIDE);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'model', text: "Service temporarily unavailable." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem('kubwa_onboarding_seen', 'true');
    } catch (e) {}
    setShowOnboarding(false);
  };

  const renderContent = () => {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isVendor = user?.role === 'VENDOR';
    const isProvider = user?.role === 'PROVIDER';

    switch (currentSection) {
      case AppSection.HOME: 
        return <Home setSection={navigateTo} user={user} setAuthIntent={setAuthIntent} />;
      case AppSection.MART: 
        return <Mart addToCart={addToCart} cart={cart} setCart={setCart} user={user} onRequireAuth={() => navigateTo(AppSection.ACCOUNT)} setSection={navigateTo} refreshUser={refreshUser} />;
      case AppSection.FIXIT: 
        return <FixIt user={user} onRequireAuth={() => navigateTo(AppSection.ACCOUNT)} setSection={navigateTo} refreshUser={refreshUser} />;
      case AppSection.RIDE: 
        return <Deliveries user={user} onRequireAuth={() => navigateTo(AppSection.ACCOUNT)} setSection={navigateTo} refreshUser={refreshUser} />;
      case AppSection.ADMIN: 
        return isAdmin ? <Admin currentUser={user} /> : <Home setSection={navigateTo} user={user} setAuthIntent={setAuthIntent} />;
      case AppSection.VENDOR_DASHBOARD: 
        return isVendor ? <VendorDashboard currentUser={user} setSection={navigateTo} /> : <Home setSection={navigateTo} user={user} setAuthIntent={setAuthIntent} />;
      case AppSection.PROVIDER_DASHBOARD: 
        return isProvider ? <ProviderDashboard currentUser={user} setSection={navigateTo} /> : <Home setSection={navigateTo} user={user} setAuthIntent={setAuthIntent} />;
      case AppSection.ACCOUNT: 
        return <Account user={user} setUser={setUser} setSection={navigateTo} authIntent={authIntent} clearAuthIntent={() => setAuthIntent(null)} refreshUser={refreshUser} />;
      case AppSection.ABOUT:
      case AppSection.PRIVACY:
      case AppSection.TERMS:
      case AppSection.CONTACT:
      case AppSection.FAQ: 
        return <InfoPages section={currentSection} setSection={navigateTo} />;
      default: 
        return <Home setSection={navigateTo} user={user} setAuthIntent={setAuthIntent} />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
         <div className="w-16 h-16 bg-kubwa-green rounded-3xl animate-bounce flex items-center justify-center shadow-xl">
            <span className="text-white text-2xl font-black">KC</span>
         </div>
         <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Verifying Identity...</p>
      </div>
    );
  }

  const showApprovalBanner = user && user.status === 'PENDING' && (user.role === 'VENDOR' || user.role === 'PROVIDER' || user.role === 'RIDER');
  const showRejectedBanner = user && user.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans border-x border-gray-100">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {activeNotification && (
        <NotificationToast 
          notification={activeNotification} 
          onClose={() => setActiveNotification(null)} 
        />
      )}

      {showApprovalBanner && (
        <div className="bg-orange-500 text-white px-6 py-2 flex items-center gap-3 animate-fade-in relative z-[60]">
           <Clock size={16} className="animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">Profile Under Review by Admin</span>
        </div>
      )}
      
      {showRejectedBanner && (
        <div className="bg-red-600 text-white px-6 py-2 flex items-center gap-3 animate-fade-in relative z-[60]">
           <AlertTriangle size={16} />
           <span className="text-[10px] font-black uppercase tracking-widest">Account Rejected. Check Profile for Details.</span>
        </div>
      )}

      {user && !user.isSetupComplete && (
        <SetupWizard 
          user={user} 
          onComplete={(updatedUser) => {
            setUser(updatedUser);
            refreshUser();
          }} 
        />
      )}
      
      <div className={`h-screen overflow-y-auto no-scrollbar bg-white pb-32 ${(showApprovalBanner || showRejectedBanner) ? 'pt-0' : ''}`}>
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
            onClick={() => navigateTo(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === item.id ? 'text-kubwa-green' : 'text-gray-300'}`}
          >
            <item.icon size={22} strokeWidth={currentSection === item.id ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      <button onClick={() => setAiChatOpen(true)} className="fixed bottom-28 right-6 bg-gray-900 text-white p-4 rounded-2xl shadow-xl z-40 active:scale-95 transition-all">
        <Bot size={24} />
      </button>
      
      {aiChatOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAiChatOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-slide-in-bottom">
             <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
               <div className="flex items-center gap-3"><Bot size={20} /><h3 className="text-sm font-black uppercase tracking-widest">Assistant</h3></div>
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
               <button type="submit" className="bg-kubwa-green text-white p-3 rounded-xl transition-transform active:scale-90"><MessageSquare size={18} /></button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
