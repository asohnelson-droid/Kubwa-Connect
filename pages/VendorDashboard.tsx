
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Loader2, 
  Store, 
  ShoppingBag, 
  X, 
  TrendingUp, 
  ArrowUpCircle,
  AlertCircle,
  Globe,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  MessageSquare,
  Send,
  Check,
  AlertOctagon,
  ChevronRight,
  ClipboardList,
  Truck,
  Image as ImageIcon
} from 'lucide-react';
import { Card, Badge, Button, Sheet, Input, Breadcrumbs } from '../components/ui';
import { api, PRODUCT_CATEGORIES } from '../services/data';
import { User, Product, AppSection, MartOrder, OrderStatus } from '../types';

interface VendorDashboardProps {
  currentUser: User | null;
  setSection: (section: AppSection) => void;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ currentUser, setSection }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form & Submission State
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Stable data loader
  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const all = await api.getProducts();
        const vendorItems = all.filter(p => p.vendorId === currentUser.id);
        setProducts(vendorItems);
      } else {
        const vendorOrders = await api.orders.getVendorOrders(currentUser.id);
        setOrders(vendorOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (err) {
      console.error("[VendorDashboard] Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const closeForm = () => {
    if (isSubmitting) return;
    setIsProductFormOpen(false);
    setEditingProduct(null);
    setSubmitMessage(null);
    setSubmitError(null);
    setIsSubmitting(false);
  };

  const handleOpenAddProduct = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!currentUser) return;

    const limit = 4; // Flat limit for Phase 1
    if (products.length >= limit) {
      alert("Phase 1: Listing limit reached (Max 4 items).");
      return;
    }

    setEditingProduct({
      name: '',
      price: 0,
      category: PRODUCT_CATEGORIES[0].id,
      image: '',
      description: '',
      variants: [],
      status: 'PENDING'
    });
    setSubmitError(null);
    setSubmitMessage(null);
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
    setSubmitError(null);
    setSubmitMessage(null);
    setIsProductFormOpen(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsSubmitting(true);
    try {
      const success = await api.orders.updateStatus(orderId, newStatus);
      if (success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProduct = async () => {
    if (isSubmitting || !currentUser?.id || !editingProduct) return;
    
    const nameTrimmed = editingProduct.name?.trim();
    const imageTrimmed = editingProduct.image?.trim();
    const priceVal = Number(editingProduct.price);
    
    if (!nameTrimmed || isNaN(priceVal) || priceVal <= 0 || !imageTrimmed) {
      setSubmitError("Please provide a valid Name, Price, and Image URL.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const payload: Partial<Product> = {
        ...editingProduct,
        name: nameTrimmed,
        image: imageTrimmed,
        price: priceVal,
        vendorId: currentUser.id,
        status: 'PENDING' 
      };

      const result = await api.saveProduct(payload);

      if (result.success && result.data) {
        const savedProduct = result.data as Product;
        
        setProducts(prev => {
          const exists = prev.find(p => p.id === savedProduct.id);
          if (exists) {
            return prev.map(p => p.id === savedProduct.id ? savedProduct : p);
          }
          return [savedProduct, ...prev];
        });

        setSubmitMessage("Success! Your item has been submitted for approval.");
        
        setTimeout(() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
          setIsSubmitting(false);
        }, 1500);
      } else {
        throw new Error(result.error || "Submission failed. Please check your connection.");
      }
    } catch (err: any) {
      console.error("[VendorDashboard] Save Failed:", err.message);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!currentUser || currentUser.role !== 'VENDOR') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
         <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle size={40} />
         </div>
         <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">Merchant Restricted</h2>
         <p className="text-gray-400 text-[10px] mt-2 font-black uppercase tracking-widest leading-relaxed">Only verified vendors can access this console.</p>
         <Button onClick={() => setSection(AppSection.ACCOUNT)} className="mt-8 px-10 h-14">Return to Account</Button>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-8 px-6 max-w-2xl mx-auto animate-fade-in">
      <Breadcrumbs items={[
        { label: 'Profile', onClick: () => setSection(AppSection.ACCOUNT) },
        { label: 'Merchant Console' }
      ]} />

      <div className="flex justify-between items-start mb-8">
         <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Merchant Console</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">Managing: {currentUser.storeName || currentUser.name}</p>
         </div>
         <Button 
            onClick={handleOpenAddProduct} 
            className="p-4 shadow-xl shadow-kubwa-green/20"
            disabled={currentUser.status === 'SUSPENDED' || isSubmitting}
         >
            <Plus size={20} strokeWidth={3} />
         </Button>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-[2rem] mb-8">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'inventory' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
        >
          <Package size={14} /> Inventory
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
        >
          <ClipboardList size={14} /> Live Orders
          {orders.filter(o => o.status === 'CREATED').length > 0 && (
            <span className="w-2 h-2 bg-kubwa-orange rounded-full"></span>
          )}
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-6 bg-gray-900 text-white border-none rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/10 rounded-xl"><Package size={16} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Listings</span>
                </div>
                <p className="text-2xl font-black tracking-tighter">{products.length}</p>
            </Card>
            <Card className="p-6 bg-white border-none shadow-sm rounded-[2.5rem] border border-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-kubwa-green/10 text-kubwa-green rounded-xl"><Clock size={16} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Review Queue</span>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tighter">{products.filter(p => p.status === 'PENDING').length}</p>
            </Card>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input 
               placeholder="Search inventory..." 
               className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-kubwa-green/10 transition-all"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-kubwa-green" size={32} />
             </div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No listings found</p>
             </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="p-4 border-none shadow-sm rounded-[2.5rem] flex items-center justify-between bg-white hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <img src={product.image} className="w-16 h-16 rounded-2xl object-cover bg-gray-100" />
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{product.name}</p>
                      <p className="text-[10px] font-black text-kubwa-green mt-1">₦{product.price.toLocaleString()}</p>
                      <div className="mt-2">
                        {product.status === 'PENDING' && <Badge color="bg-orange-50 text-orange-600">Pending</Badge>}
                        {product.status === 'APPROVED' && <Badge color="bg-green-50 text-green-600">Live</Badge>}
                        {product.status === 'REJECTED' && <Badge color="bg-red-50 text-red-600">Needs Edit</Badge>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleEditProduct(product)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-900 hover:text-white transition-all">
                    <Edit3 size={18} />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-kubwa-green" size={32} /></div>
          ) : orders.length === 0 ? (
             <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No active orders</p>
             </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order.id} className="p-6 border-none shadow-sm rounded-[2.5rem] bg-white border border-gray-50">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Order #{order.id.slice(0, 5)}</p>
                        <p className="text-sm font-black text-gray-900 uppercase mt-1">{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</p>
                      </div>
                      <Badge color={order.status === 'CREATED' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}>
                         {order.status.replace(/_/g, ' ')}
                      </Badge>
                   </div>
                   
                   <div className="space-y-2 mb-6">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-gray-600">
                           <span>{item.name} x{item.quantity}</span>
                           <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t flex justify-between items-center text-xs font-black text-gray-900">
                        <span className="uppercase">Total Earnings</span>
                        <span className="text-kubwa-green">₦{order.total.toLocaleString()}</span>
                      </div>
                   </div>

                   <div className="flex gap-2">
                      {order.status === 'CREATED' && (
                        <Button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'VENDOR_CONFIRMED')} 
                          className="flex-1 h-12 text-[10px] font-black"
                          disabled={isSubmitting}
                        >
                          CONFIRM ORDER
                        </Button>
                      )}
                      {order.status === 'VENDOR_CONFIRMED' && (
                        <Button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'IN_TRANSIT')} 
                          className="flex-1 h-12 text-[10px] font-black bg-blue-600"
                          disabled={isSubmitting}
                        >
                          MARK AS READY / SHIPPED
                        </Button>
                      )}
                      {order.status === 'IN_TRANSIT' && (
                        <Button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')} 
                          className="flex-1 h-12 text-[10px] font-black bg-green-600"
                          disabled={isSubmitting}
                        >
                          MARK AS DELIVERED
                        </Button>
                      )}
                      <Button variant="outline" className="h-12 w-12 p-0 rounded-2xl">
                         <MessageSquare size={16} />
                      </Button>
                   </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      <Sheet isOpen={isProductFormOpen} onClose={closeForm} title={editingProduct?.id ? "Edit Item" : "New Item"}>
         <div className="p-2 space-y-8 pb-24">
            <fieldset disabled={isSubmitting} className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Name</label>
                   <Input value={editingProduct?.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Price (₦)</label>
                       <Input type="number" value={editingProduct?.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Category</label>
                       <select 
                          className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase outline-none"
                          value={editingProduct?.category}
                          onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                       >
                          {PRODUCT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                       </select>
                    </div>
                </div>
                
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Showcase Image (URL)</label>
                   <Input placeholder="https://example.com/product.jpg" value={editingProduct?.image} onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })} />
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Product Story / Details</label>
                   <textarea 
                     className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold h-24 resize-none outline-none" 
                     placeholder="Tell residents why they should buy this..."
                     value={editingProduct?.description}
                     onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                   />
                </div>
            </fieldset>

            <div className="space-y-4">
              {submitError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-[10px] font-black flex items-center gap-3 animate-fade-in border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              {submitMessage && (
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-[10px] font-black flex items-center gap-3 animate-fade-in border border-green-100">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>{submitMessage}</span>
                </div>
              )}

              <Button 
                onClick={handleSaveProduct} 
                disabled={isSubmitting || !!submitMessage} 
                className="w-full h-16 shadow-xl active:scale-95 transition-transform"
              >
                 {isSubmitting ? <Loader2 className="animate-spin" /> : 'SUBMIT FOR APPROVAL'}
              </Button>
            </div>
         </div>
      </Sheet>
    </div>
  );
};

export default VendorDashboard;
