
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
  Star,
  UploadCloud,
  X as CloseIcon,
  Settings,
  LogOut
} from 'lucide-react';
import { Card, Badge, Button, Sheet, Input, Breadcrumbs } from '../components/ui';
import { api, PRODUCT_CATEGORIES } from '../services/data';
import { User, Product, AppSection, MartOrder, OrderStatus } from '../types';

interface VendorDashboardProps {
  currentUser: User | null;
  setSection: (section: AppSection) => void;
  refreshUser?: () => Promise<User | null>;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ currentUser, setSection, refreshUser }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const hasLoadedInitial = useRef(false);
  const currentUserId = currentUser?.id;

  // Product Form State
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Settings Form State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<{ storeName: string; bio: string; address: string; phoneNumber: string }>({
    storeName: '', bio: '', address: '', phoneNumber: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
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

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) {
        alert("Image is too large! Please select a photo under 1MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (editingProduct) {
            setEditingProduct({ ...editingProduct, image: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async () => {
    if (isSubmitting || !editingProduct) return;
    if (!currentUserId) {
        setSubmitError("Session Expired: Please log out and sign in again to verify your identity.");
        return;
    }

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
    if (!imageTrimmed || !imageTrimmed.startsWith('data:image') && !imageTrimmed.startsWith('http')) {
      setSubmitError("Valid Image Required: Please upload a photo or provide a valid URL.");
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
        vendorId: currentUserId,
        status: 'PENDING' 
      };

      const result = await api.saveProduct(payload);

      if (result.success) {
        setSubmitMessage(editingProduct.id ? "Updates submitted for review! 🚀" : "New listing submitted for review! 🎉");
        if (result.data) {
            const saved = result.data;
            setProducts(prev => {
                const idx = prev.findIndex(p => p.id === saved.id);
                if (idx > -1) return prev.map(p => p.id === saved.id ? saved : p);
                return [saved, ...prev];
            });
        }
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

  // --- SETTINGS LOGIC ---
  const openSettings = () => {
    if (!currentUser) return;
    setSettingsForm({
      storeName: currentUser.storeName || '',
      bio: currentUser.bio || '',
      address: currentUser.address || '',
      phoneNumber: currentUser.phoneNumber || ''
    });
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    setIsSavingSettings(true);
    try {
      const success = await api.users.updateProfile(currentUser.id, settingsForm);
      if (success) {
        if (refreshUser) await refreshUser();
        setIsSettingsOpen(false);
        alert("Store settings updated successfully!");
      } else {
        alert("Failed to update settings.");
      }
    } catch (e) {
      alert("Error saving settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    await api.auth.signOut();
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
         <div className="flex gap-2">
           <Button 
              onClick={openSettings}
              className="p-4 bg-gray-100 text-gray-900 shadow-none hover:bg-gray-200 w-12 h-12 flex items-center justify-center"
           >
              <Settings size={20} />
           </Button>
           <Button 
              onClick={handleOpenAddProduct} 
              className="p-4 shadow-xl shadow-kubwa-green/20 w-12 h-12 flex items-center justify-center"
              disabled={currentUser.status === 'SUSPENDED' || isSubmitting}
           >
              <Plus size={20} strokeWidth={3} />
           </Button>
         </div>
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
                
                {/* IMPROVED IMAGE SECTION */}
                <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Product Image</label>
                   
                   {/* Instructional Note */}
                   <div className="bg-blue-50 p-3 rounded-2xl flex gap-3 items-start border border-blue-100">
                      <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <div>
                         <p className="text-[10px] font-bold text-blue-700 leading-tight">
                            How to add an image:
                         </p>
                         <ul className="text-[10px] text-blue-600 list-disc ml-4 mt-1 leading-relaxed">
                            <li>Tap the box below to upload directly from your device.</li>
                            <li>Or paste a direct URL (link) if you have one.</li>
                            <li>Use square images (1:1) for best results.</li>
                         </ul>
                      </div>
                   </div>

                   <div className="flex gap-4 items-start">
                      {/* Visual Uploader */}
                      <div className="relative w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 group cursor-pointer hover:border-kubwa-green hover:bg-green-50 transition-all">
                         {editingProduct?.image ? (
                           <>
                             <img src={editingProduct.image} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 size={16} className="text-white" />
                             </div>
                           </>
                         ) : (
                           <UploadCloud className="text-gray-300 group-hover:text-kubwa-green transition-colors" />
                         )}
                         <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={handleImageFileSelect}
                         />
                      </div>

                      {/* URL Fallback Input */}
                      <div className="flex-1 space-y-2">
                         <div className="relative">
                            <Input 
                               placeholder="Or paste image link here..." 
                               value={editingProduct?.image?.startsWith('data:') ? '' : editingProduct?.image} 
                               onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                               className="text-[10px] h-10 pr-8"
                            />
                            {editingProduct?.image && (
                              <button 
                                onClick={() => setEditingProduct({ ...editingProduct, image: '' })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                              >
                                <CloseIcon size={14} />
                              </button>
                            )}
                         </div>
                         <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                           {editingProduct?.image ? <CheckCircle size={10} className="text-green-500"/> : <XCircle size={10} />}
                           {editingProduct?.image ? 'Image selected successfully' : 'No image selected'}
                         </p>
                      </div>
                   </div>
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
            </div>
         </div>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Store Settings">
        <div className="p-2 space-y-6 pb-24">
           <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Store Name</label>
                 <Input value={settingsForm.storeName} onChange={e => setSettingsForm({ ...settingsForm, storeName: e.target.value })} />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Contact Phone</label>
                 <Input value={settingsForm.phoneNumber} onChange={e => setSettingsForm({ ...settingsForm, phoneNumber: e.target.value })} />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Shop Address</label>
                 <Input value={settingsForm.address} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-2">About Your Store</label>
                 <textarea 
                    className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold h-24 resize-none outline-none"
                    value={settingsForm.bio}
                    onChange={e => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                 />
              </div>
           </div>
           
           <div className="space-y-4 pt-4 border-t border-gray-100">
             <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full h-14 bg-gray-900 shadow-none">
                {isSavingSettings ? <Loader2 className="animate-spin" /> : 'SAVE SETTINGS'}
             </Button>
             
             <button onClick={handleLogout} className="w-full py-4 text-xs font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 rounded-2xl transition-colors">
                <LogOut size={16} /> Log Out
             </button>
           </div>
        </div>
      </Sheet>
    </div>
  );
};

export default VendorDashboard;
