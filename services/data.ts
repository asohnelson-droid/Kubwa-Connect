
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

// Simple internal observer for notifications since we are in a single-page app context
type NotificationCallback = (notif: PushNotification) => void;
const notificationListeners: Set<NotificationCallback> = new Set();

const mapUserData = (sessionUser: any, profile: any = null): User => {
    if (!sessionUser) return null as any;
    const meta = sessionUser.user_metadata || {};
    const data = profile || meta;
    const name = data.full_name || data.name || meta.full_name || meta.name || 'Kubwa Resident';
    const role = (data.role || meta.role || 'USER') as UserRole;
    const tier = (data.tier || meta.tier || 'FREE') as MonetisationTier;
    const status = (data.status || data.approval_status || meta.status || meta.approval_status || 'APPROVED') as ApprovalStatus;

    const isPremiumTier = tier === 'VERIFIED' || tier === 'FEATURED' || data.subscription?.tier === 'ELITE';
    const defaultLimit = role === 'VENDOR' ? (isPremiumTier ? 999 : 6) : 999;
    const calculatedLimit = data.productLimit ?? meta.productLimit ?? defaultLimit;

    return {
        id: sessionUser.id || '',
        email: sessionUser.email || '',
        name: name,
        role: role,
        joinedAt: sessionUser.created_at,
        tier: tier,
        isFeatured: !!data.isFeatured || tier === 'FEATURED',
        productLimit: Number(calculatedLimit),
        verificationStatus: data.verificationStatus || meta.verificationStatus || 'NONE',
        paymentStatus: data.paymentStatus || meta.paymentStatus || 'UNPAID',
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
                // Primary check: getSession restores token from storage
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) return null;

                // Secondary check: verify JWT with server
                const { data: { user: sessionUser }, error: fetchError } = await supabase.auth.getUser();
                if (fetchError || !sessionUser) return null;

                // Final check: Fetch database profile
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
                
                return mapUserData(sessionUser, profile);
            } catch (e: any) {
                console.warn("[Auth] getSession failed:", e);
                return null;
            }
        },
        signIn: async (email, password) => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) return { error: error.message };
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
                return { user: mapUserData(data.user, profile) };
            } catch (e: any) {
                return { error: e.message };
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
                if (error) return { error: error.message };
                if (data?.user) {
                    await supabase.from('profiles').insert([{ id: data.user.id, email, fullName: name, role, status: initialStatus }]);
                }
                return { user: data?.user ? mapUserData(data.user) : null, requiresVerification: !!data?.user && !data?.session };
            } catch (e: any) {
                return { error: e.message };
            }
        },
        signOut: async () => { 
            await supabase.auth.signOut();
            localStorage.removeItem('kubwa_cart');
            localStorage.removeItem('kubwa-auth-storage');
        },
        resetPassword: async (email: string) => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            return { success: !error, error: error?.message };
        },
        updatePassword: async (password: string) => {
            const { error } = await supabase.auth.updateUser({ password });
            return { success: !error, error: error?.message };
        },
        resendVerification: async (email: string) => {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });
            return { success: !error, error: error?.message };
        }
    },
    orders: {
        placeOrder: async (orderData: Partial<MartOrder>) => {
            const { data, error } = await supabase.from('orders').insert([{ ...orderData, date: new Date().toISOString() }]).select();
            if (!error && data?.[0]) {
                // TRIGGER NOTIFICATION FOR VENDOR
                api.notifications.send({
                    title: "New Order Received! 🛍️",
                    body: `A new order (#${data[0].id.slice(0, 5)}) has been placed. Head to your dashboard to confirm.`
                });
            }
            return { success: !error, orderId: data?.[0]?.id };
        },
        updateStatus: async (orderId: string, status: OrderStatus) => {
            const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
            if (!error) {
                // TRIGGER NOTIFICATION FOR BUYER
                api.notifications.send({
                    title: "Order Update! 🚚",
                    body: `Your order #${orderId.slice(0, 5)} is now ${status.replace('_', ' ').toLowerCase()}.`
                });
            }
            return !error;
        },
        getMyOrders: async (userId: string): Promise<MartOrder[]> => {
            const { data } = await supabase.from('orders').select('*').eq('userId', userId);
            return (data as any) || [];
        }
    },
    users: {
        completeSetup: async (userId: string, data: any) => {
            await supabase.from('profiles').upsert({ id: userId, ...data, isSetupComplete: true });
            const { data: { user } } = await supabase.auth.updateUser({ data: { ...data, isSetupComplete: true } });
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
            return mapUserData(user, profile);
        },
        getFeaturedVendors: async () => {
            const { data } = await supabase.from('profiles').select('*').eq('tier', 'FEATURED');
            return (data as any) || [];
        },
        getAddresses: async (userId: string): Promise<Address[]> => {
            const { data } = await supabase.from('addresses').select('*').eq('userId', userId);
            return (data as any) || [];
        }
    },
    providers: {
        getMyProfile: async (userId: string): Promise<ServiceProvider | null> => {
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
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
            // SECURITY: Every vendor-initiated save resets status to PENDING
            // Note: 'approvedBy' and 'approvedAt' columns are not present in the database schema.
            const payload: any = {
                name: product.name?.trim(),
                price: Number(product.price),
                category: product.category,
                image: product.image?.trim(),
                description: product.description?.trim(),
                vendorId: product.vendorId,
                status: 'PENDING',
                submittedAt: new Date().toISOString(),
                rejectionNote: null,
                stock: product.stock ?? 10,
                variants: product.variants || []
            };

            let result;
            if (product.id) {
                result = await supabase.from('products').update(payload).eq('id', product.id).select();
            } else {
                result = await supabase.from('products').insert([payload]).select();
            }

            if (result.error) throw result.error;
            return { success: true, data: result.data?.[0] };
        } catch (e: any) {
            return { success: false, error: e.message || "Failed to save to database" };
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
    getMockContext: async () => {
        const [products, providers] = await Promise.all([api.getProducts(), api.getProviders()]);
        return { products, providers };
    },
    admin: {
        getAnnouncements: async (): Promise<Announcement[]> => {
            const { data } = await supabase.from('announcements').select('*').eq('isActive', true);
            return (data as any) || [];
        },
        getPlatformStats: async (): Promise<AnalyticsData> => {
            return { dau: 1250, revenue: 450000, retention: 85, conversion: 12, revenueSplit: [], userStats: { pending: 5 } };
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
        getAllTransactions: async (): Promise<Transaction[]> => {
            const { data } = await supabase.from('transactions').select('*');
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
        updateProductStatus: async (productId: string, status: ApprovalStatus, adminId?: string, note?: string) => {
            const updates: any = { 
                status,
                rejectionNote: note || null 
            };
            
            // Note: Admin columns 'approvedBy' and 'approvedAt' were removed from the payload
            // as they are missing from the current database schema.

            const { error } = await supabase.from('products').update(updates).eq('id', productId);
            return !error;
        },
        updateUser: async (userId: string, updates: any) => {
            const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
            return !error;
        },
        deleteUser: async (userId: string) => {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            return !error;
        }
    },
    reviews: {
        getByTarget: async (targetId: string): Promise<Review[]> => {
            const { data } = await supabase.from('reviews').select('*').eq('targetId', targetId);
            return (data as any) || [];
        }
    },
    deliveries: {
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
    }
};
