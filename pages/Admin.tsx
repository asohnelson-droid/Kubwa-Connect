
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
  Bike
} from 'lucide-react';
import { api } from '../services/data';
import { User, ApprovalStatus, Transaction } from '../types';

const Admin: React.FC<{currentUser?: User | null}> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'billing' | 'users'>('overview');
  const [pendingEntities, setPendingEntities] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'approvals') {
        const data = await api.admin.getPendingEntities();
        setPendingEntities(data);
    } else if (activeTab === 'billing') {
        // Mock billing data
        setTransactions([
          { id: 't1', userId: 'v2', intent: 'VENDOR_FEATURED', amount: 15000, reference: 'KCB-MOCK-SAMPLE', status: 'SUCCESS', provider: 'MOCK', date: new Date().toISOString() }
        ]);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (userId: string, newStatus: ApprovalStatus) => {
    setActionLoading(userId);
    const success = await api.admin.updateUserStatus(userId, newStatus);
    if (success) {
        setPendingEntities(prev => prev.filter(u => u.id !== userId));
    }
    setActionLoading(null);
  };

  if (currentUser?.role !== 'ADMIN') return (
    <div className="p-8 text-center text-gray-400 font-black uppercase tracking-widest">
        Unauthorized Access
    </div>
  );

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
         <button className="p-4 bg-gray-100 rounded-[1.5rem] hover:bg-gray-200 transition-colors">
            <Settings size={22}/>
         </button>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex gap-2 mb-10 bg-gray-100 p-1.5 rounded-[2rem] overflow-x-auto no-scrollbar">
         {[
           { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
           { id: 'approvals', label: 'Verification', icon: Clock },
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="p-10 bg-gradient-to-br from-green-600 to-green-700 text-white border-none shadow-xl shadow-green-600/20 rounded-[2.5rem]">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Platform Revenue</p>
                  <p className="text-4xl font-black tracking-tight">₦245,000</p>
               </Card>
               <Card className="p-10 bg-gray-900 text-white border-none shadow-xl rounded-[2.5rem]">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Active Entities</p>
                  <p className="text-4xl font-black tracking-tight">1,204</p>
               </Card>
               <Card className="p-10 bg-white border-none shadow-sm rounded-[2.5rem]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Open Approvals</p>
                  <p className="text-4xl font-black text-gray-900 tracking-tight">{pendingEntities.length}</p>
               </Card>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pending Verification Queue</h3>
                  <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                     <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
               </div>
               
               {loading ? (
                 <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400">
                    <Loader2 className="animate-spin" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Syncing Applications...</p>
                 </div>
               ) : pendingEntities.length === 0 ? (
                 <Card className="py-20 border-dashed border-2 flex flex-col items-center justify-center text-center rounded-[3rem]">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-xl font-black uppercase text-gray-900">All Caught Up!</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">No new applications are waiting for review.</p>
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
                                     {entity.role === 'VENDOR' ? <Store size={10} className="mr-1" /> : entity.role === 'PROVIDER' ? <Briefcase size={10} className="mr-1" /> : <Bike size={10} className="mr-1" />}
                                     {entity.role}
                                  </Badge>
                               </div>
                               <p className="text-xs font-bold text-gray-400 mb-2">{entity.email}</p>
                               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Applied: {new Date(entity.joinedAt || '').toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="flex gap-3 w-full md:w-auto">
                            <Button 
                               variant="outline" 
                               className="flex-1 md:flex-none h-14 border-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                               onClick={() => handleStatusUpdate(entity.id, 'REJECTED')}
                               disabled={actionLoading === entity.id}
                            >
                               {actionLoading === entity.id ? <Loader2 size={18} className="animate-spin" /> : <Ban size={18} />} REJECT
                            </Button>
                            <Button 
                               className="flex-1 md:flex-none h-14 bg-kubwa-green shadow-lg shadow-kubwa-green/20"
                               onClick={() => handleStatusUpdate(entity.id, 'APPROVED')}
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

          {activeTab === 'billing' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Revenue Streams</h3>
               </div>
               {transactions.map(tx => (
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
                       <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Payment Verified</p>
                    </div>
                 </Card>
               ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default Admin;
