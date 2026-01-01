
import { supabase } from './supabase';
import { User, UserRole, Product, ServiceProvider, ApprovalStatus, MonetisationTier, PaymentIntent, Transaction, Address, Review, DeliveryRequest, MartOrder, OrderStatus, AnalyticsData, ProductVariant, Announcement, PushNotification } from '../types';

export const KUBWA_AREAS = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Gwarinpa', 'Dawaki', 'Dutse', 'Arab Road', 'Byazhin'];
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

/**
 * HELPER: Robust Error Extraction
 * Prevents the dreaded "[object Object]" in logs and UI.
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
    
    // Phase 1: Default all users to FREE tier
    const tier = 'FREE' as MonetisationTier;
    const status = (data.status || data.approval_status || meta.status || meta.approval_status || 'APPROVED') as ApprovalStatus;

    // Phase 1: Standard 4 product limit for all vendors
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
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) return null;

                const { data: { user: sessionUser }, error: fetchError } = await supabase.auth.getUser();
                if (fetchError || !sessionUser) return null;

                let { data: profile } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
                
                if (!profile && sessionUser) {
                    const initialRole = (sessionUser.user_metadata?.role || 'USER') as UserRole;
                    const initialStatus = ['VENDOR', 'PROVIDER', 'RIDER'].includes(initialRole) ? 'PENDING' : 'APPROVED';
                    
                    const { data: newProfile, error: repairError } = await supabase.from('profiles').insert([{ 
                        id: sessionUser.id, 
                        email: sessionUser.email, 
                        fullName: sessionUser.user_metadata?.name || 'Kubwa Resident',
                        role: initialRole,
                        status: initialStatus
                    }]).select().maybeSingle();
                    
                    if (!repairError && newProfile) profile = newProfile;
                }
                
                return mapUserData(sessionUser, profile);
            } catch (e: any) {
                console.error("[Data] getSession Error:", getErrorMessage(e));
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
                    await supabase.from('profiles').upsert([{ 
                        id: data.user.id, 
                        email: email, 
                        fullName: name, 
                        role: role, 
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
        return (data as Product[]) || [];
    },
    saveProduct: async (product: Partial<Product>): Promise<{ success: boolean; data?: Product; error?: string }> => {
        try {
            if (!product.vendorId) throw new Error("Missing Merchant ID. Please log in again.");

            // 1. ROBUST PRE-FLIGHT IDENTITY CHECK (Fixes FK violation)
            const { data: profile, error: profileFetchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', product.vendorId)
                .maybeSingle();

            if (!profile || profileFetchError) {
                console.warn("[Data] Merchant record missing from DB. Repairing...");
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user || user.id !== product.vendorId) {
                    throw new Error("Merchant identity cannot be verified. Please log out and back in.");
                }
                const { error: upsertError } = await supabase.from('profiles').upsert([{ 
                    id: user.id, 
                    email: user.email, 
                    fullName: user.user_metadata?.name || 'Kubwa Merchant',
                    role: (user.user_metadata?.role || 'VENDOR') as UserRole,
                    status: (user.user_metadata?.status || 'PENDING') as ApprovalStatus
                }]);
                if (upsertError) throw new Error(`Merchant synchronization failed: ${getErrorMessage(upsertError)}`);
            }

            // 2. CONSTRUCT PAYLOAD DEFENSIVELY (Addresses schema cache issues)
            const payload: any = {
                name: product.name?.trim(),
                price: Number(product.price),
                category: product.category,
                image: product.image?.trim(),
                vendorId: product.vendorId,
                status: product.status || 'PENDING',
                stock: product.stock !== undefined ? Number(product.stock) : 0
            };

            // If the user hasn't added the 'description' column yet, this would fail.
            // We include it but ensure it's not empty if present.
            if (product.description !== undefined) {
                payload.description = product.description?.trim();
            }

            // 3. EXECUTE SAVE
            let result;
            if (product.id) {
                result = await supabase.from('products').update(payload).eq('id', product.id).select();
            } else {
                result = await supabase.from('products').insert([payload]).select();
            }

            if (result.error) {
                const errStr = getErrorMessage(result.error);
                // Special check for schema cache errors
                if (errStr.includes("column \"description\" of relation \"products\" does not exist")) {
                    throw new Error("Missing database column. Please add a 'description' (TEXT) column to your 'products' table in the Supabase Dashboard.");
                }
                throw new Error(errStr);
            }
            
            return { success: true, data: result.data?.[0] };

        } catch (e: any) {
            const errorMessage = getErrorMessage(e);
            console.error("[Data] saveProduct Fatal Error:", errorMessage);
            return { success: false, error: errorMessage };
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
            return (data as any) || [];
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
