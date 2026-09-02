

import { supabase } from './supabase';
import { User, UserRole, Product, ServiceProvider, ApprovalStatus, MonetisationTier, PaymentIntent, Transaction, Address, Review, DeliveryRequest, MartOrder, OrderStatus, AnalyticsData, DeliveryStatus, ServiceOrder, ServiceOrderStatus } from '../types';

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
 * Strict Enforcement: Free vendors are capped at 4 products.
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
    
    // STRICT LIMIT: 4 for Free Vendors, 999 for Premium/Other
    const defaultLimit = role === 'VENDOR' ? (isPremiumTier ? 999 : 4) : 999;
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
                // SECURITY: Self-service signup must only ever create standard community
                // accounts. ADMIN / SUPER_ADMIN (and anything else unrecognized) can never
                // be granted through the public signup form. Admin accounts must be created
                // out-of-band (e.g. directly in Supabase, or promoted by an existing admin).
                const PUBLIC_SIGNUP_ROLES: UserRole[] = ['USER', 'VENDOR', 'PROVIDER', 'RIDER'];
                if (!PUBLIC_SIGNUP_ROLES.includes(role)) {
                    return { error: "This account type can't be self-registered. Please contact support." };
                }

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
                            productLimit: role === 'VENDOR' ? 4 : 999, 
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
        },
        requestRoleUpgrade: async (newRole: 'VENDOR' | 'PROVIDER' | 'RIDER'): Promise<{ success: boolean; error?: string }> => {
            const { error } = await supabase.rpc('request_role_upgrade', { new_role: newRole });
            return { success: !error, error: error?.message };
        },
        updateProfile: async (userId: string, data: { name?: string; phoneNumber?: string; address?: string }): Promise<{ success: boolean; error?: string }> => {
            try {
                const metaData: any = { ...data };
                if (data.name) metaData.full_name = data.name;

                const { error: authError } = await supabase.auth.updateUser({ data: metaData });
                if (authError) throw authError;

                const { error: profileError } = await supabase.from('profiles').update(data).eq('id', userId);
                if (profileError) throw profileError;

                return { success: true };
            } catch (e: any) {
                return { success: false, error: e.message || "Failed to update profile." };
            }
        },
        updateEmail: async (newEmail: string): Promise<{ success: boolean; error?: string }> => {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            return { success: !error, error: error?.message };
        }
    },
    orders: {
        placeOrder: async (orderData: Partial<MartOrder>) => {
            const { data, error } = await supabase.rpc('place_order_with_stock', {
                p_vendor_id: orderData.vendorId,
                p_items: orderData.items,
                p_total: orderData.total,
                p_delivery_option: orderData.deliveryOption,
                p_delivery_address: orderData.deliveryAddress || null,
                p_contact_phone: orderData.contactPhone
            });
            return { success: !error, orderId: data as string | undefined, error: error?.message };
        },
        getMyOrders: async (userId: string): Promise<MartOrder[]> => {
            const { data } = await supabase.from('orders').select('*').eq('userId', userId);
            return (data as any) || [];
        },
        getVendorOrders: async (vendorId: string): Promise<MartOrder[]> => {
            const { data } = await supabase.from('orders').select('*').eq('vendorId', vendorId).order('created_at', { ascending: false });
            return (data as any) || [];
        },
        updateStatus: async (orderId: string, status: string) => {
             const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
             return !error;
        },
        dispatchToRider: async (orderId: string, riderId: string): Promise<{ success: boolean; error?: string }> => {
            const { error } = await supabase.rpc('dispatch_order_to_rider', { order_id: orderId, rider_id: riderId });
            return { success: !error, error: error?.message };
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
            const { data } = await supabase.from('providers').select('*').eq('userId', userId).maybeSingle();
            return (data as any) || null;
        },
        updateStatus: async (providerId: string, available: boolean): Promise<boolean> => {
            const { error } = await supabase.from('providers').update({ available }).eq('id', providerId);
            return !error;
        },
        upsert: async (userId: string, data: { name: string; category: string; rate: number; bio?: string; image?: string; location?: string }): Promise<{ success: boolean }> => {
            const { error } = await supabase.from('providers').upsert({ userId, ...data }, { onConflict: 'userId' });
            return { success: !error };
        },
    },
    riders: {
        getAvailable: async (): Promise<{ id: string; name: string; phoneNumber?: string }[]> => {
            const { data } = await supabase.from('profiles').select('id, name, "phoneNumber"').eq('role', 'RIDER').eq('status', 'APPROVED').eq('available', true);
            return (data as any) || [];
        },
        getAllApproved: async (): Promise<{ id: string; name: string; phoneNumber?: string; available: boolean }[]> => {
            const { data } = await supabase.from('profiles').select('id, name, "phoneNumber", available').eq('role', 'RIDER').eq('status', 'APPROVED');
            return (data as any) || [];
        },
        getMyAvailability: async (userId: string): Promise<boolean> => {
            const { data } = await supabase.from('profiles').select('available').eq('id', userId).maybeSingle();
            return !!data?.available;
        },
        setAvailability: async (userId: string, available: boolean): Promise<boolean> => {
            const { error } = await supabase.from('profiles').update({ available }).eq('id', userId);
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
    storage: {
        uploadProductImage: async (vendorId: string, file: File): Promise<string | null> => {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `${vendorId}/${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage.from('product-images').upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (error) {
                console.warn('[storage] product image upload failed:', error.message);
                return null;
            }
            const { data } = supabase.storage.from('product-images').getPublicUrl(path);
            return data.publicUrl;
        },
        deleteProductImage: async (url: string): Promise<void> => {
            // Only ever attempt to clean up files actually in our bucket -- an
            // old base64 data: URL from before this migration isn't a storage
            // path and would just fail harmlessly, but skip it outright.
            const marker = '/product-images/';
            const idx = url.indexOf(marker);
            if (idx === -1) return;
            const path = url.slice(idx + marker.length).split('?')[0];
            await supabase.storage.from('product-images').remove([path]);
        }
    },
    getProducts: async (): Promise<Product[]> => {
        const { data } = await supabase.from('products').select('*');
        const dbProducts = (data as Product[]) || [];
        return [...dbProducts, ...MOCK_PRODUCTS];
    },
    getVendorPickupInfo: async (vendorId: string): Promise<{ storeName?: string; address?: string; location?: string } | null> => {
        const { data } = await supabase.from('profiles').select('storeName, address, location').eq('id', vendorId).maybeSingle();
        return data || null;
    },
    getProviders: async (): Promise<ServiceProvider[]> => {
        const { data } = await supabase.from('providers').select('*');
        return (data as any) || [];
    },
    getMockContext: async () => {
        const products = await api.getProducts();
        const providers = await api.getProviders();
        return { products, providers };
    },
    getDeliveries: async (userId?: string): Promise<DeliveryRequest[]> => {
        let query = supabase.from('deliveries').select('*, rider:profiles!deliveries_riderid_fkey(name, phoneNumber)');
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
        getAllAnnouncements: async () => {
            const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
            return (data as any) || [];
        },
        createAnnouncement: async (announcement: { title: string; message: string; type: 'INFO' | 'ALERT' | 'PROMO' }) => {
            const { data, error } = await supabase.from('announcements').insert([announcement]).select();
            return { success: !error, data: data?.[0] };
        },
        toggleAnnouncementActive: async (id: string, isActive: boolean) => {
            const { error } = await supabase.from('announcements').update({ isActive }).eq('id', id);
            return !error;
        },
        deleteAnnouncement: async (id: string) => {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            return !error;
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
        },
        getMyReviews: async (userId: string): Promise<Review[]> => {
            const { data } = await supabase.from('reviews').select('*').eq('userId', userId);
            return (data as any) || [];
        },
        create: async (review: { userId: string; targetId: string; rating: number; comment: string }) => {
            const { data, error } = await supabase.from('reviews').insert([review]).select();
            return { success: !error, data: data?.[0] };
        }
    },
    serviceOrders: {
        create: async (order: { userId: string; serviceId: string; amount: number }) => {
            const { data, error } = await supabase.from('service_orders').insert([order]).select();
            return { success: !error, orderId: data?.[0]?.id };
        },
        getMyBookings: async (userId: string): Promise<ServiceOrder[]> => {
            const { data } = await supabase.from('service_orders').select('*, providers(userId, name, image, category)').eq('userId', userId).order('created_at', { ascending: false });
            return (data as any) || [];
        },
        getForProvider: async (serviceId: string): Promise<ServiceOrder[]> => {
            const { data } = await supabase.from('service_orders').select('*').eq('serviceId', serviceId).order('created_at', { ascending: false });
            return (data as any) || [];
        },
        updateStatus: async (orderId: string, status: ServiceOrderStatus): Promise<boolean> => {
            const { error } = await supabase.from('service_orders').update({ status }).eq('id', orderId);
            return !error;
        }
    }
};