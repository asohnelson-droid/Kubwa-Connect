
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Button, Sheet, Input } from '../components/ui';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Loader2, 
  ShieldCheck, 
  RefreshCw, 
  Ban, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Store,
  Bike,
  ShoppingBag,
  Star,
  Search,
  ChevronRight,
  TrendingUp,
  Activity,
  UserCheck,
  PackageCheck,
  User as UserIcon,
  AlertCircle,
  ArrowUpRight,
  Filter,
  Eye,
  MoreVertical,
  MapPin,
  Trash2,
  Edit3,
  Phone,
  UserPlus,
  ShieldAlert,
  Info,
  Check,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/data';
import { User, ApprovalStatus, Transaction, Product, AnalyticsData, MartOrder, UserRole, MonetisationTier } from '../types';

type AdminTab = 'overview' | 'approvals' | 'products' | 'orders' | 'billing' | 'users';

const Admin: React.FC<{currentUser?: User | null}> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [pendingEntities, setPendingEntities] = useState<User[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allOrders, setAllOrders] = useState<MartOrder[]>([]);
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Selection/Detail State
  const [selectedEntity, setSelectedEntity] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
        const statsData = await api.admin.getPlatformStats();
        setStats(statsData);

        const users = await api.admin.getAllUsers();
        setAllUsers(users);

        if (activeTab === 'approvals') {
            const data = await api.admin.getPendingEntities();
            setPendingEntities(data);
        } else if (activeTab === 'products') {
            const data = await api.admin.getPendingProducts();
            setPendingProducts(data);
        } else if (activeTab === 'orders') {
            const data = await api.admin.getAllOrders();
            setAllOrders(data);
        } else if (activeTab === 'billing') {
            const data = await api.admin.getAllTransactions();
            setTransactions(data);
        }
    } catch (e) {
        console.error("Failed to load admin data", e);
    }
    setLoading(false);
  };

  const handleUserStatusUpdate = async (userId: string, newStatus: ApprovalStatus) => {
    setActionLoading(userId);
    const success = await api.admin.updateUserStatus(userId, newStatus);
    if (success) {
        setPendingEntities(prev => prev.filter(u => u.id !== userId));
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        if (selectedEntity?.id === userId) setSelectedEntity(null);
    }
    setActionLoading(null);
  };

  const handleProductStatusUpdate = async (productId: string, newStatus: ApprovalStatus) => {
    let note = '';
    if (newStatus === 'REJECTED') {
      note = prompt("Why are you rejecting this product? (Optional note for vendor):") || '';
    }

    setActionLoading(productId);
    const success = await api.admin.updateProductStatus(productId, newStatus, currentUser?.id, note);
    if (success) {
        setPendingProducts(prev => prev.filter(p => p.id !== productId));
    }
    setActionLoading(null);
  };

  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mb-8">
            <ShieldCheck size={48} strokeWidth={1} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Restricted Suite</h2>
        <p className="text-gray-500 font-bold mt-4">Authorized Admin Access Only.</p>
    </div>
  );

  return (
    <div className="pb-32 pt-8 px-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-10 flex justify-between items-start">
         <div>
            <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="text-kubwa-green" size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Governance Portal</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase">Admin Console</h2>
         </div>
         <button onClick={loadData} className="p-4 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
         </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-10 bg-gray-100 p-1.5 rounded-[2rem] overflow-x-auto no-scrollbar shadow-inner">
         {[
           { id: 'overview', label: 'Stats', icon: LayoutDashboard },
           { id: 'approvals', label: 'Users', icon: Clock },
           { id: 'products', label: 'Products', icon: ShoppingBag },
           { id: 'orders', label: 'Orders', icon: PackageCheck },
           { id: 'billing', label: 'Billing', icon: DollarSign },
         ].map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setActiveTab(tab.id as AdminTab)}
             className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 px-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white shadow-xl text-kubwa-green' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <tab.icon size={14}/> {tab.label}
           </button>
         ))}
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Inventory Queue</h3>
              <Badge color="bg-gray-900 text-white">{pendingProducts.length} Pending</Badge>
           </div>

           {loading ? <Loader2 className="animate-spin mx-auto text-kubwa-green" /> : 
            pendingProducts.length === 0 ? (
              <Card className="py-20 flex flex-col items-center justify-center border-dashed border-2 rounded-[3rem]">
                 <CheckCircle size={40} className="text-green-500 mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">All Items Reviewed</p>
              </Card>
            ) : (
            <div className="grid grid-cols-1 gap-4">
                {pendingProducts.map(p => {
                  const vendor = allUsers.find(u => u.id === p.vendorId);
                  return (
                    <Card key={p.id} className="p-6 border-none shadow-sm rounded-[2.5rem] flex flex-col gap-6 bg-white hover:shadow-xl transition-all border border-gray-50 overflow-hidden relative">
                       <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                             <img src={p.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1">
                             <h4 className="font-black text-gray-900 text-base uppercase tracking-tight">{p.name}</h4>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Store: <span className="text-kubwa-orange">{vendor?.storeName || vendor?.name || 'Unknown'}</span></p>
                             <div className="mt-3 flex items-center gap-4">
                                <p className="text-sm font-black text-kubwa-green">₦{p.price.toLocaleString()}</p>
                                <Badge color="bg-gray-50 text-gray-400">{p.category}</Badge>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => handleProductStatusUpdate(p.id, 'REJECTED')} 
                               className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-inner"
                             >
                               <XCircle size={20}/>
                             </button>
                             <button 
                               onClick={() => handleProductStatusUpdate(p.id, 'APPROVED')} 
                               className="p-4 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-inner"
                             >
                               <CheckCircle size={20}/>
                             </button>
                          </div>
                       </div>
                       
                       {p.description && (
                         <div className="p-4 bg-gray-50 rounded-2xl text-[10px] text-gray-600 italic leading-relaxed">
                            "{p.description}"
                         </div>
                       )}
                    </Card>
                  );
                })}
            </div>
           )}
        </div>
      )}
      
      {/* Fallback for other tabs since this focus is on approval flow */}
      {(activeTab === 'overview' || activeTab === 'approvals' || activeTab === 'orders' || activeTab === 'billing') && (
        <div className="py-20 text-center opacity-30 text-xs font-black uppercase tracking-widest">
           Section in production...
        </div>
      )}
    </div>
  );
};

export default Admin;
