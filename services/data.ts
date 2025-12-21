
import { supabase } from './supabase';
import { 
    User, UserRole, Product, ServiceProvider, DeliveryRequest, MartOrder, 
    Announcement, Review, AnalyticsData, SystemSettings, FeaturedRequest, 
    FeaturedPlan, SubscriptionPlan, ActivityItem, Address, VendorAnalytics,
    CartItem, WorkDay, AdminLog
} from '../types';

export const KUBWA_AREAS = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Gwarinpa', 'Dawaki', 'Dutse', 'Arab Road', 'Byazhin'];

// SECTION 3: Service Selection List
export const FIXIT_SERVICES = [
    'Electrical Repairs', 
    'Plumbing', 
    'Generator Repairs', 
    'Phone & Laptop Repairs',
    'Cleaning Services', 
    'Painting', 
    'AC Repairs', 
    'Carpentry', 
    'Installations',
    'Home Tutoring',
    'Beauty & Makeup'
];

// SECTION 1 & 2: Category Structure & List
export interface CategoryDefinition {
    id: string;
    label: string;
    subcategories: { id: string; label: string; examples: string; active: boolean }[];
}

export const PRODUCT_CATEGORIES: CategoryDefinition[] = [
    {
        id: 'food',
        label: 'Food & Consumables',
        subcategories: [
            { id: 'food_grains', label: 'Grains, Rice & Pasta', examples: 'Rice, Spaghetti, Beans, Garri', active: true },
            { id: 'food_fresh', label: 'Fresh Vegetables & Fruits', examples: 'Tomatoes, Pepper, Yam, Plantain', active: true },
            { id: 'food_meat', label: 'Meat, Fish & Poultry', examples: 'Frozen Chicken, Fresh Fish, Beef', active: true },
            { id: 'food_drinks', label: 'Drinks & Beverages', examples: 'Water, Juice, Wine, Soda', active: true },
            { id: 'food_pantry', label: 'Pantry & Provisions', examples: 'Oil, Spices, Canned Food, Sugar', active: true },
        ]
    },
    {
        id: 'fashion',
        label: 'Fashion & Personal',
        subcategories: [
            { id: 'fashion_men', label: 'Men\'s Wear', examples: 'Shirts, Trousers, Kaftans, Suits', active: true },
            { id: 'fashion_women', label: 'Women\'s Wear', examples: 'Dresses, Skirts, Blouses, Abaya', active: true },
            { id: 'fashion_shoes', label: 'Shoes & Footwear', examples: 'Sneakers, Heels, Sandals', active: true },
            { id: 'fashion_acc', label: 'Accessories', examples: 'Bags, Jewelry, Watches, Perfumes', active: true },
        ]
    },
    {
        id: 'elec',
        label: 'Electronics & Appliances',
        subcategories: [
            { id: 'elec_phones', label: 'Phones & Tablets', examples: 'iPhones, Androids, Chargers', active: true },
            { id: 'elec_home', label: 'Home Appliances', examples: 'Blenders, Irons, Generators, Fans', active: true },
            { id: 'elec_comp', label: 'Computers & Gadgets', examples: 'Laptops, Printers, Headphones', active: true },
        ]
    },
    {
        id: 'home',
        label: 'Home & Living',
        subcategories: [
            { id: 'home_furn', label: 'Furniture', examples: 'Chairs, Tables, Beds', active: true },
            { id: 'home_decor', label: 'Decor & Bedding', examples: 'Curtains, Sheets, Rugs', active: true },
            { id: 'home_kitch', label: 'Kitchenware', examples: 'Pots, Plates, Cutlery', active: true },
        ]
    },
    {
        id: 'health',
        label: 'Health & Wellness',
        subcategories: [
            { id: 'health_beauty', label: 'Beauty & Skincare', examples: 'Creams, Soaps, Makeup', active: true },
            { id: 'health_supp', label: 'Supplements & Herbs', examples: 'Vitamins, Herbal Teas', active: true },
            { id: 'health_pers', label: 'Personal Care', examples: 'Toiletries, Diapers, Hygiene', active: true },
        ]
    },
    {
        id: 'kids',
        label: 'Baby, Kids & Toys',
        subcategories: [
            { id: 'kids_cloth', label: 'Kids Clothing', examples: 'Baby wears, Uniforms', active: true },
            { id: 'kids_toys', label: 'Toys & Education', examples: 'Dolls, Bicycles, Books', active: true },
            { id: 'kids_baby', label: 'Baby Essentials', examples: 'Diapers, Wipes, Food', active: true },
        ]
    },
    {
        id: 'auto',
        label: 'Automotive',
        subcategories: [
            { id: 'auto_parts', label: 'Car Parts & Accessories', examples: 'Tyres, Oil, Batteries', active: true },
            { id: 'auto_bike', label: 'Motorcycles & Keke', examples: 'Parts, Helmets', active: true },
        ]
    },
    {
        id: 'pets',
        label: 'Agriculture & Pets',
        subcategories: [
            { id: 'agri_feed', label: 'Animal Feed', examples: 'Dog food, Chicken feed', active: true },
            { id: 'agri_live', label: 'Livestock & Poultry', examples: 'Live Chickens, Goats', active: true },
            { id: 'agri_pets', label: 'Pets & Supplies', examples: 'Dogs, Cages, Chains', active: true },
        ]
    },
    {
        id: 'digital',
        label: 'Digital & Professional',
        subcategories: [
            { id: 'digi_serv', label: 'Digital Services', examples: 'Printing, Design, Data', active: true },
            { id: 'digi_book', label: 'Books & Stationery', examples: 'Textbooks, Pens, Notepads', active: true },
        ]
    },
    {
        id: 'other',
        label: 'Others',
        subcategories: [
            { id: 'other_misc', label: 'Miscellaneous', examples: 'Items not listed above', active: true },
        ]
    }
];

