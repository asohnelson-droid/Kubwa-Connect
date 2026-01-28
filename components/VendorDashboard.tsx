
import React, { useState, useEffect } from 'react';
import { User, Product, MartOrder, ApprovalStatus } from '../types';
import { api, PRODUCT_CATEGORIES } from '../services/data';
import { Card, Button, Input, Badge, Sheet } from './ui';
import { Plus, Edit2, Trash2, Package, DollarSign, Loader2, Image as ImageIcon } from 'lucide-react';

interface VendorDashboardProps {
  user: User;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    setLoading(true);
    const [pData, oData] = await Promise.all([
      api.products.getByVendor(user.id),
      api.orders.getVendorOrders(user.id)
    ]);
    setProducts(pData);
    setOrders(oData);
    setLoading(false);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.name || !editingProduct?.price) return;
    setSaving(true);
    
    const payload = {
      ...editingProduct,
      vendorId: user.id,
      status: 'PENDING' as ApprovalStatus 
    };

    await api.products.upsert(payload);
    setSaving(false);
    setIsSheetOpen(false);
    setEditingProduct(null);
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    await api.products.delete(id);
    loadData();
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setEditingProduct(prev => ({ ...prev || {}, image: reader.result as string }));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Metrics
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = orders.length;

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Metrics Cards */}
       <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 bg-kubwa-green text-white border-none">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={20}/></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Revenue</span>
             </div>
             <p className="text-2xl font-black">₦{totalRevenue.toLocaleString()}</p>
          </Card>
          <Card className="p-6 bg-gray-900 text-white border-none">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><Package size={20}/></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Orders</span>
             </div>
             <p className="text-2xl font-black">{totalOrders}</p>
          </Card>
       </div>

       {/* Products Section */}
       <div className="flex justify-between items-center">
          <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">My Inventory</h3>
          <Button onClick={() => { setEditingProduct({ category: 'Food' }); setIsSheetOpen(true); }} className="h-10 text-xs px-4">
             <Plus size={16} /> Add Product
          </Button>
       </div>

       {loading ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-kubwa-green"/></div> : (
           <div className="space-y-3">
              {products.length === 0 && <p className="text-center text-gray-400 py-6 text-xs">No products listed.</p>}
              {products.map(p => (
                <Card key={p.id} className="p-4 flex items-center justify-between border-none shadow-sm">
                   <div className="flex items-center gap-4">
                      <img src={p.image} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                      <div>
                         <p className="font-black text-sm text-gray-900">{p.name}</p>
                         <p className="text-xs text-gray-500">₦{p.price.toLocaleString()}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <Badge color={p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{p.status}</Badge>
                      <button onClick={() => { setEditingProduct(p); setIsSheetOpen(true); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><Edit2 size={14}/></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100"><Trash2 size={14}/></button>
                   </div>
                </Card>
              ))}
           </div>
       )}

       {/* Orders Section */}
       <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 mt-8">Recent Orders</h3>
       <div className="space-y-3">
          {orders.length === 0 && !loading && <p className="text-center text-gray-400 py-6 text-xs">No orders yet.</p>}
          {orders.map(o => (
            <Card key={o.id} className="p-4 border-none shadow-sm">
               <div className="flex justify-between mb-2">
                  <span className="font-black text-sm">Order #{o.id.substring(0,6)}</span>
                  <span className="text-xs text-gray-500">{new Date(o.date).toLocaleDateString()}</span>
               </div>
               <div className="space-y-1 mb-3">
                  {o.items.map((i: any) => (
                    <div key={i.id} className="flex justify-between text-xs text-gray-600">
                       <span>{i.quantity}x {i.name}</span>
                       <span>₦{(i.price * i.quantity).toLocaleString()}</span>
                    </div>
                  ))}
               </div>
               <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-black text-kubwa-green">₦{o.total.toLocaleString()}</span>
                  <select 
                    className="bg-gray-100 text-[10px] font-bold p-2 rounded-lg outline-none"
                    value={o.status}
                    onChange={async (e) => {
                       await api.orders.updateStatus(o.id, e.target.value);
                       loadData();
                    }}
                  >
                     <option value="CREATED">Created</option>
                     <option value="VENDOR_CONFIRMED">Confirmed</option>
                     <option value="RIDER_ASSIGNED">Rider Assigned</option>
                     <option value="IN_TRANSIT">In Transit</option>
                     <option value="DELIVERED">Delivered</option>
                  </select>
               </div>
            </Card>
          ))}
       </div>

       {/* Edit/Add Sheet */}
       <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title={editingProduct?.id ? "Edit Product" : "Add Product"}>
          <div className="space-y-4 p-6">
             <div className="w-full h-40 bg-gray-100 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border-2 border-dashed border-gray-200">
                {editingProduct?.image ? <img src={editingProduct.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300 mb-2"/>}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                {!editingProduct?.image && <span className="text-xs text-gray-400 font-bold">Tap to upload image</span>}
             </div>
             <Input placeholder="Product Name" value={editingProduct?.name || ''} onChange={e => setEditingProduct(prev => ({...prev || {}, name: e.target.value}))} />
             <Input placeholder="Price" type="number" value={editingProduct?.price || ''} onChange={e => setEditingProduct(prev => ({...prev || {}, price: Number(e.target.value)}))} />
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Category</label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none"
                  value={editingProduct?.category}
                  onChange={e => setEditingProduct(prev => ({...prev || {}, category: e.target.value}))}
                >
                   {PRODUCT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
             </div>
             <textarea 
               className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none h-24 resize-none" 
               placeholder="Description..."
               value={editingProduct?.description || ''} 
               onChange={e => setEditingProduct(prev => ({...prev || {}, description: e.target.value}))}
             />
             <Button onClick={handleSaveProduct} disabled={saving} className="w-full h-14">
                {saving ? <Loader2 className="animate-spin" /> : 'SAVE PRODUCT'}
             </Button>
          </div>
       </Sheet>
    </div>
  );
};

export default VendorDashboard;
