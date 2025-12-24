
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Star, Loader2, X, Trash2, Store, Crown, Heart, Filter, Minus, ExternalLink, Shield, Phone, ShoppingBag, MapPin, CheckCircle } from 'lucide-react';
import { api, SUBSCRIPTION_PLANS, PRODUCT_CATEGORIES, getParentCategory } from '../services/data';
import { Product, CartItem, User, Review, AppSection, FeaturedPlan } from '../types';
import { Button, Badge, Card, Breadcrumbs } from '../components/ui';
import AuthModal from '../components/AuthModal';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVendor, setFilterVendor] = useState('All'); 
  const [displayCount, setDisplayCount] = useState(8);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productVendor, setProductVendor] = useState<User | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1); 
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
      setLoading(false);
    };
    loadData();
    if (user?.wishlist) setWishlist(user.wishlist);
  }, [user]);

  useEffect(() => {
    if (selectedProduct) {
      setLoadingVendor(true);
      setOrderQuantity(1);
      api.users.getById(selectedProduct.vendorId).then(vendor => {
        setProductVendor(vendor);
        setLoadingVendor(false);
      });
    } else {
      setProductVendor(null);
    }
  }, [selectedProduct]);

  const filteredProducts = products.filter(p => {
    const parent = getParentCategory(p.category);
    const matchesCategory = selectedParentCategory === 'All' || parent === selectedParentCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = filterVendor === 'All' || p.vendorId === filterVendor;
    return matchesCategory && matchesSearch && matchesVendor && p.status === 'APPROVED';
  });

  const visibleProducts = filteredProducts.slice(0, displayCount);

  const handleAddToCart = (product: Product, qty: number = 1) => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setCartToast(`Added ${qty} ${product.name} to cart`);
    setTimeout(() => setCartToast(null), 2000);
    if (selectedProduct) setSelectedProduct(null);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const toggleWishlist = async (productId: string) => {
    if (!user) { setShowAuthModal(true); return; }
    const isIn = wishlist.includes(productId);
    setWishlist(prev => isIn ? prev.filter(id => id !== productId) : [...prev, productId]);
    await api.users.toggleWishlist(user.id, productId);
  };

  const handleViewVendorProducts = (vendorId: string) => {
    setFilterVendor(vendorId);
    setSelectedProduct(null);
    setSearchTerm('');
  };

  return (
    <div className="pb-24 pt-4 px-4 relative">
      <Breadcrumbs items={[
        { label: 'Home', onClick: () => setSection(AppSection.HOME) },
        { label: 'Mart', onClick: () => { setSelectedParentCategory('All'); setFilterVendor('All'); } }
      ]} />
      
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} providerName="Mart" onSuccess={() => refreshUser()} />}
      {cartToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl animate-fade-in z-50 flex items-center gap-2">
          <CheckCircle size={14} className="text-green-400" />{cartToast}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-kubwa-green">Kubwa Mart</h2>
          <p className="text-gray-500 text-sm">
            {filterVendor !== 'All' ? `Viewing items from ${productVendor?.storeName || 'Vendor'}` : 'Everything delivered.'}
          </p>
        </div>
        <button className="p-2 bg-white border border-gray-200 rounded-full relative" onClick={() => setIsCartOpen(true)}>
          <ShoppingCart size={20} />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-kubwa-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search products..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-kubwa-green/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {filterVendor !== 'All' && <button onClick={() => setFilterVendor('All')} className="px-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-1 text-xs font-bold"><X size={14} /> Clear Filter</button>}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {['All', ...PRODUCT_CATEGORIES.map(c => c.label)].map(cat => (
          <button key={cat} onClick={() => setSelectedParentCategory(cat === 'All' ? 'All' : PRODUCT_CATEGORIES.find(c => c.label === cat)?.id || 'All')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedParentCategory === (cat === 'All' ? 'All' : PRODUCT_CATEGORIES.find(c => c.label === cat)?.id) ? 'bg-kubwa-green text-white' : 'bg-white border text-gray-600'}`}>{cat}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? [1,2,3,4].map(n => <div key={n} className="h-48 bg-gray-100 rounded-xl animate-pulse" />) : 
          visibleProducts.map(product => (
            <Card key={product.id} className="p-0 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <div className="h-32 bg-gray-200 relative"><img src={product.image} alt={product.name} className="w-full h-full object-cover" /></div>
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-kubwa-green">₦{product.price.toLocaleString()}</span>
                  <button className="bg-gray-100 p-1.5 rounded-lg text-kubwa-green hover:bg-kubwa-green hover:text-white" onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}><Plus size={16}/></button>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-sm max-h-[90vh] rounded-2xl overflow-hidden flex flex-col relative animate-zoom-in shadow-2xl">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"><X size={18} /></button>
              
              <div className="h-64 bg-gray-100 relative shrink-0">
                 <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                 <button onClick={(e) => { e.stopPropagation(); toggleWishlist(selectedProduct.id); }} className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg">
                   <Heart size={20} className={wishlist.includes(selectedProduct.id) ? "text-red-500 fill-current" : "text-gray-400"} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
                 <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 mr-2">
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedProduct.name}</h2>
                        <div className="flex items-center gap-1 mt-1">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-bold text-gray-700">{selectedProduct.rating}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="font-bold text-2xl text-kubwa-green block">₦{selectedProduct.price.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="my-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Product Details</h4>
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                       {selectedProduct.description || "Fresh and available for immediate delivery across Kubwa."}
                    </p>
                 </div>

                 {/* Vendor Info Section */}
                 <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sold By</h4>
                    {loadingVendor ? (
                        <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                    ) : productVendor && (
                       <div className="bg-white border rounded-xl p-3 flex items-center gap-3 shadow-sm hover:border-kubwa-green/30 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-lg border-2 border-blue-100 overflow-hidden shrink-0">
                             {productVendor.avatar ? <img src={productVendor.avatar} className="w-full h-full object-cover" alt=""/> : productVendor.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-1">
                                <span className="font-bold text-sm text-gray-900 truncate">{productVendor.storeName || productVendor.name}</span>
                                {productVendor.verification?.status === 'VERIFIED' && <Shield size={12} className="text-blue-500 fill-blue-500 shrink-0" />}
                             </div>
                             <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex text-yellow-400"><Star size={10} fill="currentColor" /></div>
                                <span className="text-[10px] text-gray-500 font-bold">{productVendor.rating} Rating</span>
                                <span className="text-[10px] text-gray-400">•</span>
                                <span className="text-[10px] text-gray-500">{productVendor.reviews || 0} reviews</span>
                             </div>
                             <button 
                                onClick={() => handleViewVendorProducts(productVendor.id)}
                                className="flex items-center gap-1 mt-1 text-kubwa-green text-[10px] font-bold hover:underline"
                             >
                                View Store <ExternalLink size={10} />
                             </button>
                          </div>
                          <a href={`tel:${productVendor.phoneNumber}`} className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-kubwa-green hover:text-white transition-colors">
                             <Phone size={16} />
                          </a>
                       </div>
                    )}
                 </div>
              </div>

              <div className="p-4 border-t bg-gray-50 shadow-inner">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
                       <button onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-kubwa-green hover:bg-gray-50 rounded-lg transition-colors"><Minus size={18} /></button>
                       <span className="font-bold text-lg min-w-[20px] text-center">{orderQuantity}</span>
                       <button onClick={() => setOrderQuantity(orderQuantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-kubwa-green hover:bg-gray-50 rounded-lg transition-colors"><Plus size={18} /></button>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                       <p className="text-xl font-bold text-gray-900">₦{(selectedProduct.price * orderQuantity).toLocaleString()}</p>
                    </div>
                 </div>
                 <Button className="w-full py-4 text-base font-bold shadow-lg flex items-center justify-center gap-3 bg-kubwa-green border-none" onClick={() => handleAddToCart(selectedProduct, orderQuantity)}>
                    <ShoppingCart size={20} /> Add to Cart
                 </Button>
              </div>
           </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 font-bold text-lg"><ShoppingCart size={20}/> Cart</div>
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? <p className="text-center py-20 text-gray-400">Empty cart.</p> : cart.map(item => (
                <div key={item.id} className="flex gap-3 border-b pb-3 mb-3">
                  <img src={item.image} className="w-12 h-12 rounded object-cover" alt=""/>
                  <div className="flex-1"><h4 className="font-bold text-sm">{item.name}</h4><p className="text-xs text-gray-500">₦{item.price.toLocaleString()} x {item.quantity}</p></div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
            {cart.length > 0 && <div className="p-4 border-t"><Button className="w-full py-3" onClick={() => alert("Proceeding to checkout")}>Checkout</Button></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mart;
