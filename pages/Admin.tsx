
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/ui';
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
  // Add User icon import with alias to avoid conflict with User type from types.ts
  User as UserIcon
} from 'lucide-react';
import { api } from '../services/data';
import { User, ApprovalStatus, Transaction, Product, AnalyticsData } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const Admin: React.FC<{currentUser?: User | null}> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'products' | 'billing' | 'users'>('overview');
  const [pendingEntities, setPendingEntities] = useState<User[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
        const statsData = await api.admin.getPlatformStats();
        setStats(statsData);

        if (activeTab === 'approvals') {
            const data = await api.admin.getPendingEntities();
            setPendingEntities(data);
        } else if (activeTab === 'products') {
            const data = await api.admin.getPendingProducts();
            setPendingProducts(data);
        } else if (activeTab === 'billing') {
            const data = await api.admin.getAllTransactions();
            setTransactions(data);
        } else if (activeTab === 'users') {
            const data = await api.admin.getAllUsers();
            setAllUsers(data);
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
        loadData();
    }
    setActionLoading(null);
  };

  const handleProductStatusUpdate = async (productId: string, newStatus: ApprovalStatus) => {
    setActionLoading(productId);
    const success = await api.admin.updateProductStatus(productId, newStatus);
    if (success) {
        setPendingProducts(prev => prev.filter(p => p.id !== productId));
        loadData();
    }
    setActionLoading(null);
  };

  const handleToggleFeature = async (userId: string, current: boolean) => {
    setActionLoading(userId);
    const success = await api.admin.toggleFeatureUser(userId, !current);
    if (success) {
        setPendingEntities(prev => prev.map(u => u.id === userId ? { ...u, isFeatured: !current } : u));
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isFeatured: !current } : u));
    }
    setActionLoading(null);
  };

  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mb-8">
            <ShieldCheck size={48} strokeWidth={1} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Access Denied</h2>
        <p className="text-gray-500 font-bold mt-4 max-w-xs leading-relaxed">Only verified platform administrators can access the Central Governance suite.</p>
    </div>
  );

  const COLORS = ['#FF5733', '#F97316', '#FBBF24', '#3B82F6'];

  const revenueData = [
    { name: 'Mon', rev: 4000 },
    { name: 'Tue', rev: 3000 },
    { name: 'Wed', rev: 5000 },
    { name: 'Thu', rev: 8000 },
    { name: 'Fri', rev: 6000 },
    { name: 'Sat', rev: 12000 },
    { name: 'Sun', rev: 9000 },
  ];

  return (
    <div className="pb-32 pt-8 px-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10 flex justify-between items-end">
         <div>
            <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="text-kubwa-green" size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Kubwa Central Governance</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase">Admin Console</h2>
         </div>
         <div className="flex gap-3">
            <button onClick={loadData} className="p-4 bg-gray-100 rounded-[1.5rem] hover:bg-gray-200 transition-colors">
                <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="p-4 bg-gray-100 rounded-[1.5rem] hover:bg-gray-200 transition-colors">
                <Settings size={22}/>
            </button>
         </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex gap-2 mb-10 bg-gray-100 p-1.5 rounded-[2rem] overflow-x-auto no-scrollbar shadow-inner">
         {[
           { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
           { id: 'approvals', label: 'Entities', icon: Clock },
           { id: 'products', label: 'Inventory', icon: ShoppingBag },
           { id: 'billing', label: 'Revenue', icon: DollarSign },
           { id: 'users', label: 'Residents', icon: Users }
         ].map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white shadow-xl text-kubwa-green' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <tab.icon size={16}/> {tab.label}
           </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
          {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="p-10 bg-gradient-to-br from-kubwa-green to-orange-600 text-white border-none shadow-xl shadow-kubwa-green/20 rounded-[2.5rem]">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Platform Revenue</p>
                      <p className="text-4xl font-black tracking-tight">₦{stats?.revenue.toLocaleString()}</p>
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-black">
                         <span className="bg-white/20 px-2 py-1 rounded">+{stats?.conversion}% growth</span>
                      </div>
                   </Card>
                   <Card className="p-10 bg-gray-900 text-white border-none shadow-xl rounded-[2.5rem]">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Total Residents</p>
                      <p className="text-4xl font-black tracking-tight">{stats?.dau.toLocaleString()}</p>
                      <p className="text-[10px] font-black text-gray-500 uppercase mt-4">Verified Business Network</p>
                   </Card>
                   <Card className="p-10 bg-white border-none shadow-sm rounded-[2.5rem]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Pending Tasks</p>
                      <p className="text-4xl font-black text-gray-900 tracking-tight">{stats?.userStats?.pending || 0}</p>
                      <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-kubwa-orange" style={{ width: '45%' }} />
                      </div>
                   </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                           <TrendingUp size={16}/> Revenue Velocity (7D)
                        </h3>
                        <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={revenueData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#ccc'}} />
                                 <YAxis hide />
                                 <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                 <Line type="monotone" dataKey="rev" stroke="#FF5733" strokeWidth={4} dot={{r: 4, fill: '#FF5733', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                           <Activity size={16}/> Revenue Distribution
                        </h3>
                        <div className="h-64 w-full flex items-center">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={stats?.revenueSplit || []}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {stats?.revenueSplit?.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                 </Pie>
                                 <Tooltip />
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="space-y-3">
                              {stats?.revenueSplit?.map((item, idx) => (
                                 <div key={idx} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                                    <span className="text-[10px] font-black uppercase text-gray-500">{item.name}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                    </Card>
                </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-6">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Verification Queue</h3>
               
               {loading ? (
                 <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400">
                    <Loader2 className="animate-spin" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Processing Entity Data...</p>
                 </div>
               ) : pendingEntities.length === 0 ? (
                 <Card className="py-20 border-dashed border-2 flex flex-col items-center justify-center text-center rounded-[3rem]">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-xl font-black uppercase text-gray-900">Queue Cleared</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">All business applications have been reviewed.</p>
                 </Card>
               ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {pendingEntities.map(entity => (
                      <Card key={entity.id} className="p-8 border-none shadow-sm hover:shadow-md transition-all rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 group">
                         <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center text-2xl font-black text-gray-400 overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform shrink-0">
                               {entity.avatar ? <img src={entity.avatar} className="w-full h-full object-cover" /> : entity.name.charAt(0)}
                            </div>
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                  <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">{entity.storeName || entity.name}</h4>
                                  <Badge color={entity.role === 'VENDOR' ? 'bg-orange-50 text-orange-600' : entity.role === 'PROVIDER' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}>
                                     {entity.role}
                                  </Badge>
                               </div>
                               <p className="text-xs font-bold text-gray-400 mb-2">{entity.email}</p>
                               <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleToggleFeature(entity.id, !!entity.isFeatured)}
                                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${entity.isFeatured ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 'text-gray-300 border-gray-100'}`}
                                  >
                                    <Star size={10} className={`inline mr-1 ${entity.isFeatured ? 'fill-yellow-600' : ''}`} /> FEATURED
                                  </button>
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-3 w-full md:w-auto">
                            <Button 
                               variant="outline" 
                               className="flex-1 md:flex-none h-14 border-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                               onClick={() => handleUserStatusUpdate(entity.id, 'REJECTED')}
                               disabled={actionLoading === entity.id}
                            >
                               {actionLoading === entity.id ? <Loader2 size={18} className="animate-spin" /> : <Ban size={18} />} REJECT
                            </Button>
                            <Button 
                               className="flex-1 md:flex-none h-14 bg-kubwa-green shadow-lg shadow-kubwa-green/20"
                               onClick={() => handleUserStatusUpdate(entity.id, 'APPROVED')}
                               disabled={actionLoading === entity.id}
                            >
                               {actionLoading === entity.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} APPROVE
                            </Button>
                         </div>
                      </Card>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">New Product Listings</h3>
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-green" size={40} /></div>
                ) : pendingProducts.length === 0 ? (
                    <Card className="py-20 text-center rounded-[3rem] border-dashed border-2">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory is clean</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {pendingProducts.map(product => (
                            <Card key={product.id} className="p-6 border-none shadow-sm rounded-[2rem] flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                                        <img src={product.image} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight">{product.name}</h4>
                                        <p className="text-xs font-bold text-kubwa-green">₦{product.price.toLocaleString()}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mt-1">From: {product.vendorId}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleProductStatusUpdate(product.id, 'REJECTED')} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><XCircle size={20}/></button>
                                    <button onClick={() => handleProductStatusUpdate(product.id, 'APPROVED')} className="p-4 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all"><CheckCircle size={20}/></button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input className="w-full pl-12 pr-6 py-5 bg-gray-100 border-none rounded-[2rem] text-sm font-black outline-none" placeholder="Search Kubwa Resident Directory..." />
                </div>
                {loading ? (
                   <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-green" /></div>
                ) : (
                  <Card className="p-0 border-none shadow-sm rounded-[3rem] overflow-hidden bg-white divide-y divide-gray-50">
                      {allUsers.map(user => (
                          <div key={user.id} className="p-6 flex items-center justify-between group hover:bg-gray-50 transition-all">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden">
                                     {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-auto text-gray-400" />}
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-2">
                                         <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{user.name}</p>
                                         <Badge color={user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}>{user.role}</Badge>
                                      </div>
                                      <p className="text-[10px] font-bold text-gray-400">{user.email} • {new Date(user.joinedAt || '').toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <button className="p-3 text-gray-200 hover:text-kubwa-green transition-colors">
                                  <ChevronRight size={18} />
                              </button>
                          </div>
                      ))}
                  </Card>
                )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Revenue Streams</h3>
               </div>
               {loading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-green" /></div>
               ) : transactions.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-black uppercase tracking-widest text-[10px]">No recent transactions</div>
               ) : (
                 transactions.map(tx => (
                   <Card key={tx.id} className="flex justify-between items-center p-8 border-none shadow-sm rounded-[2.5rem]">
                      <div className="flex items-center gap-6">
                         <div className="p-4 bg-gray-50 rounded-[1.5rem] text-gray-400">
                            <DollarSign size={24} />
                         </div>
                         <div>
                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{tx.intent.replace('_', ' ')}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">REF: {tx.reference}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xl font-black text-kubwa-green">₦{tx.amount.toLocaleString()}</p>
                         <div className="flex items-center justify-end gap-1 text-[9px] font-black text-green-600 uppercase tracking-widest mt-1">
                            <CheckCircle size={10} /> Verified
                         </div>
                      </div>
                   </Card>
                 ))
               )}
            </div>
          )}
      </div>
    </div>
  );
};

export default Admin;
