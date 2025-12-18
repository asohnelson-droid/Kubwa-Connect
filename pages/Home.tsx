import React, { useState, useEffect } from 'react';
import { ShoppingBag, Wrench, Truck, ChevronRight, User, Store, Bike, Search, MapPin, Bell, X, Star, ShieldCheck, Crown, Flame, Clock } from 'lucide-react';
import { AppSection, UserRole, User as UserType, Announcement, Product } from '../types';
import { Button, Card, Select } from '../components/ui';
import { KUBWA_AREAS, api } from '../services/data';

interface HomeProps {
  setSection: (section: AppSection) => void;
  user?: UserType | null;
  setAuthIntent: (intent: { section: AppSection; role: UserRole } | null) => void;
}

const Home: React.FC<HomeProps> = ({ setSection, user, setAuthIntent }) => {
  const [activeTab, setActiveTab] = useState<'RESIDENT' | 'BUSINESS' | 'RIDER'>('RESIDENT');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('All Kubwa');

  // Data
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [visibleAnnouncement, setVisibleAnnouncement] = useState<Announcement | null>(null);
  const [featuredVendors, setFeaturedVendors] = useState<UserType[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [productSortMode, setProductSortMode] = useState<'NEW' | 'TRENDING'>('NEW');

  // Hero Slider State
  const [heroIndex, setHeroIndex] = useState(0);
  const heroMessages = [
    "Find Trusted Artisans in Kubwa in Under 2 Minutes.",
    "Find verified vendors for quality products in Kubwa.",
    "Engage riders and movers to move your items."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroMessages.length);
    }, 5000); // 5 seconds interval
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadData = async () => {
       // Announcements
       const data = await api.admin.getAnnouncements();
       if (data.length > 0) {
          setAnnouncements(data);
          setVisibleAnnouncement(data[0]);
       }

       // Featured Vendors
       const featured = await api.users.getFeaturedVendors();
       setFeaturedVendors(featured);

       // Products
       loadProducts();
    };
    loadData();
  }, [productSortMode]);

  const loadProducts = async () => {
      const allProducts = await api.getProducts();
      let sorted = allProducts.filter(p => p.status === 'APPROVED');
      
      if (productSortMode === 'NEW') {
          sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      } else {
          // Trending
          sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      }
      
      setRecentProducts(sorted.slice(0, 6));
  };


  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Simple heuristic routing logic
    const query = searchQuery.toLowerCase();
    const serviceKeywords = ['plumber', 'electrician', 'cleaner', 'tutor', 'repair', 'mechanic', 'tailor', 'artisan'];
    
    // If it looks like a service request, go to FixIt
    if (serviceKeywords.some(k => query.includes(k))) {
       setSection(AppSection.FIXIT);
    } else {
       // Default to Mart for product searches or general queries
       setSection(AppSection.MART);
    }
  };

  const handleVendorAction = () => {
    if (user?.role === 'VENDOR') {
      setSection(AppSection.MART);
    } else {
      setAuthIntent({ section: AppSection.MART, role: 'VENDOR' });
      setSection(AppSection.ACCOUNT);
    }
  };

  const handleRiderAction = () => {
    if (user?.role === 'RIDER') {
      setSection(AppSection.RIDE);
    } else {
      setAuthIntent({ section: AppSection.RIDE, role: 'RIDER' });
      setSection(AppSection.ACCOUNT);
    }
  };

  const trendingItems = [
    {
      id: 1,
      title: "Fresh Yam",
      subtitle: "₦1,200/kg",
      image: "https://picsum.photos/200/200?random=1",
      section: AppSection.MART,
      tag: "Mart"
    },
    {
      id: 2,
      title: "Emmanuel Fixes",
      subtitle: "Plumber • 4.9★",
      image: "https://picsum.photos/200/200?random=5",
      section: AppSection.FIXIT,
      tag: "Pro"
    },
    {
      id: 3,
      title: "Musa Express",
      subtitle: "Rider • 500+ Trips",
      image: "https://picsum.photos/200/200?random=15",
      section: AppSection.RIDE,
      tag: "Rider"
    }
  ];

  const locations = ['All Kubwa', ...KUBWA_AREAS];

  return (
    <div className="pb-24">
      {/* Hero Section with Search System */}
      <div className="bg-kubwa-green text-white rounded-b-3xl p-6 pt-12 relative overflow-hidden shadow-xl min-h-[340px]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-kubwa-orange opacity-20 rounded-full -ml-5 -mb-5"></div>
        
        <div className="relative z-10">
          {/* Logo Header */}
          <div className="flex items-center gap-2 mb-6 opacity-90">
             <div className="bg-white p-1.5 rounded-lg shadow-sm">
               {/* Use placeholder if logo.png is missing or just text */}
               <span className="text-2xl">⚡</span>
             </div>
             <span className="text-lg font-bold tracking-wide text-white drop-shadow-md">KUBWA CONNECT</span>
          </div>
          
          {/* Slider Headline */}
          <div className="h-20 mb-4 flex items-center">
             <h1 
               key={heroIndex} 
               className="text-2xl font-bold leading-tight animate-fade-in"
             >
               {heroMessages[heroIndex]}
             </h1>
          </div>
          
          <p className="text-white/90 mb-6 text-sm">Join 2,500+ Kubwa Residents – It's Free</p>

          {/* Search Bar */}
          <div className="bg-white rounded-xl p-2 shadow-lg flex flex-col gap-2">
             <div className="flex items-center gap-2 border-b border-gray-100 pb-2 px-2">
                <Search className="text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="What are you looking for?" 
                  className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="flex gap-2">
                <div className="relative flex-1">
                   <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={14} /></div>
                   <select 
                     className="w-full pl-7 pr-2 py-2 bg-gray-50 rounded-lg text-xs text-gray-600 appearance-none focus:outline-none"
                     value={searchLocation}
                     onChange={(e) => setSearchLocation(e.target.value)}
                   >
                      {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                   </select>
                </div>
                <button 
                  onClick={handleSearch}
                  className="bg-kubwa-orange text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-orange-600 transition-colors"
                >
                  Search
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      {visibleAnnouncement && (
        <div className="mx-4 -mt-4 relative z-20 bg-white rounded-xl shadow-md p-3 border-l-4 border-l-kubwa-orange flex justify-between items-start animate-slide-in-bottom">
           <div>
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                 <Bell size={14} className="text-kubwa-orange fill-orange-100" /> {visibleAnnouncement.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{visibleAnnouncement.message}</p>
           </div>
           <button onClick={() => setVisibleAnnouncement(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* Main Action Grid */}
      <div className="px-4 mt-8">
         <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setSection(AppSection.MART)} className="bg-green-50 p-4 rounded-xl flex flex-col items-center gap-2 border border-green-100 hover:bg-green-100 transition-colors group">
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-600 group-hover:scale-110 transition-transform">
                  <ShoppingBag size={20} />
               </div>
               <span className="text-xs font-bold text-gray-700">Mart</span>
            </button>
            <button onClick={() => setSection(AppSection.FIXIT)} className="bg-orange-50 p-4 rounded-xl flex flex-col items-center gap-2 border border-orange-100 hover:bg-orange-100 transition-colors group">
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-600 group-hover:scale-110 transition-transform">
                  <Wrench size={20} />
               </div>
               <span className="text-xs font-bold text-gray-700">FixIt</span>
            </button>
            <button onClick={() => setSection(AppSection.RIDE)} className="bg-blue-50 p-4 rounded-xl flex flex-col items-center gap-2 border border-blue-100 hover:bg-blue-100 transition-colors group">
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                  <Truck size={20} />
               </div>
               <span className="text-xs font-bold text-gray-700">Ride</span>
            </button>
         </div>
      </div>

      {/* Fresh from Mart Section (NEW) */}
      <div className="px-4 mt-8">
         <div className="flex justify-between items-center mb-4">
            <div>
               <h3 className="text-lg font-bold text-gray-800">Fresh from Mart</h3>
               <p className="text-xs text-gray-500">Best deals in Kubwa today</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setProductSortMode('NEW')}
                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${productSortMode === 'NEW' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}
                >
                   <Clock size={10} /> New
                </button>
                <button 
                  onClick={() => setProductSortMode('TRENDING')}
                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${productSortMode === 'TRENDING' ? 'bg-white shadow text-orange-500' : 'text-gray-500'}`}
                >
                   <Flame size={10} /> Hot
                </button>
            </div>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recentProducts.map(product => (
               <div 
                 key={product.id} 
                 onClick={() => setSection(AppSection.MART)}
                 className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
               >
                  <div className="h-28 bg-gray-100 relative">
                     <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     {product.isCategoryFeatured && (
                        <div className="absolute top-1 left-1 bg-yellow-400 text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                           <Crown size={8} fill="black"/> Top
                        </div>
                     )}
                  </div>
                  <div className="p-2">
                     <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{product.name}</h4>
                     <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-bold text-kubwa-green">₦{product.price.toLocaleString()}</span>
                        <div className="bg-gray-100 p-1 rounded-full text-gray-400 hover:bg-kubwa-green hover:text-white transition-colors">
                           <ShoppingBag size={12} />
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
         <button onClick={() => setSection(AppSection.MART)} className="w-full mt-3 py-2 text-xs text-gray-500 font-bold hover:text-kubwa-green">
            View All Products
         </button>
      </div>

      {/* Featured Vendors Carousel */}
      <div className="mt-8 bg-gray-50 py-6">
         <div className="px-4 flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Verified Vendors</h3>
            <button onClick={() => setSection(AppSection.MART)} className="text-xs text-kubwa-green font-bold flex items-center">
               View All <ChevronRight size={14} />
            </button>
         </div>
         <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
            {featuredVendors.map((vendor) => (
               <div key={vendor.id} className="min-w-[140px] bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-gray-200 rounded-full mb-2 overflow-hidden border-2 border-green-100">
                     <img src={vendor.avatar || `https://ui-avatars.com/api/?name=${vendor.name}&background=random`} alt={vendor.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{vendor.storeName || vendor.name}</h4>
                  <p className="text-[10px] text-gray-500 mb-2 line-clamp-1">{vendor.bio || 'Kubwa Vendor'}</p>
                  <div className="flex gap-1 text-[10px] text-yellow-500 font-bold items-center bg-yellow-50 px-2 py-0.5 rounded-full">
                     <Star size={10} fill="currentColor" /> {vendor.rating || 'New'}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Trending in Kubwa (Mixed) */}
      <div className="px-4 mt-8 mb-8">
         <h3 className="text-lg font-bold text-gray-800 mb-4">Trending in Kubwa</h3>
         <div className="space-y-3">
            {trendingItems.map((item) => (
               <div 
                 key={item.id} 
                 onClick={() => setSection(item.section)}
                 className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
               >
                  <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.tag === 'Mart' ? 'bg-green-100 text-green-700' : item.tag === 'Pro' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                           {item.tag}
                        </span>
                     </div>
                     <p className="text-sm text-gray-500">{item.subtitle}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-full text-gray-400">
                     <ChevronRight size={16} />
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Role-Based CTA Cards */}
      <div className="px-4 mb-8">
         <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={handleVendorAction}
              className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl text-white relative overflow-hidden cursor-pointer"
            >
               <div className="relative z-10">
                  <Store className="mb-2 text-kubwa-green" />
                  <h4 className="font-bold text-sm">Become a Vendor</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Sell to thousands in Kubwa</p>
               </div>
               <div className="absolute right-0 bottom-0 opacity-10">
                  <Store size={80} />
               </div>
            </div>
            
            <div 
              onClick={handleRiderAction}
              className="bg-blue-600 p-4 rounded-xl text-white relative overflow-hidden cursor-pointer"
            >
               <div className="relative z-10">
                  <Bike className="mb-2 text-white" />
                  <h4 className="font-bold text-sm">Earn as Rider</h4>
                  <p className="text-[10px] text-blue-200 mt-1">Deliver and get paid daily</p>
               </div>
               <div className="absolute right-0 bottom-0 opacity-10">
                  <Bike size={80} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Home;