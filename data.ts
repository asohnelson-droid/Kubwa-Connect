

import { supabase } from './supabase';
import { compressImage } from './imageUtils';
import { User, UserRole, Product, ServiceProvider, ApprovalStatus, MonetisationTier, PaymentIntent, Transaction, Address, Review, DeliveryRequest, MartOrder, OrderStatus, AnalyticsData, DeliveryStatus, ServiceOrder, ServiceOrderStatus, NgState, Lga, City, CityReadiness, BrowseLocation } from '../types';

/**
 * Neighbourhood suggestions shown under the free-text "Area" field, keyed by
 * LGA name. Only a hint list: people anywhere can type their own area.
 */
export const AREA_SUGGESTIONS: Record<string, string[]> = {
    'Bwari': ['Kubwa Phase 1', 'Kubwa Phase 2', 'Kubwa Phase 3', 'Kubwa Phase 4', 'Dawaki', 'Dutse', 'Arab Road', 'Byazhin', 'FCDA Quarters', 'Chikakore', 'Kubwa Village', 'Deidei', 'Galadinma', 'FOI', 'Federal Housing', 'Phase 2 Site 1', 'Phase 2 Site 2', 'Kagini', 'Karsana', 'Bwari Town', 'Ushafa'],
    'Abuja Municipal (AMAC)': ['Gwarinpa', 'Wuse', 'Wuse 2', 'Maitama', 'Asokoro', 'Garki', 'Jabi', 'Utako', 'Life Camp', 'Lugbe', 'Kado', 'Karu', 'Nyanya', 'Apo', 'Lokogoma', 'Galadimawa', 'Katampe', 'Jahi', 'Mabushi', 'Durumi'],
};

/** How many listings are fetched per page in Mart and FixIt. */
export const PAGE_SIZE = 40;
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
    const name = meta.full_name || meta.name || 'Member';
    
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

/**
 * profiles is the real, authoritative source for these fields -- they're
 * deliberately locked so only trusted server-side actions (admin approval,
 * payment verification, expiry reversion) can change them, and none of
 * those keep auth metadata in sync. Without this overlay, a user's own
 * session would keep showing stale metadata-era values for their tier,
 * limit, verification, and approval status until they fully logged out
 * and back in.
 */
const overlayProfileData = async (appUser: User): Promise<User> => {
    const { data: profile } = await supabase
        .from('profiles')
        .select('avatar, "productLimit", tier, "verificationStatus", "paymentStatus", status, "isFeatured", "stateId", "lgaId", "cityId", area, address, "phoneNumber", "storeName"')
        .eq('id', appUser.id)
        .maybeSingle();

    if (profile) {
        if (profile.avatar) appUser.avatar = profile.avatar;
        if (profile.productLimit !== null && profile.productLimit !== undefined) appUser.productLimit = profile.productLimit;
        if (profile.tier) appUser.tier = profile.tier as MonetisationTier;
        if (profile.verificationStatus) appUser.verificationStatus = profile.verificationStatus;
        if (profile.paymentStatus) appUser.paymentStatus = profile.paymentStatus;
        if (profile.status) appUser.status = profile.status as ApprovalStatus;
        appUser.isFeatured = !!profile.isFeatured || appUser.tier === 'FEATURED';
        appUser.stateId = profile.stateId ?? undefined;
        appUser.lgaId = profile.lgaId ?? undefined;
        appUser.cityId = profile.cityId ?? undefined;
        appUser.area = profile.area ?? undefined;
        if (profile.address) appUser.address = profile.address;
        if (profile.phoneNumber) appUser.phoneNumber = profile.phoneNumber;
        if (profile.storeName) appUser.storeName = profile.storeName;
    }

    return appUser;
};

const locationCache: { states: NgState[] | null; cities: City[] | null; lgas: Map<number, Lga[]> } = {
    states: null,
    cities: null,
    lgas: new Map(),
};

