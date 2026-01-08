
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/ui';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Clock,
  ShoppingBag,
  PackageCheck,
  Activity,
  User as UserIcon,
  Store,
  Briefcase,
  Bike,
  Loader2
} from 'lucide-react';
import { api } from '../services/data';
import { User, ApprovalStatus, Product, AnalyticsData } from '../types';

type AdminTab = 'overview' | 'approvals' | 'products';

const Admin: React.FC<{currentUser?: User | null}> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [pendingEntities, setPendingEntities] = useState<User[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
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

        const users = await api.admin.getAllUsers();
        setAllUsers(users);

        if (activeTab === 'approvals') {
            const data = await api.admin.getPendingEntities();
            setPendingEntities(data);
        } else if (activeTab === 'products') {
            const data = await api.admin.getPendingProducts();
            setPendingProducts(data);
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
        api.notifications.send({
          title: newStatus === 'APPROVED' ? "Verification Successful! ✅" : "Verification Rejected ❌",
          body: newStatus === 'APPROVED' ? "Your profile has been approved. You now have full access." : "Your application was not approved. Check your profile for details."
        });
    }
    setActionLoading(null);
  };

  const handleProductStatusUpdate = async (productId: string, newStatus: ApprovalStatus) => {
    setActionLoading(productId);
    const success = await api.admin.updateProductStatus(productId, newStatus);
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
      <div className="mb-10 flex justify-between items-start">
         <div>
            <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="text-kubwa-green" size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Governance Portal</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase text-nowrap">Admin Console</h2>
         </div>
         <button onClick={loadData} className="p-4 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
         </button>
      </div>

      <div className="flex gap-2 mb-10 bg-gray-100 p-1.5 rounded-[2rem] overflow-x-auto no-scrollbar shadow-inner">
         {[
           { id: 'overview', label: 'Overview', icon: LayoutDashboard },
           { id: 'approvals', label: 'Residents', icon: Users },
           { id: 'products', label: 'Inventory', icon: ShoppingBag },
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

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
           <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-900 text-white border-none p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                 <Users className="text-kubwa-green mb-4" size={32} />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50">Total Residents</h4>
                 <p className="text-4xl font-black tracking-tighter mt-2">{stats?.userStats?.total || 0}</p>
              </Card>
              <Card className="bg-white border-none p-8 rounded-[3rem] shadow-sm border border-gray-100">
                 <ShoppingBag className="text-kubwa-orange mb-4" size={32} />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Items</h4>
                 <p className="text-4xl font-black text-gray-900 tracking-tighter mt-2">{stats?.userStats?.products || 0}</p>
              </Card>
              <Card className="bg-white border-none p-8 rounded-[3rem] shadow-sm border border-gray-100">
                 <PackageCheck className="text-blue-500 mb-4" size={32} />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Orders</h4>
                 <p className="text-4xl font-black text-gray-900 tracking-tighter mt-2">{stats?.userStats?.orders || 0}</p>
              </Card>
              <Card className="bg-white border-none p-8 rounded-[3rem] shadow-sm border border-gray-100">
                 <Activity className="text-green-500 mb-4" size={32} />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Platform Uptime</h4>
                 <p className="text-4xl font-black text-gray-900 tracking-tighter mt-2">100%</p>
              </Card>
           </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Verification Queue</h3>
                <Badge color="bg-gray-900 text-white">{pendingEntities.length} Pending</Badge>
            </div>
            
            {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-green" /></div> : 
             pendingEntities.length === 0 ? (
               <Card className="py-20 flex flex-col items-center justify-center border-dashed border-2 rounded-[3rem]">
                  <CheckCircle size={40} className="text-green-500 mb-4 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No Pending Profiles</p>
               </Card>
             ) : (
                <div className="grid grid-cols-1 gap-4">
                    {pendingEntities.map(u => (
                        <Card key={u.id} className="p-6 border-none shadow-sm rounded-[2.5rem] bg-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                                   {u.role === 'VENDOR' ? <Store className="text-kubwa-green" /> : 
                                    u.role === 'PROVIDER' ? <Briefcase className="text-kubwa-orange" /> : 
                                    <Bike className="text-blue-500" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase">{u.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{u.role}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                  disabled={!!actionLoading}
                                  onClick={() => handleUserStatusUpdate(u.id, 'REJECTED')}
                                  className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                >
                                   {actionLoading === u.id ? <Loader2 className="animate-spin" size={18}/> : <XCircle size={18}/>}
                                </button>
                                <button 
                                  disabled={!!actionLoading}
                                  onClick={() => handleUserStatusUpdate(u.id, 'APPROVED')}
                                  className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                                >
                                   {actionLoading === u.id ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
             )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Inventory Queue</h3>
              <Badge color="bg-gray-900 text-white">{pendingProducts.length} Pending</Badge>
           </div>

           {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-green" /></div> : 
            pendingProducts.length === 0 ? (
              <Card className="py-20 flex flex-col items-center justify-center border-dashed border-2 rounded-[3rem]">
                 <CheckCircle size={40} className="text-green-500 mb-4 opacity-20" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">All Items Reviewed</p>
              </Card>
            ) : (
            <div className="grid grid-cols-1 gap-4">
                {pendingProducts.map(p => {
                  const vendor = allUsers.find(u => u.id === p.vendorId);
                  return (
                    <Card key={p.id} className="p-6 border-none shadow-sm rounded-[2.5rem] flex items-center justify-between bg-white hover:shadow-xl transition-all border border-gray-50 overflow-hidden relative">
                       <div className="flex items-center gap-6 w-full">
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
                               disabled={!!actionLoading}
                               onClick={() => handleProductStatusUpdate(p.id, 'REJECTED')} 
                               className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-inner"
                             >
                               {actionLoading === p.id ? <Loader2 className="animate-spin" size={20}/> : <XCircle size={20}/>}
                             </button>
                             <button 
                               disabled={!!actionLoading}
                               onClick={() => handleProductStatusUpdate(p.id, 'APPROVED')} 
                               className="p-4 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-inner"
                             >
                               {actionLoading === p.id ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
                             </button>
                          </div>
                       </div>
                    </Card>
                  );
                })}
            </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Admin;
