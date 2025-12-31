import { supabase } from './supabase';
import { User, UserRole, Product, ServiceProvider, ApprovalStatus, MonetisationTier, PaymentIntent, Transaction, Address, Review, DeliveryRequest, MartOrder, OrderStatus } from '../types';

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
 * MAPS SUPABASE AUTH METADATA TO APP USER TYPE
 */
const mapUserMetadata = (sessionUser: any): User => {
    if (!sessionUser) return null as any;
    const meta = sessionUser.user_metadata || {};
    const name = meta.full_name || meta.name || 'Kubwa Resident';
    const isPremiumTier = meta.tier === 'VERIFIED' || meta.tier === 'FEATURED' || meta.subscription?.tier === 'ELITE';
    const role = meta.role || 'USER';
    const calculatedLimit = meta.productLimit ?? (isPremiumTier ? 999 : (role === 'VENDOR' ? 4 : 999));

    return {
        id: sessionUser.id || '',
        email: sessionUser.email || '',
        name: name,
        role: role as UserRole,
        joinedAt: sessionUser.created_at,
        tier: (meta.tier || 'FREE') as MonetisationTier,
        isFeatured: !!meta.isFeatured || meta.tier === 'FEATURED',
        productLimit: Number(calculatedLimit),
        verificationStatus: meta.verificationStatus || 'NONE',
        paymentStatus: meta.paymentStatus || 'UNPAID',
        isSetupComplete: meta.isSetupComplete === true || meta.isSetupComplete === 'true',
        status: (meta.status || 'APPROVED') as ApprovalStatus,
        avatar: meta.avatar,
        bio: meta.bio,
        phoneNumber: meta.phoneNumber,
        storeName: meta.storeName,
        address: meta.address
    };
};

