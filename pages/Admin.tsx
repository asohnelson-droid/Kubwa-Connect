import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Badge, Button, Input } from '../components/ui';
import { Users, LayoutDashboard, Loader2, Search, ShoppingBag, CheckCircle, XCircle, DollarSign, Package, Trash2, ExternalLink, Ban, RefreshCw, BellRing, ShieldCheck, Briefcase, Database, Megaphone, UserPlus, Activity, UserX, TrendingUp, Send, Flag, MoreVertical, MessageSquare, Star, List, Settings, Save, AlertTriangle, ToggleLeft, ToggleRight, Lock, ShieldAlert, CheckSquare, Ghost, EyeOff, Eye, Truck, Bike, FileText, X, MapPin, Folder, Crown, Wrench } from 'lucide-react';
import { api, FEATURED_PLANS, MOCK_RIDERS, PRODUCT_CATEGORIES, CategoryDefinition } from '../services/data';
import { User, UserRole, Product, ServiceProvider, DeliveryRequest, ServiceOrder, Announcement, Review, AnalyticsData, SystemSettings, FeaturedRequest, MartOrder, AdminLog } from '../types';

interface AdminProps {
  currentUser?: User | null;
}

const EmptyState = ({ icon: Icon, title, description, action }: { icon: any, title: string, description: string, action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-dashed border-gray-200 animate-fade-in">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
      <Icon size={32} />
    </div>
    <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">{description}</p>
    {action}
  </div>
);

const Admin: React.FC<AdminProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'finance' | 'orders' | 'content' | 'settings'>('overview');
  
  // Dashboard Metrics
  const [stats, setStats] = useState<AnalyticsData | null>(null);

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]); // New: Load providers for extra details
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | UserRole>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Content Management (Products, Reviews, Announcements)
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [contentType, setContentType] = useState<'PRODUCTS' | 'ANNOUNCEMENTS' | 'REVIEWS'>('PRODUCTS');
  const [productView, setProductView] = useState<'PENDING' | 'LIVE'>('PENDING'); // Sub-tab for products
  const [productSearch, setProductSearch] = useState('');

  // Orders & Logistics State
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logisticsView, setLogisticsView] = useState<'ORDERS' | 'DELIVERIES' | 'LOGS'>('ORDERS');
  const [assignRiderModal, setAssignRiderModal] = useState<string | null>(null); // Order ID
  const [disputeModal, setDisputeModal] = useState<string | null>(null); // Order ID for cancel/dispute
  const [disputeReason, setDisputeReason] = useState('');

  // Finance State
  const [featureRequests, setFeatureRequests] = useState<FeaturedRequest[]>([]);

  // Settings State
  const [settings, setSettings] = useState<SystemSettings>({
     allowSignups: true,
     maintenanceMode: false,
     allowAdminPromotions: true,
     supportEmail: '',
     supportPhone: '',
     minVersion: ''
  });
  const [categoryList, setCategoryList] = useState<CategoryDefinition[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Processing States
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, contentType, logisticsView]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // Always load core stats for the overview
    const analytics = await api.admin.getAnalytics();
    setStats(analytics);

    // Tab specific data loading
    if (activeTab === 'users') {
        const data = await api.users.getAll();
        setUsers(data);
        const provs = await api.admin.getAllProviders();
        setProviders(provs);
    } else if (activeTab === 'content') {
        if (contentType === 'PRODUCTS') {
            const pending = await api.products.getPending();
            setPendingProducts(pending);
            const all = await api.admin.getAllProducts();
            setAllProducts(all);
        } else if (contentType === 'ANNOUNCEMENTS') {
            const data = await api.admin.getAnnouncements();
            setAnnouncements(data);
        } else if (contentType === 'REVIEWS') {
            const reviews = await api.reviews.getRecent();
            setRecentReviews(reviews);
        }
    } else if (activeTab === 'finance') {
        const reqs = await api.features.getRequests();
        setFeatureRequests(reqs);
    } else if (activeTab === 'settings') {
        const sysSettings = await api.admin.getSystemSettings();
        setSettings(sysSettings);
        // Load categories
        const cats = await api.admin.getCategories();
        setCategoryList(cats);
    } else if (activeTab === 'orders') {
        if (logisticsView === 'ORDERS') {
            const allOrders = await api.admin.getAllOrders();
            setOrders(allOrders);
        } else if (logisticsView === 'DELIVERIES') {
            const allDeliveries = await api.admin.getAllDeliveries();
            setDeliveries(allDeliveries);
        } else if (logisticsView === 'LOGS') {
            const allLogs = await api.admin.getLogs();
            setLogs(allLogs);
        }
    }
    setLoading(false);
  };

  const showNotification = (type: 'success'|'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- LOGISTICS HANDLERS ---
  const handleAssignRider = async (riderId: string) => {
      if (!assignRiderModal) return;
      const success = await api.admin.assignRiderToOrder(assignRiderModal, riderId);
      if (success) {
          showNotification('success', 'Rider assigned manually');
          setAssignRiderModal(null);
          loadDashboardData(); // Refresh list
      } else {
          showNotification('error', 'Failed to assign rider');
      }
  };

  const handleForceCancel = async () => {
      if (!disputeModal || !disputeReason) return;
      const success = await api.admin.forceCancelOrder(disputeModal, disputeReason);
      if (success) {
          showNotification('success', 'Order cancelled');
          setDisputeModal(null);
          setDisputeReason('');
          loadDashboardData();
      } else {
          showNotification('error', 'Failed to cancel order');
      }
  };

  // --- USER HANDLERS ---
  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'role' | 'flag' | 'feature', value?: string) => {
    setUpdatingId(userId);
    let success = false;
    let confirmMsg = '';

    if (action === 'suspend') confirmMsg = "Suspend this user? They will not be able to login.";
    if (action === 'activate') confirmMsg = "Re-activate this user account?";
    if (action === 'flag') confirmMsg = "Flag this user as suspicious?";
    if (action === 'feature') confirmMsg = "Toggle Featured Vendor status manually?";
    if (action === 'role') {
        // Check settings first
        if (!settings.allowAdminPromotions && value === 'ADMIN') {
            alert("Admin promotions are currently locked by system settings.");
            setUpdatingId(null);
            return;
        }
        confirmMsg = `Change user role to ${value}? This grants different permissions.`;
    }

    if (confirmMsg && !confirm(confirmMsg)) {
        setUpdatingId(null);
        return;
    }
    
    if (action === 'role' && value) success = await api.users.updateRole(userId, value as UserRole);
    else if (action === 'suspend') success = await api.users.updateStatus(userId, 'SUSPENDED');
    else if (action === 'activate') success = await api.users.updateStatus(userId, 'ACTIVE');
    else if (action === 'flag') {
        // Toggle flag
        const user = users.find(u => u.id === userId);
        success = await api.users.toggleFlag(userId, !user?.isFlagged);
    }
    else if (action === 'feature') {
        const user = users.find(u => u.id === userId);
        success = await api.users.toggleFeatured(userId, !user?.isFeatured);
    }

    if (success) {
      showNotification('success', 'User updated successfully');
      setUsers(prev => prev.map(u => {
          if (u.id !== userId) return u;
          if (action === 'role' && value) return { ...u, role: value as UserRole };
          if (action === 'suspend') return { ...u, status: 'SUSPENDED' };
          if (action === 'activate') return { ...u, status: 'ACTIVE' };
          if (action === 'flag') return { ...u, isFlagged: !u.isFlagged };
          if (action === 'feature') return { ...u, isFeatured: !u.isFeatured };
          return u;
      }));
    } else {
      showNotification('error', 'Update failed');
    }
    setUpdatingId(null);
  };

  const handleProductAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
     let reason = '';
     if (status === 'REJECTED') {
         const input = prompt("Please provide a reason for hiding/rejecting this product:");
         if (input === null) return; // Cancelled
         reason = input || "Does not meet community guidelines.";
     }

     const success = await api.products.updateStatus(id, status, reason);
     if (success) {
        showNotification('success', `Product ${status.toLowerCase()}`);
        setPendingProducts(prev => prev.filter(p => p.id !== id));
        // Also update allProducts list
        setAllProducts(prev => prev.map(p => p.id === id ? { ...p, status, rejectionReason: reason || undefined } : p));
     } else {
        showNotification('error', 'Action failed');
     }
  };

  const handleToggleProductFeature = async (productId: string) => {
      const result = await api.admin.toggleCategoryFeature(productId);
      if (result.success) {
          showNotification('success', result.message);
          // Optimistic Update
          setAllProducts(prev => prev.map(p => {
              if (p.id !== productId) return p;
              return { ...p, isCategoryFeatured: !p.isCategoryFeatured };
          }));
      } else {
          showNotification('error', result.message);
      }
  };

  const handleDeleteReview = async (id: string) => {
     if(!confirm("Are you sure you want to delete this review?")) return;
     const success = await api.reviews.delete(id);
     if (success) {
         showNotification('success', 'Review deleted');
         setRecentReviews(prev => prev.filter(r => r.id !== id));
     } else {
         showNotification('error', 'Failed to delete review');
     }
  };

  const handleCreateAnnouncement = async () => {
      setSendingBroadcast(true);
      await api.admin.broadcast(broadcastTitle, broadcastBody, 'ALL');
      showNotification('success', 'Announcement published');
      setBroadcastTitle('');
      setBroadcastBody('');
      setSendingBroadcast(false);
      loadDashboardData(); // Refresh list
  };

  const handleDeleteAnnouncement = async (id: string) => {
      if(!confirm("Remove this announcement?")) return;
      await api.admin.deleteAnnouncement(id);
      showNotification('success', 'Announcement removed');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleFeatureRequest = async (id: string, action: 'APPROVE' | 'REJECT') => {
      if (action === 'APPROVE') {
          if(!confirm("Confirm payment received and activate Featured Status?")) return;
          const success = await api.features.approveRequest(id);
          if (success) {
              showNotification('success', 'Vendor is now Featured!');
              setFeatureRequests(prev => prev.map(req => req.id === id ? {...req, status: 'ACTIVE'} : req));
          } else {
              showNotification('error', 'Failed to activate');
          }
      } else {
          if(!confirm("Reject this request?")) return;
          const success = await api.features.rejectRequest(id);
          if (success) {
              showNotification('success', 'Request rejected');
              setFeatureRequests(prev => prev.map(req => req.id === id ? {...req, status: 'REJECTED'} : req));
          }
      }
  };

  const handleSaveSettings = async () => {
      // Validate Maintenance Mode with extra confirmation
      if (settings.maintenanceMode && !confirm("WARNING: Enabling Maintenance Mode will prevent all users from accessing the app. Are you sure?")) {
          return;
      }
      setSavingSettings(true);
      const success = await api.admin.updateSystemSettings(settings);
      setSavingSettings(false);
      if (success) showNotification('success', 'System settings updated');
      else showNotification('error', 'Failed to update settings');
  };

  // --- ACCESS CHECK ---
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
         <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={40} className="text-red-600" />
         </div>
         <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
         <p className="text-gray-500 max-w-md mb-6">This area is reserved for administrators only. Please return to the main application.</p>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <Loader2 size={40} className="animate-spin text-kubwa-green mb-4" />
         <p className="text-gray-500 font-bold">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 w-full relative max-w-7xl mx-auto">
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-bold flex items-center gap-2 animate-slide-in-right ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {notification.text}
        </div>
      )}

      {/* Manual Assignment Modal */}
      {assignRiderModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
              <Card className="w-full max-w-sm animate-zoom-in">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Assign Rider Manually</h3>
                      <button onClick={() => setAssignRiderModal(null)}><X size={20}/></button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                      Select a rider to override automated dispatch for Order #{assignRiderModal.slice(-4)}.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                      {MOCK_RIDERS.map(rider => (
                          <div key={rider.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                              <div>
                                  <p className="font-bold text-sm">{rider.name}</p>
                                  <p className="text-xs text-gray-500"><MapPin size={10} className="inline mr-1"/>{rider.location}</p>
                              </div>
                              <Button className="text-xs py-1 h-8" onClick={() => handleAssignRider(rider.id)}>Assign</Button>
                          </div>
                      ))}
                  </div>
              </Card>
          </div>
      )}

      {/* Dispute/Cancel Modal */}
      {disputeModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
              <Card className="w-full max-w-sm animate-zoom-in">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-red-600">Force Cancel Order</h3>
                      <button onClick={() => setDisputeModal(null)}><X size={20}/></button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                      This action is irreversible. The customer will be refunded if paid.
                  </p>
                  <textarea 
                      className="w-full border p-2 rounded mb-4 text-sm"
                      placeholder="Reason for cancellation..."
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                  />
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700 text-white" 
                    onClick={handleForceCancel}
                    disabled={!disputeReason}
                  >
                      Confirm Cancellation
                  </Button>
              </Card>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <div className="flex items-center gap-2">
             <Badge color="bg-gray-800 text-white mb-1">ADMIN PORTAL</Badge>
           </div>
           <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
           <p className="text-sm text-gray-500">Welcome back, {currentUser.name}.</p>
        </div>
        <div className="flex gap-2">
           <Button className="text-xs flex items-center gap-2" variant="outline" onClick={() => loadDashboardData()}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
           </Button>
        </div>
      </div>

      {/* Navigation Tabs - Laptop/Tablet Friendly */}
      <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
           {[
             { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
             { id: 'orders', icon: Truck, label: 'Logistics' },
             { id: 'users', icon: Users, label: 'Users' },
             { id: 'content', icon: Megaphone, label: 'Content' },
             { id: 'finance', icon: DollarSign, label: 'Finance' },
             { id: 'settings', icon: Settings, label: 'Settings' },
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                 activeTab === tab.id ? 'bg-kubwa-green text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
               }`}
             >
               <tab.icon size={16} />
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* --- DASHBOARD CONTENT --- */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="animate-fade-in space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card className="flex flex-col justify-between border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Total Users</p>
                      <h3 className="text-3xl font-bold text-gray-800">{stats.userStats?.total || 0}</h3>
                   </div>
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={24}/></div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-green-600 font-bold">
                   <TrendingUp size={12} /> +12% this month
                </div>
             </Card>

             <Card className="flex flex-col justify-between border-l-4 border-l-green-500">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">New Faces</p>
                      <h3 className="text-3xl font-bold text-gray-800">{stats.userStats?.newThisWeek || 0}</h3>
                   </div>
                   <div className="p-2 bg-green-50 text-green-600 rounded-lg"><UserPlus size={24}/></div>
                </div>
                <p className="mt-4 text-xs text-gray-400">Joined this week</p>
             </Card>

             <Card className="flex flex-col justify-between border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Active Now</p>
                      <h3 className="text-3xl font-bold text-gray-800">{stats.userStats?.active || 0}</h3>
                   </div>
                   <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Activity size={24}/></div>
                </div>
                <p className="mt-4 text-xs text-gray-400">Online recently</p>
             </Card>

             <Card className="flex flex-col justify-between border-l-4 border-l-red-500">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Inactive</p>
                      <h3 className="text-3xl font-bold text-gray-800">{stats.userStats?.inactive || 0}</h3>
                   </div>
                   <div className="p-2 bg-red-50 text-red-600 rounded-lg"><UserX size={24}/></div>
                </div>
                <p className="mt-4 text-xs text-gray-400">Suspended / Dormant</p>
             </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Left: Quick Chart & Insights */}
             <div className="lg:col-span-2 space-y-6">
                <Card className="min-h-[300px]">
                   <h3 className="font-bold text-gray-700 mb-6">User Growth (Last 7 Days)</h3>
                   <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={stats.growthTrend || []}>
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f3f4f6'}} />
                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                {/* Insight Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Peak Day</p>
                      <p className="font-bold text-gray-800">{stats.insights?.peakDay}</p>
                   </div>
                   <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Busy Hours</p>
                      <p className="font-bold text-gray-800">{stats.insights?.busiestTime}</p>
                   </div>
                   <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Total Reviews</p>
                      <div className="flex items-center gap-1 font-bold text-gray-800">
                         <Star size={14} className="fill-yellow-400 text-yellow-400" /> {stats.insights?.totalReviews}
                      </div>
                   </div>
                   <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Listings</p>
                      <div className="flex items-center gap-1 font-bold text-gray-800">
                         <List size={14} className="text-gray-500" /> {stats.insights?.totalListings}
                      </div>
                   </div>
                </div>
             </div>

             {/* Right: Feature Usage & Activity */}
             <div className="space-y-6">
                <Card>
                   <h3 className="font-bold text-gray-700 mb-4">Feature Popularity</h3>
                   <div className="space-y-4">
                      {stats.featureUsage?.map((feature, idx) => (
                         <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-gray-600">
                               <span>{feature.name}</span>
                               <span>{feature.count} reqs</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                               <div 
                                 className="h-full rounded-full" 
                                 style={{ width: `${(feature.count / 300) * 100}%`, backgroundColor: feature.color }}
                               ></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </Card>

                <Card>
                   <h3 className="font-bold text-gray-700 mb-4">Community Activity</h3>
                   <div className="space-y-4">
                      {stats.activityLog?.map((log: any) => (
                         <div key={log.id} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600 shrink-0">
                               {log.user.charAt(0)}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-gray-800">{log.user}</p>
                               <p className="text-xs text-gray-500">{log.action}</p>
                               <p className="text-[10px] text-gray-400 mt-1">{log.time}</p>
                            </div>
                         </div>
                      ))}
                      {(!stats.activityLog || stats.activityLog.length === 0) && <p className="text-sm text-gray-400">No recent activity.</p>}
                   </div>
                </Card>
             </div>
          </div>
        </div>
      )}

      {/* 2. ORDERS & LOGISTICS TAB */}
      {activeTab === 'orders' && (
          <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button 
                          onClick={() => setLogisticsView('ORDERS')}
                          className={`px-4 py-2 text-xs font-bold rounded ${logisticsView === 'ORDERS' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}
                      >
                          Active Orders
                      </button>
                      <button 
                          onClick={() => setLogisticsView('DELIVERIES')}
                          className={`px-4 py-2 text-xs font-bold rounded ${logisticsView === 'DELIVERIES' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}
                      >
                          Dispatch Requests
                      </button>
                      <button 
                          onClick={() => setLogisticsView('LOGS')}
                          className={`px-4 py-2 text-xs font-bold rounded ${logisticsView === 'LOGS' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}
                      >
                          Admin Activity Log
                      </button>
                  </div>
              </div>

              {logisticsView === 'ORDERS' && (
                  <div className="grid grid-cols-1 gap-4">
                      {orders.length === 0 && <EmptyState icon={ShoppingBag} title="No Active Orders" description="The mart is currently quiet." />}
                      {orders.map(order => (
                          <Card key={order.id} className="flex flex-col md:flex-row justify-between gap-4 border-l-4 border-l-kubwa-green">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-lg">Order #{order.id.slice(-4)}</span>
                                      <Badge color={
                                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                                          order.status === 'READY' ? 'bg-yellow-100 text-yellow-700' :
                                          order.status === 'PENDING' ? 'bg-gray-100 text-gray-700' :
                                          'bg-green-100 text-green-700'
                                      }>{order.status}</Badge>
                                      {order.isFlagged && <Badge color="bg-red-100 text-red-700 border border-red-200"><Flag size={10} className="mr-1"/> Flagged</Badge>}
                                  </div>
                                  <p className="text-sm text-gray-600">{new Date(order.date).toLocaleString()}</p>
                                  <div className="mt-2 text-sm">
                                      <p><span className="font-bold">Items:</span> {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                                      <p><span className="font-bold">Total:</span> ₦{order.total.toLocaleString()}</p>
                                      {order.deliveryMethod === 'DELIVERY' && (
                                          <p className="text-blue-600"><span className="font-bold">To:</span> {order.deliveryAddress}</p>
                                      )}
                                  </div>
                                  {order.riderName && (
                                      <div className="mt-2 bg-gray-50 p-2 rounded inline-block text-xs border">
                                          <span className="font-bold block text-gray-500 uppercase">Assigned Rider</span>
                                          <span className="flex items-center gap-1 font-bold text-gray-800"><Bike size={12}/> {order.riderName}</span>
                                      </div>
                                  )}
                              </div>
                              <div className="flex flex-col gap-2 min-w-[150px]">
                                  {order.status === 'READY' && !order.riderId && order.deliveryMethod === 'DELIVERY' && (
                                      <Button className="text-xs bg-kubwa-green text-white" onClick={() => setAssignRiderModal(order.id)}>
                                          Assign Rider Manually
                                      </Button>
                                  )}
                                  {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                                      <Button variant="outline" className="text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => setDisputeModal(order.id)}>
                                          Force Cancel / Refund
                                      </Button>
                                  )}
                              </div>
                          </Card>
                      ))}
                  </div>
              )}

              {logisticsView === 'DELIVERIES' && (
                  <div className="grid grid-cols-1 gap-4">
                      {deliveries.length === 0 && <EmptyState icon={Truck} title="No Delivery Requests" description="No point-to-point delivery jobs active." />}
                      {deliveries.map(del => (
                          <Card key={del.id} className="flex justify-between items-center">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-gray-800">{del.itemType}</span>
                                      <Badge color="bg-blue-50 text-blue-700">{del.status}</Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">Requested: {new Date(del.date).toLocaleTimeString()}</p>
                                  <div className="text-xs space-y-1">
                                      <p className="flex items-center gap-1"><MapPin size={10} className="text-green-600"/> From: {del.pickup}</p>
                                      <p className="flex items-center gap-1"><MapPin size={10} className="text-orange-600"/> To: {del.dropoff}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-lg">₦{del.price.toLocaleString()}</p>
                                  {del.riderId ? <p className="text-xs text-gray-500">Rider Assigned</p> : <p className="text-xs text-red-500 font-bold">Pending Rider</p>}
                              </div>
                          </Card>
                      ))}
                  </div>
              )}

              {logisticsView === 'LOGS' && (
                  <div className="bg-black text-green-400 p-4 rounded-xl font-mono text-xs h-96 overflow-y-auto shadow-inner">
                      {logs.length === 0 && <p className="opacity-50">// No admin actions recorded yet.</p>}
                      {logs.map(log => (
                          <div key={log.id} className="mb-2 border-b border-gray-800 pb-2">
                              <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                              <span className="text-yellow-400 font-bold">{log.adminName}</span>:{' '}
                              <span className="text-blue-400 font-bold">{log.action}</span> - {log.details}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* 2. USERS TAB (Management List) */}
      {activeTab === 'users' && (
         <div className="space-y-4 animate-fade-in">
             {/* Filters */}
             <div className="flex gap-2">
                <div className="relative flex-1">
                   <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                   <Input placeholder="Find user by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <select 
                   className="border rounded-lg px-3 text-sm bg-white"
                   value={userFilter} 
                   onChange={(e) => setUserFilter(e.target.value as any)}
                >
                   <option value="ALL">All Roles</option>
                   <option value="USER">Residents</option>
                   <option value="VENDOR">Vendors</option>
                   <option value="PROVIDER">Fixit Pros</option>
                   <option value="RIDER">Riders</option>
                   <option value="ADMIN">Admins</option>
                </select>
             </div>
             
             {/* User Cards Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.filter(u => 
                   (userFilter === 'ALL' || u.role === userFilter) && 
                   u.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(u => {
                   const providerDetails = u.role === 'PROVIDER' ? providers.find(p => p.userId === u.id) : null;
                   
                   return (
                   <Card key={u.id} className={`flex flex-col justify-between ${u.isFlagged ? 'border-l-4 border-l-red-500' : u.status === 'SUSPENDED' ? 'opacity-70 bg-gray-50' : u.status === 'PENDING' ? 'border-l-4 border-l-yellow-500' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                               {u.name.charAt(0)}
                            </div>
                            <div>
                               <p className="font-bold text-sm flex items-center gap-1">
                                 {u.name}
                                 {u.isFlagged && <Flag size={12} className="text-red-500 fill-red-500" />}
                                 {u.isFeatured && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                               </p>
                               <p className="text-xs text-gray-500">{u.email}</p>
                               <div className="flex gap-1 mt-1">
                                  <Badge color="bg-gray-100 text-gray-600 text-[10px]">{u.role}</Badge>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                      u.status === 'ACTIVE' ? 'text-green-600 bg-green-50' : 
                                      u.status === 'PENDING' ? 'text-yellow-600 bg-yellow-50' :
                                      'text-red-600 bg-red-50'
                                  }`}>
                                     {u.status}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Provider Specific Details (For Approval) */}
                      {providerDetails && u.status === 'PENDING' && (
                          <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 mb-2 border border-yellow-100">
                              <p className="font-bold flex items-center gap-1"><Wrench size={12}/> {providerDetails.category}</p>
                              <p className="mt-1"><span className="font-bold">Skills:</span> {providerDetails.skills?.join(', ')}</p>
                              <p className="mt-1"><span className="font-bold">Loc:</span> {providerDetails.location}</p>
                          </div>
                      )}

                      {/* Management Actions */}
                      <div className="pt-3 mt-2 border-t flex gap-2 justify-between items-center">
                         <select 
                           value={u.role}
                           onChange={(e) => handleUserAction(u.id, 'role', e.target.value)}
                           className="text-xs border rounded p-1 bg-white"
                           disabled={updatingId === u.id || u.id === currentUser?.id}
                         >
                            <option value="USER">User</option>
                            <option value="VENDOR">Vendor</option>
                            <option value="PROVIDER">Provider</option>
                            <option value="RIDER">Rider</option>
                            <option value="ADMIN">Admin</option>
                         </select>

                         <div className="flex gap-1">
                            {/* Feature Vendor Button */}
                            {u.role === 'VENDOR' && (
                                <button 
                                   onClick={() => handleUserAction(u.id, 'feature')}
                                   className={`p-1.5 rounded hover:bg-gray-100 border ${u.isFeatured ? 'text-yellow-500 border-yellow-200 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500'}`}
                                   title={u.isFeatured ? 'Remove Featured Status' : 'Mark as Featured Vendor'}
                                   disabled={updatingId === u.id}
                                >
                                   <Star size={16} fill={u.isFeatured ? "currentColor" : "none"} />
                                </button>
                            )}

                            {/* Activate Button (For Pending Providers) */}
                            {u.status === 'PENDING' && (
                                <button 
                                   onClick={() => handleUserAction(u.id, 'activate')}
                                   className="p-1.5 rounded bg-green-100 text-green-600 border border-green-200 hover:bg-green-200"
                                   title="Approve Application"
                                   disabled={updatingId === u.id}
                                >
                                   <CheckCircle size={16} />
                                </button>
                            )}

                            {/* Suspend/Activate Button */}
                            {u.status !== 'PENDING' && (
                                <button 
                                   onClick={() => handleUserAction(u.id, u.status === 'ACTIVE' ? 'suspend' : 'activate')}
                                   className={`p-1.5 rounded hover:bg-gray-100 border ${u.status === 'ACTIVE' ? 'text-gray-400 hover:text-red-500' : 'text-green-500 border-green-200 bg-green-50'}`}
                                   title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                                   disabled={updatingId === u.id || u.id === currentUser?.id}
                                >
                                   {updatingId === u.id ? <Loader2 size={16} className="animate-spin" /> : (u.status === 'ACTIVE' ? <Ban size={16} /> : <CheckCircle size={16} />)}
                                </button>
                            )}

                            {/* Flag Button */}
                            <button 
                               onClick={() => handleUserAction(u.id, 'flag')}
                               className={`p-1.5 rounded hover:bg-gray-100 border ${u.isFlagged ? 'text-red-500 border-red-200 bg-red-50' : 'text-gray-400 hover:text-orange-500'}`}
                               title={u.isFlagged ? 'Remove Flag' : 'Flag as Suspicious'}
                               disabled={updatingId === u.id}
                            >
                               <Flag size={16} fill={u.isFlagged ? "currentColor" : "none"} />
                            </button>
                         </div>
                      </div>
                   </Card>
                   );
                })}
                
                {/* Empty State */}
                {users.length > 0 && users.filter(u => 
                   (userFilter === 'ALL' || u.role === userFilter) && 
                   u.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                   <div className="col-span-full">
                     <EmptyState 
                       icon={Users} 
                       title="No users found" 
                       description="Try adjusting your search or filters to find who you're looking for." 
                     />
                   </div>
                )}
             </div>
         </div>
      )}

      {/* 3. CONTENT MODERATION TAB */}
      {activeTab === 'content' && (
         <div className="space-y-4 animate-fade-in">
             <div className="flex bg-gray-100 p-1 rounded-lg mb-4 w-full max-w-md mx-auto">
                 {['PRODUCTS', 'ANNOUNCEMENTS', 'REVIEWS'].map(t => (
                   <button 
                     key={t} 
                     onClick={() => setContentType(t as any)}
                     className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all ${contentType === t ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}
                   >
                     {t}
                   </button>
                 ))}
             </div>

             {/* PRODUCTS MODERATION */}
             {contentType === 'PRODUCTS' && (
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                         <button 
                           onClick={() => setProductView('PENDING')}
                           className={`px-3 py-1 text-xs font-bold rounded ${productView === 'PENDING' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}
                         >
                           Pending Review
                         </button>
                         <button 
                           onClick={() => setProductView('LIVE')}
                           className={`px-3 py-1 text-xs font-bold rounded ${productView === 'LIVE' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}
                         >
                           Live Catalog
                         </button>
                      </div>
                      <span className="text-xs text-gray-500 font-bold">
                         {productView === 'PENDING' ? `${pendingProducts.length} Pending` : `${allProducts.length} Total`}
                      </span>
                   </div>

                   {productView === 'PENDING' ? (
                       <>
                           {pendingProducts.length === 0 ? (
                              <EmptyState 
                                icon={CheckSquare} 
                                title="All caught up!" 
                                description="There are no pending products waiting for approval right now." 
                              />
                           ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {pendingProducts.map(p => (
                                    <Card key={p.id} className="flex gap-4">
                                       <img src={p.image} className="w-24 h-24 rounded-lg bg-gray-200 object-cover" alt={p.name} />
                                       <div className="flex-1">
                                          <div className="flex justify-between items-start">
                                             <h4 className="font-bold text-gray-800">{p.name}</h4>
                                             <span className="text-kubwa-green font-bold">₦{p.price.toLocaleString()}</span>
                                          </div>
                                          <p className="text-xs text-gray-500 mb-2">{p.category} • Stock: {p.stock}</p>
                                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{p.description || "No description provided."}</p>
                                          
                                          <div className="flex gap-2">
                                             <Button className="flex-1 py-1 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleProductAction(p.id, 'APPROVED')}>Approve</Button>
                                             <Button className="flex-1 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200" onClick={() => handleProductAction(p.id, 'REJECTED')}>Reject</Button>
                                          </div>
                                       </div>
                                    </Card>
                                 ))}
                              </div>
                           )}
                       </>
                   ) : (
                       /* LIVE CATALOG VIEW */
                       <div className="space-y-4">
                          <div className="relative">
                             <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                             <Input 
                               placeholder="Search live products..." 
                               value={productSearch} 
                               onChange={e => setProductSearch(e.target.value)} 
                               className="pl-9" 
                             />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {allProducts
                                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                .map(p => (
                                <Card key={p.id} className={`flex justify-between items-center ${p.status === 'REJECTED' ? 'opacity-60 bg-gray-50' : ''}`}>
                                   <div className="flex items-center gap-3">
                                      <img src={p.image} className="w-12 h-12 rounded bg-gray-200 object-cover" alt={p.name} />
                                      <div>
                                         <p className="font-bold text-sm text-gray-800 line-clamp-1">{p.name}</p>
                                         <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-1.5 rounded font-bold ${
                                                p.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {p.status}
                                            </span>
                                            <span className="text-xs text-gray-500">₦{p.price.toLocaleString()}</span>
                                         </div>
                                         {p.isCategoryFeatured && (
                                            <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-1 mt-1">
                                                <Crown size={10} fill="currentColor"/> Category Featured
                                            </span>
                                         )}
                                      </div>
                                   </div>
                                   <div className="flex flex-col gap-2">
                                      {p.status === 'APPROVED' ? (
                                          <div className="flex gap-1">
                                              <button
                                                onClick={() => handleToggleProductFeature(p.id)}
                                                className={`p-1.5 rounded border transition-colors ${p.isCategoryFeatured ? 'bg-yellow-100 text-yellow-600 border-yellow-200' : 'bg-gray-50 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'}`}
                                                title={p.isCategoryFeatured ? "Remove Featured Status" : "Feature in Category"}
                                              >
                                                  <Crown size={16} fill={p.isCategoryFeatured ? "currentColor" : "none"} />
                                              </button>
                                              <Button 
                                                variant="outline" 
                                                className="text-xs border-red-200 text-red-600 hover:bg-red-50 px-2 py-1"
                                                onClick={() => handleProductAction(p.id, 'REJECTED')}
                                                title="Hide/Unpublish this item"
                                              >
                                                 <EyeOff size={14} />
                                              </Button>
                                          </div>
                                      ) : p.status === 'REJECTED' ? (
                                          <Button 
                                            variant="outline" 
                                            className="text-xs border-green-200 text-green-600 hover:bg-green-50"
                                            onClick={() => handleProductAction(p.id, 'APPROVED')}
                                          >
                                             <Eye size={14} className="mr-1" /> Publish
                                          </Button>
                                      ) : null}
                                   </div>
                                </Card>
                             ))}
                          </div>
                       </div>
                   )}
                </div>
             )}

             {/* ANNOUNCEMENTS MANAGEMENT */}
             {contentType === 'ANNOUNCEMENTS' && (
                <div className="space-y-6">
                   <Card className="max-w-xl mx-auto border-blue-100 bg-blue-50/50">
                      <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Megaphone size={16} /> Create Announcement</h3>
                      <div className="space-y-3">
                         <Input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="Title (e.g. Market Day Alert)" className="bg-white" />
                         <textarea 
                            className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-kubwa-green"
                            rows={3}
                            value={broadcastBody}
                            onChange={e => setBroadcastBody(e.target.value)}
                            placeholder="Message content..."
                         />
                         <Button onClick={handleCreateAnnouncement} disabled={sendingBroadcast || !broadcastTitle || !broadcastBody} className="w-full flex justify-center gap-2">
                            {sendingBroadcast ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Publish to Home Screen
                         </Button>
                      </div>
                   </Card>

                   <div className="space-y-2">
                      <h3 className="font-bold text-gray-700 text-sm">Active Announcements</h3>
                      {announcements.length === 0 ? (
                        <EmptyState 
                          icon={Ghost} 
                          title="No announcements" 
                          description="You haven't published any community alerts yet." 
                        />
                      ) : (
                        announcements.map(a => (
                           <div key={a.id} className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center">
                              <div>
                                 <h4 className="font-bold text-sm">{a.title}</h4>
                                 <p className="text-xs text-gray-500">{a.message}</p>
                                 <p className="text-[10px] text-gray-400 mt-1">{new Date(a.date).toLocaleDateString()}</p>
                              </div>
                              <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>
                           </div>
                        ))
                      )}
                   </div>
                </div>
             )}

             {/* REVIEWS MODERATION */}
             {contentType === 'REVIEWS' && (
                <div className="space-y-4">
                   <h3 className="font-bold text-gray-700">Recent Reviews</h3>
                   <div className="space-y-3">
                      {recentReviews.length === 0 ? (
                        <EmptyState 
                          icon={MessageSquare} 
                          title="No reviews" 
                          description="Community reviews will appear here once posted." 
                        />
                      ) : (
                        recentReviews.map(r => (
                           <div key={r.id} className="bg-white border p-3 rounded-lg flex gap-3">
                              <div className="bg-gray-100 p-2 rounded-full h-fit"><MessageSquare size={16} className="text-gray-500"/></div>
                              <div className="flex-1">
                                  <div className="flex justify-between">
                                     <span className="font-bold text-xs text-gray-800">{r.userName || 'Anonymous'}</span>
                                     <span className="text-yellow-500 text-xs font-bold">★ {r.rating}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 italic mt-1">"{r.comment}"</p>
                                  <p className="text-[10px] text-gray-400 mt-1">{new Date(r.date).toLocaleDateString()}</p>
                              </div>
                              <button onClick={() => handleDeleteReview(r.id)} className="text-gray-400 hover:text-red-500 self-start"><Trash2 size={16}/></button>
                           </div>
                        ))
                      )}
                   </div>
                </div>
             )}
         </div>
      )}

      {/* 4. FINANCE TAB */}
      {activeTab === 'finance' && (
         <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-gray-700">Feature Requests (Paid)</h3>
            {featureRequests.length === 0 ? (
                <EmptyState 
                  icon={DollarSign} 
                  title="No Pending Payments" 
                  description="All feature requests have been processed." 
                />
            ) : (
                <div className="space-y-3">
                    {featureRequests.map(req => {
                        const plan = FEATURED_PLANS.find(p => p.id === req.planId);
                        return (
                            <Card key={req.id} className="flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-800">{req.vendorName}</h4>
                                        <Badge color={req.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : req.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                            {req.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">Plan: {plan?.name} ({plan?.durationDays} days) • ₦{req.amount.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">{new Date(req.requestDate).toLocaleString()}</p>
                                </div>
                                {req.status === 'PAID_AWAITING_APPROVAL' && (
                                    <div className="flex gap-2">
                                        <Button className="text-xs bg-green-600 hover:bg-green-700" onClick={() => handleFeatureRequest(req.id, 'APPROVE')}>Approve & Activate</Button>
                                        <Button className="text-xs bg-red-100 text-red-600 hover:bg-red-200" onClick={() => handleFeatureRequest(req.id, 'REJECT')}>Reject</Button>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
         </div>
      )}

      {/* 5. SETTINGS TAB */}
      {activeTab === 'settings' && (
         <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Category Management */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Folder size={18}/> Product Categories</h3>
                    <Button variant="outline" className="text-xs h-8">Add New</Button>
                </div>
                <div className="bg-gray-50 border rounded-lg max-h-60 overflow-y-auto p-2">
                    {categoryList.map(parent => (
                        <div key={parent.id} className="mb-2 last:mb-0">
                            <p className="text-xs font-bold text-gray-500 uppercase px-2 py-1">{parent.label}</p>
                            {parent.subcategories.map(sub => (
                                <div key={sub.id} className="flex justify-between items-center px-2 py-1.5 bg-white border border-gray-100 rounded mb-1">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{sub.label}</p>
                                        <p className="text-[10px] text-gray-400 truncate w-48">{sub.examples}</p>
                                    </div>
                                    <Badge color={sub.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}>
                                        {sub.active ? 'Active' : 'Disabled'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Maintenance & Safety */}
            <Card className="border-red-100 border-l-4">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-gray-500" /> Platform Safety
                </h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-sm text-gray-800">Maintenance Mode</p>
                            <p className="text-xs text-gray-500">Pauses all community activity. Use for critical updates.</p>
                        </div>
                        <button 
                            onClick={() => setSettings(s => ({...s, maintenanceMode: !s.maintenanceMode}))}
                            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-sm text-gray-800">Allow New Signups</p>
                            <p className="text-xs text-gray-500">Toggle to temporarily stop new users from registering.</p>
                        </div>
                        <button 
                            onClick={() => setSettings(s => ({...s, allowSignups: !s.allowSignups}))}
                            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${settings.allowSignups ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.allowSignups ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div>
                            <p className="font-bold text-sm text-gray-800 flex items-center gap-1"><Lock size={12}/> Admin Promotions</p>
                            <p className="text-xs text-gray-500">When disabled, no one can be promoted to Admin role.</p>
                        </div>
                        <button 
                            onClick={() => setSettings(s => ({...s, allowAdminPromotions: !s.allowAdminPromotions}))}
                            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${settings.allowAdminPromotions ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.allowAdminPromotions ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                </div>
            </Card>

            {/* Platform Info */}
            <Card>
                <h3 className="font-bold text-gray-800 mb-4">Platform Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Support Email</label>
                        <Input value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} placeholder="support@kubwaconnect.com" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Support Phone</label>
                        <Input value={settings.supportPhone} onChange={e => setSettings({...settings, supportPhone: e.target.value})} placeholder="0800-HELP" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">Minimum App Version</label>
                    <Input value={settings.minVersion} onChange={e => setSettings({...settings, minVersion: e.target.value})} placeholder="1.0.0" />
                    <p className="text-[10px] text-gray-400 mt-1">Users on older versions will be forced to update.</p>
                </div>
            </Card>

            <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full py-3 flex items-center justify-center gap-2">
                {savingSettings ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Changes
            </Button>
         </div>
      )}
    </div>
  );
};

export default Admin;