
import { supabase } from './supabase';
import { User, UserRole, Product, ServiceProvider, ApprovalStatus, MonetisationTier, PaymentIntent, Transaction, Address, Review, DeliveryRequest, MartOrder, OrderStatus, AnalyticsData, ProductVariant, Announcement, PushNotification } from '../types';

export const KUBWA_AREAS = [
    'Phase 1', 
    'Phase 2', 
    'Phase 3', 
    'Phase 4', 
    'Gwarinpa', 
    'Dawaki', 
    'Dutse', 
    'Arab Road', 
    'Byazhin',
    'Army Quarters',
    'Kubwa Village',
    'Army Estate',
    'Brick City Estate',
    'Gado Nasco Road',
    'NYSC Camp',
    'FO1',
    'FCDA'
];
export const FIXIT_SERVICES = ['Electrical Repairs', 'Plumbing', 'Generator Repairs', 'Phone & Laptop Repairs', 'Cleaning Services', 'Painting', 'AC Repairs', 'Carpentry', 'Installations', 'Home Tutoring', 'Beauty & Makeup'];

export const PRODUCT_CATEGORIES = [
    { id: 'Food', label: 'Food & Groceries' },
    { id: 'Fashion', label: 'Fashion & Style' },
    { id: 'Electronics', label: 'Tech & Gadgets' },
    { id: 'Home', label: 'Home & Living' },
];

export const getParentCategory = (category: string) => {
    return category; 
};

const DUMMY_PRODUCTS: Product[] = [
    {
        id: 'prod_food_1',
        vendorId: 'mock_vendor_food',
        name: 'Jollof Rice & Chicken Combo',
        price: 2500,
        category: 'Food',
        image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=500',
        stock: 50,
        rating: 4.8,
        status: 'APPROVED',
        description: 'Smoky party jollof rice served with fried chicken and plantain.',
        isPromoted: true
    },
    {
        id: 'prod_food_2',
        vendorId: 'mock_vendor_food',
        name: 'Fresh Yam Tuber (Large)',
        price: 1800,
        category: 'Food',
        image: 'https://images.unsplash.com/photo-1593456868233-a26245347253?auto=format&fit=crop&q=80&w=500',
        stock: 25,
        rating: 4.5,
        status: 'APPROVED',
        description: 'Fresh large tuber of yam, perfect for pounding or boiling.',
        isPromoted: false
    },
    {
        id: 'prod_fash_1',
        vendorId: 'mock_vendor_fashion',
        name: 'Ankara Fabric (6 Yards)',
        price: 8500,
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1622695676346-6468d6c761b0?auto=format&fit=crop&q=80&w=500',
        stock: 10,
        rating: 4.9,
        status: 'APPROVED',
        description: 'High quality cotton Ankara fabric with vibrant, lasting colors.',
        isPromoted: true
    },
    {
        id: 'prod_fash_2',
        vendorId: 'mock_vendor_fashion',
        name: 'Men\'s Leather Slides',
        price: 5000,
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1605763240004-7e93b172d754?auto=format&fit=crop&q=80&w=500',
        stock: 15,
        rating: 4.2,
        status: 'APPROVED',
        description: 'Handcrafted leather slides for casual wear.',
        isPromoted: false
    },
    {
        id: 'prod_tech_1',
        vendorId: 'mock_vendor_tech',
        name: 'Oraimo FreePods 3',
        price: 19000,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=500',
        stock: 20,
        rating: 4.7,
        status: 'APPROVED',
        description: 'Wireless earbuds with heavy bass and noise cancellation.',
        isPromoted: true
    },
    {
        id: 'prod_tech_2',
        vendorId: 'mock_vendor_tech',
        name: 'Power Bank 20000mAh',
        price: 12000,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&q=80&w=500',
        stock: 30,
        rating: 4.6,
        status: 'APPROVED',
        description: 'Fast charging power bank with dual USB output.',
        isPromoted: false
    },
    {
        id: 'prod_home_1',
        vendorId: 'mock_vendor_home',
        name: 'Non-Stick Frying Pan',
        price: 8000,
        category: 'Home',
        image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=500',
        stock: 12,
        rating: 4.4,
        status: 'APPROVED',
        description: 'Durable non-stick frying pan, easy to clean.',
        isPromoted: false
    },
    {
        id: 'prod_home_2',
        vendorId: 'mock_vendor_home',
        name: 'Rechargeable Fan 18"',
        price: 42000,
        category: 'Home',
        image: 'https://images.unsplash.com/photo-1618941716939-553df0c690b8?auto=format&fit=crop&q=80&w=500',
        stock: 5,
        rating: 4.8,
        status: 'APPROVED',
        description: 'Standing rechargeable fan with solar panel support.',
        isPromoted: true
    }
];

