

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Star, Loader2, X, Heart, Shield, Phone, ArrowRight, Info, Crown, ArrowUpCircle, ShieldCheck, TrendingUp, CheckCircle, MapPin } from 'lucide-react';
import { api, PRODUCT_CATEGORIES, getParentCategory } from '../services/data';
import { Product, CartItem, User, AppSection } from '../types';
import { Button, Badge, Card, Breadcrumbs, Sheet, Input, BackButton, SafeImage } from '../components/ui';
import { useData } from '../contexts/DataContext';

interface MartProps {
  addToCart: (product: Product) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  user: User | null;
  onRequireAuth: () => void;
  setSection: (section: AppSection) => void;
  refreshUser: () => void;
  goBack?: () => void;
}

const Mart: React.FC<MartProps> = ({ addToCart, cart, setCart, user, onRequireAuth, setSection, refreshUser, goBack }) => {
  const isDemoProduct = (product: Product) => product.vendorId?.startsWith('demo_');
  const isOutOfStock = (product: Product) => !isDemoProduct(product) && product.stock <= 0;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState('All'); 
  
  // Use DataContext for products
  const { products, loading: contextLoading, fetchProducts } = useData();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedProduct?.id]);

  // Checkout State
  const [deliveryOption, setDeliveryOption] = useState<'DISPATCH' | 'PICKUP'>('DISPATCH');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [pickupInfo, setPickupInfo] = useState<{ storeName?: string; address?: string; location?: string } | null>(null);
  const [loadingPickupInfo, setLoadingPickupInfo] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Pre-fill user details when available
  useEffect(() => {
    if (user) {
        if (user.address) setDeliveryAddress(user.address);
        if (user.phoneNumber) setContactPhone(user.phoneNumber);
    }
  }, [user]);

  useEffect(() => {
    if (cart.length === 0) setPickupInfo(null);
  }, [cart.length]);

  useEffect(() => {
    if (deliveryOption === 'PICKUP' && cart.length > 0 && !pickupInfo) {
      setLoadingPickupInfo(true);
      api.getVendorPickupInfo(cart[0].vendorId).then(info => {
        setPickupInfo(info);
        setLoadingPickupInfo(false);
      });
    }
  }, [deliveryOption, cart]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const parent = getParentCategory(p.category);
      const matchesCategory = selectedParentCategory === 'All' || parent === selectedParentCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch && p.status === 'APPROVED';
    });
  }, [products, selectedParentCategory, searchTerm]);

  /**
   * STRICT PRODUCT LIMIT CHECK
   */
  const handleAddProductClick = () => {
    if (!user) { 
      onRequireAuth(); 
      return; 
    }
    
    if (user.role !== 'VENDOR') {
      alert("Only vendors can list products.");
      return;
    }
    
    // Count user's current products
    const myProductsCount = products.filter(p => p.vendorId === user.id).length;
    
    // Enforcement Logic: Use dynamic limit from user object
    const limit = user.productLimit || 4; 

    if (myProductsCount >= limit) {
      setShowUpgradeModal(true);
      return;
    }
    
    // Open profile section where product management lives
    setSection(AppSection.ACCOUNT);
    alert(`Limit Check Passed: ${myProductsCount}/${limit} products listed. Go to Vendor Dashboard in Profile to add your new item.`);
  };

  const calculateTotal = () => cart.reduce((a, b) => a + (b.price * b.quantity), 0);

  const handleCheckout = async () => {
    if (!user) { onRequireAuth(); return; }
    if (cart.length === 0) return;

    // A cart saved before this fix could still contain a sample item -- catch
    // it here with a specific, actionable message rather than a generic
    // failure after attempting the insert.
    const demoItemsInCart = cart.filter(item => item.vendorId?.startsWith('demo_'));
    if (demoItemsInCart.length > 0) {
        alert(`"${demoItemsInCart[0].name}" is a sample listing and can't be ordered. Please remove it from your cart to continue.`);
        return;
    }

    // Production-Ready Validation
    if (deliveryOption === 'DISPATCH' && !deliveryAddress.trim()) {
        alert("Please enter a delivery address.");
        return;
    }
    if (!contactPhone.trim()) {
        alert("Please enter a contact phone number.");
        return;
    }

    setPlacingOrder(true);
    try {
      const result = await api.orders.placeOrder({
        userId: user.id,
        items: cart,
        total: calculateTotal(),
        status: 'CREATED',
        deliveryOption,
        vendorId: cart[0].vendorId,
        deliveryAddress: deliveryOption === 'DISPATCH' ? deliveryAddress.trim() : undefined,
        contactPhone: contactPhone.trim()
      });

      if (result.success) {
        setCart([]);
        setIsCartOpen(false);
        setSection(AppSection.HOME);
        alert(deliveryOption === 'PICKUP'
          ? "Success! Your order has been placed. Head to the vendor to pick it up once confirmed."
          : "Success! Your order has been placed. We'll contact you shortly.");
      } else {
        console.error("[Mart] placeOrder failed:", result.error);
        alert(result.error?.includes('Not enough stock') ? result.error : "Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please check your connection.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4">
      {user && goBack && <BackButton onClick={goBack} />}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-kubwa-ink tracking-tight">Kubwa Mart</h2>
        <div className="flex items-center gap-2">
           {user?.role === 'VENDOR' && (
             <button 
                onClick={handleAddProductClick} 
                className={`p-3 rounded-2xl active:scale-95 transition-all ${user.status !== 'APPROVED' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-kubwa-ink text-white shadow-lg'}`}
                disabled={user.status !== 'APPROVED'}
             >
                <Plus size={20} strokeWidth={3}/>
             </button>
           )}
           <button className="p-3 bg-gray-50 rounded-2xl relative active:scale-95 transition-all" onClick={() => setIsCartOpen(true)}>
             <ShoppingCart size={22} className="text-kubwa-ink" />
             {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-kubwa-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
           </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search items in Kubwa..." 
          className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-kubwa-primary/20 outline-none font-semibold" 
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
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${selectedParentCategory === catId ? 'bg-kubwa-ink text-white border-kubwa-ink shadow-lg shadow-kubwa-ink/10' : 'bg-white border-gray-100 text-gray-500'}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {contextLoading && products.length === 0 ? <div className="col-span-2 flex justify-center py-20"><Loader2 className="animate-spin text-kubwa-primary"/></div> : 
          filteredProducts.length === 0 ? <div className="col-span-2 text-center py-20 text-gray-400 font-semibold text-sm">No matches found</div> :
          filteredProducts.map(product => (
            <Card key={product.id} className="p-0 overflow-hidden cursor-pointer group border-none shadow-sm" onClick={() => setSelectedProduct(product)}>
              <div className="h-40 bg-gray-100 overflow-hidden relative">
                <SafeImage src={product.image} alt={product.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock(product) ? 'grayscale opacity-60' : ''}`} />
                {product.isPromoted && !isOutOfStock(product) && (
                  <div className="absolute top-2 left-2 bg-kubwa-amber text-white p-1 rounded-lg">
                    <TrendingUp size={12} />
                  </div>
                )}
                {isOutOfStock(product) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-kubwa-ink/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-kubwa-ink text-xs mb-1 line-clamp-1">{product.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-kubwa-mart text-xs">₦{product.price.toLocaleString()}</span>
                  {isDemoProduct(product) ? (
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wide">Sample</span>
                  ) : isOutOfStock(product) ? (
                    <span className="text-[9px] font-bold text-red-300 uppercase tracking-wide">Sold out</span>
                  ) : (
                    <div
                      className="bg-gray-100 p-1.5 rounded-lg text-gray-400 group-hover:bg-kubwa-ink group-hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const inCart = cart.find(c => c.id === product.id)?.quantity || 0;
                        if (inCart >= product.stock) {
                          alert(`Only ${product.stock} left in stock.`);
                          return;
                        }
                        addToCart(product);
                      }}
                    >
                      <Plus size={14}/>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[150] bg-kubwa-ink/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
           <Card className="w-full max-w-sm p-10 text-center animate-zoom-in rounded-[2.5rem] border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-kubwa-mart/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="w-20 h-20 bg-kubwa-mart/10 text-kubwa-mart rounded-[1.75rem] flex items-center justify-center mx-auto mb-8">
                 <ArrowUpCircle size={40} strokeWidth={2}/>
              </div>
              
              <h3 className="font-display text-2xl font-bold text-kubwa-ink tracking-tight leading-none">Limit reached</h3>
              <p className="text-xs font-semibold text-gray-400 mt-3 mb-8">Free tier cap: 4 products</p>
              
              <div className="space-y-4 mb-10 text-left bg-gray-50 p-6 rounded-[1.75rem]">
                 {[
                   'Unlimited product listings',
                   'Verified seller badge',
                   'Featured in search results',
                   'Priority logistics support'
                 ].map((perk, i) => (
                   <div key={i} className="flex items-center gap-3 text-xs font-bold text-gray-600">
                     <CheckCircle size={14} className="text-kubwa-mart shrink-0" /> {perk}
                   </div>
                 ))}
              </div>
              
              <div className="space-y-3">
                <Button onClick={() => { setShowUpgradeModal(false); setSection(AppSection.ACCOUNT); }} className="w-full h-16 shadow-xl shadow-kubwa-primary/20">
                  Upgrade shop now
                </Button>
                <button onClick={() => setShowUpgradeModal(false)} className="text-xs font-bold text-gray-300 hover:text-kubwa-ink transition-colors py-2">
                  Maybe later
                </button>
              </div>
           </Card>
        </div>
      )}

      <Sheet isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name}>
        {selectedProduct && (
          <div className="p-6">
             {(() => {
                const gallery = selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image];
                return (
                  <>
                    <div className="h-48 rounded-3xl overflow-hidden mb-3 relative">
                       <SafeImage src={gallery[activeImageIndex] || gallery[0]} className="w-full h-full object-cover" alt={selectedProduct.name} />
                    </div>
                    {gallery.length > 1 && (
                      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                         {gallery.map((img, i) => (
                            <button
                               key={i}
                               onClick={() => setActiveImageIndex(i)}
                               className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i === activeImageIndex ? 'border-kubwa-primary' : 'border-transparent opacity-60'}`}
                            >
                               <SafeImage src={img} className="w-full h-full object-cover" alt="" />
                            </button>
                         ))}
                      </div>
                    )}
                  </>
                );
             })()}
             <p className="font-bold text-2xl text-kubwa-mart mb-4">₦{selectedProduct.price.toLocaleString()}</p>
             <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">{selectedProduct.description || 'Quality product from a verified Kubwa merchant.'}</p>
             {isDemoProduct(selectedProduct) ? (
               <div className="bg-gray-50 rounded-2xl p-4 text-center">
                 <p className="text-xs font-bold text-gray-400">Sample listing for browsing only — not available to order.</p>
               </div>
             ) : isOutOfStock(selectedProduct) ? (
               <div className="bg-red-50 rounded-2xl p-4 text-center">
                 <p className="text-xs font-bold text-red-500">Out of stock — check back later.</p>
               </div>
             ) : (
               <Button
                 className="w-full py-4 h-14 text-base"
                 onClick={() => {
                   const inCart = cart.find(c => c.id === selectedProduct.id)?.quantity || 0;
                   if (inCart >= selectedProduct.stock) {
                     alert(`Only ${selectedProduct.stock} left in stock.`);
                     return;
                   }
                   addToCart(selectedProduct);
                   setSelectedProduct(null);
                 }}
               >
                 Add to cart
               </Button>
             )}
          </div>
        )}
      </Sheet>

      <Sheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Shopping Cart">
         <div className="p-6 pb-20">
            {cart.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                 <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200"><ShoppingCart size={32} /></div>
                 <p className="text-gray-400 font-bold text-sm">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="max-h-60 overflow-y-auto no-scrollbar space-y-4">
                    {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-4">
                        <div>
                            <p className="font-bold text-xs text-kubwa-ink">{item.name}</p>
                            <p className="text-xs text-kubwa-mart font-bold mt-0.5">₦{item.price.toLocaleString()}</p>
                        </div>
                        <Badge color="bg-gray-100 text-kubwa-ink">x{item.quantity}</Badge>
                    </div>
                    ))}
                 </div>

                 {/* Checkout Form */}
                 <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                    <p className="font-bold text-xs text-gray-400 flex items-center gap-1.5">
                        <MapPin size={12} /> Fulfillment
                    </p>
                    <div className="flex gap-2">
                       <button
                          type="button"
                          onClick={() => setDeliveryOption('DISPATCH')}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${deliveryOption === 'DISPATCH' ? 'bg-kubwa-ink text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
                       >
                          Delivery
                       </button>
                       <button
                          type="button"
                          onClick={() => setDeliveryOption('PICKUP')}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${deliveryOption === 'PICKUP' ? 'bg-kubwa-ink text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
                       >
                          Pickup
                       </button>
                    </div>

                    {deliveryOption === 'DISPATCH' ? (
                      <Input 
                          placeholder="Delivery address (e.g. 5 Arab Road)" 
                          value={deliveryAddress} 
                          onChange={e => setDeliveryAddress(e.target.value)} 
                          className="bg-white"
                      />
                    ) : (
                      <div className="bg-white rounded-xl p-3 text-xs">
                         {loadingPickupInfo ? (
                            <span className="text-gray-400 font-semibold">Loading pickup location...</span>
                         ) : pickupInfo ? (
                            <>
                               <p className="font-bold text-kubwa-ink">{pickupInfo.storeName || 'Vendor location'}</p>
                               <p className="text-gray-500 font-medium mt-0.5">{pickupInfo.address || pickupInfo.location || 'Address not set by vendor yet — confirm with them directly.'}</p>
                            </>
                         ) : (
                            <span className="text-gray-400 font-semibold">Pickup location unavailable — confirm with the vendor directly.</span>
                         )}
                      </div>
                    )}

                    <Input 
                        placeholder="Contact phone" 
                        value={contactPhone} 
                        onChange={e => setContactPhone(e.target.value)} 
                        className="bg-white"
                        type="tel"
                    />
                 </div>

                 <div className="pt-4 flex justify-between items-center">
                    <span className="font-bold text-xs text-gray-400">Grand total</span>
                    <span className="font-bold text-2xl text-kubwa-mart">₦{calculateTotal().toLocaleString()}</span>
                 </div>
                 <Button className="w-full h-16 mt-4 shadow-xl shadow-kubwa-primary/10" onClick={handleCheckout} disabled={placingOrder}>
                    {placingOrder ? <Loader2 className="animate-spin" /> : 'Confirm order'}
                 </Button>
              </div>
            )}
         </div>
      </Sheet>
    </div>
  );
};

export default Mart;
