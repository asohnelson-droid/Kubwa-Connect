
import { supabase } from './supabase';
import { User, UserRole, Product, ServiceProvider, ApprovalStatus, MonetisationTier, PaymentIntent, Transaction, Address, Review, DeliveryRequest, MartOrder, OrderStatus, AnalyticsData, DeliveryStatus } from '../types';

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
 * 
 * Strict Enforcement: Free vendors are capped at 6 products.
 */
const mapUserMetadata = (sessionUser: any): User => {
    if (!sessionUser) return null as any;
    const meta = sessionUser.user_metadata || {};
    const name = meta.full_name || meta.name || 'Kubwa Resident';
    
    // Determine Role
    const role = (meta.role || 'USER') as UserRole;
    
    // Determine Tier & Limits
    const tier = (meta.tier || 'FREE') as MonetisationTier;
    const isPremiumTier = tier === 'VERIFIED' || tier === 'FEATURED' || meta.subscription?.tier === 'ELITE';
    
    // STRICT LIMIT: 6 for Free Vendors, 999 for Premium/Other
    const defaultLimit = role === 'VENDOR' ? (isPremiumTier ? 999 : 6) : 999;
    const calculatedLimit = meta.productLimit ?? defaultLimit;

    return {
        id: sessionUser.id || '',
        email: sessionUser.email || '',
        name: name,
        role: role,
        joinedAt: sessionUser.created_at,
        tier: tier,
        isFeatured: !!meta.isFeatured || tier === 'FEATURED',
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

const MOCK_PRODUCTS: Product[] = [
    // Food & Groceries
    { id: 'demo_f1', vendorId: 'demo_v1', name: 'Jollof Rice Combo', price: 2500, category: 'Food', image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=500', stock: 50, rating: 4.8, status: 'APPROVED', isPromoted: true, description: 'Spicy jollof rice with grilled chicken and plantain.' },
    { id: 'demo_f2', vendorId: 'demo_v1', name: 'Fresh Yam Tuber (Large)', price: 1200, category: 'Food', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=500', stock: 20, rating: 4.5, status: 'APPROVED', description: 'Farm fresh yam tubers from Benue.' },
    { id: 'demo_f3', vendorId: 'demo_v1', name: 'Crate of Eggs', price: 3500, category: 'Food', image: 'https://images.unsplash.com/photo-1587486913049-53fc88980fa1?auto=format&fit=crop&q=80&w=500', stock: 10, rating: 4.7, status: 'APPROVED', description: 'Large crate of fresh eggs.' },
    
    // Fashion & Style
    { id: 'demo_c1', vendorId: 'demo_v2', name: 'Ankara Shift Dress', price: 8000, category: 'Fashion', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=500', stock: 15, rating: 4.9, status: 'APPROVED', isPromoted: true, description: 'Stylish Ankara dress for casual outings.' },
    { id: 'demo_c2', vendorId: 'demo_v2', name: 'Men\'s Leather Sandals', price: 5000, category: 'Fashion', image: 'https://images.unsplash.com/photo-1621251676678-70135c345b5c?auto=format&fit=crop&q=80&w=500', stock: 30, rating: 4.2, status: 'APPROVED', description: 'Handmade leather sandals, durable and comfortable.' },
    { id: 'demo_c3', vendorId: 'demo_v2', name: 'Kubwa Connect Hoodie', price: 6500, category: 'Fashion', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=500', stock: 100, rating: 5.0, status: 'APPROVED', description: 'Official community hoodie. High quality cotton.' },

    // Tech & Gadgets
    { id: 'demo_e1', vendorId: 'demo_v3', name: 'Wireless Earbuds', price: 4500, category: 'Electronics', image: 'https://images.unsplash.com/photo-1572569028738-411a29635331?auto=format&fit=crop&q=80&w=500', stock: 25, rating: 4.4, status: 'APPROVED', description: 'Deep bass, noise cancelling wireless earbuds.' },
    { id: 'demo_e2', vendorId: 'demo_v3', name: 'Power Bank 20000mAh', price: 9000, category: 'Electronics', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&q=80&w=500', stock: 40, rating: 4.6, status: 'APPROVED', isPromoted: true, description: 'Fast charging power bank for all devices.' },
    { id: 'demo_e3', vendorId: 'demo_v3', name: 'USB-C Fast Charger', price: 3000, category: 'Electronics', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=500', stock: 60, rating: 4.3, status: 'APPROVED', description: 'Durable fast charger cable.' },

    // Home & Living
    { id: 'demo_h1', vendorId: 'demo_v4', name: 'Non-Stick Frying Pan', price: 4000, category: 'Home', image: 'https://images.unsplash.com/photo-1584949514123-474cfa705dfe?auto=format&fit=crop&q=80&w=500', stock: 12, rating: 4.5, status: 'APPROVED', description: 'Cooking made easy with this non-stick pan.' },
    { id: 'demo_h2', vendorId: 'demo_v4', name: 'Cotton Bed Sheet Set', price: 7500, category: 'Home', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&q=80&w=500', stock: 8, rating: 4.1, status: 'APPROVED', description: 'Soft cotton bedsheets with pillow cases.' },
    { id: 'demo_h3', vendorId: 'demo_v4', name: 'Rechargeable Table Fan', price: 12000, category: 'Home', image: 'https://images.unsplash.com/photo-1618941716939-553df9c69028?auto=format&fit=crop&q=80&w=500', stock: 5, rating: 4.8, status: 'APPROVED', description: 'Stay cool during power outages.' }
];

export const api = {
    auth: {
        getSession: async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                if (!session) return null;
                
                const { data: { user: sessionUser }, error: fetchError } = await supabase.auth.getUser();
                if (fetchError) return null;
                
                const appUser = mapUserMetadata(sessionUser);

                // HYBRID SYNC: Recover avatar from 'profiles' if missing in Auth Metadata (due to size limits)
                if (!appUser.avatar) {
                   const { data: profile } = await supabase.from('profiles').select('avatar').eq('id', appUser.id).maybeSingle();
                   if (profile?.avatar) {
                       appUser.avatar = profile.avatar;
                   }
                }

                return appUser;
            } catch (e: any) {
                console.warn("[Auth] Session failed:", e.message);
                return null;
            }
        },
        signUp: async (email, password, name, role) => {
            try {
                const initialStatus = (role === 'VENDOR' || role === 'PROVIDER' || role === 'RIDER') ? 'PENDING' : 'APPROVED';
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
                            productLimit: role === 'VENDOR' ? 6 : 999, 
                            paymentStatus: 'UNPAID',
                            verificationStatus: 'NONE'
                        } 
                    } 
                });

                if (error) return { error: error.message };

                return { 
                    user: data?.user ? mapUserMetadata(data.user) : null, 
                    requiresVerification: !!data?.user && !data?.session 
                };
            } catch (e: any) {
                if (e instanceof TypeError || e.message?.toLowerCase().includes('fetch')) {
                    return { error: "Network Error: Server unreachable." };
                }
                return { error: e.message || "Signup failed." };
            }
        },
        signIn: async (email, password) => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) return { error: error.message };
                if (!data?.user) return { error: "Login failed." };
                return { user: mapUserMetadata(data.user) };
            } catch (e: any) {
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
        },
        getVendorOrders: async (vendorId: string): Promise<MartOrder[]> => {
            const { data } = await supabase.from('orders').select('*').eq('vendorId', vendorId).order('date', { ascending: false });
            return (data as any) || [];
        },
        updateStatus: async (orderId: string, status: string) => {
             const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
             return !error;
        }
    },
    users: {
        completeSetup: async (userId: string, data: any) => {
            try {
                // FIX: Separate avatar (large) from metadata (small) to prevent 413 Header Overflow
                // Auth Metadata cannot store large base64 strings
                const { avatar, ...metaData } = data;

                // 1. Sync Auth Metadata (Exclude Avatar)
                const { data: { user }, error } = await supabase.auth.updateUser({ 
                    data: { ...metaData, isSetupComplete: true } 
                });
                
                if (error) throw error;

                // 2. Sync profile table (Include Avatar)
                // We add robust error handling here for "Failed to fetch" which usually means payload too large
                try {
                    const { error: profileError } = await supabase.from('profiles').upsert({ 
                        id: userId,
                        ...data, 
                        isSetupComplete: true 
                    });

                    if (profileError) throw profileError;
                } catch (profileErr: any) {
                    // RETRY STRATEGY: If the full payload failed (likely due to avatar size), try without avatar
                    if (profileErr instanceof TypeError || profileErr.message?.includes("Failed to fetch")) {
                        console.warn("[Setup] Profile upsert failed, retrying without avatar.");
                        const { error: retryError } = await supabase.from('profiles').upsert({ 
                            id: userId,
                            ...metaData, // Send only metadata, no avatar
                            isSetupComplete: true 
                        });
                        
                        if (retryError) throw retryError;
                        
                        // Return user with metadata but without avatar (since it failed)
                        const appUser = mapUserMetadata(user);
                        return { ...appUser };
                    }
                    throw profileErr;
                }

                // 3. Return user with avatar injected (since it was stripped from auth user but saved in profile)
                const appUser = mapUserMetadata(user);
                return { ...appUser, avatar: data.avatar };
            } catch (err) { 
                console.error("[Setup] Finalization Error:", err);
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
    products: {
        getByVendor: async (vendorId: string): Promise<Product[]> => {
            const { data } = await supabase.from('products').select('*').eq('vendorId', vendorId);
            return (data as Product[]) || [];
        },
        upsert: async (product: Partial<Product>) => {
            const { data, error } = await supabase.from('products').upsert(product).select();
            return { success: !error, data };
        },
        delete: async (productId: string) => {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            return !error;
        }
    },
    getProducts: async (): Promise<Product[]> => {
        const { data } = await supabase.from('products').select('*');
        const dbProducts = (data as Product[]) || [];
        return [...dbProducts, ...MOCK_PRODUCTS];
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
        updateStatus: async (jobId: string, status: DeliveryStatus): Promise<boolean> => {
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
            // Also sync auth meta for immediate UI update
            await supabase.auth.updateUser({ data: { tier, productLimit: 999 } });
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
        },
        getPlatformStats: async (): Promise<AnalyticsData> => {
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: pendingCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
            const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
            
            return {
                dau: userCount || 0,
                revenue: 245000,
                retention: 78,
                conversion: 12,
                revenueSplit: [
                    { name: 'Mart Fees', value: 120000 },
                    { name: 'FixIt Leads', value: 85000 },
                    { name: 'Subscriptions', value: 40000 }
                ],
                userStats: {
                    pending: pendingCount || 0,
                    total: userCount || 0,
                    products: productCount || 0
                }
            };
        },
        getAllUsers: async (): Promise<User[]> => {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
            return (data?.map(d => mapUserMetadata({ id: d.id, email: d.email, user_metadata: d, created_at: d.created_at })) as any) || [];
        },
        getAllTransactions: async (): Promise<Transaction[]> => {
            const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
            return (data as any) || [];
        }
    },
    reviews: { 
        getByTarget: async (id) => {
            const { data } = await supabase.from('reviews').select('*').eq('targetId', id);
            return (data as any) || [];
        } 
    }
};
