
import { supabase } from './supabase';
import { 
    User, UserRole, Product, ServiceProvider, DeliveryRequest, MartOrder, 
    Announcement, Review, AnalyticsData, SystemSettings, FeaturedRequest, 
    FeaturedPlan, SubscriptionPlan, ActivityItem, Address, VendorAnalytics,
    CartItem, WorkDay, AdminLog
} from '../types';

export const KUBWA_AREAS = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Gwarinpa', 'Dawaki', 'Dutse', 'Arab Road', 'Byazhin'];

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

export const getCategoryLabel = (id: string): string => {
    for (const group of PRODUCT_CATEGORIES) {
        const sub = group.subcategories.find(s => s.id === id);
        if (sub) return sub.label;
    }
    return 'Unknown Category';
};

export const getParentCategory = (childId: string): string => {
    for (const group of PRODUCT_CATEGORIES) {
        if (group.subcategories.some(s => s.id === childId)) return group.id;
    }
    return 'other';
};

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
  { id: '1', vendorId: 'v1', name: 'Fresh Tomatoes (Basket)', price: 15000, category: 'food_fresh', image: 'https://picsum.photos/400?random=1', stock: 10, rating: 4.5, status: 'APPROVED', location: 'Phase 4', isCategoryFeatured: true, createdAt: '2023-10-01T10:00:00Z', salesCount: 150 },
  { id: '2', vendorId: 'v1', name: 'Local Rice (50kg)', price: 65000, category: 'food_grains', image: 'https://picsum.photos/400?random=2', stock: 5, rating: 4.8, status: 'APPROVED', location: 'Gwarinpa', isCategoryFeatured: false, createdAt: '2023-10-05T14:30:00Z', salesCount: 80 },
  { id: '4', vendorId: 'v1', name: 'King\'s Vegetable Oil (5L)', price: 12500, category: 'food_pantry', image: 'https://picsum.photos/400?random=12', stock: 20, rating: 4.9, status: 'APPROVED', location: 'Phase 4', isCategoryFeatured: false, createdAt: '2023-10-12T09:15:00Z', salesCount: 200 },
  { id: '5', vendorId: 'v3', name: 'Frozen Chicken (Kilo)', price: 4500, category: 'food_meat', image: 'https://picsum.photos/400?random=13', stock: 50, rating: 4.6, status: 'APPROVED', location: 'Arab Road', isCategoryFeatured: false, createdAt: '2023-10-15T11:00:00Z', salesCount: 300 },
  { id: '3', vendorId: 'v2', name: 'Men\'s Kaftan', price: 25000, category: 'fashion_men', image: 'https://picsum.photos/400?random=3', stock: 15, rating: 4.2, status: 'APPROVED', location: 'Dutse', isCategoryFeatured: true, createdAt: '2023-09-20T16:45:00Z', salesCount: 45 },
];

const MOCK_PROVIDERS: ServiceProvider[] = [
  { id: 'p1', userId: 'u_p1', name: 'Emmanuel Fixes', category: 'Plumbing', rate: 3500, rating: 4.9, reviews: 24, image: 'https://picsum.photos/200?random=4', available: true, location: 'Phase 4', isVerified: true, skills: ['Plumbing', 'Pipe Repair'] },
  { id: 'p2', userId: 'u_p2', name: 'Sarah Styles', category: 'Tailor', rate: 5000, rating: 4.7, reviews: 12, image: 'https://picsum.photos/200?random=5', available: true, location: 'Gwarinpa', skills: ['Fashion Design', 'Alterations'] },
];

let MOCK_ORDERS: MartOrder[] = [];
let MOCK_DELIVERIES: DeliveryRequest[] = [];
// Fix: Export MOCK_RIDERS as it is used in Admin.tsx
export const MOCK_RIDERS = [
    { id: 'r1', name: 'Musa Abdullahi', phone: '08011112222', location: 'Phase 4' },
];
let MOCK_ADMIN_LOGS: AdminLog[] = [];

const SETUP_KEY_PREFIX = 'kubwa_setup_complete_';
const ROLE_KEY_PREFIX = 'kubwa_user_role_';
const STATUS_KEY_PREFIX = 'kubwa_user_status_';