// Helper to get readable label from ID
export const getCategoryLabel = (id: string): string => {
    for (const group of PRODUCT_CATEGORIES) {
        const sub = group.subcategories.find(s => s.id === id);
        if (sub) return sub.label;
    }
    return 'Unknown Category';
};

// Helper to get Parent ID from Child ID
export const getParentCategory = (childId: string): string => {
    for (const group of PRODUCT_CATEGORIES) {
        if (group.subcategories.some(s => s.id === childId)) return group.id;
    }
    return 'other';
};

// SECTION 1: Product Limits (Existing)
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'STARTER',
        name: 'Free Tier',
        price: 0,
        annualPrice: 0,
        interval: 'MONTHLY',
        features: ['List up to 4 products', 'Basic Profile', 'Standard Support'],
        limits: { listings: 4, photosPerListing: 3, messagesPerDay: 5, boostsPerMonth: 0 },
        color: 'bg-gray-100'
    },
    {
        id: 'BASIC',
        name: 'Basic Vendor',
        price: 2000,
        annualPrice: 20000,
        interval: 'MONTHLY',
        features: ['List up to 10 products', 'Verified Badge', 'Priority Support'],
        limits: { listings: 10, photosPerListing: 3, messagesPerDay: 20, boostsPerMonth: 1 },
        color: 'bg-blue-100'
    },
    {
        id: 'PREMIUM',
        name: 'Pro Vendor',
        price: 5000,
        annualPrice: 50000,
        interval: 'MONTHLY',
        features: ['Unlimited products', 'Featured Listing', 'Analytics Dashboard', '0% Commission'],
        limits: { listings: 100, photosPerListing: 5, messagesPerDay: 100, boostsPerMonth: 3 },
        color: 'bg-yellow-100',
        recommended: true
    },
    {
        id: 'ELITE',
        name: 'Elite Business',
        price: 15000,
        annualPrice: 150000,
        interval: 'MONTHLY',
        features: ['Multiple Locations', 'Dedicated Manager', 'Top Search Results', 'API Access'],
        limits: { listings: 1000, photosPerListing: 10, messagesPerDay: 1000, boostsPerMonth: 10 },
        color: 'bg-purple-100'
    }
];

