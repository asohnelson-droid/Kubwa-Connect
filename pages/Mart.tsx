import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, ShoppingBag, Plus, Star, Loader2, X, Trash2, CreditCard, Store, Package, Upload, Image as ImageIcon, Crown, Lock, ArrowUpCircle, Phone, Bell, AlertTriangle, CheckCircle2, AlertCircle, Heart, CheckCircle, Info, Filter, ArrowLeft, MapPin, Share2, Zap, Shield, User as UserIcon, Crop, Move, Minus, TrendingUp, ClipboardList, CheckSquare, XSquare, Edit, Maximize2, Minimize2, Rocket, Bike, Clock, Folder, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, SUBSCRIPTION_PLANS, KUBWA_AREAS, FEATURED_PLANS, PRODUCT_CATEGORIES, getCategoryLabel, getParentCategory } from '../services/data';
import { Product, CartItem, User, PaymentGateway, Review, AppSection, MartOrder, VendorAnalytics, FeaturedPlan } from '../types';
import { Button, Badge, Card, Input, Select, Breadcrumbs } from '../components/ui';
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

interface VendorNotification {
  id: string;
  type: 'order' | 'alert' | 'info';
  message: string;
  count?: number;
}

const Mart: React.FC<MartProps> = ({ addToCart, cart, setCart, user, onRequireAuth, setSection, refreshUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Parent ID or 'All'
  const [selectedParentCategory, setSelectedParentCategory] = useState('All'); 
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  
  // Advanced Filter State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterPriceRange, setFilterPriceRange] = useState<[number, number]>([0, 200000]); // Max expanded
  const [filterRating, setFilterRating] = useState(0);
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterVendor, setFilterVendor] = useState('All'); // New Vendor Filter
  const [vendorsList, setVendorsList] = useState<{id: string, name: string}[]>([]);
  
  // Sorting State
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'rating' | 'priceAsc' | 'priceDesc' | 'default'>('default');

  // Pagination State
  const [displayCount, setDisplayCount] = useState(8);

  // Checkout State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('PAYSTACK');
  const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'DELIVERY'>('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Vendor State
  const [showVendorDash, setShowVendorDash] = useState(false);
  const [vendorTab, setVendorTab] = useState<'overview' | 'new_orders' | 'active_orders' | 'inventory'>('overview');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [vendorOrders, setVendorOrders] = useState<MartOrder[]>([]);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  
  // Featured Plan State
  const [showFeaturePlans, setShowFeaturePlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FeaturedPlan | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Product Details Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [productVendor, setProductVendor] = useState<User | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1); // Quantity Selector

  // Notifications
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [cartToast, setCartToast] = useState<string | null>(null);

  // Add/Edit Product State
  const [newProduct, setNewProduct] = useState<{
    name: string;
    price: string;
    category: string; // This holds the SUB_CATEGORY ID
    stock: string;
    images: string[];
    phoneNumber: string;
    location: string;
    description: string;
  }>({ name: '', price: '', category: '', stock: '', images: [], phoneNumber: '', location: '', description: '' });
  
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  
  // Wishlist Local State
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Auth Gate
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'checkout' | 'wishlist' | null>(null);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  // Cropper State
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropAspect, setCropAspect] = useState(1); 
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && user.wishlist) {
      setWishlist(user.wishlist);
    }
    if (user?.phoneNumber) {
        setContactPhone(user.phoneNumber);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
      
      // Load vendors for filter
      const vendors = await api.products.getAllVendors();
      setVendorsList(vendors);

      setLoading(false);

      if (user?.role === 'VENDOR') {
        const myItems = await api.products.getByVendor(user.id);
        setMyProducts(myItems);

        const myOrders = await api.products.getVendorOrders(user.id);
        setVendorOrders(myOrders);

        const stats = await api.products.getVendorAnalytics(user.id);
        setAnalytics(stats);
        
        // Generate Notifications
        const notifs: VendorNotification[] = [];
        
        if (myOrders.length > 0) {
           const newOrders = myOrders.filter(o => o.status === 'PENDING').length;
           if (newOrders > 0) {
              notifs.push({ 
                id: 'new-orders', 
                type: 'order', 
                message: `${newOrders} New Order(s) Received`, 
                count: newOrders 
              });
           }
        }

        myItems.forEach(p => {
          if (p.stock === 0) {
            notifs.push({ id: `oos-${p.id}`, type: 'alert', message: `Out of Stock: ${p.name}` });
          } else if (p.stock < 5) {
            notifs.push({ id: `low-${p.id}`, type: 'info', message: `Low Stock: ${p.name} (${p.stock} left)` });
          }
          if (p.status === 'REJECTED') {
            notifs.push({ id: `rej-${p.id}`, type: 'alert', message: `Product Rejected: ${p.name}` });
          }
        });

        setNotifications(notifs);
      }
    };
    loadData();
  }, [user, processingOrder]); 

  // Load reviews and vendor when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      setLoadingReviews(true);
      setOrderQuantity(1);
      api.reviews.getByTarget(selectedProduct.id).then(reviews => {
        setProductReviews(reviews);
        setLoadingReviews(false);
      });
      api.users.getById(selectedProduct.vendorId).then(vendor => {
        setProductVendor(vendor);
      });
    } else {
      setProductVendor(null);
    }
  }, [selectedProduct]);

  // Reset pagination when category changes
  useEffect(() => {
      setDisplayCount(8);
  }, [selectedParentCategory, searchTerm]);

  // --- FILTER & SORT LOGIC ---
  const filteredProducts = products.filter(p => {
    // 1. Category Filtering
    const parent = getParentCategory(p.category);
    const matchesCategory = selectedParentCategory === 'All' || parent === selectedParentCategory;
    
    // 2. Search
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 3. Wishlist Toggle
    const matchesWishlist = showWishlistOnly ? wishlist.includes(p.id) : true;
    
    // 4. Advanced Filters
    const matchesPrice = p.price >= filterPriceRange[0] && p.price <= filterPriceRange[1];
    const matchesRating = filterRating === 0 || p.rating >= filterRating;
    const matchesLocation = filterLocation === 'All' || p.location === filterLocation;
    const matchesVendor = filterVendor === 'All' || p.vendorId === filterVendor;
    
    // 5. Safety
    const isVisible = p.status === 'APPROVED';
    
    return matchesCategory && matchesSearch && matchesWishlist && matchesPrice && matchesRating && matchesLocation && matchesVendor && isVisible;
  }).sort((a, b) => {
    // Priority 1: Featured
    if (a.isCategoryFeatured && !b.isCategoryFeatured) return -1;
    if (!a.isCategoryFeatured && b.isCategoryFeatured) return 1;

    // Priority 2: Selected Sort
    if (sortBy === 'trending') return (b.salesCount || 0) - (a.salesCount || 0);
    if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    
    // Priority 3: Premium Vendors (Tie-breaker)
    if (a.isPremium && !b.isPremium) return -1;
    if (!a.isPremium && b.isPremium) return 1;
    
    return 0;
  });

  // Apply Pagination Slicing
  const visibleProducts = filteredProducts.slice(0, displayCount);
  const hasMore = filteredProducts.length > displayCount;

  const handleLoadMore = () => {
      setDisplayCount(prev => prev + 8);
  };

  const locations = ['All', ...KUBWA_AREAS];
  
  const userPlanId = user?.subscription?.tier || 'STARTER';
  const userPlan = SUBSCRIPTION_PLANS.find(p => p.id === userPlanId) || SUBSCRIPTION_PLANS[0];
  const isPremium = userPlan.id === 'PREMIUM' || userPlan.id === 'ELITE';
  
  // Checkout Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = isPremium ? cartSubtotal * 0.05 : 0;
  const deliveryFee = deliveryMethod === 'DELIVERY' ? 1000 : 0;
  const cartTotal = cartSubtotal - discountAmount + deliveryFee;

  // SECTION 3 & 4: User Experience & Limits
  const productLimit = userPlan.limits.listings;
  const hasReachedLimit = myProducts.length >= productLimit;
  const usagePercent = Math.min(100, (myProducts.length / productLimit) * 100);

  const handleAddToCart = (product: Product, qty: number = 1) => {
    for (let i = 0; i < qty; i++) {
        addToCart(product);
    }
    setCartToast(`Added ${qty} ${product.name} to cart`);
    setTimeout(() => setCartToast(null), 2000);
    if (selectedProduct) setSelectedProduct(null);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleAuthSuccess = async (loggedInUser: User) => {
    refreshUser();
    if (pendingAction === 'checkout') {
       setTimeout(() => {
          alert("Signed in! You can now proceed with payment.");
       }, 500);
    } else if (pendingAction === 'wishlist' && pendingProduct) {
       setTimeout(() => toggleWishlist(pendingProduct.id, loggedInUser), 500);
    }
    setPendingAction(null);
    setPendingProduct(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user) {
      setPendingAction('checkout');
      setShowAuthModal(true);
      return;
    }
    
    // Validation
    if (deliveryMethod === 'DELIVERY' && !deliveryAddress.trim()) {
        alert("Please enter a delivery address.");
        return;
    }
    if (!contactPhone.trim()) {
        alert("Please enter a contact phone number.");
        return;
    }

    setIsCheckingOut(true);
    const success = await api.processPayment(cartTotal, paymentGateway, user);
    
    if (success) {
      // Actually create the order record in DB
      const orderCreated = await api.products.createOrder(
          user.id, 
          cart, 
          cartTotal, 
          deliveryFee, 
          deliveryMethod, 
          deliveryAddress, 
          contactPhone
      );

      if (orderCreated) {
        setPaymentSuccess(true);
        setCart([]);
        setTimeout(() => {
            setPaymentSuccess(false);
            setIsCartOpen(false);
            setIsCheckingOut(false);
            setDeliveryAddress('');
        }, 2500);
      } else {
        alert("Payment successful but order creation failed. Please contact support.");
        setIsCheckingOut(false);
      }
    } else {
      setIsCheckingOut(false);
    }
  };

  const toggleWishlist = async (productId: string, explicitUser?: User) => {
    const currentUser = explicitUser || user;
    if (!currentUser) { 
       setPendingAction('wishlist');
       setPendingProduct(products.find(p => p.id === productId) || null);
       setShowAuthModal(true);
       return; 
    }
    const isInWishlist = wishlist.includes(productId);
    const newWishlist = isInWishlist ? wishlist.filter(id => id !== productId) : [...wishlist, productId];
    setWishlist(newWishlist);
    const success = await api.users.toggleWishlist(currentUser.id, productId);
    if (!success) {
       setWishlist(wishlist);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const reader = new FileReader();
       reader.onloadend = () => {
          setCropImage(reader.result as string);
          setCropZoom(1);
          setCropOffset({ x: 0, y: 0 });
          setCropAspect(1);
       };
       reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = () => {
     // Simulated crop result
     const croppedDataUrl = cropImage; 
     if (croppedDataUrl) {
       setNewProduct(prev => ({ ...prev, images: [...prev.images, croppedDataUrl] }));
       setCropImage(null);
     }
  };

  const removeImage = (index: number) => {
      setNewProduct(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // --- VENDOR ACTIONS ---
  const handleEditProduct = (product: Product) => {
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      images: [product.image, ...(product.images || [])].filter(Boolean),
      phoneNumber: product.phoneNumber || '',
      location: product.location || '',
      description: product.description || ''
    });
    setEditingId(product.id);
    setIsAddProductOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Basic validation
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
        alert("Please fill in all required fields.");
        return;
    }
    
    setIsSubmittingProduct(true);
    
    if (editingId) {
        // Edit existing product
        setTimeout(() => {
             // Mock update for demo state
            setMyProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...newProduct, price: Number(newProduct.price), stock: Number(newProduct.stock), image: newProduct.images[0] || p.image } : p));
            setIsSubmittingProduct(false);
            setIsAddProductOpen(false);
            setEditingId(null);
            setNewProduct({ name: '', price: '', category: '', stock: '', images: [], phoneNumber: '', location: '', description: '' });
            alert("Product updated! It is now pending approval.");
        }, 1000);
    } else {
        // Add new product
        const success = await api.products.addProduct(user.id, {
        ...newProduct,
        image: newProduct.images[0] || 'https://picsum.photos/400?random=' + Math.random(),
        stock: parseInt(newProduct.stock),
        price: parseInt(newProduct.price)
        });

        setIsSubmittingProduct(false);
        if (success) {
            setIsAddProductOpen(false);
            setNewProduct({ name: '', price: '', category: '', stock: '', images: [], phoneNumber: '', location: '', description: '' });
            alert("Product submitted for approval! It will appear in the shop once approved by an Admin.");
            const myItems = await api.products.getByVendor(user.id);
            setMyProducts(myItems);
        } else {
            // SECTION 4: User Experience (Error Feedback)
            alert("Limit reached! You have used all your product slots for the Free Tier. Please upgrade to list more items.");
        }
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
     setProcessingOrder(orderId);
     const success = await api.products.updateVendorOrderStatus(orderId, status);
     if (success) {
        // Update local state deeply
        setVendorOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
     } else {
         alert("Failed to update status");
     }
     setProcessingOrder(null);
  };

  const handleRequestRider = async (order: MartOrder) => {
      setProcessingOrder(order.id);
      // Assume vendor's address is stored in user profile or just use a placeholder for now
      const vendorAddress = user?.address || 'Vendor Location (Kubwa)';
      const success = await api.products.requestRider(order, vendorAddress);
      
      if (success) {
          alert("Rider has been requested! They will be assigned automatically by the system.");
          // Update local state to reflect SHIPPED status and mocked Rider info
          setVendorOrders(prev => prev.map(o => o.id === order.id ? { 
              ...o, 
              status: 'SHIPPED',
              riderId: 'mock_rider',
              riderName: 'Musa Abdullahi',
              riderPhone: '08099887766'
          } : o));
      } else {
          alert("Failed to request rider. Please try again.");
      }
      setProcessingOrder(null);
  };

  const handleFeaturedPayment = async () => {
      if (!user || !selectedPlan) return;
      setProcessingPayment(true);
      const success = await api.processPayment(selectedPlan.price, paymentGateway, user);
      if (success) {
          // Send request to API
          await api.features.requestFeature(user.id, user.name, selectedPlan);
          alert("Payment Received! Your request is pending admin approval.");
          setShowFeaturePlans(false);
          setSelectedPlan(null);
      } else {
          alert("Payment failed.");
      }
      setProcessingPayment(false);
  };

  const requestProductFeature = () => {
      alert("Feature request sent to admin! (This is a placeholder)");
  };

  const renderOrderCard = (order: MartOrder, type: 'new' | 'active' | 'history') => (
    <div key={order.id} className="border rounded-lg p-3 bg-white shadow-sm mb-3">
        <div className="flex justify-between mb-2">
            <span className="font-bold text-xs">Order #{order.id.slice(-4)}</span>
            <Badge color={
                order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                order.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
            }>{order.status}</Badge>
        </div>
        <div className="text-xs text-gray-600 mb-2">
            <p className="text-[10px] text-gray-400 mb-1">{new Date(order.date).toLocaleString()}</p>
            {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between border-b border-gray-50 pb-1 mb-1 last:border-0 last:mb-0">
                <span>{i.quantity}x {i.name}</span>
                <span className="font-mono">₦{(i.price * i.quantity).toLocaleString()}</span>
            </div>
            ))}
            <div className="border-t mt-1 pt-1 font-bold text-right flex justify-between">
                <span>Total</span>
                <span>₦{order.total.toLocaleString()}</span>
            </div>
        </div>
        
        {/* Delivery Info */}
        <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-100 text-xs">
            <p className="flex justify-between"><span className="font-bold">Method:</span> {order.deliveryMethod}</p>
            <p className="flex justify-between"><span className="font-bold">Delivery Fee:</span> ₦{order.deliveryFee.toLocaleString()} (Locked)</p>
            {order.deliveryMethod === 'DELIVERY' && (
                <p className="mt-1"><span className="font-bold">Address:</span> {order.deliveryAddress}</p>
            )}
            <p className="mt-1 flex items-center gap-1"><span className="font-bold">Contact:</span> <Phone size={10}/> {order.contactPhone}</p>
            
            {/* Rider Info Display (Read Only) */}
            {order.status === 'SHIPPED' && order.riderName && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-blue-800">
                    <p className="font-bold flex items-center gap-1"><Bike size={12}/> Assigned Rider</p>
                    <p>{order.riderName}</p>
                    <p>{order.riderPhone}</p>
                </div>
            )}
        </div>

        {/* Order Actions based on Status */}
        <div className="flex gap-2">
            {type === 'new' && order.status === 'PENDING' && (
                <>
                    <Button 
                        onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                        className="flex-1 py-1 text-xs bg-green-600 hover:bg-green-700 h-8"
                        disabled={!!processingOrder}
                    >
                        Accept Order
                    </Button>
                    <Button 
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                        className="flex-1 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 h-8"
                        disabled={!!processingOrder}
                    >
                        Reject
                    </Button>
                </>
            )}

            {type === 'active' && order.status === 'ACCEPTED' && (
                <Button 
                    onClick={() => updateOrderStatus(order.id, 'READY')}
                    className="w-full py-1 text-xs bg-yellow-500 hover:bg-yellow-600 h-8 flex items-center justify-center gap-2"
                    disabled={!!processingOrder}
                >
                    <Package size={14} /> Mark Ready for {order.deliveryMethod === 'PICKUP' ? 'Pickup' : 'Dispatch'}
                </Button>
            )}

            {type === 'active' && order.status === 'READY' && (
                <>
                    {order.deliveryMethod === 'DELIVERY' ? (
                        <Button 
                            onClick={() => handleRequestRider(order)}
                            className="w-full py-1 text-xs bg-blue-600 hover:bg-blue-700 h-8 flex items-center justify-center gap-2"
                            disabled={!!processingOrder}
                        >
                            {processingOrder === order.id ? <Loader2 size={14} className="animate-spin" /> : <><Bike size={14}/> Request Rider (Auto-Assign)</>}
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                            className="w-full py-1 text-xs bg-green-600 hover:bg-green-700 h-8"
                            disabled={!!processingOrder}
                        >
                            Mark Collected by User
                        </Button>
                    )}
                </>
            )}

            {type === 'active' && order.status === 'SHIPPED' && (
                <div className="w-full text-center text-xs text-gray-500 italic bg-gray-100 py-1 rounded">
                    With Rider ({order.riderName})
                </div>
            )}
        </div>
    </div>
  );

  const renderVendorDashboard = () => {
    if (!user || !analytics) return null;
    
    // Filter orders for tabs
    const newOrders = vendorOrders.filter(o => o.status === 'PENDING');
    const activeOrders = vendorOrders.filter(o => ['ACCEPTED', 'READY', 'SHIPPED'].includes(o.status));
    
    return (
        <div className="mb-8 animate-fade-in">
           <div className="bg-gray-900 text-white p-4 rounded-t-xl flex justify-between items-center">
              <div>
                 <h3 className="font-bold text-lg flex items-center gap-2"><Store size={18} /> My Store Dashboard</h3>
                 <p className="text-xs text-gray-400">Manage your business • {userPlan.name} Plan</p>
              </div>
              <button onClick={() => setShowVendorDash(false)} className="bg-white/10 p-1 rounded hover:bg-white/20"><X size={16}/></button>
           </div>
           
           <div className="bg-white border border-gray-200 rounded-b-xl p-4 shadow-xl">
              {/* Notifications Banner */}
              {notifications.length > 0 && (
                <div className="mb-4 space-y-2">
                   {notifications.map(n => (
                     <div key={n.id} className={`p-2 rounded text-xs flex items-center gap-2 ${n.type === 'alert' ? 'bg-red-50 text-red-700 border border-red-200' : n.type === 'order' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {n.type === 'alert' ? <AlertCircle size={14}/> : n.type === 'order' ? <Package size={14}/> : <Info size={14}/>}
                        <span className="font-bold">{n.message}</span>
                     </div>
                   ))}
                </div>
              )}

              {/* Dashboard Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg mb-4 overflow-x-auto no-scrollbar">
                 {['overview', 'new_orders', 'active_orders', 'inventory'].map(t => (
                   <button 
                     key={t} 
                     onClick={() => setVendorTab(t as any)}
                     className={`flex-1 py-2 px-3 text-[10px] md:text-xs font-bold uppercase rounded whitespace-nowrap transition-all ${vendorTab === t ? 'bg-white shadow text-kubwa-green' : 'text-gray-500'}`}
                   >
                     {t.replace('_', ' ')} 
                     {t === 'new_orders' && newOrders.length > 0 && ` (${newOrders.length})`}
                   </button>
                 ))}
              </div>

              {/* OVERVIEW TAB */}
              {vendorTab === 'overview' && (
                <div className="space-y-4 animate-fade-in">
                   {/* Product Limit Progress Bar */}
                   <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between text-xs font-bold mb-1">
                         <span>Product Limit ({userPlan.name})</span>
                         <span className={hasReachedLimit ? "text-red-500" : "text-gray-600"}>{myProducts.length} / {productLimit} Used</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                         <div className={`h-full ${hasReachedLimit ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${usagePercent}%` }}></div>
                      </div>
                      {hasReachedLimit && (
                         <div className="mt-2 text-[10px] bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-100 flex items-center gap-1">
                            <Crown size={12} />
                            <span>Upgrade to Pro to list unlimited products.</span>
                         </div>
                      )}
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                         <p className="text-xs text-green-600 font-bold uppercase">Revenue</p>
                         <p className="text-xl font-bold text-gray-900">₦{(analytics.totalRevenue).toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                         <p className="text-xs text-blue-600 font-bold uppercase">Orders</p>
                         <p className="text-xl font-bold text-gray-900">{analytics.totalOrders}</p>
                      </div>
                   </div>
                   
                   <div className="h-40 bg-white border rounded-lg p-2">
                      <p className="text-xs font-bold text-gray-500 mb-2">Sales Trend</p>
                      <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={analytics.salesData}>
                          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{fill: '#f3f4f6'}} />
                          <Bar dataKey="sales" fill="#0D9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                   
                   <div className="flex gap-2">
                       <Button 
                         onClick={() => { setEditingId(null); setNewProduct({ name: '', price: '', category: '', stock: '', images: [], phoneNumber: '', location: '', description: '' }); setIsAddProductOpen(true); }} 
                         disabled={hasReachedLimit} 
                         className={`flex-1 flex items-center justify-center gap-2 ${hasReachedLimit ? 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed' : ''}`}
                       >
                         <Plus size={16} /> {hasReachedLimit ? 'Limit Reached' : 'Add Product'}
                       </Button>
                       <Button variant="secondary" onClick={() => setShowFeaturePlans(true)} className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600">
                         <Rocket size={16} /> Boost
                       </Button>
                   </div>
                </div>
              )}

              {/* NEW ORDERS TAB */}
              {vendorTab === 'new_orders' && (
                <div className="space-y-3 animate-fade-in max-h-96 overflow-y-auto">
                   {newOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                         <Clock size={32} className="mx-auto mb-2 opacity-20"/>
                         <p className="text-xs">No new orders waiting.</p>
                      </div>
                   ) : (
                      newOrders.map(order => renderOrderCard(order, 'new'))
                   )}
                </div>
              )}

              {/* ACTIVE ORDERS TAB */}
              {vendorTab === 'active_orders' && (
                <div className="space-y-3 animate-fade-in max-h-96 overflow-y-auto">
                   {activeOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                         <Package size={32} className="mx-auto mb-2 opacity-20"/>
                         <p className="text-xs">No active orders in progress.</p>
                      </div>
                   ) : (
                      activeOrders.map(order => renderOrderCard(order, 'active'))
                   )}
                </div>
              )}

              {/* INVENTORY TAB - Updated for Features */}
              {vendorTab === 'inventory' && (
                <div className="space-y-2 animate-fade-in max-h-96 overflow-y-auto">
                   {myProducts.length === 0 ? <p className="text-center text-gray-400 py-4 text-xs">No products listed.</p> : null}
                   {myProducts.map(p => (
                      <div key={p.id} className={`flex flex-col bg-gray-50 p-2 rounded border gap-2 ${p.isCategoryFeatured ? 'border-yellow-300 ring-1 ring-yellow-100' : ''}`}>
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <img src={p.image} className="w-8 h-8 rounded bg-gray-200 object-cover" alt="" />
                                <div>
                                   <div className="flex items-center gap-1">
                                      <p className="text-xs font-bold truncate w-24">{p.name}</p>
                                      {p.isCategoryFeatured && <Crown size={10} className="text-yellow-600 fill-yellow-600" />}
                                   </div>
                                   <p className="text-[10px] text-gray-500">Stock: {p.stock} • ₦{p.price}</p>
                                   <p className="text-[9px] text-gray-400">{getCategoryLabel(p.category)}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                                    p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>{p.status}</span>
                                <button onClick={() => handleEditProduct(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={14} /></button>
                             </div>
                        </div>
                        {p.status === 'REJECTED' && p.rejectionReason && (
                           <div className="text-[10px] text-red-600 bg-red-50 p-1 rounded border border-red-100 flex items-start gap-1">
                              <AlertCircle size={12} className="shrink-0 mt-0.5"/> 
                              <span><strong>Action Needed:</strong> {p.rejectionReason}</span>
                           </div>
                        )}
                        {!p.isCategoryFeatured && p.status === 'APPROVED' && (
                            <button onClick={requestProductFeature} className="text-[10px] text-yellow-600 hover:underline flex items-center gap-1">
                                <Star size={10} /> Request Feature
                            </button>
                        )}
                        {p.isCategoryFeatured && (
                            <p className="text-[10px] text-yellow-700 font-bold bg-yellow-50 px-2 py-0.5 rounded flex items-center gap-1">
                                <Crown size={10} /> Featured Product
                            </p>
                        )}
                      </div>
                   ))}
                </div>
              )}
           </div>
        </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 relative">
      <Breadcrumbs items={[
        { label: 'Home', onClick: () => setSection(AppSection.HOME) },
        { label: 'Mart', onClick: () => setSelectedParentCategory('All') },
        ...(selectedParentCategory !== 'All' ? [{ label: PRODUCT_CATEGORIES.find(c => c.id === selectedParentCategory)?.label || 'Category' }] : [])
      ]} />
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          providerName="Mart Vendor"
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Cart Toast */}
      {cartToast && (
         <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl animate-fade-in z-50 flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            {cartToast}
         </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-kubwa-green">Kubwa Mart</h2>
          <p className="text-gray-500 text-sm">Everything you need, delivered.</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'VENDOR' && (
             <div className="relative">
                <button 
                  onClick={() => setShowVendorDash(!showVendorDash)}
                  className={`p-2 rounded-full border transition-all ${showVendorDash ? 'bg-kubwa-green text-white border-kubwa-green' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  <Store size={20} />
                </button>
                {notifications.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {notifications.length}
                   </span>
                )}
             </div>
          )}
          <div className="relative">
            <button 
              className="p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-kubwa-green relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-kubwa-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RENDER VENDOR DASHBOARD */}
      {showVendorDash && renderVendorDashboard()}

      {/* FEATURED PLANS MODAL */}
      {showFeaturePlans && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
           <Card className="w-full max-w-sm animate-zoom-in relative">
              <button onClick={() => { setShowFeaturePlans(false); setSelectedPlan(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
              <div className="text-center mb-6">
                 <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2 text-yellow-500">
                    <Star size={24} fill="currentColor" />
                 </div>
                 <h3 className="text-lg font-bold">Boost Your Store</h3>
                 <p className="text-sm text-gray-500">Get seen by thousands of Kubwa residents.</p>
              </div>

              {!selectedPlan ? (
                 <div className="space-y-3">
                    {FEATURED_PLANS.map(plan => (
                       <div key={plan.id} onClick={() => setSelectedPlan(plan)} className="p-3 border rounded-xl hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer transition-all flex justify-between items-center group">
                          <div>
                             <h4 className="font-bold text-gray-800">{plan.name}</h4>
                             <p className="text-xs text-gray-500">{plan.durationDays} Days Duration</p>
                          </div>
                          <span className="font-bold text-kubwa-green group-hover:text-yellow-600">₦{plan.price.toLocaleString()}</span>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border">
                       <p className="text-xs text-gray-500 font-bold uppercase mb-1">Selected Plan</p>
                       <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">{selectedPlan.name}</span>
                          <span className="font-bold text-kubwa-green text-lg">₦{selectedPlan.price.toLocaleString()}</span>
                       </div>
                    </div>
                    
                    <div className="text-xs bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100 flex gap-2">
                       <Info size={16} className="shrink-0" />
                       <p>Payment is processed securely via Paystack/Flutterwave. Your "Featured" status will be activated by an Admin after payment confirmation.</p>
                    </div>

                    <Button onClick={handleFeaturedPayment} disabled={processingPayment} className="w-full py-3 shadow-lg">
                       {processingPayment ? <Loader2 className="animate-spin" /> : `Pay ₦${selectedPlan.price.toLocaleString()}`}
                    </Button>
                    <button onClick={() => setSelectedPlan(null)} className="w-full text-center text-xs text-gray-500 mt-2">Choose different plan</button>
                 </div>
              )}
           </Card>
        </div>
      )}

      {/* Main Search & Filter Bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-kubwa-green/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowFilterModal(!showFilterModal)}
          className={`px-3 rounded-xl border flex items-center justify-center transition-colors ${
            (showFilterModal || filterRating > 0 || filterLocation !== 'All') ? 'bg-kubwa-green border-kubwa-green text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Categories Scroller (Parents) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        <button
            onClick={() => setSelectedParentCategory('All')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedParentCategory === 'All' 
                ? 'bg-kubwa-green text-white shadow' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
        </button>
        {PRODUCT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedParentCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedParentCategory === cat.id
                ? 'bg-kubwa-green text-white shadow' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          [1,2,3,4].map(n => <div key={n} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)
        ) : (
          visibleProducts.map(product => {
            const cartItem = cart.find(item => item.id === product.id);
            const quantityInCart = cartItem ? cartItem.quantity : 0;
            
            return (
            <Card 
               key={product.id} 
               className={`p-0 overflow-hidden group cursor-pointer hover:shadow-md transition-shadow ${product.isCategoryFeatured ? 'ring-2 ring-yellow-400 border-yellow-400' : ''}`}
               onClick={() => setSelectedProduct(product)}
            >
              <div className="h-32 bg-gray-200 relative overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                {product.isCategoryFeatured && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 z-10">
                    <Crown size={10} fill="black" /> Top Pick
                  </div>
                )}
                {!product.isCategoryFeatured && product.isPremium && (
                  <div className="absolute top-2 left-2 bg-orange-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                    <Crown size={10} fill="white" /> Pro
                  </div>
                )}
                {wishlist.includes(product.id) ? (
                   <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="absolute top-2 right-2 bg-white p-1 rounded-full text-red-500 shadow-md transition-transform hover:scale-110">
                      <Heart size={14} fill="currentColor" />
                   </button>
                ) : (
                   <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-gray-400 shadow-md transition-transform hover:scale-110 hover:text-red-500">
                      <Heart size={14} />
                   </button>
                )}
              </div>
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{product.name}</h3>
                </div>
                <div className="flex flex-col gap-1 mb-2">
                   <p className="text-[10px] text-gray-400">{getCategoryLabel(product.category)}</p>
                   <div className="flex items-center gap-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-500">{product.rating}</span>
                   </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="font-bold text-kubwa-green">₦{product.price.toLocaleString()}</p>
                  <button 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                      quantityInCart > 0 
                        ? 'bg-kubwa-green text-white shadow-md ring-2 ring-green-100' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    <Plus size={14} /> {quantityInCart > 0 ? `Add (${quantityInCart})` : 'Add'}
                  </button>
                </div>
              </div>
            </Card>
            );
          })
        )}
      </div>
      
      {/* Load More Button */}
      {hasMore && !loading && (
          <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={handleLoadMore} className="px-8">
                  Load More Products
              </Button>
          </div>
      )}

      {/* FILTER MODAL */}
      {showFilterModal && (
         <div className="absolute top-20 left-4 right-4 z-20 bg-white p-4 rounded-xl shadow-xl border animate-fade-in max-w-sm mx-auto">
            <h3 className="font-bold text-gray-700 mb-3 flex justify-between items-center">
                Refine Results
                <button onClick={() => setShowFilterModal(false)}><X size={20} className="text-gray-400"/></button>
            </h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Sort By</label>
                  <Select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-xs py-2 bg-gray-50 w-full">
                     <option value="default">Recommended</option>
                     <option value="trending">Trending Now 🔥</option>
                     <option value="newest">New Arrivals</option>
                     <option value="rating">Highest Rated</option>
                     <option value="priceAsc">Price: Low to High</option>
                     <option value="priceDesc">Price: High to Low</option>
                  </Select>
               </div>
               
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Price Range (₦)</label>
                  <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        placeholder="Min" 
                        value={filterPriceRange[0]} 
                        onChange={(e) => setFilterPriceRange([Number(e.target.value), filterPriceRange[1]])}
                        className="text-xs py-1"
                      />
                      <span className="text-gray-400">-</span>
                      <Input 
                        type="number" 
                        placeholder="Max" 
                        value={filterPriceRange[1]} 
                        onChange={(e) => setFilterPriceRange([filterPriceRange[0], Number(e.target.value)])}
                        className="text-xs py-1"
                      />
                  </div>
               </div>

               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Vendor</label>
                  <Select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="text-xs py-2 bg-gray-50 w-full">
                     <option value="All">All Vendors</option>
                     {vendorsList.map(v => (
                         <option key={v.id} value={v.id}>{v.name}</option>
                     ))}
                  </Select>
               </div>

               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Min Rating</label>
                  <div className="flex gap-2">
                     {[0, 3, 4, 4.5].map(r => (
                        <button 
                          key={r} 
                          onClick={() => setFilterRating(r)}
                          className={`px-3 py-1 text-xs rounded border ${filterRating === r ? 'bg-orange-100 border-orange-500 text-orange-800' : 'bg-gray-50'}`}
                        >
                          {r === 0 ? 'Any' : `${r}+ ★`}
                        </button>
                     ))}
                  </div>
               </div>
               
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Location</label>
                  <Select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="text-xs py-2 bg-gray-50 w-full">
                     {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </Select>
               </div>
               
               <div className="flex items-center gap-2 pt-2 border-t">
                  <input type="checkbox" checked={showWishlistOnly} onChange={e => setShowWishlistOnly(e.target.checked)} className="rounded text-kubwa-green" />
                  <span className="text-sm font-medium">Show Wishlist Only</span>
               </div>
               
               <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => { 
                      setFilterRating(0); 
                      setFilterLocation('All'); 
                      setShowWishlistOnly(false); 
                      setSortBy('default');
                      setFilterPriceRange([0, 200000]);
                      setFilterVendor('All');
                  }}>Reset</Button>
                  <Button className="flex-1 text-xs" onClick={() => setShowFilterModal(false)}>Apply Filters</Button>
               </div>
            </div>
         </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-sm max-h-[90vh] rounded-2xl overflow-hidden flex flex-col relative animate-zoom-in">
              {/* Close Button */}
              <button 
                 onClick={() => setSelectedProduct(null)} 
                 className="absolute top-4 right-4 z-10 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
              >
                 <X size={18} />
              </button>
              
              {/* Image Section */}
              <div className="h-64 bg-gray-200 relative shrink-0">
                 <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                 {wishlist.includes(selectedProduct.id) ? (
                    <button onClick={() => toggleWishlist(selectedProduct.id)} className="absolute bottom-4 right-4 bg-white text-red-500 p-2 rounded-full shadow-lg">
                       <Heart size={20} fill="currentColor" />
                    </button>
                 ) : (
                    <button onClick={() => toggleWishlist(selectedProduct.id)} className="absolute bottom-4 right-4 bg-white/90 text-gray-400 p-2 rounded-full shadow-lg hover:text-red-500">
                       <Heart size={20} />
                    </button>
                 )}
                 {selectedProduct.isCategoryFeatured && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                        <Crown size={12} fill="black" /> Featured in {getCategoryLabel(selectedProduct.category)}
                    </div>
                 )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5">
                 <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
                    <span className="font-bold text-xl text-kubwa-green">₦{selectedProduct.price.toLocaleString()}</span>
                 </div>
                 
                 <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-yellow-700 font-bold border border-yellow-100">
                       <Star size={12} fill="currentColor" /> {selectedProduct.rating}
                    </div>
                    <span className="text-gray-400">|</span>
                    <span className={`${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                       {selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Out of Stock'}
                    </span>
                 </div>

                 {/* Description */}
                 <div className="mb-6">
                    <h4 className="font-bold text-gray-800 text-sm mb-1">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                       {selectedProduct.description || "No detailed description available for this product."}
                    </p>
                    <div className="mt-2 inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-500">
                        Category: {getCategoryLabel(selectedProduct.category)}
                    </div>
                 </div>

                 {/* Vendor Info */}
                 {productVendor && (
                    <div className="mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                          {productVendor.name.charAt(0)}
                       </div>
                       <div className="flex-1">
                          <p className="text-xs text-gray-400 font-bold uppercase">Sold By</p>
                          <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                             {productVendor.storeName || productVendor.name}
                             {productVendor.verification?.status === 'VERIFIED' && <Shield size={12} className="text-blue-500 fill-blue-500" />}
                             {productVendor.isFeatured && (
                                <Badge color="bg-yellow-100 text-yellow-800 text-[10px] flex items-center gap-1 border border-yellow-200 px-1 py-0.5">
                                   <Star size={8} fill="currentColor" /> Featured
                                </Badge>
                             )}
                          </p>
                          {(selectedProduct.phoneNumber || productVendor.phoneNumber) && (
                            <a href={`tel:${selectedProduct.phoneNumber || productVendor.phoneNumber}`} className="text-xs text-gray-500 flex items-center gap-1 mt-1 hover:text-kubwa-green hover:underline">
                               <Phone size={10} /> {selectedProduct.phoneNumber || productVendor.phoneNumber}
                            </a>
                          )}
                       </div>
                       <div className="text-right">
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                             <Star size={10} fill="black" /> {productVendor.rating || 'N/A'}
                          </div>
                          <p className="text-[10px] text-gray-400">{productVendor.reviews || 0} reviews</p>
                       </div>
                    </div>
                 )}

                 {/* Reviews */}
                 <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-3">Customer Reviews</h4>
                    {loadingReviews ? (
                       <Loader2 className="animate-spin text-gray-400 mx-auto" />
                    ) : productReviews.length > 0 ? (
                       <div className="space-y-3">
                          {productReviews.map(r => (
                             <div key={r.id} className="text-sm border-b pb-2 last:border-0">
                                <div className="flex justify-between mb-1">
                                   <span className="font-bold text-gray-700">{r.userName || 'User'}</span>
                                   <div className="flex text-yellow-400"><Star size={10} fill="currentColor"/> <span className="text-gray-400 ml-1 text-xs">{r.rating}</span></div>
                                </div>
                                <p className="text-gray-600 text-xs">"{r.comment}"</p>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <p className="text-xs text-gray-400 italic">No reviews yet.</p>
                    )}
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t bg-gray-50">
                 <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm font-bold text-gray-600">Quantity</span>
                    <div className="flex items-center gap-3 bg-white border rounded-lg px-2 py-1">
                       <button onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))} className="text-gray-500 hover:text-black font-bold text-lg">-</button>
                       <span className="font-bold w-4 text-center">{orderQuantity}</span>
                       <button onClick={() => setOrderQuantity(Math.min(selectedProduct.stock, orderQuantity + 1))} className="text-gray-500 hover:text-black font-bold text-lg">+</button>
                    </div>
                    <div className="ml-auto text-right">
                       <span className="text-xs text-gray-400">Total</span>
                       <p className="font-bold text-lg">₦{(selectedProduct.price * orderQuantity).toLocaleString()}</p>
                    </div>
                 </div>
                 <Button 
                    className="w-full py-3 shadow-lg flex items-center justify-center gap-2" 
                    onClick={() => handleAddToCart(selectedProduct, orderQuantity)}
                    disabled={selectedProduct.stock === 0}
                 >
                    {selectedProduct.stock > 0 ? (
                       <>Add to Cart <ShoppingCart size={18} /></>
                    ) : (
                       'Out of Stock'
                    )}
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* ADD/EDIT PRODUCT MODAL */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
           <Card className="w-full max-w-sm max-h-[90vh] overflow-y-auto animate-zoom-in">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                 <button onClick={() => { setIsAddProductOpen(false); setEditingId(null); setNewProduct({ name: '', price: '', category: '', stock: '', images: [], phoneNumber: '', location: '', description: '' }); }}><X size={20}/></button>
              </div>
              
              <form onSubmit={handleSaveProduct} className="space-y-4">
                 {/* Image Upload & Cropper Trigger */}
                 <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Product Images (Max 3)</label>
                    <div className="flex gap-2 mb-2 overflow-x-auto">
                        {newProduct.images.map((img, idx) => (
                            <div key={idx} className="relative w-20 h-20 shrink-0 border rounded-lg bg-gray-100">
                                <img src={img} alt={`Product ${idx+1}`} className="w-full h-full object-cover rounded-lg" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow"><X size={12}/></button>
                            </div>
                        ))}
                        {newProduct.images.length < 3 && (
                            <div className="w-20 h-20 shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 relative cursor-pointer hover:bg-gray-100 transition-colors">
                                <ImageIcon className="text-gray-400 mb-1" size={20} />
                                <span className="text-[10px] text-gray-500 text-center">Add Photo</span>
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                            </div>
                        )}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="text-xs font-bold text-gray-700 mb-1 block">Name</label>
                       <Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required placeholder="e.g. Fresh Yam" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-gray-700 mb-1 block">Price (₦)</label>
                       <Input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required placeholder="2000" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-3">
                    <div>
                       <label className="text-xs font-bold text-gray-700 mb-1 block">Category</label>
                       <Select 
                         value={newProduct.category} 
                         onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                         required
                       >
                          <option value="">Select Category</option>
                          {PRODUCT_CATEGORIES.map(group => (
                             <optgroup key={group.id} label={group.label}>
                                {group.subcategories.filter(s => s.active).map(sub => (
                                   <option key={sub.id} value={sub.id}>{sub.label}</option>
                                ))}
                             </optgroup>
                          ))}
                       </Select>
                       {newProduct.category && (
                          <p className="text-[10px] text-gray-500 mt-1 italic">
                             Examples: {PRODUCT_CATEGORIES.flatMap(g => g.subcategories).find(s => s.id === newProduct.category)?.examples}
                          </p>
                       )}
                    </div>
                    <div>
                       <label className="text-xs font-bold text-gray-700 mb-1 block">Stock Quantity</label>
                       <Input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required placeholder="10" />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Description</label>
                    <textarea 
                       className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-kubwa-green" 
                       rows={3}
                       placeholder="Describe your product details..."
                       value={newProduct.description}
                       onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    />
                 </div>

                 <Button disabled={isSubmittingProduct} className="w-full py-3">
                    {isSubmittingProduct ? <Loader2 className="animate-spin" /> : (editingId ? 'Update Product' : 'Submit Product')}
                 </Button>
              </form>
           </Card>
        </div>
      )}

      {/* IMAGE CROPPER MODAL */}
      {cropImage && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in">
           <div className="p-4 flex justify-between items-center text-white">
              <button onClick={() => setCropImage(null)}><X size={24} /></button>
              <h3 className="font-bold">Adjust Image</h3>
              <button onClick={handleCropSave} className="text-kubwa-green font-bold flex items-center gap-1"><CheckSquare size={20} /> Done</button>
           </div>
           
           <div className="flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center">
              {/* Cropping Container */}
              <div 
                 ref={containerRef}
                 className="relative border-2 border-white/50 shadow-2xl overflow-hidden cursor-move"
                 style={{ 
                    width: '300px', 
                    height: `${300 / cropAspect}px` 
                 }}
                 onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }); }}
                 onMouseMove={(e) => { if(isDragging) setCropOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
                 onMouseUp={() => setIsDragging(false)}
                 onMouseLeave={() => setIsDragging(false)}
                 onTouchStart={(e) => { setIsDragging(true); setDragStart({ x: e.touches[0].clientX - cropOffset.x, y: e.touches[0].clientY - cropOffset.y }); }}
                 onTouchMove={(e) => { if(isDragging) setCropOffset({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y }); }}
                 onTouchEnd={() => setIsDragging(false)}
              >
                 <img 
                    ref={imgRef}
                    src={cropImage} 
                    alt="Crop" 
                    className="max-w-none origin-center absolute top-1/2 left-1/2"
                    style={{ 
                       transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
                       pointerEvents: 'none'
                    }}
                    draggable={false}
                 />
                 <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/20"></div><div className="border-r border-b border-white/20"></div><div className="border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div><div className="border-r border-b border-white/20"></div><div className="border-b border-white/20"></div>
                    <div className="border-r border-white/20"></div><div className="border-r border-white/20"></div><div></div>
                 </div>
              </div>
           </div>
           
           <div className="bg-black p-6 space-y-6">
              <div className="flex justify-center gap-4">
                 <button onClick={() => setCropAspect(1)} className={`p-2 rounded border ${cropAspect === 1 ? 'border-kubwa-green text-kubwa-green' : 'border-gray-600 text-gray-400'}`}>
                    <div className="w-6 h-6 border-2 border-current"></div>
                    <span className="text-[10px] block text-center mt-1">1:1</span>
                 </button>
                 <button onClick={() => setCropAspect(4/3)} className={`p-2 rounded border ${cropAspect === 4/3 ? 'border-kubwa-green text-kubwa-green' : 'border-gray-600 text-gray-400'}`}>
                    <div className="w-8 h-6 border-2 border-current mx-auto"></div>
                    <span className="text-[10px] block text-center mt-1">4:3</span>
                 </button>
                 <button onClick={() => setCropAspect(16/9)} className={`p-2 rounded border ${cropAspect === 16/9 ? 'border-kubwa-green text-kubwa-green' : 'border-gray-600 text-gray-400'}`}>
                    <div className="w-10 h-6 border-2 border-current mx-auto"></div>
                    <span className="text-[10px] block text-center mt-1">16:9</span>
                 </button>
              </div>

              <div className="flex items-center gap-4">
                 <Minimize2 size={16} className="text-gray-400" />
                 <input 
                   type="range" 
                   min="1" 
                   max="3" 
                   step="0.1" 
                   value={cropZoom} 
                   onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                   className="flex-1 accent-kubwa-green"
                 />
                 <Maximize2 size={16} className="text-gray-400" />
                </div>
             </div>
          </div>
        )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
             <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} /> Your Cart</h3>
               <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                    <ShoppingBag size={48} className="mb-2 opacity-20" />
                    <p>Your cart is empty.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsCartOpen(false)}>Start Shopping</Button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-3 bg-white border border-gray-100 p-2 rounded-xl shadow-sm">
                       <img src={item.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" alt={item.name} />
                       <div className="flex-1">
                          <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-gray-500 mb-1">₦{item.price.toLocaleString()}</p>
                          <div className="flex items-center gap-3">
                            <button className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600" onClick={() => removeFromCart(item.id)}>-</button>
                            <span className="text-sm font-bold">{item.quantity}</span>
                            <button className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600" onClick={() => handleAddToCart(item)}>+</button>
                          </div>
                       </div>
                       <button onClick={() => removeFromCart(item.id)} className="self-start text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  ))
                )}
             </div>

             {cart.length > 0 && (
               <div className="p-4 border-t bg-gray-50">
                  {isPremium && (
                    <div className="flex justify-between text-xs text-orange-600 mb-2 font-bold px-2 py-1 bg-orange-100 rounded">
                       <span>Premium Discount (5%)</span>
                       <span>-₦{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {isCheckingOut && (
                    <div className="mb-4 space-y-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex gap-2 bg-white p-1 rounded-lg border">
                           <button 
                             onClick={() => setDeliveryMethod('PICKUP')}
                             className={`flex-1 py-1.5 text-xs font-bold rounded ${deliveryMethod === 'PICKUP' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                           >
                              Pickup (₦0)
                           </button>
                           <button 
                             onClick={() => setDeliveryMethod('DELIVERY')}
                             className={`flex-1 py-1.5 text-xs font-bold rounded ${deliveryMethod === 'DELIVERY' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                           >
                              Delivery (₦1,000)
                           </button>
                        </div>
                        
                        {deliveryMethod === 'DELIVERY' && (
                            <div className="animate-fade-in">
                                <label className="text-xs font-bold text-gray-700 block mb-1">Delivery Address</label>
                                <Input 
                                  value={deliveryAddress} 
                                  onChange={e => setDeliveryAddress(e.target.value)} 
                                  placeholder="e.g. Phase 4, Kubwa" 
                                  className="bg-white text-xs h-9"
                                />
                            </div>
                        )}
                        <div>
                             <label className="text-xs font-bold text-gray-700 block mb-1">Contact Phone</label>
                             <Input 
                               value={contactPhone} 
                               onChange={e => setContactPhone(e.target.value)} 
                               placeholder="e.g. 080..." 
                               className="bg-white text-xs h-9"
                             />
                        </div>
                    </div>
                  )}

                  <div className="space-y-1 mb-4 text-sm">
                      <div className="flex justify-between text-gray-500">
                         <span>Subtotal</span>
                         <span>₦{(cartSubtotal - discountAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                         <span>Delivery Fee</span>
                         <span>₦{deliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
                         <span>Total</span>
                         <span>₦{cartTotal.toLocaleString()}</span>
                      </div>
                  </div>
                  
                  {isCheckingOut ? (
                     <div className="space-y-3 animate-fade-in">
                        <p className="text-xs font-bold text-gray-500 uppercase">Select Payment Method</p>
                        <div className="grid grid-cols-2 gap-2">
                           <button 
                             onClick={() => setPaymentGateway('PAYSTACK')}
                             className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-1 transition-all ${paymentGateway === 'PAYSTACK' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-500'}`}
                           >
                             <CreditCard size={20} /> Paystack
                           </button>
                           <button 
                             onClick={() => setPaymentGateway('FLUTTERWAVE')}
                             className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-1 transition-all ${paymentGateway === 'FLUTTERWAVE' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white text-gray-500'}`}
                           >
                             <CreditCard size={20} /> Flutterwave
                           </button>
                        </div>
                        <Button className="w-full py-3 mt-2 shadow-lg" onClick={handleCheckout}>
                           Pay ₦{cartTotal.toLocaleString()}
                        </Button>
                     </div>
                  ) : paymentSuccess ? (
                     <div className="bg-green-100 text-green-700 p-4 rounded-xl text-center font-bold animate-zoom-in flex flex-col items-center gap-2">
                        <CheckCircle size={32} />
                        Payment Successful!
                        <span className="text-xs font-normal">Order Created Successfully</span>
                     </div>
                  ) : (
                     <Button className="w-full py-3 shadow-lg flex justify-between items-center px-6" onClick={() => setIsCheckingOut(true)}>
                        <span>Checkout</span>
                        <ArrowLeft className="rotate-180" size={20} />
                     </Button>
                  )}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mart;