
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
  Check
} from 'lucide-react';
import { Card, Badge, Button, Sheet, Input, Breadcrumbs } from '../components/ui';
import { api, PRODUCT_CATEGORIES } from '../services/data';
import { User, Product, AppSection } from '../types';

interface VendorDashboardProps {
  currentUser: User | null;
  setSection: (section: AppSection) => void;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ currentUser, setSection }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load products belonging to the current vendor
  const loadProducts = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const all = await api.getProducts();
      const vendorItems = all.filter(p => p.vendorId === currentUser.id);
      setProducts(vendorItems);
    } catch (err) {
      console.error("[VendorDashboard] Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const closeForm = () => {
    setIsProductFormOpen(false);
    setEditingProduct(null);
    setSaveSuccess(false);
  };

  const handleOpenAddProduct = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!currentUser) return;

    // Vendor Guard: Limits for unapproved accounts
    if (currentUser.status === 'PENDING' && products.length >= 1) {
      alert("Verification Pending: You can list one initial item until your profile is approved.");
      return;
    }

    if (currentUser.status === 'SUSPENDED') {
      alert("Access Blocked: Your listing privileges are currently suspended.");
      return;
    }

    const limit = currentUser.productLimit || (currentUser.tier === 'FREE' ? 6 : 999);
    if (products.length >= limit) {
      setShowUpgradeModal(true);
      return;
    }

    // New Product Default State
    setEditingProduct({
      name: '',
      price: 0,
      category: PRODUCT_CATEGORIES[0].id,
      image: '',
      description: '',
      variants: [],
      status: 'PENDING'
    });
    setSaveSuccess(false);
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
    setSaveSuccess(false);
    setIsProductFormOpen(true);
  };

  /**
   * ROBUST SUBMISSION FLOW
   * - Sets 'PENDING' explicitly to trigger admin review
   * - Disables UI to prevent race conditions or duplicates
   * - Provides visual success state before closing
   */
  const handleSaveProduct = async () => {
    // 1. Double-Submission Guard
    if (saving || saveSuccess || !currentUser?.id || !editingProduct) return;
    
    // 2. Validation
    const nameTrimmed = editingProduct.name?.trim();
    const imageTrimmed = editingProduct.image?.trim();
    const priceVal = Number(editingProduct.price);
    
    if (!nameTrimmed || isNaN(priceVal) || priceVal <= 0 || !imageTrimmed) {
      alert("Incomplete Listing: Please provide a valid name, price, and image URL.");
      return;
    }

    // 3. LOCK UI
    setSaving(true);

    try {
      // 4. Force status to PENDING for review workflow
      const payload: Partial<Product> = {
        ...editingProduct,
        name: nameTrimmed,
        image: imageTrimmed,
        price: priceVal,
        vendorId: currentUser.id,
        status: 'PENDING' // CRITICAL: This ensures admin sees it for approval
      };

      const result = await api.saveProduct(payload);

      if (result.success) {
        // 5. Success Feedback
        setSaveSuccess(true);
        
        api.notifications.send({
          title: "Update Submitted! 📦",
          body: `"${nameTrimmed}" is now in the review queue for admin approval.`
        });

        // 6. Refresh Local State
        await loadProducts(); 
        
        // 7. Auto-close after brief success visual
        setTimeout(() => {
          closeForm();
        }, 1500);
      } else {
        throw new Error(result.error || "Database rejection.");
      }
    } catch (err: any) {
      console.error("[VendorDashboard] Submission Error:", err);
      alert(`Submission Failed: ${err.message || 'Please check your connection.'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || currentUser.role !== 'VENDOR') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
         <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle size={40} />
         </div>
         <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">Access Restricted</h2>
         <p className="text-gray-400 text-[10px] mt-2 font-black uppercase tracking-widest">Only authorized merchants can access the console.</p>
         <Button onClick={() => setSection(AppSection.ACCOUNT)} className="mt-8 px-10 h-14">Return to Account</Button>
      </div>
    );
  }

  const pendingItemsCount = products.filter(p => p.status === 'PENDING').length;

  return (
    <div className="pb-32 pt-8 px-6 max-w-2xl mx-auto animate-fade-in">
      <Breadcrumbs items={[
        { label: 'Profile', onClick: () => setSection(AppSection.ACCOUNT) },
        { label: 'Merchant Console' }
      ]} />

      <div className="flex justify-between items-start mb-10">
         <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Merchant Console</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">Managing: {currentUser.storeName || currentUser.name}</p>
         </div>
         <Button 
            onClick={handleOpenAddProduct} 
            className="p-4 shadow-xl shadow-kubwa-green/20"
            disabled={currentUser.status === 'SUSPENDED' || saving}
         >
            <Plus size={20} strokeWidth={3} />
         </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
         <Card className="p-6 bg-gray-900 text-white border-none rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-white/10 rounded-xl"><Package size={16} /></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-white/50">My Inventory</span>
            </div>
            <p className="text-2xl font-black tracking-tighter">{products.length}</p>
            <p className="text-[8px] font-bold text-white/30 uppercase mt-1">Total Active/Pending</p>
         </Card>
         <Card className="p-6 bg-white border-none shadow-sm rounded-[2.5rem] border border-gray-50">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-kubwa-green/10 text-kubwa-green rounded-xl"><Clock size={16} /></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Review Queue</span>
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-tighter">
               {pendingItemsCount}
            </p>
            <p className="text-[8px] font-bold text-gray-300 uppercase mt-1">Awaiting Approval</p>
         </Card>
      </div>

      <div className="space-y-6">
         <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input 
               placeholder="Search my products..." 
               className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-kubwa-green/10 transition-all placeholder:text-gray-300"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
            />
         </div>

         {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="animate-spin text-kubwa-green" size={32} />
               <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Syncing Catalog...</p>
            </div>
         ) : filteredProducts.length === 0 ? (
             <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 animate-fade-in group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-200">
                   <ShoppingBag size={32} strokeWidth={1.5} />
                </div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No matching products</p>
             </div>
           ) : (
             <div className="space-y-4">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="p-4 border-none shadow-sm rounded-[2.5rem] flex flex-col gap-4 bg-white border border-gray-50 transition-all hover:shadow-lg">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-gray-50 border border-gray-100">
                              <img src={product.image} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tight line-clamp-1">{product.name}</p>
                              <p className="text-[10px] font-black text-kubwa-green mt-1">₦{product.price.toLocaleString()}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {product.status === 'PENDING' && (
                                  <Badge color="bg-orange-50 text-orange-600 flex items-center gap-1">
                                    <Clock size={10} /> Pending Review
                                  </Badge>
                                )}
                                {product.status === 'APPROVED' && (
                                  <Badge color="bg-green-50 text-green-600 flex items-center gap-1">
                                    <CheckCircle size={10} /> Live in Mart
                                  </Badge>
                                )}
                                {product.status === 'REJECTED' && (
                                  <Badge color="bg-red-50 text-red-600 flex items-center gap-1">
                                    <XCircle size={10} /> Rejected
                                  </Badge>
                                )}
                              </div>
                           </div>
                        </div>
                        <button onClick={() => handleEditProduct(product)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-900 hover:text-white transition-all">
                           <Edit3 size={18} />
                        </button>
                     </div>

                     {product.status === 'REJECTED' && product.rejectionNote && (
                       <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex gap-3 items-start animate-fade-in">
                         <div className="p-1.5 bg-red-100 rounded-lg text-red-600 mt-0.5"><MessageSquare size={12}/></div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest mb-1">Feedback from Admin:</p>
                            <p className="text-[10px] font-bold">{product.rejectionNote}</p>
                         </div>
                       </div>
                     )}
                  </Card>
                ))}
             </div>
           )
         }
      </div>

      {/* Product Management Form */}
      <Sheet isOpen={isProductFormOpen} onClose={closeForm} title={editingProduct?.id ? "Edit Inventory" : "New Merchant Listing"}>
         <div className="p-2 space-y-8 pb-24">
            <div className="p-4 bg-blue-50 text-blue-800 rounded-2xl text-[9px] font-black uppercase tracking-widest flex gap-3">
               <Info size={16} className="shrink-0" />
               <p>Submissions are reviewed by our team before appearing in the public Mart.</p>
            </div>
            
            <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Product Name</label>
                   <Input placeholder="e.g., Fresh Organic Tomatoes" value={editingProduct?.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Base Price (₦)</label>
                       <Input type="number" placeholder="0.00" value={editingProduct?.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Category</label>
                       <select 
                          className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-kubwa-green transition-all"
                          value={editingProduct?.category}
                          onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                       >
                          {PRODUCT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                       </select>
                    </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Product Photo URL</label>
                   <Input placeholder="https://..." value={editingProduct?.image} onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })} />
                   
                   {editingProduct?.image && (
                      <div className="mt-4 animate-fade-in">
                         <div className="w-full h-40 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center relative shadow-inner">
                            <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL'; }} />
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
                               <p className="text-[8px] font-black uppercase text-black/20">Preview Mode</p>
                            </div>
                         </div>
                      </div>
                   )}
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Public Description</label>
                   <textarea 
                     className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold h-24 resize-none outline-none focus:ring-2 focus:ring-kubwa-green transition-all" 
                     placeholder="What makes this product special for Kubwa residents?"
                     value={editingProduct?.description}
                     onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                   />
                </div>
            </div>

            <Button 
                onClick={handleSaveProduct} 
                disabled={saving || saveSuccess} 
                className={`w-full h-16 shadow-xl transition-all ${saveSuccess ? 'bg-green-600 shadow-green-600/20' : 'shadow-kubwa-green/20'}`}
            >
               {saving ? (
                 <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    <span>SYNCING TO CLOUD...</span>
                 </div>
               ) : saveSuccess ? (
                 <div className="flex items-center gap-2">
                    <Check size={18} strokeWidth={3} />
                    <span>SUBMITTED SUCCESSFULLY</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-2">
                    <Send size={18} />
                    <span>SUBMIT FOR APPROVAL</span>
                 </div>
               )}
            </Button>
         </div>
      </Sheet>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
           <Card className="w-full max-w-sm p-12 text-center animate-zoom-in rounded-[3.5rem] border-none shadow-2xl bg-white relative">
              <div className="w-20 h-20 bg-kubwa-green/10 text-kubwa-green rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <ArrowUpCircle size={40} strokeWidth={2.5}/>
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Limit Reached</h3>
              <p className="text-[10px] font-black text-gray-400 mt-3 uppercase tracking-widest mb-8">Free accounts are limited to 6 products.</p>
              <Button onClick={() => { setShowUpgradeModal(false); setSection(AppSection.ACCOUNT); }} className="w-full h-16 text-xs font-black">
                UPGRADE TO PRO
              </Button>
              <button onClick={() => setShowUpgradeModal(false)} className="mt-6 text-[9px] font-black text-gray-300 uppercase tracking-widest">Close</button>
           </Card>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
