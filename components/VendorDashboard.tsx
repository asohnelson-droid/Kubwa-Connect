

import React, { useState, useEffect } from 'react';
import { User, Product, MartOrder, ApprovalStatus } from '../types';
import { api, PRODUCT_CATEGORIES } from '../services/data';
import { Card, Button, Input, Badge, Sheet } from './ui';
import { Plus, Edit2, Trash2, Package, DollarSign, Loader2, Image as ImageIcon, Crown, X } from 'lucide-react';

interface VendorDashboardProps {
  user: User;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [imageEntries, setImageEntries] = useState<{ url: string; file?: File }[]>([]);
  const [pendingImageDeletions, setPendingImageDeletions] = useState<string[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

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
    if (!editingProduct?.name || !editingProduct?.price || imageEntries.length === 0) return;
    setSaving(true);

    const resolvedUrls: string[] = [];
    for (const entry of imageEntries) {
      if (entry.file) {
        const uploadedUrl = await api.storage.uploadProductImage(user.id, entry.file);
        if (!uploadedUrl) {
          alert("One of your photos failed to upload. Please try again.");
          setSaving(false);
          return;
        }
        resolvedUrls.push(uploadedUrl);
      } else {
        resolvedUrls.push(entry.url);
      }
    }

    const payload = {
      ...editingProduct,
      image: resolvedUrls[0],
      images: resolvedUrls,
      vendorId: user.id,
      status: 'PENDING' as ApprovalStatus 
    };

    await api.products.upsert(payload);

    // Only now that the product is actually saved is it safe to clean up
    // storage files the vendor removed during this edit.
    for (const url of pendingImageDeletions) {
      api.storage.deleteProductImage(url);
    }

    setSaving(false);
    setIsSheetOpen(false);
    setEditingProduct(null);
    setImageEntries([]);
    setPendingImageDeletions([]);
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    await api.products.delete(id);
    loadData();
  };

  const handleCloseSheet = () => {
    imageEntries.forEach(entry => {
      if (entry.file) URL.revokeObjectURL(entry.url);
    });
    setIsSheetOpen(false);
  };
  
  const MAX_PRODUCT_IMAGES = 4;

  const openAddProduct = () => {
    setEditingProduct({ category: 'Food' });
    setImageEntries([]);
    setPendingImageDeletions([]);
    setIsSheetOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    const existingUrls = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
    setImageEntries(existingUrls.map(url => ({ url })));
    setPendingImageDeletions([]);
    setIsSheetOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = MAX_PRODUCT_IMAGES - imageEntries.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newEntries = filesToAdd.map(file => ({ url: URL.createObjectURL(file), file }));
    setImageEntries(prev => [...prev, ...newEntries]);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImageEntries(prev => {
      const entry = prev[index];
      if (entry.file) {
        // Local preview only -- never uploaded, just free the blob URL.
        URL.revokeObjectURL(entry.url);
      } else {
        // A real, already-uploaded photo -- queue it for storage cleanup,
        // but only actually delete once the product save is confirmed.
        setPendingImageDeletions(d => [...d, entry.url]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Metrics
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = orders.length;

  // Limit Check
  const isLimitReached = products.length >= (user.productLimit || 4);

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
          
          <div className="flex items-center gap-2">
             {isLimitReached && (
               <Button onClick={() => setIsUpgradeModalOpen(true)} className="h-10 text-xs px-4 bg-gray-900 text-white hover:bg-black shadow-xl">
                  <Crown size={14} className="text-yellow-400 mr-2" /> Upgrade
               </Button>
             )}
             <Button 
                onClick={() => { 
                   if (isLimitReached) return;
                   openAddProduct();
                }} 
                disabled={isLimitReached}
                className={`h-10 text-xs px-4 ${isLimitReached ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70 shadow-none' : ''}`}
             >
                <Plus size={16} /> Add Product
             </Button>
          </div>
       </div>

       {isLimitReached && (
         <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-center">
            <p className="text-xs font-black text-orange-800 uppercase tracking-widest">You’ve reached the free plan limit.</p>
         </div>
       )}

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
                      <button onClick={() => openEditProduct(p)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><Edit2 size={14}/></button>
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
                  <span className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</span>
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
                  {o.deliveryOption === 'DISPATCH' && ['RIDER_ASSIGNED', 'IN_TRANSIT', 'DELIVERED'].includes(o.status) ? (
                    <Badge color={o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                       {o.status === 'RIDER_ASSIGNED' ? 'Rider Assigned' : o.status === 'IN_TRANSIT' ? 'Out for Delivery' : 'Delivered'}
                    </Badge>
                  ) : (
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
                       {o.deliveryOption === 'PICKUP' && <option value="DELIVERED">Picked Up</option>}
                       <option value="CANCELLED">Cancelled</option>
                    </select>
                  )}
               </div>
            </Card>
          ))}
       </div>

       {/* Edit/Add Sheet */}
       <Sheet isOpen={isSheetOpen} onClose={handleCloseSheet} title={editingProduct?.id ? "Edit Product" : "Add Product"}>
          <div className="space-y-4 p-6">
             <div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                   {imageEntries.map((entry, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
                         <img src={entry.url} className="w-full h-full object-cover" />
                         {i === 0 && (
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full">Cover</span>
                         )}
                         <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center"
                         >
                            <X size={10} />
                         </button>
                      </div>
                   ))}
                   {imageEntries.length < MAX_PRODUCT_IMAGES && (
                      <label className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-gray-300">
                         <ImageIcon className="text-gray-300" size={18} />
                         <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                      </label>
                   )}
                </div>
                <p className="text-[9px] font-bold text-gray-400 ml-1">Up to {MAX_PRODUCT_IMAGES} photos. First photo is the cover image.</p>
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
             <Button
                onClick={handleSaveProduct}
                disabled={saving || !editingProduct?.name || !editingProduct?.price || imageEntries.length === 0}
                className="w-full h-14"
             >
                {saving ? <><Loader2 className="animate-spin" /> Uploading...</> : 'SAVE PRODUCT'}
             </Button>
          </div>
       </Sheet>

       {/* Upgrade Modal */}
       {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
             <Card className="w-full max-w-sm p-8 text-center animate-zoom-in rounded-[2.5rem] border-none shadow-2xl relative">
                <button 
                  onClick={() => setIsUpgradeModalOpen(false)} 
                  className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X size={20} />
                </button>
                
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                   <Crown size={40} />
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Upgrade your plan</h3>
                <p className="text-gray-500 font-bold text-xs max-w-xs mx-auto mb-8 leading-relaxed">
                   You've hit the limit of 4 products on the Free tier. Unlock unlimited listings and verified badges today.
                </p>
                
                <Button onClick={() => setIsUpgradeModalOpen(false)} className="w-full h-14 text-xs font-black shadow-xl shadow-yellow-500/20 bg-gray-900 text-white">
                   CLOSE
                </Button>
             </Card>
          </div>
       )}
    </div>
  );
};

export default VendorDashboard;