
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '../components/ui';
import { LayoutDashboard, Users, Wrench, Package, Truck, Settings, Loader2, Crown, ShieldCheck, Zap, RefreshCw, Star, Ban, CreditCard, DollarSign } from 'lucide-react';
import { api } from '../services/data';
import { User, MonetisationTier, Transaction } from '../types';

const Admin: React.FC<{currentUser?: User | null}> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'users'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulated Admin Data
    setUsers([
      { id: 'v1', name: 'Musa Provisions', email: 'musa@kubwa.com', role: 'VENDOR', status: 'APPROVED', tier: 'FREE', productLimit: 4 },
      { id: 'v2', name: 'Elite Electronics', email: 'elite@kubwa.com', role: 'VENDOR', status: 'APPROVED', tier: 'FEATURED', productLimit: 999 }
    ] as any);

    setTransactions([
      { id: 't1', userId: 'v2', intent: 'VENDOR_FEATURED', amount: 15000, reference: 'KCB-MOCK-SAMPLE', status: 'SUCCESS', provider: 'MOCK', date: new Date().toISOString() }
    ]);
  }, [activeTab]);

  if (currentUser?.role !== 'ADMIN') return (
    <div className="p-8 text-center text-gray-400 font-black uppercase">Unauthorized Access</div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
         <div>
            <Badge color="bg-gray-800 text-white mb-2">Super Admin</Badge>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Governance Console</h2>
         </div>
         <button className="p-3 bg-gray-100 rounded-2xl"><Settings size={20}/></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
         {[
           { id: 'overview', label: 'Insight', icon: LayoutDashboard },
           { id: 'billing', label: 'Revenue', icon: DollarSign },
           { id: 'users', label: 'Entity Management', icon: Users }
         ].map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}
           >
             <tab.icon size={14}/> {tab.label}
           </button>
         ))}
      </div>

      {/* Content Areas */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
           <Card className="p-6 bg-green-50 border-none">
              <p className="text-[10px] font-black text-green-600 uppercase">Gross Sales</p>
              <p className="text-2xl font-black text-green-900">₦245,000</p>
           </Card>
           <Card className="p-6 bg-blue-50 border-none">
              <p className="text-[10px] font-black text-blue-600 uppercase">Premium Subs</p>
              <p className="text-2xl font-black text-blue-900">12</p>
           </Card>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-4 animate-fade-in">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Live Transaction Log</h3>
           {transactions.map(tx => (
             <Card key={tx.id} className="flex justify-between items-center p-6 border-none shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                      <CreditCard size={20} />
                   </div>
                   <div>
                      <p className="text-xs font-black text-gray-900 uppercase">{tx.intent}</p>
                      <p className="text-[10px] font-bold text-gray-400">{tx.reference}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-black text-kubwa-green">₦{tx.amount.toLocaleString()}</p>
                   <Badge color="bg-green-100 text-green-700">Successful</Badge>
                </div>
             </Card>
           ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
           {users.map(user => (
             <Card key={user.id} className="flex justify-between items-center p-6 border-none shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400">{user.name.charAt(0)}</div>
                   <div>
                      <p className="font-black text-gray-900">{user.name}</p>
                      <Badge color="bg-gray-100 text-gray-500">{user.tier}</Badge>
                   </div>
                </div>
                <Button variant="outline" className="h-10 text-[10px] font-black">Edit Entity</Button>
             </Card>
           ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
