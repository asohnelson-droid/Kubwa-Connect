
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Image as ImageIcon,
  Star
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
  
  const hasLoadedInitial = useRef(false);
  const currentUserId = currentUser?.id;

  // Form & Submission State
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = useCallback(async (forceSilent = false) => {
    if (!currentUserId) return;
    
    if (!hasLoadedInitial.current && !forceSilent) {
      setLoading(true);
    }

    try {
      if (activeTab === 'inventory') {
        const all = await api.getProducts();
        const vendorItems = all.filter(p => p.vendorId === currentUserId);
        setProducts(vendorItems);
      } else {
        const vendorOrders = await api.orders.getVendorOrders(currentUserId);
        setOrders(vendorOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      hasLoadedInitial.current = true;
    } catch (err) {
      console.error("[VendorDashboard] Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, activeTab]);

  useEffect(() => {
    loadData();
  }, [currentUserId, activeTab, loadData]);

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

    // PRE-CHECK: Block if the profile is not marked as setup in the UI state
    if (!currentUser.isSetupComplete) {
       alert("Shop Setup Required: You must complete your merchant profile in the Account section before adding items.");
       setSection(AppSection.ACCOUNT);
       return;
    }

    const limit = currentUser.productLimit || 4; 
    if (products.length >= limit) {
      alert(`Limit Reached: Phase 1 merchants can list up to ${limit} items.`);
      return;
    }

    setEditingProduct({
      name: '',
      price: 0,
      category: PRODUCT_CATEGORIES[0].id,
      image: '',
      description: '',
      variants: [],
      status: 'PENDING',
      isPromoted: false
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
    if (isSubmitting) return;
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

  /**
   * RELIABLE PRODUCT SUBMISSION HANDLER
   * - Enforces PENDING status for admin review
   * - Prevents duplicate clicks via isSubmitting guard
   * - Provides clear visual success/error states
   */
  const handleSaveProduct = async () => {
    // 1. DUPLICATE PREVENTION: Immediately exit if already processing
    if (isSubmitting || !editingProduct) return;
    
    // 2. SECURITY CHECK: Verify merchant identity
    if (!currentUserId) {
        setSubmitError("Session Expired: Please log out and sign in again to verify your identity.");
        return;
    }

    // 3. INPUT VALIDATION: Ensure minimum viable product data
    const nameTrimmed = editingProduct.name?.trim();
    const imageTrimmed = editingProduct.image?.trim();
    const priceVal = Number(editingProduct.price);
    
    if (!nameTrimmed || nameTrimmed.length < 3) {
      setSubmitError("Product Title is too short. Please provide a descriptive name.");
      return;
    }
    if (isNaN(priceVal) || priceVal <= 0) {
      setSubmitError("Valid Price Required: Please enter a selling price greater than 0.");
      return;
    }
    if (!imageTrimmed || !imageTrimmed.startsWith('http')) {
      setSubmitError("Valid Image URL Required: Please provide a working link to your product photo.");
      return;
    }

    // 4. PREPARE SUBMISSION STATE
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      // 5. CONSTRUCT SECURE PAYLOAD
      // Force status to 'PENDING' even for updates to ensure quality control
      const payload: Partial<Product> = {
        ...editingProduct,
        name: nameTrimmed,
        image: imageTrimmed,
        price: priceVal,
        vendorId: currentUserId,
        status: 'PENDING' 
      };

      // 6. EXECUTE DATABASE SYNC
      const result = await api.saveProduct(payload);

      if (result.success) {
        // 7. SUCCESS FEEDBACK
        setSubmitMessage(editingProduct.id ? "Updates submitted for review! 🚀" : "New listing submitted for review! 🎉");
        
        // 8. OPTIMISTIC UI UPDATE: Refresh local state immediately
        if (result.data) {
            const saved = result.data;
            setProducts(prev => {
                const idx = prev.findIndex(p => p.id === saved.id);
                if (idx > -1) return prev.map(p => p.id === saved.id ? saved : p);
                return [saved, ...prev];
            });
        }

        // 9. DELAYED CLOSE: Allow user to see the success message
        setTimeout(() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
          setIsSubmitting(false);
        }, 1800);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error("[VendorDashboard] Submission Failure:", err.message);
      
      // 10. ERROR FEEDBACK: Map cryptic database errors to merchant-friendly alerts
      let friendlyError = err.message || "Something went wrong on our end. Please try again.";
      if (friendlyError.includes('foreign key')) {
          friendlyError = "Merchant Identity Error: We couldn't link this item to your profile. Please visit your Account page to complete your setup.";
      } else if (friendlyError.includes('duplicate key')) {
          friendlyError = "An item with this exact name already exists in your shop.";
      }
      
      setSubmitError(friendlyError);
      setIsSubmitting(false);
    }
  };

  if (!currentUser || currentUser.role !== 'VENDOR') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
         <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle size={40} />
         </div>
         <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">Access Restricted</h2>
         <p className="text-gray-400 text-[10px] mt-2 font-black uppercase tracking-widest leading-loose max-w-xs">
           Only verified merchants can access the console. If you are a vendor, ensure your application is approved.
         </p>
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
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Total Listings</span>
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
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Refreshing...</p>
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
                    <div className="relative w-16 h-16 shrink-0">
                      <img src={product.image} className="w-full h-full rounded-2xl object-cover bg-gray-100" />
                      {product.isPromoted && (
                        <div className="absolute -top-2 -left-2 bg-yellow-400 text-white p-1 rounded-lg shadow-lg">
                          <Star size={12} className="fill-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{product.name}</p>
                      <p className="text-[10px] font-black text-kubwa-green mt-1">₦{product.price.toLocaleString()}</p>
                      <div className="mt-2 flex gap-2">
                        {product.status === 'PENDING' && <Badge color="bg-orange-50 text-orange-600">Pending</Badge>}
                        {product.status === 'APPROVED' && <Badge color="bg-green-50 text-green-600">Live</Badge>}
                        {product.status === 'REJECTED' && <Badge color="bg-red-50 text-red-600">Rejected</Badge>}
                        {product.isPromoted && <Badge color="bg-yellow-50 text-yellow-600">Featured</Badge>}
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
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No live orders</p>
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
                        <span className="uppercase">Merchant Earnings</span>
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
                          DISPATCH RIDER
                        </Button>
                      )}
                      {order.status === 'IN_TRANSIT' && (
                        <Button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')} 
                          className="flex-1 h-12 text-[10px] font-black bg-green-600"
                          disabled={isSubmitting}
                        >
                          COMPLETE ORDER
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
      <Sheet isOpen={isProductFormOpen} onClose={closeForm} title={editingProduct?.id ? "Update Listing" : "New Listing"}>
         <div className="p-2 space-y-8 pb-24">
            <fieldset disabled={isSubmitting} className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Product Title</label>
                   <Input value={editingProduct?.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Selling Price (₦)</label>
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
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2">High-Res Image (URL)</label>
                   <Input placeholder="https://image-hosting.com/item.jpg" value={editingProduct?.image} onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })} />
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Product Story / Specs</label>
                   <textarea 
                     className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold h-24 resize-none outline-none" 
                     placeholder="Tell residents what makes this item special..."
                     value={editingProduct?.description}
                     onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                   />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-tight text-gray-900">Featured Listing</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Prioritize this item on the Mart</p>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setEditingProduct({ ...editingProduct, isPromoted: !editingProduct?.isPromoted })}
                     className={`w-12 h-6 rounded-full transition-colors relative ${editingProduct?.isPromoted ? 'bg-kubwa-green' : 'bg-gray-300'}`}
                   >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingProduct?.isPromoted ? 'left-7' : 'left-1'}`} />
                   </button>
                </div>
            </fieldset>

            <div className="space-y-4">
              {submitError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-[10px] font-black flex items-center gap-3 animate-fade-in border border-red-100 shadow-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="leading-tight">{submitError}</span>
                </div>
              )}
              {submitMessage && (
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-[10px] font-black flex items-center gap-3 animate-fade-in border border-green-100 shadow-sm">
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
              
              <p className="text-[8px] font-black text-gray-300 text-center uppercase tracking-widest mt-2">
                Approvals typically take 2-4 business hours.
              </p>
            </div>
         </div>
      </Sheet>
    </div>
  );
};

export default VendorDashboard;
