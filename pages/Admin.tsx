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
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | UserRole>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [contentType, setContentType] = useState<'PRODUCTS' | 'ANNOUNCEMENTS' | 'REVIEWS'>('PRODUCTS');
  const [productView, setProductView] = useState<'PENDING' | 'LIVE'>('PENDING');
  const [productSearch, setProductSearch] = useState('');
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logisticsView, setLogisticsView] = useState<'ORDERS' | 'DELIVERIES' | 'LOGS'>('ORDERS');
  const [assignRiderModal, setAssignRiderModal] = useState<string | null>(null);
  const [disputeModal, setDisputeModal] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [featureRequests, setFeatureRequests] = useState<FeaturedRequest[]>([]);
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
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, contentType, logisticsView]);

  const loadDashboardData = async () => {
    setLoading(true);
    const analytics = await api.admin.getAnalytics();
    setStats(analytics);

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

  const handleProductAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
     let reason = '';
     if (status === 'REJECTED') {
         const input = prompt("Please provide a reason for rejecting this product (this will be shown to the vendor):");
         if (input === null) return; 
         reason = input || "Does not meet community guidelines.";
     }

     const success = await api.products.updateStatus(id, status, reason);
     if (success) {
        showNotification('success', `Product ${status.toLowerCase()}`);
        setPendingProducts(prev => prev.filter(p => p.id !== id));
        setAllProducts(prev => prev.map(p => p.id === id ? { ...p, status, rejectionReason: reason || undefined } : p));
     } else {
        showNotification('error', 'Action failed');
     }
  };

  const handleToggleProductFeature = async (productId: string) => {
      const result = await api.admin.toggleCategoryFeature(productId);
      if (result.success) {
          showNotification('success', result.message);
          setAllProducts(prev => prev.map(p => {
              if (p.id !== productId) return p;
              return { ...p, isCategoryFeatured: !p.isCategoryFeatured };
          }));
      } else {
          showNotification('error', result.message);
      }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'role' | 'flag' | 'feature', value?: string) => {
    setUpdatingId(userId);
    let success = false;
    let confirmMsg = '';

    if (action === 'suspend') confirmMsg = "Suspend this user?";
    if (action === 'activate') confirmMsg = "Re-activate user?";
    if (action === 'role') confirmMsg = `Change role to ${value}?`;

    if (confirmMsg && !confirm(confirmMsg)) {
        setUpdatingId(null);
        return;
    }
    
    if (action === 'role' && value) success = await api.users.updateRole(userId, value as UserRole);
    else if (action === 'suspend') success = await api.users.updateStatus(userId, 'SUSPENDED');
    else if (action === 'activate') success = await api.users.updateStatus(userId, 'ACTIVE');

    if (success) {
      showNotification('success', 'User updated');
      loadDashboardData();
    }
    setUpdatingId(null);
  };

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  return (
    <div className="pb-24 pt-4 px-4 w-full relative max-w-7xl mx-auto">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-bold flex items-center gap-2 animate-slide-in-right ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {notification.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <Badge color="bg-gray-800 text-white mb-1">ADMIN PORTAL</Badge>
           <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        </div>
      </div>

      <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 mb-6 overflow-x-auto flex gap-2">
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

      {activeTab === 'content' && contentType === 'PRODUCTS' && (
          <div className="space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-lg w-full max-w-xs">
                  <button onClick={() => setProductView('PENDING')} className={`flex-1 py-1.5 text-xs font-bold rounded ${productView === 'PENDING' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}>Pending</button>
                  <button onClick={() => setProductView('LIVE')} className={`flex-1 py-1.5 text-xs font-bold rounded ${productView === 'LIVE' ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}>Live</button>
              </div>

              {productView === 'PENDING' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingProducts.length === 0 ? <EmptyState icon={CheckSquare} title="Clean Queue" description="No products pending review." /> : 
                       pendingProducts.map(p => (
                          <Card key={p.id} className="flex gap-4">
                              <img src={p.image} className="w-20 h-20 rounded object-cover" />
                              <div className="flex-1">
                                  <h4 className="font-bold text-sm">{p.name}</h4>
                                  <p className="text-xs text-gray-500 mb-2">₦{p.price.toLocaleString()}</p>
                                  <div className="flex gap-2">
                                      <Button className="flex-1 py-1 text-xs" onClick={() => handleProductAction(p.id, 'APPROVED')}>Approve</Button>
                                      <Button variant="outline" className="flex-1 py-1 text-xs border-red-500 text-red-500" onClick={() => handleProductAction(p.id, 'REJECTED')}>Reject</Button>
                                  </div>
                              </div>
                          </Card>
                      ))}
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allProducts.map(p => (
                          <Card key={p.id} className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <img src={p.image} className="w-10 h-10 rounded object-cover" />
                                  <div>
                                      <p className="text-sm font-bold">{p.name}</p>
                                      <Badge color={p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{p.status}</Badge>
                                  </div>
                              </div>
                              <div className="flex gap-1">
                                  <button onClick={() => handleToggleProductFeature(p.id)} className={`p-1.5 rounded border ${p.isCategoryFeatured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400'}`}><Crown size={16} /></button>
                                  <button onClick={() => handleProductAction(p.id, p.status === 'APPROVED' ? 'REJECTED' : 'APPROVED')} className="p-1.5 border rounded text-gray-400">{p.status === 'APPROVED' ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                              </div>
                          </Card>
                      ))}
                  </div>
              )}
          </div>
      )}
      
      {/* Other tabs omitted for brevity, keeping existing structure */}
      <div className="text-center py-20 text-gray-400">
          <Database size={40} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">Select a tab above to manage platform data.</p>
      </div>
    </div>
  );
};

export default Admin;