
import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Star, Loader2, X, Heart, Shield, Phone, ArrowRight, Info, Crown, ArrowUpCircle, ShieldCheck, TrendingUp, CheckCircle, MapPin } from 'lucide-react';
import { api, PRODUCT_CATEGORIES, getParentCategory } from '../services/data';
import { Product, CartItem, User, AppSection } from '../types';
import { Button, Badge, Card, Breadcrumbs, Sheet, Input } from '../components/ui';
import { useData } from '../contexts/DataContext';

interface MartProps {
  addToCart: (product: Product) => void;
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
  
  // Use DataContext for products
  const { products, loading: contextLoading, fetchProducts } = useData();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Checkout State
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');

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
    const limit = user.productLimit || 6; 

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

    // Production-Ready Validation
    if (!deliveryAddress.trim()) {
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
        deliveryOption: 'DISPATCH',
        vendorId: cart[0].vendorId,
        deliveryAddress: deliveryAddress.trim(),
        contactPhone: contactPhone.trim(),
        date: new Date().toISOString()
      });

      if (result.success) {
        setCart([]);
        setIsCartOpen(false);
        setSection(AppSection.HOME);
        alert("Success! Your order has been placed. We'll contact you shortly.");
      } else {
        alert("Failed to place order. Please try again.");
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">KUBWA MART</h2>
        <div className="flex items-center gap-2">
           {user?.role === 'VENDOR' && (
             <button 
                onClick={handleAddProductClick} 
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
        {contextLoading && products.length === 0 ? <div className="col-span-2 flex justify-center py-20"><Loader2 className="animate-spin text-kubwa-green"/></div> : 
          filteredProducts.length === 0 ? <div className="col-span-2 text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-[10px]">No matches found</div> :
          filteredProducts.map(product => (
            <Card key={product.id} className="p-0 overflow-hidden cursor-pointer group border-none shadow-sm" onClick={() => setSelectedProduct(product)}>
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
                  <div className="bg-gray-100 p-1.5 rounded-lg text-gray-400 group-hover:bg-gray-900 group-hover:text-white" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                    <Plus size={14}/>
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
           <Card className="w-full max-w-sm p-10 text-center animate-zoom-in rounded-[3rem] border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-kubwa-green/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="w-20 h-20 bg-kubwa-green/10 text-kubwa-green rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <ArrowUpCircle size={40} strokeWidth={2.5}/>
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Limit Reached</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-widest mb-8">Free Tier Cap: 6 Products</p>
              
              <div className="space-y-4 mb-10 text-left bg-gray-50 p-6 rounded-[2rem]">
                 {[
                   'Unlimited Product Listings',
                   'Verified Seller Badge',
                   'Featured in Search Results',
                   'Priority Logistics Support'
                 ].map((perk, i) => (
                   <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-600">
                     <CheckCircle size={14} className="text-kubwa-green shrink-0" /> {perk}
                   </div>
                 ))}
              </div>
              
              <div className="space-y-3">
                <Button onClick={() => { setShowUpgradeModal(false); setSection(AppSection.ACCOUNT); }} className="w-full h-16 text-xs font-black shadow-xl shadow-kubwa-green/20">
                  UPGRADE SHOP NOW
                </Button>
                <button onClick={() => setShowUpgradeModal(false)} className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors py-2">
                  Maybe Later
                </button>
              </div>
           </Card>
        </div>
      )}

      <Sheet isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name}>
        {selectedProduct && (
          <div className="p-6">
             <div className="h-48 rounded-3xl overflow-hidden mb-6 relative">
                <img src={selectedProduct.image} className="w-full h-full object-cover"/>
             </div>
             <p className="font-black text-2xl text-kubwa-green mb-4">₦{selectedProduct.price.toLocaleString()}</p>
             <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">{selectedProduct.description || 'Quality product from a verified Kubwa merchant.'}</p>
             <Button className="w-full py-4 h-14 text-base" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>Add to Cart</Button>
          </div>
        )}
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
                 <div className="max-h-60 overflow-y-auto no-scrollbar space-y-4">
                    {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-4">
                        <div>
                            <p className="font-black text-[10px] uppercase text-gray-900">{item.name}</p>
                            <p className="text-[10px] text-kubwa-green font-black mt-0.5">₦{item.price.toLocaleString()}</p>
                        </div>
                        <Badge color="bg-gray-100 text-gray-900">x{item.quantity}</Badge>
                    </div>
                    ))}
                 </div>

                 {/* Checkout Form */}
                 <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                    <p className="font-black uppercase text-[10px] text-gray-400 tracking-widest flex items-center gap-1">
                        <MapPin size={10} /> Delivery Details
                    </p>
                    <Input 
                        placeholder="Delivery Address (e.g. 5 Arab Road)" 
                        value={deliveryAddress} 
                        onChange={e => setDeliveryAddress(e.target.value)} 
                        className="bg-white"
                    />
                    <Input 
                        placeholder="Contact Phone" 
                        value={contactPhone} 
                        onChange={e => setContactPhone(e.target.value)} 
                        className="bg-white"
                        type="tel"
                    />
                 </div>

                 <div className="pt-4 flex justify-between items-center">
                    <span className="font-black uppercase text-[10px] text-gray-400 tracking-widest">Grand Total</span>
                    <span className="font-black text-2xl text-kubwa-green">₦{calculateTotal().toLocaleString()}</span>
                 </div>
                 <Button className="w-full h-16 mt-4 shadow-xl shadow-kubwa-green/10" onClick={handleCheckout} disabled={placingOrder}>
                    {placingOrder ? <Loader2 className="animate-spin" /> : 'CONFIRM ORDER'}
                 </Button>
              </div>
            )}
         </div>
      </Sheet>
    </div>
  );
};

export default Mart;
