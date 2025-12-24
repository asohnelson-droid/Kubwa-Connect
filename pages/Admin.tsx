
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Badge, Button, Input, Select } from '../components/ui';
import { Users, LayoutDashboard, Loader2, Search, ShoppingBag, CheckCircle, XCircle, DollarSign, Package, Trash2, ExternalLink, Ban, RefreshCw, BellRing, ShieldCheck, Briefcase, Database, Megaphone, UserPlus, Activity, UserX, TrendingUp, Send, Flag, MoreVertical, MessageSquare, Star, List, Settings, Save, AlertTriangle, ToggleLeft, ToggleRight, Lock, ShieldAlert, CheckSquare, Ghost, EyeOff, Eye, Truck, Bike, FileText, X, MapPin, Folder, Crown, Wrench, Shield } from 'lucide-react';
// Removed FEATURED_PLANS and MOCK_RIDERS as they are not exported or used
import { api, PRODUCT_CATEGORIES, CategoryDefinition } from '../services/data';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'providers' | 'orders' | 'content' | 'settings'>('overview');
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [contentType, setContentType] = useState<'PRODUCTS' | 'ANNOUNCEMENTS' | 'REVIEWS'>('PRODUCTS');
  const [productView, setProductView] = useState<'PENDING' | 'LIVE'>('PENDING');
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [logisticsView, setLogisticsView] = useState<'ORDERS' | 'DELIVERIES' | 'LOGS'>('ORDERS');
  const [settings, setSettings] = useState<SystemSettings>({
     allowSignups: true,
     maintenanceMode: false,
     allowAdminPromotions: true,
     supportEmail: '',
     supportPhone: '',
     minVersion: ''
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => { loadDashboardData(); }, [activeTab, contentType, logisticsView]);

  const loadDashboardData = async () => {
    setLoading(true);
    const analytics = await api.admin.getAnalytics();
    setStats(analytics);

    if (activeTab === 'users') {
        const data = await api.users.getAll();
        setUsers(data);
    } else if (activeTab === 'providers') {
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
        }
    } else if (activeTab === 'settings') {
        const sysSettings = await api.admin.getSystemSettings();
        setSettings(sysSettings);
    } else if (activeTab === 'orders') {
        if (logisticsView === 'ORDERS') {
            const allOrders = await api.admin.getAllOrders();
            setOrders(allOrders);
        } else if (logisticsView === 'DELIVERIES') {
            const allDeliveries = await api.admin.getAllDeliveries();
            setDeliveries(allDeliveries);
        }
    }
    setLoading(false);
  };

  const showNotification = (type: 'success'|'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleProviderAction = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
      setUpdatingId(userId);
      let success = false;
      if (status === 'APPROVED') {
          success = await api.admin.approveProvider(userId);
      } else {
          const reason = prompt("Enter rejection reason:") || "Incomplete profile info.";
          success = await api.admin.rejectProvider(userId, reason);
      }
      
      if (success) {
          showNotification('success', `Provider application ${status.toLowerCase()}`);
          loadDashboardData();
      } else {
          showNotification('error', "Action failed.");
      }
      setUpdatingId(null);
  };

  const handleProductAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
     let reason = '';
     if (status === 'REJECTED') {
         const input = prompt("Please provide a reason for rejecting this product:");
         if (input === null) return; 
         reason = input || "Does not meet community guidelines.";
     }

     const success = await api.products.updateStatus(id, status, reason);
     if (success) {
        showNotification('success', `Product ${status.toLowerCase()}`);
        loadDashboardData();
     } else {
        showNotification('error', 'Action failed');
     }
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

      <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 mb-6 overflow-x-auto flex gap-2 no-scrollbar">
           {[
             { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
             { id: 'orders', icon: Truck, label: 'Logistics' },
             { id: 'providers', icon: Wrench, label: 'Providers' },
             { id: 'users', icon: Users, label: 'Users' },
             { id: 'content', icon: Megaphone, label: 'Content' },
             { id: 'settings', icon: Settings, label: 'Settings' },
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                 activeTab === tab.id ? 'bg-kubwa-green text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
               }`}
             >
               <tab.icon size={16} />
               {tab.label}
             </button>
           ))}
      </div>

      {activeTab === 'overview' && stats && (
          <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 border-l-4 border-l-blue-500">
                      <p className="text-xs text-gray-500 font-bold uppercase">DAU</p>
                      <p className="text-2xl font-bold">{stats.dau}</p>
                  </Card>
                  <Card className="p-4 border-l-4 border-l-green-500">
                      <p className="text-xs text-gray-500 font-bold uppercase">Revenue</p>
                      <p className="text-2xl font-bold">₦{stats.revenue.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4 border-l-4 border-l-orange-500">
                      <p className="text-xs text-gray-500 font-bold uppercase">Pending Prod.</p>
                      <p className="text-2xl font-bold">{pendingProducts.length}</p>
                  </Card>
                  <Card className="p-4 border-l-4 border-l-purple-500">
                      <p className="text-xs text-gray-500 font-bold uppercase">New Users</p>
                      <p className="text-2xl font-bold">{stats.userStats?.newThisWeek || 12}</p>
                  </Card>
              </div>
          </div>
      )}

      {activeTab === 'providers' && (
          <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Fixit Provider Applications</h3>
                  <button onClick={loadDashboardData} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {providers.length === 0 ? <EmptyState icon={Wrench} title="No Applications" description="All Fixit providers are up to date." /> : 
                   providers.map(p => (
                      <Card key={p.id} className="p-4 space-y-4 relative overflow-hidden">
                          {p.isVerified && <div className="absolute top-0 right-0 bg-green-500 text-white p-1 rounded-bl-lg shadow"><Shield size={14}/></div>}
                          <div className="flex gap-4">
                              <img src={p.image} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm" alt={p.name} />
                              <div className="flex-1">
                                  <h4 className="font-bold text-lg text-gray-900">{p.name}</h4>
                                  <Badge color="bg-orange-100 text-orange-700 font-bold">{p.category}</Badge>
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={12}/> {p.location || 'Not Specified'}</p>
                              </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg border text-sm">
                              <p className="font-bold text-gray-700 text-xs uppercase mb-1">Skills Offered</p>
                              <div className="flex flex-wrap gap-1">
                                  {p.skills?.map(s => <span key={s} className="bg-white px-2 py-0.5 rounded border text-[10px] text-gray-600">{s}</span>)}
                              </div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg border text-sm italic text-gray-600">
                              <p className="font-bold text-gray-700 text-xs uppercase mb-1 not-italic">Bio / Intro</p>
                              "{p.bio || 'No bio provided.'}"
                          </div>

                          <div className="flex gap-2">
                              <Button 
                                onClick={() => handleProviderAction(p.userId!, 'APPROVED')}
                                className="flex-1 py-2 text-xs bg-green-600 hover:bg-green-700 shadow-sm"
                                disabled={updatingId === p.userId}
                              >
                                {updatingId === p.userId ? <Loader2 size={14} className="animate-spin" /> : 'Approve Application'}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => handleProviderAction(p.userId!, 'REJECTED')}
                                className="flex-1 py-2 text-xs border-red-500 text-red-500 hover:bg-red-50"
                                disabled={updatingId === p.userId}
                              >
                                Reject
                              </Button>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {loading && (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-kubwa-green" size={40} /></div>
      )}

      {!loading && activeTab !== 'overview' && activeTab !== 'providers' && (
        <div className="text-center py-20 text-gray-400">
            <Database size={40} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Manage {activeTab} data here.</p>
        </div>
      )}
    </div>
  );
};

export default Admin;