export const api = {
    auth: {
        getSession: async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                if (!session) return null;
                
                const { data: { user: sessionUser }, error: fetchError } = await supabase.auth.getUser();
                if (fetchError) return null;
                return mapUserMetadata(sessionUser);
            } catch (e: any) {
                console.warn("[Auth] Session failed:", e.message);
                return null;
            }
        },
        signUp: async (email, password, name, role) => {
            try {
                const initialStatus = (role === 'VENDOR' || role === 'PROVIDER' || role === 'RIDER') ? 'PENDING' : 'APPROVED';
                
                // Use current location without complex logic
                const redirectUrl = window.location.origin;

                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password, 
                    options: { 
                        emailRedirectTo: redirectUrl,
                        data: { 
                            name: name, 
                            full_name: name,
                            role: role, 
                            isSetupComplete: false, 
                            status: initialStatus, 
                            tier: 'FREE', 
                            productLimit: role === 'VENDOR' ? 4 : 999, 
                            paymentStatus: 'UNPAID',
                            verificationStatus: 'NONE'
                        } 
                    } 
                });

                if (error) {
                    return { error: error.message };
                }

                return { 
                    user: data?.user ? mapUserMetadata(data.user) : null, 
                    requiresVerification: !!data?.user && !data?.session 
                };
            } catch (e: any) {
                console.error("[Auth] Fatal Exception:", e);
                // Specifically detect the 'Failed to fetch' TypeError
                if (e instanceof TypeError || e.message?.toLowerCase().includes('fetch')) {
                    return { error: "Network Error: The request was blocked by your browser or network. Please check for Adblockers (uBlock, Brave Shields) or restrictive VPNs." };
                }
                return { error: e.message || "An unexpected authentication error occurred." };
            }
        },
        signIn: async (email, password) => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) return { error: error.message };
                if (!data?.user) return { error: "Login failed." };
                return { user: mapUserMetadata(data.user) };
            } catch (e: any) {
                if (e instanceof TypeError || e.message?.toLowerCase().includes('fetch')) {
                    return { error: "Network Error: Could not reach the authentication server." };
                }
                return { error: `Sign-in failed: ${e.message}` };
            }
        },
        signOut: async () => { 
            try {
                await supabase.auth.signOut();
            } finally {
                localStorage.removeItem('kubwa_cart');
                localStorage.removeItem('kubwa-auth-storage');
            }
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
            const { error } = await supabase.auth.resend({ type: 'signup', email });
            return { success: !error, error: error?.message };
        }
    },
    orders: {
        placeOrder: async (orderData: Partial<MartOrder>) => {
            const { data, error } = await supabase.from('orders').insert([orderData]).select();
            return { success: !error, orderId: data?.[0]?.id };
        },
        getMyOrders: async (userId: string): Promise<MartOrder[]> => {
            const { data } = await supabase.from('orders').select('*').eq('userId', userId);
            return (data as any) || [];
        }
    },
    users: {
        completeSetup: async (userId: string, data: any) => {
            try {
                const { data: { user }, error } = await supabase.auth.updateUser({ 
                    data: { ...data, isSetupComplete: true } 
                });
                if (error) return null;

                const { error: profileError } = await supabase.from('profiles').update({ 
                    ...data, 
                    isSetupComplete: true 
                }).eq('id', userId);

                if (profileError) console.warn("Profile sync error:", profileError.message);

                return mapUserMetadata(user);
            } catch (err) { 
                return null; 
            }
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
                name: data.name || data.fullName,
                category: (data as any).category || 'Service',
                rate: (data as any).rate || 0,
                rating: (data as any).rating || 0,
                reviews: (data as any).reviews || 0,
                image: data.avatar || '',
                available: (data as any).available ?? true,
                isVerified: data.verificationStatus === 'VERIFIED'
            };
        },
        updateStatus: async (providerId: string, available: boolean): Promise<boolean> => {
            const { error } = await supabase.from('profiles').update({ available }).eq('id', providerId);
            return !error;
        },
    },
    getProducts: async (): Promise<Product[]> => {
        const { data } = await supabase.from('products').select('*').eq('status', 'APPROVED');
        return (data as Product[]) || [];
    },
    getProviders: async (): Promise<ServiceProvider[]> => {
        const { data } = await supabase.from('profiles').select('*').in('role', ['PROVIDER', 'VENDOR']).eq('status', 'APPROVED');
        return (data?.map(d => ({
            id: d.id,
            userId: d.id,
            name: d.fullName || d.name,
            category: (d as any).category || 'General',
            rate: (d as any).rate || 0,
            rating: (d as any).rating || 0,
            reviews: (d as any).reviews || 0,
            image: d.avatar || '',
            available: (d as any).available ?? true,
            isVerified: d.verificationStatus === 'VERIFIED',
            location: d.address
        })) as any) || [];
    },
    getMockContext: async () => {
        const products = await api.getProducts();
        const providers = await api.getProviders();
        return { products, providers };
    },
    getDeliveries: async (userId?: string): Promise<DeliveryRequest[]> => {
        let query = supabase.from('deliveries').select('*');
        if (userId) query = query.or(`userId.eq.${userId},riderId.eq.${userId}`);
        const { data } = await query;
        return (data as any) || [];
    },
    requestDelivery: async (data: any): Promise<boolean> => {
        const { error } = await supabase.from('deliveries').insert([{
            userId: data.userId,
            pickup: data.pickup,
            dropoff: data.dropoff,
            itemType: data.itemType,
            phoneNumber: data.phoneNumber,
            status: 'PENDING',
            price: 1000
        }]);
        return !error;
    },
    deliveries: {
        getAvailableJobs: async (): Promise<DeliveryRequest[]> => {
            const { data } = await supabase.from('deliveries').select('*').eq('status', 'PENDING');
            return (data as any) || [];
        },
        acceptDelivery: async (jobId: string, riderId: string): Promise<boolean> => {
            const { error } = await supabase.from('deliveries').update({ riderId: riderId, status: 'ACCEPTED' }).eq('id', jobId);
            return !error;
        },
        updateStatus: async (jobId: string, status: string): Promise<boolean> => {
            const { error } = await supabase.from('deliveries').update({ status }).eq('id', jobId);
            return !error;
        }
    },
    payments: { 
        fulfillIntent: async (userId, intent, ref) => {
            const tier = intent.includes('FEATURED') ? 'FEATURED' : 'VERIFIED';
            const { error } = await supabase.from('profiles').update({ 
                tier, 
                paymentStatus: 'PAID',
                verificationStatus: 'VERIFIED',
                productLimit: 999 
            }).eq('id', userId);
            return !error;
        } 
    },
    admin: { 
        getAnnouncements: async () => {
            const { data } = await supabase.from('announcements').select('*').eq('isActive', true);
            return (data as any) || [];
        },
        getPendingEntities: async () => {
            const { data } = await supabase.from('profiles').select('*').eq('status', 'PENDING');
            return (data as any) || [];
        },
        getPendingProducts: async () => {
            const { data } = await supabase.from('products').select('*').eq('status', 'PENDING');
            return (data as any) || [];
        },
        updateUserStatus: async (userId: string, status: ApprovalStatus) => {
            const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
            return !error;
        },
        updateProductStatus: async (productId: string, status: ApprovalStatus) => {
            const { error } = await supabase.from('products').update({ status }).eq('id', productId);
            return !error;
        },
        toggleFeatureUser: async (userId: string, isFeatured: boolean) => {
            const { error } = await supabase.from('profiles').update({ tier: isFeatured ? 'FEATURED' : 'VERIFIED' }).eq('id', userId);
            return !error;
        }
    },
    reviews: { 
        getByTarget: async (id) => {
            const { data } = await supabase.from('reviews').select('*').eq('targetId', id);
            return (data as any) || [];
        } 
    }
};