export const FEATURED_PLANS: FeaturedPlan[] = [
    { id: 'feat_daily', name: '24 Hours Boost', durationDays: 1, price: 1000 },
    { id: 'feat_weekly', name: '7 Days Boost', durationDays: 7, price: 5000 },
    { id: 'feat_monthly', name: '30 Days Boost', durationDays: 30, price: 15000 },
];

const MOCK_PRODUCTS: Product[] = [
  // Food & Consumables
  { id: '1', vendorId: 'v1', name: 'Fresh Tomatoes (Basket)', price: 15000, category: 'food_fresh', image: 'https://picsum.photos/400?random=1', stock: 10, rating: 4.5, status: 'APPROVED', location: 'Phase 4', isCategoryFeatured: true, createdAt: '2023-10-01T10:00:00Z', salesCount: 150 },
  { id: '2', vendorId: 'v1', name: 'Local Rice (50kg)', price: 65000, category: 'food_grains', image: 'https://picsum.photos/400?random=2', stock: 5, rating: 4.8, status: 'APPROVED', location: 'Gwarinpa', isCategoryFeatured: false, createdAt: '2023-10-05T14:30:00Z', salesCount: 80 },
  { id: '4', vendorId: 'v1', name: 'King\'s Vegetable Oil (5L)', price: 12500, category: 'food_pantry', image: 'https://picsum.photos/400?random=12', stock: 20, rating: 4.9, status: 'APPROVED', location: 'Phase 4', isCategoryFeatured: false, createdAt: '2023-10-12T09:15:00Z', salesCount: 200 },
  { id: '5', vendorId: 'v3', name: 'Frozen Chicken (Kilo)', price: 4500, category: 'food_meat', image: 'https://picsum.photos/400?random=13', stock: 50, rating: 4.6, status: 'APPROVED', location: 'Arab Road', isCategoryFeatured: false, createdAt: '2023-10-15T11:00:00Z', salesCount: 300 },
  
  // Fashion
  { id: '3', vendorId: 'v2', name: 'Men\'s Kaftan', price: 25000, category: 'fashion_men', image: 'https://picsum.photos/400?random=3', stock: 15, rating: 4.2, status: 'APPROVED', location: 'Dutse', isCategoryFeatured: true, createdAt: '2023-09-20T16:45:00Z', salesCount: 45 },
  { id: '6', vendorId: 'v2', name: 'Ankara Fabric (6 Yards)', price: 8000, category: 'fashion_women', image: 'https://picsum.photos/400?random=14', stock: 30, rating: 4.7, status: 'APPROVED', location: 'Dutse', isCategoryFeatured: false, createdAt: '2023-10-18T10:20:00Z', salesCount: 12 },
  { id: '7', vendorId: 'v2', name: 'Running Sneakers', price: 18000, category: 'fashion_shoes', image: 'https://picsum.photos/400?random=15', stock: 8, rating: 4.4, status: 'APPROVED', location: 'Dutse', isCategoryFeatured: false, createdAt: '2023-10-20T13:00:00Z', salesCount: 5 },

  // Electronics
  { id: '8', vendorId: 'v4', name: 'Oraimo Power Bank 20000mAh', price: 22000, category: 'elec_phones', image: 'https://picsum.photos/400?random=16', stock: 12, rating: 4.8, status: 'APPROVED', location: 'Phase 3', isCategoryFeatured: true, createdAt: '2023-10-22T09:00:00Z', salesCount: 95 },
  { id: '9', vendorId: 'v4', name: 'Blender & Grinder Set', price: 35000, category: 'elec_home', image: 'https://picsum.photos/400?random=17', stock: 6, rating: 4.5, status: 'APPROVED', location: 'Phase 3', isCategoryFeatured: false, createdAt: '2023-10-21T15:30:00Z', salesCount: 20 },
  { id: '10', vendorId: 'v4', name: 'Used iPhone X (64GB)', price: 120000, category: 'elec_phones', image: 'https://picsum.photos/400?random=18', stock: 1, rating: 4.0, status: 'APPROVED', location: 'Phase 3', isCategoryFeatured: false, createdAt: '2023-10-23T11:45:00Z', salesCount: 3 },

  // Home & Kids
  { id: '11', vendorId: 'v5', name: 'Non-Stick Fry Pan', price: 9500, category: 'home_kitch', image: 'https://picsum.photos/400?random=19', stock: 15, rating: 4.3, status: 'APPROVED', location: 'Byazhin', isCategoryFeatured: false, createdAt: '2023-10-10T12:00:00Z', salesCount: 60 },
  { id: '12', vendorId: 'v5', name: 'Baby Diapers (Pack of 50)', price: 7500, category: 'kids_baby', image: 'https://picsum.photos/400?random=20', stock: 40, rating: 4.9, status: 'APPROVED', location: 'Byazhin', isCategoryFeatured: true, createdAt: '2023-10-24T08:30:00Z', salesCount: 500 },
  
  // Others
  { id: '13', vendorId: 'v6', name: 'Dog Food (Binggo)', price: 14000, category: 'agri_feed', image: 'https://picsum.photos/400?random=21', stock: 10, rating: 4.6, status: 'APPROVED', location: 'Gwarinpa', isCategoryFeatured: false, createdAt: '2023-10-25T14:00:00Z', salesCount: 15 },
  { id: '14', vendorId: 'v6', name: 'A4 Printing Paper (Ream)', price: 3500, category: 'digi_book', image: 'https://picsum.photos/400?random=22', stock: 100, rating: 4.5, status: 'APPROVED', location: 'Gwarinpa', isCategoryFeatured: false, createdAt: '2023-10-25T16:00:00Z', salesCount: 10 },
  { id: '15', vendorId: 'v3', name: 'Catfish (Smoked)', price: 4000, category: 'food_meat', image: 'https://picsum.photos/400?random=23', stock: 25, rating: 4.8, status: 'APPROVED', location: 'Arab Road', isCategoryFeatured: false, createdAt: '2023-10-24T18:00:00Z', salesCount: 200 },
];