const checkSetupStatus = (userId: string): boolean => {
    try {
        return localStorage.getItem(`${SETUP_KEY_PREFIX}${userId}`) === 'true';
    } catch (e) { return false; }
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

const getStoredStatus = (userId: string): string | null => {
    return localStorage.getItem(`${STATUS_KEY_PREFIX}${userId}`);
};

const setStoredStatus = (userId: string, status: string) => {
    localStorage.setItem(`${STATUS_KEY_PREFIX}${userId}`, status);
};

export const api = {
    auth: {
        getSession: async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                const userId = data.session.user.id;
                const role = getStoredRole(userId) || data.session.user.user_metadata.role || 'USER';
                const status = getStoredStatus(userId) || 'ACTIVE';
                
                return {
                     id: userId,
                     email: data.session.user.email!,
                     name: data.session.user.user_metadata.name || 'User',
                     // Fix: Cast string variables to literal union types
                     role: role as UserRole,
                     status: status as 'ACTIVE' | 'PENDING' | 'SUSPENDED',
                     joinedAt: new Date().toISOString(),
                     isSetupComplete: checkSetupStatus(userId)
                } as User;
            }
            return null;
        },
        signIn: async (email, password) => {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { error: error.message };
            if (!data.user) return { error: 'User not found' };
            
            const role = getStoredRole(data.user.id) || data.user.user_metadata.role || 'USER';
            const status = getStoredStatus(data.user.id) || 'ACTIVE';
            
            // Fix: Cast string variables to literal union types for User object
            const user: User = {
                 id: data.user.id,
                 email: email,
                 name: data.user.user_metadata.name || 'User',
                 role: role as UserRole,
                 status: status as 'ACTIVE' | 'PENDING' | 'SUSPENDED',
                 joinedAt: new Date().toISOString(),
                 isSetupComplete: checkSetupStatus(data.user.id)
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
            
            const initialStatus = (role === 'RIDER' || role === 'PROVIDER') ? 'PENDING' : 'ACTIVE';
            
            if (data.user) {
                 setStoredRole(data.user.id, role as UserRole);
                 setStoredStatus(data.user.id, initialStatus);

                 const newUser: User = { 
                     id: data.user.id, 
                     email, 
                     name, 
                     role: role as UserRole, 
                     // Fix: Cast string variables to literal union types
                     status: initialStatus as 'ACTIVE' | 'PENDING' | 'SUSPENDED',
                     joinedAt: new Date().toISOString(),
                     isSetupComplete: false 
                 };
                 return { user: newUser };
            }
            return { requiresVerification: true };
        },
        signOut: async () => { await supabase.auth.signOut(); },
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
            setStoredRole(id, role as UserRole);
            return true;
        },
        updateStatus: async (id, status) => {
            setStoredStatus(id, status);
            return true;
        },
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
        becomeProvider: async (userId: string, data: any) => {
            setStoredRole(userId, 'PROVIDER');
            setStoredStatus(userId, 'PENDING');
            
            const existing = MOCK_PROVIDERS.find(p => p.userId === userId);
            if (!existing) {
                MOCK_PROVIDERS.push({
                    id: `p_${Date.now()}`,
                    userId: userId,
                    name: data.businessName || 'Service Provider',
                    category: data.services[0], 
                    skills: data.services,
                    rate: 0, 
                    rating: 0,
                    reviews: 0,
                    image: 'https://picsum.photos/200?grayscale',
                    available: false,
                    location: data.location,
                    isVerified: false,
                    isFeatured: false,
                    bio: data.bio
                });
            }
            return true;
        }
    },
    
    products: {
        getPending: async () => [] as Product[],
        getByVendor: async (id) => MOCK_PRODUCTS.filter(p => p.vendorId === id),
        getVendorOrders: async (id) => MOCK_ORDERS,
        getVendorAnalytics: async (id) => ({ totalRevenue: 150000, totalOrders: 25, itemsSold: 60, lowStockCount: 2, salesData: [{name: 'Mon', sales: 4000}] } as VendorAnalytics),
        addProduct: async (userId, product) => {
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
        createOrder: async (userId, items, total, deliveryFee, method, address, phone) => {
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
        updateVendorOrderStatus: async (orderId, status) => {
            const order = MOCK_ORDERS.find(o => o.id === orderId);
            if (order) { order.status = status as any; return true; }
            return false;
        },
        requestRider: async (order, vendorAddress) => {
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
        getAllVendors: async () => {
            const vendorIds = Array.from(new Set(MOCK_PRODUCTS.map(p => p.vendorId)));
            return vendorIds.map(id => ({ id, name: `Vendor ${id}` })); 
        }
    },

    admin: {
        getAnnouncements: async () => [] as Announcement[],
        getAnalytics: async () => ({ dau: 120, revenue: 450000, retention: 85, conversion: 12, revenueSplit: { subscriptions: 20000, commissions: 15000, deliveryFees: 10000 } } as AnalyticsData),
        getAllProducts: async () => MOCK_PRODUCTS,
        getAllProviders: async () => MOCK_PROVIDERS,
        approveProvider: async (userId: string) => {
            setStoredStatus(userId, 'ACTIVE');
            const p = MOCK_PROVIDERS.find(prov => prov.userId === userId);
            if (p) p.isVerified = true;
            return true;
        },
        rejectProvider: async (userId: string, reason: string) => {
            setStoredStatus(userId, 'REJECTED');
            return true;
        },
        getSystemSettings: async () => ({ allowSignups: true, maintenanceMode: false, allowAdminPromotions: true, supportEmail: 'help@kubwa.com', supportPhone: '0800-KUBWA', minVersion: '1.0.0' } as SystemSettings),
        getAllOrders: async () => MOCK_ORDERS,
        getAllDeliveries: async () => MOCK_DELIVERIES,
        getLogs: async () => MOCK_ADMIN_LOGS,
        getCategories: async () => PRODUCT_CATEGORIES,
        toggleCategoryFeature: async (productId) => {
            const product = MOCK_PRODUCTS.find(p => p.id === productId);
            if (!product) return { success: false, message: 'Product not found' };
            product.isCategoryFeatured = !product.isCategoryFeatured;
            return { success: true, message: 'Status updated' };
        }
    },

    reviews: {
        getByTarget: async (id) => [{ id: 'r1', userId: 'u2', targetId: id, rating: 5, comment: 'Great service!', date: '2023-10-01', userName: 'Chinedu' }] as Review[],
        getRecent: async () => [] as Review[],
        delete: async (id) => true,
    },
    
    providers: {
        getMyProfile: async (id) => MOCK_PROVIDERS.find(p => p.userId === id) || null,
        requestService: async (userId, providerId, amount, type, date) => true,
        updateStatus: async (id, status) => {
            const p = MOCK_PROVIDERS.find(prov => prov.id === id);
            if (p) p.available = status;
            return true;
        },
        updateSchedule: async (id, schedule) => {
            const p = MOCK_PROVIDERS.find(prov => prov.id === id);
            if (p) p.schedule = schedule;
            return true;
        },
        updateProviderProfile: async (id, updates) => {
            const p = MOCK_PROVIDERS.find(prov => prov.id === id);
            if (p) { Object.assign(p, updates); return true; }
            return false;
        }
    },
    
    deliveries: {
        getAvailableJobs: async () => MOCK_DELIVERIES.filter(d => d.status === 'PENDING'),
        acceptDelivery: async (jobId, riderId) => {
            const job = MOCK_DELIVERIES.find(d => d.id === jobId);
            if (job && job.status === 'PENDING') {
                job.status = 'ACCEPTED';
                job.riderId = riderId;
                return true;
            }
            return false;
        },
        updateStatus: async (jobId, status) => {
            const job = MOCK_DELIVERIES.find(d => d.id === jobId);
            if (job) { job.status = status as any; return true; }
            return false;
        },
    },
    
    features: {
        requestFeature: async (userId, name, plan) => true,
        getRequests: async () => [] as FeaturedRequest[],
        approveRequest: async (id) => true,
        rejectRequest: async (id) => true,
    },

    notifications: {
        simulatePush: async () => ({ id: 'n1', title: 'Update', body: 'New notification', timestamp: new Date().toISOString() }),
    },

    shareContent: async (title, text) => {
        if (navigator.share) navigator.share({ title, text }).catch(console.error);
        else alert("Share: " + text);
    },

    getMockContext: async () => ({ products: MOCK_PRODUCTS, providers: MOCK_PROVIDERS }),
    getProducts: async () => MOCK_PRODUCTS,
    getProviders: async () => MOCK_PROVIDERS,
    getDeliveries: async (userId) => MOCK_DELIVERIES.filter(d => d.userId === userId || d.riderId === userId),
    requestDelivery: async (data) => {
        MOCK_DELIVERIES.push({
            ...data,
            id: `del_${Date.now()}`,
            status: 'PENDING',
            date: new Date().toISOString(),
            type: 'DELIVERY'
        });
        return true;
    },
    processPayment: async (amount, gateway, user) => true,
};
