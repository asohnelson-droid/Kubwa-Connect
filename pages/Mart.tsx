
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Star, Loader2, X, Heart, Shield, Phone, ArrowRight, Info, Crown, ArrowUpCircle } from 'lucide-react';
import { api, PRODUCT_CATEGORIES, getParentCategory } from '../services/data';
import { Product, CartItem, User, AppSection } from '../types';
import { Button, Badge, Card, Breadcrumbs, Sheet } from '../components/ui';

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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await api.getProducts();
    // Sort logic: Featured/Promoted products first
    const sorted = [...data].sort((a, b) => (b.isPromoted ? 1 : 0) - (a.isPromoted ? 1 : 0));
    setProducts(sorted);
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    const parent = getParentCategory(p.category);
    const matchesCategory = selectedParentCategory === 'All' || parent === selectedParentCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && p.status === 'APPROVED';
  });

  const handleAddProductClick = () => {
    if (!user) { onRequireAuth(); return; }
    if (user.role !== 'VENDOR') return;
    
    // LIMIT CHECK
    if (user.tier === 'FREE' && user.productLimit <= 4) {
      setShowUpgradeModal(true);
      return;
    }
    // Proceed to real add flow...
    alert("New product form would open here.");
  };

  return (
    <div className="pb-24 pt-4 px-4">
      {/* 1. HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">KUBWA MART</h2>
        <div className="flex items-center gap-2">
           {user?.role === 'VENDOR' && (
             <button onClick={handleAddProductClick} className="p-3 bg-gray-900 text-white rounded-2xl active:scale-95 transition-all">
                <Plus size={20} strokeWidth={3}/>
             </button>
           )}
           <button className="p-3 bg-gray-50 rounded-2xl relative active:scale-95 transition-all" onClick={() => setIsCartOpen(true)}>
             <ShoppingCart size={22} className="text-gray-900" />
             {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-kubwa-orange text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
           </button>
        </div>
      </div>

      {/* 2. SEARCH & CATEGORIES */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="What are you looking for today?" 
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
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap ${selectedParentCategory === catId ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-100 text-gray-500'}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 3. PRODUCT GRID */}
      <div className="grid grid-cols-2 gap-4">
        {loading ? <div className="col-span-2 flex justify-center py-20"><Loader2 className="animate-spin text-kubwa-green"/></div> : 
          filteredProducts.map(product => (
            <Card key={product.id} className="p-0 overflow-hidden cursor-pointer group relative border-none shadow-sm" onClick={() => setSelectedProduct(product)}>
              {product.isPromoted && (
                <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase flex items-center gap-1">
                  <Crown size={8}/> Sponsored
                </div>
              )}
              <div className="h-40 bg-gray-100 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-4">
                <h3 className="font-black text-gray-900 text-xs mb-1 line-clamp-1">{product.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="font-black text-kubwa-green text-sm">₦{product.price.toLocaleString()}</span>
                  <div className="bg-gray-100 p-1.5 rounded-lg text-gray-400 group-hover:bg-gray-900 group-hover:text-white" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                    <Plus size={14}/>
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {/* 4. UPGRADE PROMPT MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <Card className="w-full max-w-sm p-8 text-center animate-zoom-in rounded-[2.5rem]">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><ArrowUpCircle size={32}/></div>
              <h3 className="text-xl font-black text-gray-900 uppercase">Limit Reached</h3>
              <p className="text-xs font-bold text-gray-500 mt-2 leading-relaxed">Vendors on the Free Tier can only list 4 products. Upgrade to a Verified Tier to unlock unlimited listings and get a blue trust badge.</p>
              <Button onClick={() => { setShowUpgradeModal(false); setSection(AppSection.ACCOUNT); }} className="w-full mt-8 bg-blue-600">Upgrade Now</Button>
              <button onClick={() => setShowUpgradeModal(false)} className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Maybe Later</button>
           </Card>
        </div>
      )}

      {/* Product Detail Sheet & Cart Sheet remains same as original but with tier logic added */}
      <Sheet isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name}>
        {selectedProduct && (
          <div className="p-6">
             <div className="h-48 rounded-3xl overflow-hidden mb-6"><img src={selectedProduct.image} className="w-full h-full object-cover"/></div>
             <p className="font-black text-2xl text-kubwa-green mb-4">₦{selectedProduct.price.toLocaleString()}</p>
             <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">{selectedProduct.description || 'Verified quality item from a Kubwa Vendor.'}</p>
             <Button className="w-full py-4 h-14 text-base" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>Add to Cart</Button>
          </div>
        )}
      </Sheet>

      <Sheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Your Cart">
         <div className="p-6">
            {cart.length === 0 ? <p className="text-center text-gray-400 py-10 font-black">Empty</p> : (
              <div className="space-y-4">
                 {cart.map(item => (
                   <div key={item.id} className="flex justify-between items-center border-b pb-4">
                      <div><p className="font-black text-sm">{item.name}</p><p className="text-xs text-kubwa-green font-bold">₦{item.price}</p></div>
                      <Badge color="bg-gray-100 text-gray-900">Qty: {item.quantity}</Badge>
                   </div>
                 ))}
                 <div className="pt-4 flex justify-between items-center"><span className="font-black">Total</span><span className="font-black text-xl text-kubwa-green">₦{cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</span></div>
                 <Button className="w-full mt-6">Checkout</Button>
              </div>
            )}
         </div>
      </Sheet>
    </div>
  );
};

export default Mart;
