
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Sheet, Input, SafeImage } from '../components/ui';
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
  Bell,
  Trash2,
  Plus,
  PackageCheck,
  RotateCcw,
  // Add User icon import with alias to avoid conflict with User type from types.ts
  User as UserIcon
} from 'lucide-react';
import { api } from '../services/data';
import { User, ApprovalStatus, Transaction, Product, AnalyticsData, Announcement, MartOrder } from '../types';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'products' | 'orders' | 'billing' | 'users' | 'announcements'>('overview');
  const [pendingEntities, setPendingEntities] = useState<User[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Refunds
  const [refundingOrder, setRefundingOrder] = useState<MartOrder | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [issuingRefund, setIssuingRefund] = useState(false);

  // Announcements tab
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAnnouncementSheetOpen, setIsAnnouncementSheetOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<'INFO' | 'ALERT' | 'PROMO'>('INFO');
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

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
        } else if (activeTab === 'orders') {
            const data = await api.admin.getAllOrders();
            setOrders(data);
        } else if (activeTab === 'users') {
            const data = await api.admin.getAllUsers();
            setAllUsers(data);
        } else if (activeTab === 'announcements') {
            const data = await api.admin.getAllAnnouncements();
            setAnnouncements(data);
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

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim() || !newMessage.trim()) return;
    setCreatingAnnouncement(true);
    const result = await api.admin.createAnnouncement({
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newType
    });
    if (result.success) {
      setIsAnnouncementSheetOpen(false);
      setNewTitle('');
      setNewMessage('');
      setNewType('INFO');
      loadData();
    } else {
      alert("Failed to create announcement. Please try again.");
    }
    setCreatingAnnouncement(false);
  };

  const handleToggleAnnouncementActive = async (id: string, current: boolean) => {
    setActionLoading(id);
    const success = await api.admin.toggleAnnouncementActive(id, !current);
    if (success) {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive: !current } : a));
    }
    setActionLoading(null);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement? This can't be undone.")) return;
    setActionLoading(id);
    const success = await api.admin.deleteAnnouncement(id);
    if (success) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
    setActionLoading(null);
  };

  const handleIssueRefund = async () => {
    if (!refundingOrder || !refundReason.trim()) return;
    setIssuingRefund(true);
    const result = await api.admin.issueRefund(refundingOrder.id, refundReason.trim());
    setIssuingRefund(false);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === refundingOrder.id ? { ...o, refundStatus: 'REFUNDED', refundReason: refundReason.trim() } : o));
      setRefundingOrder(null);
      setRefundReason('');
    } else {
      alert(result.error || "Couldn't issue the refund. Please try again.");
    }
  };

  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-8">
            <ShieldCheck size={44} strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-2xl font-bold text-kubwa-ink">Access denied</h2>
        <p className="text-gray-500 font-medium mt-4 max-w-xs leading-relaxed text-sm">Only verified platform administrators can access the Central Governance suite.</p>
    </div>
  );

  const COLORS = ['#FF5A36', '#16A34A', '#F59E0B', '#2563EB'];

  const ROLE_COLORS: Record<string, string> = {
    VENDOR: 'bg-kubwa-mart/10 text-kubwa-mart',
    PROVIDER: 'bg-kubwa-fixit/10 text-kubwa-fixit',
    RIDER: 'bg-kubwa-ride/10 text-kubwa-ride',
  };

  return (
    <div className="pb-32 pt-8 px-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10 flex justify-between items-end">
         <div>
            <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="text-kubwa-primary" size={18} />
                <span className="text-xs font-bold text-gray-500">Kubwa Central Governance</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-kubwa-ink tracking-tight leading-none">Admin Console</h2>
         </div>
         <div className="flex gap-3">
            <button onClick={loadData} className="p-4 bg-gray-100 rounded-[1.25rem] hover:bg-gray-200 transition-colors">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="p-4 bg-gray-100 rounded-[1.25rem] hover:bg-gray-200 transition-colors">
                <Settings size={20}/>
            </button>
         </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex gap-2 mb-10 bg-gray-100 p-1.5 rounded-[1.75rem] overflow-x-auto no-scrollbar">
         {[
           { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
           { id: 'approvals', label: 'Entities', icon: Clock },
           { id: 'products', label: 'Inventory', icon: ShoppingBag },
           { id: 'orders', label: 'Orders', icon: PackageCheck },
           { id: 'announcements', label: 'Announcements', icon: Bell },
           { id: 'billing', label: 'Revenue', icon: DollarSign },
           { id: 'users', label: 'Residents', icon: Users }
         ].map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow-lg text-kubwa-primary' : 'text-gray-500 hover:text-kubwa-ink'}`}
           >
             <tab.icon size={15}/> {tab.label}
           </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
          {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="p-8 bg-gradient-to-br from-kubwa-primary to-kubwa-primaryDark text-white border-none shadow-xl shadow-kubwa-primary/20 rounded-[2rem]">
                      <p className="text-xs font-bold opacity-70 mb-2">Platform revenue</p>
                      <p className="text-4xl font-bold tracking-tight">₦{stats?.revenue.toLocaleString()}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                         <span className="bg-white/20 px-2.5 py-1 rounded-lg">{(stats?.conversion ?? 0) >= 0 ? '+' : ''}{stats?.conversion ?? 0}% vs last week</span>
                      </div>
                   </Card>
                   <Card className="p-8 bg-kubwa-ink text-white border-none shadow-xl rounded-[2rem]">
                      <p className="text-xs font-bold opacity-60 mb-2">Total residents</p>
                      <p className="text-4xl font-bold tracking-tight">{stats?.dau.toLocaleString()}</p>
                      <p className="text-xs font-semibold text-gray-400 mt-4">Verified business network</p>
                   </Card>
                   <Card className="p-8 bg-white border-none shadow-sm rounded-[2rem]">
                      <p className="text-xs font-bold text-gray-500 mb-2">Pending tasks</p>
                      <p className="text-4xl font-bold text-kubwa-ink tracking-tight">{stats?.userStats?.pending || 0}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-4">Applications awaiting review</p>
                   </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white">
                        <h3 className="text-xs font-bold text-gray-500 mb-8 flex items-center gap-2">
                           <TrendingUp size={16}/> Revenue velocity (7d)
                        </h3>
                        <div className="h-64 w-full">
                           {(!stats?.revenueByDay || stats.revenueByDay.every(d => d.rev === 0)) ? (
                              <div className="h-full flex items-center justify-center text-center px-6">
                                 <p className="text-xs font-semibold text-gray-500">No subscription revenue in the last 7 days yet.</p>
                              </div>
                           ) : (
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={stats.revenueByDay}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#ccc'}} />
                                 <YAxis hide />
                                 <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                 <Line type="monotone" dataKey="rev" stroke="#FF5A36" strokeWidth={3.5} dot={{r: 4, fill: '#FF5A36', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                              </LineChart>
                           </ResponsiveContainer>
                           )}
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white">
                        <h3 className="text-xs font-bold text-gray-500 mb-8 flex items-center gap-2">
                           <Activity size={16}/> Revenue distribution
                        </h3>
                        <div className="h-64 w-full flex items-center">
                           {(!stats?.revenueSplit || stats.revenueSplit.length === 0) ? (
                              <p className="text-xs font-semibold text-gray-500 text-center w-full px-6">No subscription revenue in the last 7 days yet.</p>
                           ) : (
                           <>
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={stats.revenueSplit}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {stats.revenueSplit.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                 </Pie>
                                 <Tooltip />
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="space-y-3">
                              {stats.revenueSplit.map((item, idx) => (
                                 <div key={idx} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                                    <span className="text-xs font-bold text-gray-500">{item.name}</span>
                                 </div>
                              ))}
                           </div>
                           </>
                           )}
                        </div>
                    </Card>
                </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-6">
               <h3 className="text-xs font-bold text-gray-500 ml-2">Verification queue</h3>
               
               {loading ? (
                 <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-500">
                    <Loader2 className="animate-spin" size={44} />
                    <p className="text-xs font-bold">Processing entity data...</p>
                 </div>
               ) : pendingEntities.length === 0 ? (
                 <Card className="py-20 border-dashed border-2 flex flex-col items-center justify-center text-center rounded-[2.5rem]">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[1.75rem] flex items-center justify-center mb-6">
                        <CheckCircle size={36} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-kubwa-ink">Queue cleared</h3>
                    <p className="text-xs font-semibold text-gray-500 mt-2">All business applications have been reviewed.</p>
                 </Card>
               ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {pendingEntities.map(entity => (
                      <Card key={entity.id} className="p-6 border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
                         <div className="flex items-center gap-5 w-full md:w-auto">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-xl font-bold text-gray-500 overflow-hidden border border-gray-100 shrink-0">
                               <SafeImage src={entity.avatar} className="w-full h-full object-cover" alt="" fallbackIcon={<span>{entity.name.charAt(0)}</span>} />
                            </div>
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                  <h4 className="text-base font-bold text-kubwa-ink">{entity.storeName || entity.name}</h4>
                                  <Badge color={ROLE_COLORS[entity.role] || 'bg-gray-100 text-gray-500'}>
                                     {entity.role}
                                  </Badge>
                               </div>
                               <p className="text-xs font-semibold text-gray-500 mb-2">{entity.email}</p>
                               <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleToggleFeature(entity.id, !!entity.isFeatured)}
                                    className={`text-[10px] font-bold px-3 py-1 rounded-full border ${entity.isFeatured ? 'bg-kubwa-amber/10 text-kubwa-amber border-kubwa-amber/20' : 'text-gray-500 border-gray-100'}`}
                                  >
                                    <Star size={10} className={`inline mr-1 ${entity.isFeatured ? 'fill-kubwa-amber' : ''}`} /> Featured
                                  </button>
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-3 w-full md:w-auto">
                            <Button 
                               variant="outline" 
                               className="flex-1 md:flex-none h-12 border-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                               onClick={() => handleUserStatusUpdate(entity.id, 'REJECTED')}
                               disabled={actionLoading === entity.id}
                            >
                               {actionLoading === entity.id ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />} Reject
                            </Button>
                            <Button 
                               className="flex-1 md:flex-none h-12 shadow-lg shadow-kubwa-primary/20"
                               onClick={() => handleUserStatusUpdate(entity.id, 'APPROVED')}
                               disabled={actionLoading === entity.id}
                            >
                               {actionLoading === entity.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve
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
                <h3 className="text-xs font-bold text-gray-500 ml-2">New product listings</h3>
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-primary" size={36} /></div>
                ) : pendingProducts.length === 0 ? (
                    <Card className="py-20 text-center rounded-[2.5rem] border-dashed border-2">
                         <p className="text-xs font-bold text-gray-500">Inventory is clean</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {pendingProducts.map(product => (
                            <Card key={product.id} className="p-5 border-none shadow-sm rounded-[1.75rem] flex items-center justify-between">
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                                        <SafeImage src={product.image} className="w-full h-full object-cover" alt={product.name} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-kubwa-ink text-sm truncate">{product.name}</h4>
                                        <p className="text-xs font-bold text-kubwa-mart">₦{product.price.toLocaleString()}</p>
                                        <p className="text-[11px] font-semibold text-gray-500 mt-0.5 truncate">From: {product.vendorId}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleProductStatusUpdate(product.id, 'REJECTED')} className="p-3.5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><XCircle size={18}/></button>
                                    <button onClick={() => handleProductStatusUpdate(product.id, 'APPROVED')} className="p-3.5 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all"><CheckCircle size={18}/></button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-500 ml-2">Home screen announcements</h3>
                    <Button onClick={() => setIsAnnouncementSheetOpen(true)} className="h-11 text-xs px-5">
                        <Plus size={16} /> New announcement
                    </Button>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-primary" size={36} /></div>
                ) : announcements.length === 0 ? (
                    <Card className="py-20 text-center rounded-[2.5rem] border-dashed border-2">
                         <div className="w-20 h-20 bg-gray-50 text-gray-500 rounded-[1.75rem] flex items-center justify-center mx-auto mb-6">
                            <Bell size={36} />
                         </div>
                         <p className="text-xs font-bold text-gray-500">No announcements yet</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map(a => (
                            <Card key={a.id} className="p-6 border-none shadow-sm rounded-[1.75rem]">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge color={
                                                a.type === 'ALERT' ? 'bg-red-50 text-red-600' :
                                                a.type === 'PROMO' ? 'bg-kubwa-amber/10 text-kubwa-amber' :
                                                'bg-blue-50 text-blue-600'
                                            }>{a.type}</Badge>
                                            <Badge color={a.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}>
                                                {a.isActive ? 'Live' : 'Hidden'}
                                            </Badge>
                                        </div>
                                        <h4 className="font-bold text-kubwa-ink text-sm truncate">{a.title}</h4>
                                        <p className="text-xs font-semibold text-gray-500 mt-1 line-clamp-2">{a.message}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggleAnnouncementActive(a.id, a.isActive)}
                                            disabled={actionLoading === a.id}
                                            className={`p-3 rounded-2xl transition-all ${a.isActive ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                        >
                                            {actionLoading === a.id ? <Loader2 size={18} className="animate-spin" /> : a.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAnnouncement(a.id)}
                                            disabled={actionLoading === a.id}
                                            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Sheet isOpen={isAnnouncementSheetOpen} onClose={() => setIsAnnouncementSheetOpen(false)} title="New Announcement">
                    <div className="space-y-4 p-6">
                        <Input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                        <textarea
                            className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-semibold h-28 resize-none outline-none focus:ring-2 focus:ring-kubwa-primary/20"
                            placeholder="Message"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                        />
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 ml-2">Type</label>
                            <select
                                className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-semibold outline-none"
                                value={newType}
                                onChange={e => setNewType(e.target.value as 'INFO' | 'ALERT' | 'PROMO')}
                            >
                                <option value="INFO">Info</option>
                                <option value="ALERT">Alert</option>
                                <option value="PROMO">Promo</option>
                            </select>
                        </div>
                        <Button onClick={handleCreateAnnouncement} disabled={creatingAnnouncement || !newTitle.trim() || !newMessage.trim()} className="w-full h-14">
                            {creatingAnnouncement ? <Loader2 className="animate-spin" /> : 'Publish announcement'}
                        </Button>
                    </div>
                </Sheet>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input className="w-full pl-12 pr-6 py-4 bg-gray-100 border-none rounded-[1.75rem] text-sm font-semibold outline-none" placeholder="Search Kubwa resident directory..." />
                </div>
                {loading ? (
                   <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-primary" /></div>
                ) : (
                  <Card className="p-0 border-none shadow-sm rounded-[2rem] overflow-hidden bg-white divide-y divide-gray-50">
                      {allUsers.map(user => (
                          <div key={user.id} className="p-5 flex items-center justify-between group hover:bg-gray-50 transition-all">
                              <div className="flex items-center gap-4 min-w-0">
                                  <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                                     <SafeImage src={user.avatar} className="w-full h-full object-cover" alt="" fallbackIcon={<UserIcon size={18} />} />
                                  </div>
                                  <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                         <p className="text-sm font-bold text-kubwa-ink truncate">{user.name}</p>
                                         <Badge color={user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'bg-indigo-50 text-indigo-600' : ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-500'}>{user.role}</Badge>
                                      </div>
                                      <p className="text-xs font-semibold text-gray-500 truncate">{user.email} • {new Date(user.joinedAt || '').toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <button className="p-3 text-gray-200 hover:text-kubwa-primary transition-colors shrink-0">
                                  <ChevronRight size={18} />
                              </button>
                          </div>
                      ))}
                  </Card>
                )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-gray-500 ml-2">Recent orders (most recent 100)</h3>
               {loading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-primary" /></div>
               ) : orders.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 font-bold text-sm">No orders yet</div>
               ) : (
                 orders.map(order => (
                   <Card key={order.id} className="p-6 border-none shadow-sm rounded-[2rem]">
                      <div className="flex justify-between items-start gap-4">
                         <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3.5 bg-gray-50 rounded-2xl text-gray-500 shrink-0">
                               <PackageCheck size={22} />
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-bold text-kubwa-ink">Order #{order.id.slice(0, 6)}</p>
                               <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleDateString()} &middot; {order.deliveryOption}</p>
                               <div className="flex items-center gap-1.5 mt-1.5">
                                  <Badge color="bg-gray-100 text-gray-600">{order.status.replace('_', ' ')}</Badge>
                                  {order.refundStatus === 'REFUNDED' && (
                                     <Badge color="bg-red-50 text-red-500">Refunded</Badge>
                                  )}
                               </div>
                            </div>
                         </div>
                         <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-kubwa-mart">₦{order.total.toLocaleString()}</p>
                            {order.refundStatus === 'REFUNDED' ? (
                               <p className="text-[10px] font-semibold text-gray-500 mt-2 max-w-[140px]">{order.refundReason}</p>
                            ) : (
                               <button
                                  onClick={() => { setRefundingOrder(order); setRefundReason(''); }}
                                  className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 ml-auto"
                               >
                                  <RotateCcw size={12} /> Issue refund
                               </button>
                            )}
                         </div>
                      </div>
                   </Card>
                 ))
               )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-xs font-bold text-gray-500">Revenue streams</h3>
               </div>
               {loading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-primary" /></div>
               ) : transactions.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 font-bold text-sm">No recent transactions</div>
               ) : (
                 transactions.map(tx => (
                   <Card key={tx.id} className="flex justify-between items-center p-6 border-none shadow-sm rounded-[2rem]">
                      <div className="flex items-center gap-5">
                         <div className="p-3.5 bg-gray-50 rounded-2xl text-gray-500">
                            <DollarSign size={22} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-kubwa-ink">{tx.intent.replace('_', ' ')}</p>
                            <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Ref: {tx.reference}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xl font-bold text-kubwa-mart">₦{tx.amount.toLocaleString()}</p>
                         <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-green-600 mt-1">
                            <CheckCircle size={10} /> Verified
                         </div>
                      </div>
                   </Card>
                 ))
               )}
            </div>
          )}
      </div>

      <Sheet isOpen={!!refundingOrder} onClose={() => setRefundingOrder(null)} title="Issue Refund">
        {refundingOrder && (
          <div className="p-6 pb-8 space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4">
               <p className="text-xs font-bold text-gray-500">Order #{refundingOrder.id.slice(0, 6)}</p>
               <p className="text-2xl font-bold text-kubwa-ink mt-1">₦{refundingOrder.total.toLocaleString()}</p>
            </div>
            <p className="text-xs font-semibold text-gray-500 leading-relaxed">
               This records the refund for your own tracking and marks the order visibly refunded. It does not move money automatically -- process the actual payment reversal in Paystack yourself.
            </p>
            <textarea
              className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-semibold h-24 resize-none outline-none focus:ring-2 focus:ring-kubwa-primary/20"
              placeholder="Reason for this refund (required)"
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
            />
            <Button onClick={handleIssueRefund} disabled={issuingRefund || !refundReason.trim()} className="w-full h-14 bg-red-500 shadow-red-500/20">
              {issuingRefund ? <Loader2 className="animate-spin" /> : 'Confirm refund'}
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default Admin;