// UPDATED: Added userId link to mock providers to ensure matching works
const MOCK_PROVIDERS: ServiceProvider[] = [
  { id: 'p1', userId: 'u_p1', name: 'Emmanuel Fixes', category: 'Plumbing', rate: 3500, rating: 4.9, reviews: 24, image: 'https://picsum.photos/200?random=4', available: true, location: 'Phase 4', isVerified: true, skills: ['Plumbing', 'Pipe Repair'] },
  { id: 'p2', userId: 'u_p2', name: 'Sarah Styles', category: 'Tailor', rate: 5000, rating: 4.7, reviews: 12, image: 'https://picsum.photos/200?random=5', available: true, location: 'Gwarinpa', skills: ['Fashion Design', 'Alterations'] },
  { id: 'p3', userId: 'u_p3', name: 'Quick Cleaners', category: 'Cleaning Services', rate: 2000, rating: 4.5, reviews: 40, image: 'https://picsum.photos/200?random=6', available: false, location: 'Kubwa Village', skills: ['Deep Cleaning', 'Laundry'] },
];

// Mock Orders with new Statuses
let MOCK_ORDERS: MartOrder[] = [
    {
        id: 'ord_1234',
        userId: 'u2',
        items: [{...MOCK_PRODUCTS[0], quantity: 2}],
        total: 31000,
        date: new Date().toISOString(),
        status: 'PENDING', // New Order
        type: 'MART',
        deliveryMethod: 'DELIVERY',
        deliveryAddress: 'Block 2, Phase 4, Kubwa',
        deliveryFee: 1000,
        contactPhone: '08012345678'
    },
    {
        id: 'ord_5678',
        userId: 'u3',
        items: [{...MOCK_PRODUCTS[1], quantity: 1}],
        total: 65000,
        date: new Date(Date.now() - 3600000).toISOString(),
        status: 'ACCEPTED', // Preparing
        type: 'MART',
        deliveryMethod: 'PICKUP',
        deliveryFee: 0,
        contactPhone: '09087654321'
    }
];