/**
 * HELPER: Robust Error Extraction
 */
const getErrorMessage = (error: any): string => {
    if (!error) return "Unknown error occurred.";
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.details) return error.details;
    if (error.hint) return `${error.message} (Hint: ${error.hint})`;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
};

// Simple internal observer for notifications
type NotificationCallback = (notif: PushNotification) => void;
const notificationListeners: Set<NotificationCallback> = new Set();

const mapUserData = (sessionUser: any, profile: any = null): User => {
    if (!sessionUser) return null as any;
    const meta = sessionUser.user_metadata || {};
    const data = profile || meta;
    
    const name = data.fullName || data.full_name || data.name || meta.full_name || meta.name || 'Kubwa Resident';
    const role = (data.role || meta.role || 'USER') as UserRole;
    
    const tier = 'FREE' as MonetisationTier;
    const status = (data.status || data.approval_status || meta.status || meta.approval_status || 'APPROVED') as ApprovalStatus;

    const defaultLimit = role === 'VENDOR' ? 4 : 999;
    const calculatedLimit = data.productLimit ?? meta.productLimit ?? defaultLimit;

    return {
        id: sessionUser.id || '',
        email: sessionUser.email || data.email || meta.email || '',
        name: name,
        role: role,
        joinedAt: sessionUser.created_at,
        tier: tier,
        isFeatured: false,
        productLimit: Number(calculatedLimit),
        verificationStatus: (data.verificationStatus || meta.verificationStatus || 'NONE') as any,
        paymentStatus: 'UNPAID' as any,
        isSetupComplete: data.isSetupComplete === true || data.isSetupComplete === 'true' || meta.isSetupComplete === true,
        status: status,
        avatar: data.avatar || meta.avatar,
        bio: data.bio || meta.bio,
        phoneNumber: data.phoneNumber || meta.phoneNumber,
        storeName: data.storeName || meta.storeName,
        address: data.address || meta.address,
        rejectionReason: data.rejectionReason || meta.rejectionReason
    };
};

