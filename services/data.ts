
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
        if (group.subcategories?.some(s => s.id === childId)) return group.id;
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
        features: ['List up to 4 products', 'Basic Profile'],
        limits: { listings: 4, photosPerListing: 3, messagesPerDay: 5, boostsPerMonth: 0 },
        color: 'bg-gray-100'
    },
    {
        id: 'PREMIUM',
        name: 'Pro Vendor',
        price: 5000,
        annualPrice: 50000,
        interval: 'MONTHLY',
        features: ['Unlimited products', 'Verified Badge'],
        limits: { listings: 100, photosPerListing: 5, messagesPerDay: 100, boostsPerMonth: 3 },
        color: 'bg-yellow-100',
        recommended: true
    }
];

const MOCK_PRODUCTS: Product[] = [
  { id: '1', vendorId: 'v1', name: 'Fresh Tomatoes (Basket)', price: 15000, category: 'food_fresh', image: 'https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?auto=format&fit=crop&q=80&w=400', stock: 10, rating: 4.5, status: 'APPROVED', location: 'Phase 4', isCategoryFeatured: true, createdAt: '2023-10-01T10:00:00Z', salesCount: 150, description: 'Direct from the farm. Very fresh and high quality big tomatoes basket.' },
  { id: '2', vendorId: 'v2', name: 'Local Rice (50kg)', price: 65000, category: 'food_grains', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400', stock: 5, rating: 4.8, status: 'APPROVED', location: 'Gwarinpa', isCategoryFeatured: false, createdAt: '2023-10-05T14:30:00Z', salesCount: 80, description: 'Stone-free, well-parboiled local rice.' },
  { id: '3', vendorId: 'v1', name: 'King\'s Vegetable Oil (5L)', price: 12500, category: 'food_pantry', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400', stock: 20, rating: 4.9, status: 'APPROVED', location: 'Phase 4', description: 'Premium quality cooking oil.' },
];

export const api = {
    auth: {
        getSession: async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                return {
                     id: data.session.user.id,
                     email: data.session.user.email!,
                     name: data.session.user.user_metadata.name || 'User',
                     role: 'USER',
                     status: 'ACTIVE',
                     joinedAt: new Date().toISOString(),
                     isSetupComplete: true
                } as User;
            }
            return null;
        },
        signIn: async (email, password) => {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { error: error.message };
            return { user: { id: data.user.id, email, name: data.user.user_metadata.name, role: 'USER', status: 'ACTIVE' } as User };
        },
        // Updated to include requiresVerification to fix AuthModal error
        signUp: async (email, password, name, role) => {
            const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
            if (error) return { error: error.message, requiresVerification: false };
            return { 
                user: { id: data.user?.id || 'new-user', email, name, role, status: 'ACTIVE' } as User,
                requiresVerification: false
            };
        },
        signOut: async () => { await supabase.auth.signOut(); },
        resetPassword: async (email) => { const { error } = await supabase.auth.resetPasswordForEmail(email); return { error: error?.message }; }
    },
    users: {
        getFeaturedVendors: async () => [
            { id: 'v1', name: 'Musa Ibrahim', role: 'VENDOR', status: 'ACTIVE', storeName: 'Musa Provisions', avatar: 'https://i.pravatar.cc/150?u=v1', rating: 4.9, bio: 'Quality goods in Phase 4' },
            { id: 'v2', name: 'Sarah Okon', role: 'VENDOR', status: 'ACTIVE', storeName: 'Sarah’s Fashion', avatar: 'https://i.pravatar.cc/150?u=v2', rating: 4.7, bio: 'Boutique clothing' }
        ] as User[],
        // Added to fix Admin.tsx error
        getAll: async () => [
            { id: 'v1', name: 'Musa Ibrahim', email: 'musa@example.com', role: 'VENDOR', status: 'ACTIVE', storeName: 'Musa Provisions' },
            { id: 'v2', name: 'Sarah Okon', email: 'sarah@example.com', role: 'VENDOR', status: 'ACTIVE', storeName: 'Sarah’s Fashion' },
            { id: 'u1', name: 'Admin User', email: 'admin@kubwa.com', role: 'ADMIN', status: 'ACTIVE' }
        ] as User[],
        getById: async (id: string) => {
            const vendors = {
                'v1': { name: 'Musa Ibrahim', storeName: 'Musa Provisions', rating: 4.9, reviews: 128, avatar: 'https://i.pravatar.cc/150?u=v1', verification: { status: 'VERIFIED' }, phoneNumber: '08012345678' },
                'v2': { name: 'Sarah Okon', storeName: 'Sarah’s Fashion', rating: 4.7, reviews: 45, avatar: 'https://i.pravatar.cc/150?u=v2', verification: { status: 'VERIFIED' }, phoneNumber: '08098765432' },
                'v3': { name: 'Amina Jalo', storeName: 'Fresh Mart', rating: 4.5, reviews: 32, avatar: 'https://i.pravatar.cc/150?u=v3', verification: { status: 'PENDING' }, phoneNumber: '07011223344' }
            };
            const vendor = vendors[id] || { name: 'Kubwa Vendor', storeName: 'Local Store', rating: 4.0, reviews: 10 };
            return { id, role: 'VENDOR', status: 'ACTIVE', ...vendor } as User;
        },
        updateProfile: async (id, updates) => ({ id, ...updates } as User),
        getActivity: async (id) => [],
        getAddresses: async (id) => [],
        saveAddress: async (userId, title, details) => ({ id: Math.random().toString(), userId, title, details } as Address),
        deleteAddress: async (id) => true,
        toggleWishlist: async (userId, productId) => true,
        completeSetup: async (userId, data) => true,
        becomeProvider: async (userId, data) => true,
        updateRole: async (id, role) => true,
        updateStatus: async (id, status) => true
    },
    products: {
        getPending: async () => [],
        getByVendor: async (id) => MOCK_PRODUCTS.filter(p => p.vendorId === id),
        getVendorOrders: async (id) => [],
        getVendorAnalytics: async (id) => ({ totalRevenue: 150000, totalOrders: 25, itemsSold: 60, lowStockCount: 2, salesData: [] }),
        addProduct: async (userId, product) => true,
        updateStatus: async (id, status, reason) => true,
        createOrder: async (userId, items, total, deliveryFee, method, address, phone) => true,
        updateVendorOrderStatus: async (orderId, status) => true,
        requestRider: async (order, addr) => true,
        getAllVendors: async () => [{ id: 'v1', name: 'Musa Provisions' }, { id: 'v2', name: 'Sarah’s Fashion' }]
    },
    admin: {
        getAnnouncements: async () => [],
        getAnalytics: async () => ({ dau: 120, revenue: 450000, retention: 85, conversion: 12, revenueSplit: { subscriptions: 0, commissions: 0, deliveryFees: 0 } }),
        getAllProducts: async () => MOCK_PRODUCTS,
        getAllProviders: async () => [],
        approveProvider: async (id) => true,
        rejectProvider: async (id, reason) => true,
        getSystemSettings: async () => ({ allowSignups: true, maintenanceMode: false, allowAdminPromotions: true, supportEmail: 'hi@kubwa.com', supportPhone: '0800', minVersion: '1.0.0' }),
        getAllOrders: async () => [],
        getAllDeliveries: async () => []
    },
    reviews: { getByTarget: async (id) => [] },
    providers: { getMyProfile: async (id) => null, requestService: async (uid, pid, amt, type, date) => true, updateStatus: async (id, s) => true, updateProviderProfile: async (id, u) => true },
    deliveries: { getAvailableJobs: async () => [], acceptDelivery: async (jid, rid) => true, updateStatus: async (jid, s) => true },
    features: { requestFeature: async (uid, n, p) => true },
    notifications: { simulatePush: async () => ({ id: '1', title: 'Hi', body: 'Test', timestamp: new Date().toISOString() }) },
    getMockContext: async () => ({ products: MOCK_PRODUCTS, providers: [] }),
    getProducts: async () => MOCK_PRODUCTS,
    getProviders: async () => [],
    getDeliveries: async (uid) => [],
    requestDelivery: async (d) => true,
    processPayment: async (amt, g, u) => true
};