let MOCK_DELIVERIES: DeliveryRequest[] = [
    { id: 'del_1', userId: 'u2', pickup: 'Phase 4', dropoff: 'Gwarinpa', itemType: 'Documents', price: 1000, status: 'PENDING', date: new Date().toISOString(), type: 'DELIVERY' }
];

export const MOCK_RIDERS = [
    { id: 'r1', name: 'Musa Abdullahi', phone: '08011112222', location: 'Phase 4' },
    { id: 'r2', name: 'John Peter', phone: '08033334444', location: 'Gwarinpa' },
    { id: 'r3', name: 'Kelechi West', phone: '08055556666', location: 'Dutse' },
];

let MOCK_ADMIN_LOGS: AdminLog[] = [
    { id: 'log_1', adminName: 'SuperAdmin', action: 'SYSTEM_UPDATE', targetId: 'settings', details: 'Updated support email', timestamp: new Date(Date.now() - 86400000).toISOString() }
];

// ------------------------------------------------------------------
// CRITICAL: Setup & Role Persistence (Single Source of Truth)
// ------------------------------------------------------------------
const SETUP_KEY_PREFIX = 'kubwa_setup_complete_';
const ROLE_KEY_PREFIX = 'kubwa_user_role_';

const checkSetupStatus = (userId: string): boolean => {
    try {
        const storedValue = localStorage.getItem(`${SETUP_KEY_PREFIX}${userId}`);
        return storedValue === 'true';
    } catch (e) {
        return false;
    }
};

const markSetupComplete = (userId: string) => {
    localStorage.setItem(`${SETUP_KEY_PREFIX}${userId}`, 'true');
};

const getStoredRole = (userId: string): UserRole | null => {
    return localStorage.getItem(`${ROLE_KEY_PREFIX}${userId}`) as UserRole | null;
};

const setStoredRole = (userId: string, role: UserRole) => {
    localStorage.setItem(`${ROLE_KEY_PREFIX}${userId}`, role);
};
// ------------------------------------------------------------------