const MOCK_PRODUCTS: Product[] = [
    // Food & Groceries
    { id: 'demo_f1', vendorId: 'demo_v1', name: 'Jollof Rice Combo', price: 2500, category: 'Food', image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=500', stock: 50, rating: 4.8, status: 'APPROVED', isPromoted: true, description: 'Spicy jollof rice with grilled chicken and plantain.' },
    { id: 'demo_f2', vendorId: 'demo_v1', name: 'Fresh Yam Tuber (Large)', price: 1200, category: 'Food', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=500', stock: 20, rating: 4.5, status: 'APPROVED', description: 'Farm fresh yam tubers from Benue.' },
    { id: 'demo_f3', vendorId: 'demo_v1', name: 'Crate of Eggs', price: 3500, category: 'Food', image: 'https://images.unsplash.com/photo-1587486913049-53fc88980fa1?auto=format&fit=crop&q=80&w=500', stock: 10, rating: 4.7, status: 'APPROVED', description: 'Large crate of fresh eggs.' },
    
    // Fashion & Style
    { id: 'demo_c1', vendorId: 'demo_v2', name: 'Ankara Shift Dress', price: 8000, category: 'Fashion', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=500', stock: 15, rating: 4.9, status: 'APPROVED', isPromoted: true, description: 'Stylish Ankara dress for casual outings.' },
    { id: 'demo_c2', vendorId: 'demo_v2', name: 'Men\'s Leather Sandals', price: 5000, category: 'Fashion', image: 'https://images.unsplash.com/photo-1621251676678-70135c345b5c?auto=format&fit=crop&q=80&w=500', stock: 30, rating: 4.2, status: 'APPROVED', description: 'Handmade leather sandals, durable and comfortable.' },
    { id: 'demo_c3', vendorId: 'demo_v2', name: 'Classic Pullover Hoodie', price: 6500, category: 'Fashion', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=500', stock: 100, rating: 5.0, status: 'APPROVED', description: 'Heavyweight cotton hoodie, unisex fit.' },

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
                return await overlayProfileData(appUser);
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
                return { user: await overlayProfileData(mapUserMetadata(data.user)) };
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
        updateProfile: async (userId: string, data: { name?: string; phoneNumber?: string; address?: string; avatar?: string; lgaId?: number; area?: string }): Promise<{ success: boolean; error?: string }> => {
            try {
                // Location lives only in profiles: the database derives state and city from the LGA.
                const { avatar, lgaId, area, ...syncableData } = data;
                const metaData: any = { ...syncableData };
                if (syncableData.name) metaData.full_name = syncableData.name;

                const { error: authError } = await supabase.auth.updateUser({ data: metaData });
                if (authError) throw authError;

                const profileUpdate: any = { ...syncableData };
                if (avatar !== undefined) profileUpdate.avatar = avatar;
                if (lgaId !== undefined) profileUpdate.lgaId = lgaId;
                if (area !== undefined) profileUpdate.area = area;

                const { error: profileError } = await supabase.from('profiles').update(profileUpdate).eq('id', userId);
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
                p_contact_phone: orderData.contactPhone,
                p_dropoff_lga_id: orderData.dropoffLgaId ?? null
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
                const { avatar, lgaId, area, ...metaData } = data;

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
                            lgaId,
                            area,
                            isSetupComplete: true 
                        });
                        
                        if (retryError) throw retryError;
                        
                        // Return user with metadata but without avatar (since it failed)
                        return await overlayProfileData(mapUserMetadata(user));
                    }
                    throw profileErr;
                }

                // 3. Return user with avatar injected (since it was stripped from auth user but saved in profile)
                return await overlayProfileData({ ...mapUserMetadata(user), avatar: data.avatar });
            } catch (err) { 
                console.error("[Setup] Finalization Error:", err);
                return null; 
            }
        },
        // Profiles are private (own row only); this server function returns just the public shop identity.
        getFeaturedVendors: async (cityId?: number) => {
            const { data } = await supabase.rpc('get_featured_vendors', { p_city_id: cityId ?? null });
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
        // Riders are matched by city: a vendor only ever sees riders who work in their city.
        // The database enforces the same rule when a rider is assigned.
        // The server uses the signed-in vendor's own city, so the cityId argument is only a guard.
        getAvailable: async (cityId?: number): Promise<{ id: string; name: string; phoneNumber?: string }[]> => {
            if (!cityId) return [];
            const { data } = await supabase.rpc('get_city_riders', { p_only_available: true });
            return (data as any) || [];
        },
        getAllApproved: async (cityId?: number): Promise<{ id: string; name: string; phoneNumber?: string; available: boolean }[]> => {
            if (!cityId) return [];
            const { data } = await supabase.rpc('get_city_riders', { p_only_available: false });
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
            const compressed = await compressImage(file);
            const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `${vendorId}/${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage.from('product-images').upload(path, compressed, {
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
        },
        uploadAvatar: async (userId: string, file: File): Promise<string | null> => {
            const compressed = await compressImage(file, 800, 0.85); // avatars display small -- no need for the larger dimension used for product photos
            const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `${userId}/${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage.from('avatars').upload(path, compressed, {
                cacheControl: '3600',
                upsert: false
            });
            if (error) {
                console.warn('[storage] avatar upload failed:', error.message);
                return null;
            }
            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            return data.publicUrl;
        },
        deleteAvatar: async (url: string): Promise<void> => {
            // Best-effort cleanup of the previous photo once a new one is
            // successfully saved -- each upload gets a unique filename, so
            // without this, replaced avatars would just accumulate forever.
            const marker = '/avatars/';
            const idx = url.indexOf(marker);
            if (idx === -1) return;
            const path = url.slice(idx + marker.length).split('?')[0];
            await supabase.storage.from('avatars').remove([path]);
        }
    },
    /**
     * Approved listings from live cities, narrowed to the buyer's chosen area.
     * Paged on the server so the app never downloads the whole catalogue.
     * Sample listings are only added while an area has almost nothing real to show.
     */
    getProducts: async (browse?: BrowseLocation, page = 0): Promise<{ items: Product[]; hasMore: boolean }> => {
        let q = supabase
            .from('products')
            .select('*, city:cities!inner(name, "isLive")')
            .eq('status', 'APPROVED')
            .eq('city.isLive', true);
        if (browse?.scope === 'CITY' && browse.cityId) q = q.eq('cityId', browse.cityId);
        if (browse?.scope === 'STATE' && browse.stateId) q = q.eq('stateId', browse.stateId);
        const from = page * PAGE_SIZE;
        const { data, error } = await q
            .order('isPromoted', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .range(from, from + PAGE_SIZE - 1);
        if (error) throw new Error(error.message);
        const items: Product[] = (data || []).map((p: any) => {
            const { city, ...rest } = p;
            return { ...rest, cityName: city?.name } as Product;
        });
        const hasMore = items.length === PAGE_SIZE;
        if (page === 0 && items.length < 8) return { items: [...items, ...MOCK_PRODUCTS], hasMore };
        return { items, hasMore };
    },
    getVendorPickupInfo: async (vendorId: string): Promise<{ storeName?: string; address?: string; location?: string; area?: string; lgaId?: number; stateId?: number; cityId?: number } | null> => {
        const { data } = await supabase.rpc('get_vendor_public_info', { p_vendor_id: vendorId });
        const row = Array.isArray(data) ? data[0] : data;
        return (row as any) || null;
    },
    getProviders: async (browse?: BrowseLocation, page = 0): Promise<{ items: ServiceProvider[]; hasMore: boolean }> => {
        let q = supabase
            .from('providers')
            .select('*, city:cities!inner(name, "isLive"), lga:lgas(name)')
            .eq('city.isLive', true);
        if (browse?.scope === 'CITY' && browse.cityId) q = q.eq('cityId', browse.cityId);
        if (browse?.scope === 'STATE' && browse.stateId) q = q.eq('stateId', browse.stateId);
        const from = page * PAGE_SIZE;
        const { data, error } = await q
            .order('isVerified', { ascending: false, nullsFirst: false })
            .order('rating', { ascending: false, nullsFirst: false })
            .range(from, from + PAGE_SIZE - 1);
        if (error) throw new Error(error.message);
        const items: ServiceProvider[] = (data || []).map((p: any) => {
            const { city, lga, ...rest } = p;
            return { ...rest, cityName: city?.name, lgaName: lga?.name } as ServiceProvider;
        });
        return { items, hasMore: items.length === PAGE_SIZE };
    },
    getDeliveries: async (userId?: string): Promise<DeliveryRequest[]> => {
        let query = supabase.from('deliveries').select('*');
        if (userId) query = query.or(`userId.eq.${userId},riderId.eq.${userId}`);
        const { data } = await query;
        const deliveries: DeliveryRequest[] = (data as any) || [];
        // Rider contact comes from a server function limited to deliveries you're part of.
        const withRider = deliveries.filter(d => d.riderId).map(d => d.id);
        if (withRider.length) {
            const { data: riders } = await supabase.rpc('get_delivery_riders', { p_delivery_ids: withRider });
            const byDelivery = new Map(((riders as any[]) || []).map(r => [r.deliveryId, { name: r.name, phoneNumber: r.phoneNumber }]));
            for (const d of deliveries) {
                const rider = byDelivery.get(d.id);
                if (rider) d.rider = rider;
            }
        }
        return deliveries;
    },
    // The fee is set by the database from the city's zone prices; the client never sends one.
    requestDelivery: async (data: { userId: string; pickup: string; dropoff: string; itemType: string; phoneNumber: string; pickupLgaId: number; dropoffLgaId: number }): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.from('deliveries').insert([{
            userId: data.userId,
            pickup: data.pickup,
            dropoff: data.dropoff,
            itemType: data.itemType,
            phoneNumber: data.phoneNumber,
            pickupLgaId: data.pickupLgaId,
            dropoffLgaId: data.dropoffLgaId,
            status: 'PENDING'
        }]);
        return { success: !error, error: error?.message };
    },
    /** Delivery fee between two LGAs, or null when no rider can do that trip. */
    quoteDeliveryFee: async (pickupLgaId?: number, dropoffLgaId?: number): Promise<number | null> => {
        if (!pickupLgaId || !dropoffLgaId) return null;
        const { data, error } = await supabase.rpc('quote_delivery_fee', { p_pickup_lga: pickupLgaId, p_dropoff_lga: dropoffLgaId });
        if (error || data === null || data === undefined) return null;
        return Number(data);
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
    locations: {
        getStates: async (): Promise<NgState[]> => {
            if (locationCache.states) return locationCache.states;
            const { data } = await supabase.from('states').select('id, name').order('name');
            locationCache.states = (data as NgState[]) || [];
            return locationCache.states;
        },
        getLgas: async (stateId: number): Promise<Lga[]> => {
            const cached = locationCache.lgas.get(stateId);
            if (cached) return cached;
            const { data } = await supabase.from('lgas').select('id, name, "stateId", "cityId"').eq('stateId', stateId).order('name');
            const list = (data as Lga[]) || [];
            if (list.length) locationCache.lgas.set(stateId, list);
            return list;
        },
        getCities: async (): Promise<City[]> => {
            if (locationCache.cities) return locationCache.cities;
            const { data } = await supabase.from('cities').select('*').order('name');
            locationCache.cities = (data as City[]) || [];
            return locationCache.cities;
        },
        clearCache: () => { locationCache.states = null; locationCache.cities = null; locationCache.lgas.clear(); }
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

            const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
            const { data: recentTxns } = await supabase
                .from('transactions')
                .select('amount, intent, created_at')
                .eq('status', 'SUCCESS')
                .gte('created_at', fourteenDaysAgo);

            const txns = recentTxns || [];
            const now = Date.now();
            const sevenDaysAgoMs = now - 7 * 24 * 60 * 60 * 1000;

            // Kobo -> Naira. This is the only real revenue this business has --
            // Mart/FixIt transactions are not commissioned, only tier
            // subscriptions are, so anything else here would be fiction.
            const thisWeek = txns.filter(t => new Date(t.created_at).getTime() >= sevenDaysAgoMs);
            const lastWeek = txns.filter(t => new Date(t.created_at).getTime() < sevenDaysAgoMs);
            const thisWeekTotal = thisWeek.reduce((sum, t) => sum + t.amount, 0) / 100;
            const lastWeekTotal = lastWeek.reduce((sum, t) => sum + t.amount, 0) / 100;
            const growthPct = lastWeekTotal > 0
                ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
                : (thisWeekTotal > 0 ? 100 : 0);

            const splitByIntent: Record<string, number> = {};
            for (const t of thisWeek) {
                const label = t.intent === 'VENDOR_FEATURED' ? 'Vendor Featured'
                    : t.intent === 'VENDOR_VERIFIED' ? 'Vendor Verified'
                    : t.intent === 'FIXIT_VERIFIED' ? 'FixIt Verified'
                    : t.intent;
                splitByIntent[label] = (splitByIntent[label] || 0) + (t.amount / 100);
            }

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const revenueByDay = Array.from({ length: 7 }, (_, i) => {
                const dayStart = new Date(now - (6 - i) * 24 * 60 * 60 * 1000);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
                const dayTotal = txns
                    .filter(t => {
                        const ts = new Date(t.created_at).getTime();
                        return ts >= dayStart.getTime() && ts < dayEnd.getTime();
                    })
                    .reduce((sum, t) => sum + t.amount, 0) / 100;
                return { name: dayNames[dayStart.getDay()], rev: dayTotal };
            });

            return {
                dau: userCount || 0,
                revenue: thisWeekTotal,
                retention: 0, // Not tracked -- no session/return-visit data exists in this schema yet.
                conversion: growthPct,
                revenueSplit: Object.entries(splitByIntent).map(([name, value]) => ({ name, value })),
                revenueByDay,
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
        },
        getAllOrders: async (): Promise<MartOrder[]> => {
            const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
            return (data as any) || [];
        },
        getCityReadiness: async (): Promise<CityReadiness[]> => {
            const { data } = await supabase.from('city_readiness').select('*').order('isLive', { ascending: false }).order('name');
            return (data as any) || [];
        },
        getStateDemand: async (): Promise<{ stateId: number; name: string; people: number }[]> => {
            const { data } = await supabase.from('state_demand').select('*').order('people', { ascending: false });
            return (data as any) || [];
        },
        setCityLive: async (cityId: number, isLive: boolean): Promise<{ success: boolean; error?: string }> => {
            const update: any = { isLive };
            if (isLive) update.launchedAt = new Date().toISOString();
            const { error } = await supabase.from('cities').update(update).eq('id', cityId);
            api.locations.clearCache();
            return { success: !error, error: error?.message };
        },
        issueRefund: async (orderId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
            const { error } = await supabase.rpc('issue_refund', { p_order_id: orderId, p_reason: reason });
            return { success: !error, error: error?.message };
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