export const api = {
    notifications: {
        subscribe: (cb: NotificationCallback) => {
            notificationListeners.add(cb);
            return () => notificationListeners.delete(cb);
        },
        send: (notif: PushNotification) => {
            notificationListeners.forEach(cb => cb(notif));
        }
    },
    auth: {
        getSession: async () => {
            try {
                // 1. Attempt to retrieve session from local storage/Supabase client
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                // CRITICAL FIX: Handle Invalid/Stale Refresh Token Errors
                // If the refresh token is not found or invalid, we must clear the session to prevent a crash loop.
                if (sessionError) {
                    const msg = sessionError.message || '';
                    if (msg.includes("Refresh Token") || msg.includes("Invalid Refresh Token")) {
                        console.warn("[Auth] Stale refresh token detected. Cleaning up session.");
                        await supabase.auth.signOut(); 
                        localStorage.removeItem('kubwa-connect-auth'); // Force clear storage key
                    }
                    return null;
                }

                if (!session) return null;

                // 2. Validate session with a getUser call (ensures token is active on server)
                const { data: { user: sessionUser }, error: fetchError } = await supabase.auth.getUser();
                
                if (fetchError || !sessionUser) {
                     // If getUser fails (e.g. user deleted or token revoked), force logout
                     if (fetchError?.message?.includes("Refresh Token")) {
                        console.warn("[Auth] Token validation failed. Signing out.");
                        await supabase.auth.signOut();
                        localStorage.removeItem('kubwa-connect-auth');
                     }
                     return null;
                }

                // 3. Fetch/Repair Profile Data
                let { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
                
                if (!profile && sessionUser && !profileError) {
                    const { data: newProfile, error: repairError } = await supabase.from('profiles').insert([{ 
                        id: sessionUser.id, 
                        email: sessionUser.email, 
                        fullName: sessionUser.user_metadata?.name || 'Kubwa Resident'
                    }]).select().maybeSingle();
                    
                    if (!repairError && newProfile) profile = newProfile;
                }
                
                return mapUserData(sessionUser, profile);
            } catch (e: any) {
                console.error("[Data] getSession Error:", getErrorMessage(e));
                // Fallback: If any critical auth error occurs, assume logged out
                if (e.message && (e.message.includes("Refresh Token") || e.message.includes("json"))) {
                    localStorage.removeItem('kubwa-connect-auth');
                }
                return null;
            }
        },
        signIn: async (email, password) => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) return { error: getErrorMessage(error) };
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
                return { user: mapUserData(data.user, profile) };
            } catch (e: any) {
                return { error: getErrorMessage(e) };
            }
        },
        signUp: async (email, password, name, role) => {
            try {
                const needsApproval = role === 'VENDOR' || role === 'PROVIDER' || role === 'RIDER';
                const initialStatus = needsApproval ? 'PENDING' : 'APPROVED';
                const { data, error } = await supabase.auth.signUp({ 
                    email, password, 
                    options: { data: { name, role, status: initialStatus, tier: 'FREE' } } 
                });
                if (error) return { error: getErrorMessage(error) };
                
                if (data?.user) {
                    await supabase.from('profiles').insert([{ 
                        id: data.user.id, 
                        email: email, 
                        fullName: name,
                        status: initialStatus
                    }]);
                }
                
                return { user: data?.user ? mapUserData(data.user) : null, requiresVerification: !!data?.user && !data?.session };
            } catch (e: any) {
                return { error: getErrorMessage(e) };
            }
        },
        signOut: async () => { 
            await supabase.auth.signOut();
            localStorage.clear();
        },
        resetPassword: async (email: string) => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            return { success: !error, error: error ? getErrorMessage(error) : undefined };
        },
        updatePassword: async (password: string) => {
            const { error } = await supabase.auth.updateUser({ password });
            return { success: !error, error: error ? getErrorMessage(error) : undefined };
        },
        resendVerification: async (email: string) => {
            const { error } = await supabase.auth.resend({ type: 'signup', email });
            return { success: !error, error: error ? getErrorMessage(error) : undefined };
        }
    },
    orders: {
        placeOrder: async (orderData: Partial<MartOrder>) => {
            // MOCK HANDLING: If vendor is a dummy vendor, succeed without database interaction
            if (orderData.vendorId?.startsWith('mock_')) {
                 return { success: true, orderId: `mock_${Date.now()}` };
            }

            const { data, error } = await supabase.from('orders').insert([{ ...orderData, date: new Date().toISOString() }]).select();
            if (!error && data?.[0]) {
                api.notifications.send({
                    title: "New Order! 🛍️",
                    body: `A customer has just placed an order. Tap to confirm items.`
                });
            }
            return { success: !error, orderId: data?.[0]?.id };
        },
        updateStatus: async (orderId: string, status: OrderStatus) => {
            const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
            return !error;
        },
        getMyOrders: async (userId: string): Promise<MartOrder[]> => {
            const { data } = await supabase.from('orders').select('*').eq('userId', userId);
            return (data as any) || [];
        },
        getVendorOrders: async (vendorId: string): Promise<MartOrder[]> => {
            const { data } = await supabase.from('orders').select('*').eq('vendorId', vendorId);
            return (data as any) || [];
        }
    },
    users: {
        completeSetup: async (userId: string, data: any) => {
            try {
                const dbPayload = { 
                    ...data, 
                    fullName: data.name || data.fullName,
                    isSetupComplete: true 
                };
                await supabase.from('profiles').upsert({ id: userId, ...dbPayload });
                const { data: { user } } = await supabase.auth.updateUser({ 
                  data: { ...data, isSetupComplete: true } 
                });
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
                return mapUserData(user, profile);
            } catch (e) {
                console.error("[Data] completeSetup Error:", getErrorMessage(e));
                return null;
            }
        },
        updateProfile: async (userId: string, updates: Partial<any>): Promise<boolean> => {
            try {
                const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
                if (error) throw error;
                await supabase.auth.updateUser({ data: updates });
                return true;
            } catch (e) {
                console.error("Update Profile Error", e);
                return false;
            }
        },
        getFeaturedVendors: async () => {
            const { data } = await supabase.from('profiles').select('*').eq('role', 'VENDOR').eq('status', 'APPROVED').limit(5);
            return (data as any) || [];
        },
        getAddresses: async (userId: string): Promise<Address[]> => {
            const { data } = await supabase.from('addresses').select('*').eq('userId', userId);
            return (data as any) || [];
        }
    },
    providers: {
        getMyProfile: async (userId: string): Promise<ServiceProvider | null> => {
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
            if (!data) return null;
            return {
                id: data.id,
                userId: data.id,
                name: data.fullName || data.name,
                category: (data as any).category || 'Service',
                rate: (data as any).rate || 0,
                rating: (data as any).rating || 0,
                reviews: (data as any).reviews || 0,
                image: data.avatar || '',
                available: (data as any).available ?? true,
                isVerified: data.verificationStatus === 'VERIFIED',
                bio: data.bio || '',
                skills: (data as any).skills || []
            };
        },
        updateStatus: async (providerId: string, available: boolean): Promise<boolean> => {
            const { error } = await supabase.from('profiles').update({ available }).eq('id', providerId);
            return !error;
        },
        updateProviderProfile: async (userId: string, updates: Partial<ServiceProvider>): Promise<boolean> => {
            const { error } = await supabase.from('profiles').update({
                category: updates.category,
                rate: updates.rate,
                bio: updates.bio,
                skills: updates.skills
            }).eq('id', userId);
            return !error;
        }
    },
    getProducts: async (): Promise<Product[]> => {
        const { data } = await supabase.from('products').select('*');
        const dbProducts = (data || []).map((p: any) => ({
            ...p,
            // AUTO-MAP: Handle any database column naming convention automatically
            vendorId: p.merchant_id || p.vendorId || p.vendor_id, 
            isPromoted: p.isPromoted || p.ispromoted
        })) as Product[];
        
        // Merge DB products with Dummy products to ensure Mart is populated
        return [...dbProducts, ...DUMMY_PRODUCTS];
    },
    saveProduct: async (product: Partial<Product>): Promise<{ success: boolean; data?: Product; error?: string }> => {
        try {
            // STEP 1: AUTHENTICATION CHECK
            const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();
            if (authUserError || !authUser) {
                throw new Error("Your login session has expired. Please sign in again.");
            }

            const currentUserId = authUser.id;

            // STEP 2: PROFILE EXISTENCE VALIDATION (Aggressive Repair)
            // Try to fetch profile ID, if not found or error, attempt upsert to repair foreign key relationship
            const ensureProfile = async () => {
                const { data: profileCheck } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', currentUserId)
                    .maybeSingle();

                if (!profileCheck) {
                     // Auto-repair profile
                     await supabase.from('profiles').upsert({
                         id: currentUserId,
                         email: authUser.email,
                         fullName: authUser.user_metadata?.name || 'Kubwa Merchant',
                         role: 'VENDOR'
                     }, { onConflict: 'id', ignoreDuplicates: true });
                }
            };

            await ensureProfile();

            // STEP 3: PREPARE PAYLOAD
            const buildPayload = (includeDescription: boolean) => {
                const p: any = {
                    name: product.name?.trim(),
                    price: Math.max(0, Number(product.price)),
                    category: product.category,
                    image: product.image?.trim(),
                    merchant_id: currentUserId, 
                    status: product.status || 'PENDING',
                    stock: product.stock !== undefined ? Math.max(0, Number(product.stock)) : 0,
                    isPromoted: product.isPromoted ?? false
                };
                if (includeDescription && product.description !== undefined) {
                    p.description = product.description?.trim();
                }
                return p;
            };

            // STEP 4: DATABASE OPERATION
            let result;
            const primaryPayload = buildPayload(true);
            
            const performOperation = async (payload: any) => {
                 if (product.id) {
                    return await supabase.from('products').update(payload).eq('id', product.id).select();
                 } else {
                    return await supabase.from('products').insert([payload]).select();
                 }
            };

            result = await performOperation(primaryPayload);

            // Retry logic for schema mismatch (description column)
            if (result.error && getErrorMessage(result.error).includes('column "description"')) {
                 result = await performOperation(buildPayload(false));
            }

            // Retry logic for Foreign Key Constraint (Missing Profile despite check)
            if (result.error && getErrorMessage(result.error).includes('foreign key constraint')) {
                 // Force upsert profile again, potentially overwriting to ensure consistency
                 await supabase.from('profiles').upsert({
                     id: currentUserId,
                     email: authUser.email,
                     fullName: authUser.user_metadata?.name || 'Kubwa Merchant',
                     role: 'VENDOR'
                 });
                 // Retry operation one last time
                 result = await performOperation(primaryPayload);
            }

            if (result.error) {
                const errStr = getErrorMessage(result.error);
                if (errStr.includes('foreign key constraint')) {
                    throw new Error("Database Sync Error: Your merchant profile is not recognized. Please visit your Account page to refresh your status.");
                }
                throw new Error(errStr);
            }
            
            // Map return data back to Frontend format
            const savedItem = result.data?.[0];
            const mappedItem = savedItem ? {
                ...savedItem,
                vendorId: savedItem.merchant_id || savedItem.vendorId || savedItem.vendor_id
            } : undefined;

            return { success: true, data: mappedItem };

        } catch (e: any) {
            console.error("[Data] saveProduct Error:", e.message);
            return { success: false, error: e.message };
        }
    },
    getProviders: async (): Promise<ServiceProvider[]> => {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'PROVIDER');
        return (data || []).map(d => ({
            id: d.id,
            userId: d.id,
            name: d.fullName || d.name,
            category: (d as any).category || 'Service',
            rate: (d as any).rate || 0,
            rating: (d as any).rating || 0,
            reviews: (d as any).reviews || 0,
            image: d.avatar || '',
            available: (d as any).available ?? true,
            isVerified: data.verificationStatus === 'VERIFIED',
            bio: d.bio || '',
            skills: (d as any).skills || [],
            location: d.address || ''
        }));
    },
    deliveries: {
        getDeliveries: async (userId?: string): Promise<DeliveryRequest[]> => {
            let query = supabase.from('deliveries').select('*');
            if (userId) query = query.or(`userId.eq.${userId},riderId.eq.${userId}`);
            const { data } = await query;
            return (data as any) || [];
        },
        requestDelivery: async (payload: any): Promise<boolean> => {
            const { error } = await supabase.from('deliveries').insert([{ ...payload, status: 'PENDING', price: 1000, date: new Date().toISOString() }]);
            return !error;
        },
        getAvailableJobs: async (): Promise<DeliveryRequest[]> => {
            const { data } = await supabase.from('deliveries').select('*').eq('status', 'PENDING');
            return (data as any) || [];
        },
        acceptDelivery: async (id: string, riderId: string): Promise<boolean> => {
            const { error } = await supabase.from('deliveries').update({ riderId, status: 'ACCEPTED' }).eq('id', id);
            return !error;
        },
        updateStatus: async (id: string, status: string): Promise<boolean> => {
            const { error } = await supabase.from('deliveries').update({ status }).eq('id', id);
            return !error;
        }
    },
    getMockContext: async () => {
        const [products, providers] = await Promise.all([api.getProducts(), api.getProviders()]);
        return { products, providers };
    },
    admin: {
        getPlatformStats: async (): Promise<AnalyticsData> => {
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
            const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
            return { 
                dau: userCount || 0, 
                revenue: 0, 
                retention: 0, 
                conversion: 0, 
                revenueSplit: [], 
                userStats: { total: userCount, products: productCount, orders: orderCount } 
            };
        },
        getPendingEntities: async (): Promise<User[]> => {
            const { data } = await supabase.from('profiles').select('*').eq('status', 'PENDING');
            return (data || []).map(d => mapUserData({ id: d.id, user_metadata: d }, d));
        },
        getPendingProducts: async (): Promise<Product[]> => {
            const { data } = await supabase.from('products').select('*').eq('status', 'PENDING');
            return (data || []).map((p: any) => ({
                ...p,
                vendorId: p.merchant_id || p.vendorId
            }));
        },
        getAllOrders: async (): Promise<MartOrder[]> => {
            const { data } = await supabase.from('orders').select('*');
            return (data as any) || [];
        },
        getAllUsers: async (): Promise<User[]> => {
            const { data } = await supabase.from('profiles').select('*');
            return (data || []).map(d => mapUserData({ id: d.id, user_metadata: d }, d));
        },
        updateUserStatus: async (userId: string, status: ApprovalStatus) => {
            const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
            return !error;
        },
        updateProductStatus: async (productId: string, status: ApprovalStatus) => {
            const { error } = await supabase.from('products').update({ status }).eq('id', productId);
            return !error;
        },
        getAnnouncements: async (): Promise<Announcement[]> => {
            const { data } = await supabase.from('announcements').select('*').eq('isActive', true);
            return (data as any) || [];
        }
    },
    reviews: {
        getByTarget: async (targetId: string): Promise<Review[]> => {
            const { data } = await supabase.from('reviews').select('*').eq('targetId', targetId);
            return (data as any) || [];
        }
    }
};