export const api = {
    auth: {
        getSession: async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                const userId = data.session.user.id;
                const isSetup = checkSetupStatus(userId);
                // Check local storage for Role override, else fallback to session metadata
                const storedRole = getStoredRole(userId);
                const role = storedRole || data.session.user.user_metadata.role || 'USER';
                
                return {
                     id: userId,
                     email: data.session.user.email!,
                     name: data.session.user.user_metadata.name || 'User',
                     role: role,
                     status: 'ACTIVE',
                     joinedAt: new Date().toISOString(),
                     isSetupComplete: isSetup
                } as User;
            }
            return null;
        },
        signIn: async (email, password) => {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { error: error.message };
            if (!data.user) return { error: 'User not found' };
            
            const isSetup = checkSetupStatus(data.user.id);
            const storedRole = getStoredRole(data.user.id);
            const role = storedRole || data.user.user_metadata.role || 'USER';
            
            const user: User = {
                 id: data.user.id,
                 email: email,
                 name: data.user.user_metadata.name || 'User',
                 role: role,
                 status: 'ACTIVE',
                 joinedAt: new Date().toISOString(),
                 isSetupComplete: isSetup
            };
            return { user };
        },
        signUp: async (email, password, name, role) => {
            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: { data: { name, role } } 
            });
            if (error) return { error: error.message };
            
            const initialStatus = role === 'RIDER' ? 'PENDING' : 'ACTIVE';
            
            if (data.session) {
                 // Save initial role to local storage immediately
                 setStoredRole(data.user!.id, role as UserRole);

                 const newUser: User = { 
                     id: data.user!.id, 
                     email, 
                     name, 
                     role: role as UserRole, 
                     status: initialStatus,
                     joinedAt: new Date().toISOString(),
                     isSetupComplete: false 
                 };
                 return { user: newUser };
            }
            return { requiresVerification: true };
        },
        signOut: async () => {
            await supabase.auth.signOut();
        },
        resetPassword: async (email) => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            return { error: error?.message };
        }
    },

    users: {
        getFeaturedVendors: async () => {
             return [{id: 'v1', name: 'Mama Nkechi Store', email: 'v1@kubwa.com', role: 'VENDOR', status: 'ACTIVE', isFeatured: true, storeName: 'Mama Nkechi', bio: 'Best groceries in Phase 4', avatar: 'https://picsum.photos/200?random=10' }] as User[];
        },
        getAll: async () => [] as User[],
        getById: async (id) => null as unknown as User,
        updateRole: async (id, role) => {
            // FIX: Persist role change to LocalStorage
            setStoredRole(id, role as UserRole);
            return true;
        },
        updateStatus: async (id, status) => true,
        toggleFlag: async (id, isFlagged) => true,
        toggleFeatured: async (id, isFeatured) => true,
        updateProfile: async (id, updates) => ({ id, ...updates } as User),
        getActivity: async (id) => MOCK_ORDERS as ActivityItem[],
        getAddresses: async (id) => [] as Address[],
        saveAddress: async (userId, title, details) => ({ id: Math.random().toString(), userId, title, details } as Address),
        deleteAddress: async (id) => true,
        toggleWishlist: async (userId, productId) => true,
        completeSetup: async (userId, data) => {
            markSetupComplete(userId);
            return true;
        },
        // SECTION 2: Fixit Onboarding
        becomeProvider: async (userId: string, data: any) => {
            // 1. Update user Role to PROVIDER
            setStoredRole(userId, 'PROVIDER');
            
            // 2. Create ServiceProvider Record (MOCKED)
            MOCK_PROVIDERS.push({
                id: `p_${Date.now()}`,
                userId: userId,
                name: data.businessName || 'Service Provider',
                category: data.services[0], // Primary category
                skills: data.services, // All selected services
                rate: 0, // Default
                rating: 0,
                reviews: 0,
                image: 'https://picsum.photos/200?grayscale', // Placeholder
                available: false, // Default offline
                location: data.location,
                isVerified: false,
                isFeatured: false,
                bio: data.bio
            });
            
            return true;
        }
    },
    
    products: {
        getPending: async () => [] as Product[],
        getByVendor: async (id) => MOCK_PRODUCTS.filter(p => p.vendorId === id),
        getVendorOrders: async (id) => MOCK_ORDERS, // Return mock orders
        getVendorAnalytics: async (id) => ({ totalRevenue: 150000, totalOrders: 25, itemsSold: 60, lowStockCount: 2, salesData: [{name: 'Mon', sales: 4000}, {name: 'Tue', sales: 3000}] } as VendorAnalytics),
        addProduct: async (userId, product) => {
            const currentProducts = MOCK_PRODUCTS.filter(p => p.vendorId === userId);
            const plan = SUBSCRIPTION_PLANS[0]; 
            if (currentProducts.length >= plan.limits.listings) {
                return false; 
            }
            MOCK_PRODUCTS.push({
                ...product,
                id: Math.random().toString(),
                vendorId: userId,
                rating: 0,
                status: 'PENDING',
                isCategoryFeatured: false,
                createdAt: new Date().toISOString(),
                salesCount: 0
            });
            return true;
        },
        updateStatus: async (id, status, reason) => {
            const product = MOCK_PRODUCTS.find(p => p.id === id);
            if (product) {
                product.status = status;
                product.rejectionReason = reason;
                return true;
            }
            return false;
        },
        createOrder: async (userId: string, items: CartItem[], total: number, deliveryFee: number, method: string, address: string, phone: string) => {
            MOCK_ORDERS.push({
                id: `ord_${Date.now()}`,
                userId,
                items,
                total: total + deliveryFee,
                date: new Date().toISOString(),
                status: 'PENDING',
                type: 'MART',
                deliveryMethod: method as any,
                deliveryAddress: address,
                deliveryFee,
                contactPhone: phone
            });
            return true;
        },
        updateVendorOrderStatus: async (orderId: string, status: string) => {
            const order = MOCK_ORDERS.find(o => o.id === orderId);
            if (order) {
                order.status = status as any;
                return true;
            }
            return false;
        },
        requestRider: async (order: MartOrder, vendorAddress: string) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const o = MOCK_ORDERS.find(mo => mo.id === order.id);
                    if (o) {
                        o.status = 'SHIPPED';
                        o.riderId = 'rider_001';
                        o.riderName = 'Musa Abdullahi';
                        o.riderPhone = '08099887766';
                    }
                    resolve(true);
                }, 1500); 
            });
        },
        // NEW: Get all vendors for filtering
        getAllVendors: async () => {
            // In a real app this would be a separate query. For mock, we extract from products.
            const vendorIds = Array.from(new Set(MOCK_PRODUCTS.map(p => p.vendorId)));
            // Mock returning minimal user objects for the dropdown
            return vendorIds.map(id => ({ id, name: `Vendor ${id}` })); 
        }
    },

    admin: {
        getAnnouncements: async () => [] as Announcement[],
        getAnalytics: async () => ({ dau: 120, revenue: 450000, retention: 85, conversion: 12, revenueSplit: { subscriptions: 20000, commissions: 15000, deliveryFees: 10000 } } as AnalyticsData),
        getAllProducts: async () => MOCK_PRODUCTS,
        broadcast: async (title: string, body: string, audience: string) => true,
        deleteAnnouncement: async (id: string) => true,
        updateSystemSettings: async (settings: SystemSettings) => true,
        getSystemSettings: async () => ({ allowSignups: true, maintenanceMode: false, allowAdminPromotions: true, supportEmail: 'help@kubwa.com', supportPhone: '0800-KUBWA', minVersion: '1.0.0' } as SystemSettings),
        getAllOrders: async () => MOCK_ORDERS,
        getAllDeliveries: async () => MOCK_DELIVERIES,
        assignRiderToOrder: async (orderId: string, riderId: string) => {
            const order = MOCK_ORDERS.find(o => o.id === orderId);
            const rider = MOCK_RIDERS.find(r => r.id === riderId);
            if (order && rider) {
                order.riderId = riderId;
                order.riderName = rider.name;
                order.riderPhone = rider.phone;
                order.status = 'SHIPPED';
                MOCK_ADMIN_LOGS.unshift({
                    id: `log_${Date.now()}`,
                    adminName: 'Admin',
                    action: 'ASSIGN_RIDER',
                    targetId: orderId,
                    details: `Assigned ${rider.name} to order ${orderId}`,
                    timestamp: new Date().toISOString()
                });
                return true;
            }
            return false;
        },
        forceCancelOrder: async (orderId: string, reason: string) => {
            const order = MOCK_ORDERS.find(o => o.id === orderId);
            if (order) {
                order.status = 'CANCELLED';
                order.isFlagged = false; // Resolve flag if any
                MOCK_ADMIN_LOGS.unshift({
                    id: `log_${Date.now()}`,
                    adminName: 'Admin',
                    action: 'FORCE_CANCEL',
                    targetId: orderId,
                    details: `Cancelled: ${reason}`,
                    timestamp: new Date().toISOString()
                });
                return true;
            }
            return false;
        },
        resolveDispute: async (orderId: string, resolution: string) => {
             const order = MOCK_ORDERS.find(o => o.id === orderId);
             if (order) {
                 order.isFlagged = false;
                 order.flagReason = undefined;
                 MOCK_ADMIN_LOGS.unshift({
                    id: `log_${Date.now()}`,
                    adminName: 'Admin',
                    action: 'RESOLVE_DISPUTE',
                    targetId: orderId,
                    details: `Resolved: ${resolution}`,
                    timestamp: new Date().toISOString()
                });
                return true;
             }
             return false;
        },
        getLogs: async () => MOCK_ADMIN_LOGS,
        getCategories: async () => PRODUCT_CATEGORIES,
        toggleCategoryFeature: async (productId: string) => {
            const product = MOCK_PRODUCTS.find(p => p.id === productId);
            if (!product) return { success: false, message: 'Product not found' };
            if (product.isCategoryFeatured) {
                product.isCategoryFeatured = false;
                return { success: true, message: 'Featured status removed.' };
            }
            const count = MOCK_PRODUCTS.filter(p => p.category === product.category && p.isCategoryFeatured && p.status === 'APPROVED').length;
            if (count >= 3) {
                return { success: false, message: `Slot limit reached for this category (3/3). Unfeature another item first.` };
            }
            product.isCategoryFeatured = true;
            return { success: true, message: 'Product is now featured in its category!' };
        },
        // SECTION 5: Admin get all providers
        getAllProviders: async () => MOCK_PROVIDERS,
    },

    reviews: {
        getByTarget: async (id) => [{ id: 'r1', userId: 'u2', targetId: id, rating: 5, comment: 'Great service!', date: '2023-10-01', userName: 'Chinedu' }] as Review[],
        getRecent: async () => [] as Review[],
        delete: async (id: string) => true,
    },
    
    providers: {
        getMyProfile: async (id) => MOCK_PROVIDERS.find(p => p.userId === id) || null,
        requestService: async (userId: string, providerId: string, amount: number, type: string, date: string) => true,
        updateStatus: async (id, status: boolean) => {
            const p = MOCK_PROVIDERS.find(prov => prov.id === id);
            if (p) p.available = status;
            return true;
        },
        updateSchedule: async (id: string, schedule: WorkDay[]) => {
            const p = MOCK_PROVIDERS.find(prov => prov.id === id);
            if (p) p.schedule = schedule;
            return true;
        },
        updateProviderProfile: async (id: string, updates: Partial<ServiceProvider>) => {
            const p = MOCK_PROVIDERS.find(prov => prov.id === id);
            if (p) {
                Object.assign(p, updates);
                return true;
            }
            return false;
        }
    },
    
    deliveries: {
        getAvailableJobs: async () => MOCK_DELIVERIES.filter(d => d.status === 'PENDING'),
        acceptDelivery: async (jobId: string, riderId: string) => {
            const job = MOCK_DELIVERIES.find(d => d.id === jobId);
            if (job && job.status === 'PENDING') {
                job.status = 'ACCEPTED';
                job.riderId = riderId;
                return true;
            }
            return false;
        },
        updateStatus: async (jobId: string, status: string) => {
            const job = MOCK_DELIVERIES.find(d => d.id === jobId);
            if (job) {
                job.status = status as any;
                return true;
            }
            return false;
        },
    },
    
    features: {
        requestFeature: async (userId: string, name: string, plan: FeaturedPlan) => true,
        getRequests: async () => [] as FeaturedRequest[],
        approveRequest: async (id: string) => true,
        rejectRequest: async (id: string) => true,
    },

    notifications: {
        simulatePush: async () => ({ id: 'n1', title: 'Order Update', body: 'Your order has been shipped!', icon: 'mart', timestamp: new Date().toISOString() }),
    },

    shareContent: async (title, text) => {
        if (navigator.share) {
            navigator.share({ title, text }).catch(console.error);
        } else {
            alert("Share: " + text);
        }
    },

    getMockContext: async () => ({ products: MOCK_PRODUCTS, providers: MOCK_PROVIDERS }),

    getProducts: async () => MOCK_PRODUCTS,
    getProviders: async () => MOCK_PROVIDERS,
    getDeliveries: async (userId) => MOCK_DELIVERIES.filter(d => d.userId === userId || d.riderId === userId),
    requestDelivery: async (data: any) => {
        MOCK_DELIVERIES.push({
            ...data,
            id: `del_${Date.now()}`,
            status: 'PENDING',
            date: new Date().toISOString(),
            type: 'DELIVERY'
        });
        return true;
    },
    processPayment: async (amount: number, gateway: string, user: User) => true,
};