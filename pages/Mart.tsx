
import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Star, Loader2, X, Heart, Shield, Phone, ArrowRight, Info, Crown, ArrowUpCircle, ShieldCheck, TrendingUp, CheckCircle, Package, Layers, Edit2, Trash2 } from 'lucide-react';
import { api, PRODUCT_CATEGORIES, getParentCategory } from '../services/data';
import { Product, CartItem, User, AppSection, ProductVariant, ProductOption } from '../types';
import { Button, Badge, Card, Breadcrumbs, Sheet, Input } from '../components/ui';

interface MartProps {
  addToCart: (product: CartItem) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  user: User | null;
  onRequireAuth: () => void;
  setSection: (section: AppSection) => void;
  refreshUser: () => void;
}

const Mart: React.FC<MartProps> = ({ addToCart, cart, setCart, user, onRequireAuth, setSection, refreshUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState('All'); 
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Selection state for variants
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  
  // Vendor Form State
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [formProduct, setFormProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: PRODUCT_CATEGORIES[0].id,
    image: '',
    description: '',
    variants: []
  });
  const [savingProduct, setSavingProduct] = useState(false);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await api.getProducts();
    const sorted = [...data].sort((a, b) => (b.isPromoted ? 1 : 0) - (a.isPromoted ? 1 : 0));
    setProducts(sorted);
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const parent = getParentCategory(p.category);
      const matchesCategory = selectedParentCategory === 'All' || parent === selectedParentCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch && p.status === 'APPROVED';
    });
  }, [products, selectedParentCategory, searchTerm]);

  /**
   * DYNAMIC PRICE CALCULATION
   */
  const getSelectedPrice = (product: Product, selections: Record<string, string>) => {
    let price = product.price;
    if (!product.variants) return price;
    
    product.variants.forEach(variant => {
      const selectedOptionLabel = selections[variant.name];
      const option = variant.options.find(o => o.label === selectedOptionLabel);
      if (option) price += option.priceModifier;
    });
    return price;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    // Check if all variants are selected
    if (selectedProduct.variants) {
      const missing = selectedProduct.variants.some(v => !selectedVariants[v.name]);
      if (missing) {
        alert("Please select all options (Size, Color, etc.) before adding to cart.");
        return;
      }
    }

    addToCart({
      ...selectedProduct,
      quantity: 1,
      selectedVariants: { ...selectedVariants }
    });
    setSelectedProduct(null);
    setSelectedVariants({});
  };

  /**
   * VENDOR: ADD/EDIT PRODUCT LOGIC
   */
  const handleOpenProductForm = (product?: Product) => {
    if (!user) { onRequireAuth(); return; }
    if (user.role !== 'VENDOR') return;

    if (!product) {
        const myProductsCount = products.filter(p => p.vendorId === user.id).length;
        const limit = user.productLimit || 6; 
        if (myProductsCount >= limit) {
          setShowUpgradeModal(true);
          return;
        }
    }

    setFormProduct(product || {
        name: '',
        price: 0,
        category: PRODUCT_CATEGORIES[0].id,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', // Default placeholder
        description: '',
        variants: []
    });
    setIsProductFormOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!user) return;
    setSavingProduct(true);
    const result = await api.saveProduct({ ...formProduct, vendorId: user.id });
    if (result.success) {
        alert("Product submitted for review!");
        setIsProductFormOpen(false);
        loadData();
    } else {
        alert("Failed to save product.");
    }
    setSavingProduct(false);
  };

  const addVariantGroup = () => {
    setFormProduct(prev => ({
        ...prev,
        variants: [
            ...(prev.variants || []),
            { id: Math.random().toString(), name: 'New Attribute', options: [] }
        ]
    }));
  };

  const addOptionToVariant = (variantId: string) => {
    setFormProduct(prev => ({
        ...prev,
        variants: prev.variants?.map(v => v.id === variantId ? {
            ...v,
            options: [...v.options, { id: Math.random().toString(), label: 'New Option', priceModifier: 0 }]
        } : v)
    }));
  };

  const calculateTotal = () => cart.reduce((total, item) => total + (getSelectedPrice(item, item.selectedVariants || {}) * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) { onRequireAuth(); return; }
    if (cart.length === 0) return;

    setPlacingOrder(true);
    try {
      const result = await api.orders.placeOrder({
        userId: user.id,
        items: cart,
        total: calculateTotal(),
        status: 'CREATED',
        deliveryOption: 'DISPATCH',
        vendorId: cart[0].vendorId 
      });

      if (result.success) {
        alert("Success! Your order has been placed.");
        setCart([]);
        setIsCartOpen(false);
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">KUBWA MART</h2>
        <div className="flex items-center gap-2">
           {user?.role === 'VENDOR' && (
             <button 
                onClick={() => handleOpenProductForm()} 
                className={`p-3 rounded-2xl active:scale-95 transition-all ${user.status !== 'APPROVED' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white shadow-lg'}`}
                disabled={user.status !== 'APPROVED'}
             >
                <Plus size={20} strokeWidth={3}/>
             </button>
           )}
           <button className="p-3 bg-gray-50 rounded-2xl relative active:scale-95 transition-all" onClick={() => setIsCartOpen(true)}>
             <ShoppingCart size={22} className="text-gray-900" />
             {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-kubwa-orange text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
           </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search items in Kubwa..." 
          className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-kubwa-green/20 outline-none font-bold" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
        {['All', ...PRODUCT_CATEGORIES.map(c => c.label)].map(cat => {
          const catId = cat === 'All' ? 'All' : PRODUCT_CATEGORIES.find(c => c.label === cat)?.id || 'All';
          return (
            <button 
              key={cat} 
              onClick={() => setSelectedParentCategory(catId)} 
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap ${selectedParentCategory === catId ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/10' : 'bg-white border-gray-100 text-gray-500'}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {loading ? <div className="col-span-2 flex justify-center py-20"><Loader2 className="animate-spin text-kubwa-green"/></div> : 
          filteredProducts.length === 0 ? <div className="col-span-2 text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-[10px]">No matches found</div> :
          filteredProducts.map(product => (
            <Card key={product.id} className="p-0 overflow-hidden cursor-pointer group border-none shadow-sm" onClick={() => { setSelectedProduct(product); setSelectedVariants({}); }}>
              <div className="h-40 bg-gray-100 overflow-hidden relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                {product.isPromoted && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-white p-1 rounded-lg">
                    <TrendingUp size={12} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-black text-gray-900 text-[10px] mb-1 line-clamp-1 uppercase tracking-tight">{product.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="font-black text-kubwa-green text-xs">₦{product.price.toLocaleString()}</span>
                  <div className="bg-gray-100 p-1.5 rounded-lg text-gray-400 group-hover:bg-gray-900 group-hover:text-white">
                    {product.variants && product.variants.length > 0 ? <Layers size={14} /> : <Plus size={14}/>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {/* Shopper Detail Sheet */}
      <Sheet isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name}>
        {selectedProduct && (
          <div className="p-6">
             <div className="h-48 rounded-3xl overflow-hidden mb-6 relative">
                <img src={selectedProduct.image} className="w-full h-full object-cover" alt=""/>
             </div>
             <p className="font-black text-3xl text-kubwa-green mb-4">
                ₦{getSelectedPrice(selectedProduct, selectedVariants).toLocaleString()}
             </p>
             
             {/* Variant Selectors */}
             {selectedProduct.variants && selectedProduct.variants.map(variant => (
               <div key={variant.id} className="mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Select {variant.name}</label>
                  <div className="flex flex-wrap gap-2">
                     {variant.options.map(opt => (
                       <button 
                         key={opt.id}
                         onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: opt.label }))}
                         className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-tight border-2 transition-all ${selectedVariants[variant.name] === opt.label ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-100 text-gray-600'}`}
                       >
                         {opt.label} {opt.priceModifier !== 0 && <span className="text-[8px] opacity-60 ml-1">(+₦{opt.priceModifier})</span>}
                       </button>
                     ))}
                  </div>
               </div>
             ))}

             <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">{selectedProduct.description || 'Quality product from a verified Kubwa merchant.'}</p>
             <Button className="w-full py-4 h-16 text-base" onClick={handleAddToCart}>ADD TO BASKET</Button>
          </div>
        )}
      </Sheet>

      {/* Vendor: Product Management Form Sheet */}
      <Sheet isOpen={isProductFormOpen} onClose={() => setIsProductFormOpen(false)} title={formProduct.id ? "Edit Product" : "List New Item"}>
         <div className="p-6 space-y-6 pb-24">
            <div className="space-y-4">
                <Input placeholder="Product Name" value={formProduct.name} onChange={e => setFormProduct({ ...formProduct, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                    <Input type="number" placeholder="Base Price (₦)" value={formProduct.price} onChange={e => setFormProduct({ ...formProduct, price: Number(e.target.value) })} />
                    <select 
                      className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-kubwa-green"
                      value={formProduct.category}
                      onChange={e => setFormProduct({ ...formProduct, category: e.target.value })}
                    >
                      {PRODUCT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                </div>
                <Input placeholder="Image URL" value={formProduct.image} onChange={e => setFormProduct({ ...formProduct, image: e.target.value })} />
                <textarea 
                  className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold h-24 resize-none outline-none focus:ring-2 focus:ring-kubwa-green" 
                  placeholder="Tell residents about this item..."
                  value={formProduct.description}
                  onChange={e => setFormProduct({ ...formProduct, description: e.target.value })}
                />
            </div>

            {/* Variants Section */}
            <div className="pt-4 border-t">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Product Variants</h4>
                  <button onClick={addVariantGroup} className="flex items-center gap-1 text-[10px] font-black text-kubwa-green uppercase">
                    <Plus size={14} /> Add Attribute
                  </button>
               </div>
               
               <div className="space-y-6">
                  {formProduct.variants?.map((variant) => (
                    <div key={variant.id} className="p-4 bg-gray-50 rounded-3xl space-y-4 border border-gray-100">
                       <div className="flex justify-between gap-2">
                          <input 
                            className="bg-transparent font-black text-xs uppercase outline-none border-b border-gray-200 flex-1 py-1"
                            value={variant.name}
                            onChange={(e) => {
                               const newVariants = formProduct.variants?.map(v => v.id === variant.id ? { ...v, name: e.target.value } : v);
                               setFormProduct({ ...formProduct, variants: newVariants });
                            }}
                          />
                          <button onClick={() => setFormProduct({ ...formProduct, variants: formProduct.variants?.filter(v => v.id !== variant.id) })} className="text-red-400"><Trash2 size={16}/></button>
                       </div>
                       
                       <div className="space-y-2">
                          {variant.options.map(opt => (
                            <div key={opt.id} className="flex gap-2 items-center">
                               <input 
                                 className="bg-white px-3 py-2 rounded-xl text-[10px] font-bold outline-none border border-gray-100 flex-1"
                                 placeholder="Option (e.g. Large)"
                                 value={opt.label}
                                 onChange={(e) => {
                                    const newVars = formProduct.variants?.map(v => v.id === variant.id ? {
                                        ...v,
                                        options: v.options.map(o => o.id === opt.id ? { ...o, label: e.target.value } : o)
                                    } : v);
                                    setFormProduct({ ...formProduct, variants: newVars });
                                 }}
                               />
                               <input 
                                 type="number"
                                 className="bg-white px-3 py-2 rounded-xl text-[10px] font-bold outline-none border border-gray-100 w-24"
                                 placeholder="+ Price"
                                 value={opt.priceModifier}
                                 onChange={(e) => {
                                    const newVars = formProduct.variants?.map(v => v.id === variant.id ? {
                                        ...v,
                                        options: v.options.map(o => o.id === opt.id ? { ...o, priceModifier: Number(e.target.value) } : o)
                                    } : v);
                                    setFormProduct({ ...formProduct, variants: newVars });
                                 }}
                               />
                               <button onClick={() => {
                                  const newVars = formProduct.variants?.map(v => v.id === variant.id ? { ...v, options: v.options.filter(o => o.id !== opt.id) } : v);
                                  setFormProduct({ ...formProduct, variants: newVars });
                               }} className="text-gray-300"><X size={14}/></button>
                            </div>
                          ))}
                          <button onClick={() => addOptionToVariant(variant.id)} className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1 hover:text-gray-900 transition-colors">
                            <Plus size={10} /> Add Option
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <Button onClick={handleSaveProduct} disabled={savingProduct} className="w-full h-16 shadow-xl shadow-kubwa-green/10">
               {savingProduct ? <Loader2 className="animate-spin" /> : 'SUBMIT PRODUCT'}
            </Button>
         </div>
      </Sheet>

      <Sheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Shopping Cart">
         <div className="p-6 pb-20">
            {cart.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                 <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200"><ShoppingCart size={32} /></div>
                 <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                 {cart.map((item, idx) => (
                   <div key={`${item.id}-${idx}`} className="flex justify-between items-start border-b border-gray-50 pb-4">
                      <div className="flex-1">
                        <p className="font-black text-[10px] uppercase text-gray-900">{item.name}</p>
                        {item.selectedVariants && Object.entries(item.selectedVariants).map(([key, val]) => (
                          <span key={key} className="text-[8px] font-bold text-gray-400 uppercase mr-2">{key}: {val}</span>
                        ))}
                        <p className="text-[10px] text-kubwa-green font-black mt-1">₦{getSelectedPrice(item, item.selectedVariants || {}).toLocaleString()}</p>
                      </div>
                      <Badge color="bg-gray-100 text-gray-900">x{item.quantity}</Badge>
                   </div>
                 ))}
                 <div className="pt-6 flex justify-between items-center">
                    <span className="font-black uppercase text-[10px] text-gray-400 tracking-widest">Grand Total</span>
                    <span className="font-black text-2xl text-kubwa-green">₦{calculateTotal().toLocaleString()}</span>
                 </div>
                 <Button className="w-full h-16 mt-8 shadow-xl shadow-kubwa-green/10" onClick={handleCheckout} disabled={placingOrder}>
                    {placingOrder ? <Loader2 className="animate-spin" /> : 'CONFIRM ORDER'}
                 </Button>
              </div>
            )}
         </div>
      </Sheet>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
           <Card className="w-full max-w-sm p-10 text-center animate-zoom-in rounded-[3rem] border-none shadow-2xl relative overflow-hidden">
              <div className="w-20 h-20 bg-kubwa-green/10 text-kubwa-green rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <ArrowUpCircle size={40} strokeWidth={2.5}/>
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Limit Reached</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-widest mb-8">Free Tier Cap: 6 Products</p>
              <Button onClick={() => { setShowUpgradeModal(false); setSection(AppSection.ACCOUNT); }} className="w-full h-16 text-xs font-black">
                UPGRADE SHOP NOW
              </Button>
           </Card>
        </div>
      )}
    </div>
  );
};

export default Mart;
