
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

const mapUserMetadata = (sessionUser: any): User => {
    if (!sessionUser) return null as any;
    const meta = sessionUser.user_metadata || {};
    const isPremiumTier = meta.tier === 'VERIFIED' || meta.tier === 'FEATURED' || meta.subscription?.tier === 'ELITE';
    
    const role = meta.role || 'USER';
    const calculatedLimit = meta.productLimit ?? (isPremiumTier ? 999 : (role === 'VENDOR' ? 4 : 999));

    return {
        id: sessionUser.id || '',
        email: sessionUser.email || '',
        name: meta.name || 'Kubwa Resident',
        role: role,
        joinedAt: sessionUser.created_at,
        tier: meta.tier || 'FREE',
        isFeatured: !!meta.isFeatured || meta.tier === 'FEATURED',
        productLimit: calculatedLimit,
        verificationStatus: meta.verificationStatus || 'NONE',
        paymentStatus: meta.paymentStatus || 'UNPAID',
        isSetupComplete: meta.isSetupComplete === true || meta.isSetupComplete === 'true',
        status: meta.status || 'APPROVED',
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
                if (sessionError || !session) return null;

                const { data: { user: sessionUser }, error: fetchError } = await supabase.auth.getUser();
                if (fetchError || !sessionUser) return null;
                
                return mapUserMetadata(sessionUser);
            } catch (e: any) {
                console.error("Auth API: getSession Error:", e.message);
                return null;
            }
        },
        signUp: async (email, password, name, role) => {
            try {
                const redirectUrl = window.location.origin.replace(/\/$/, '') + '/';
                const initialStatus = (role === 'VENDOR' || role === 'PROVIDER' || role === 'RIDER') ? 'PENDING' : 'APPROVED';
                
                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password, 
                    options: { 
                        emailRedirectTo: redirectUrl,
                        data: { 
                            name, 
                            role, 
                            isSetupComplete: false, 
                            status: initialStatus,
                            tier: 'FREE',
                            productLimit: role === 'VENDOR' ? 4 : 999,
                            paymentStatus: 'UNPAID'
                        } 
                    } 
                });

                if (error) {
                    console.error("Supabase SignUp Error:", error);
                    if (error.message.includes('fetch')) {
                        return { error: "Network Error: Could not reach Supabase. Check your URL configuration." };
                    }
                    return { error: error.message };
                }

                return { 
                    user: data?.user ? mapUserMetadata(data.user) : null, 
                    requiresVerification: !!data?.user && !data?.session 
                };
            } catch (e: any) {
                console.error("SignUp Catch:", e);
                return { error: "Signup failed. Please try again later." };
            }
        },
        signIn: async (email, password) => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    console.error("Supabase SignIn Error:", error);
                    if (error.message.includes('fetch')) {
                        return { error: "Connection Error: Failed to reach Kubwa Connect servers. Check environment variables." };
                    }
                    return { error: error.message };
                }
                return { user: data?.user ? mapUserMetadata(data.user) : null };
            } catch (e: any) {
                console.error("SignIn Catch:", e);
                return { error: "Login failed due to a system configuration error." };
            }
        },
        signOut: async () => { 
            await supabase.auth.signOut();
            localStorage.removeItem('kubwa_cart');
        },
        resetPassword: async (email: string) => {
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) return { success: false, error: error.message };
                return { success: true };
            } catch (err: any) {
                return { success: false, error: "Network error during reset." };
            }
        },
        updatePassword: async (password: string) => {
            try {
                const { error } = await supabase.auth.updateUser({ password });
                if (error) return { success: false, error: error.message };
                return { success: true };
            } catch (err: any) {
                return { success: false, error: "Failed to update password." };
            }
        },
        resendVerification: async (email: string) => {
            try {
                const { error } = await supabase.auth.resend({ type: 'signup', email });
                if (error) return { success: false, error: error.message };
                return { success: true };
            } catch (err: any) {
                return { success: false, error: "Resend failed." };
            }
        }
    },
    orders: {
        placeOrder: async (orderData: Partial<MartOrder>) => {
            console.log("[API] Order Placed:", orderData);
            return { success: true, orderId: 'ord-' + Math.random().toString(36).substr(2, 9) };
        },
        getMyOrders: async (userId: string): Promise<MartOrder[]> => {
            return [];
        }
    },
    users: {
        completeSetup: async (userId: string, data: any) => {
            try {
                const { data: { user }, error } = await supabase.auth.updateUser({ 
                    data: { ...data, isSetupComplete: true } 
                });
                if (error) return null;
                await supabase.auth.refreshSession();
                return mapUserMetadata(user);
            } catch (err) {
                return null;
            }
        },
        getFeaturedVendors: async () => [],
        getAddresses: async (userId: string): Promise<Address[]> => []
    },
    providers: {
        getMyProfile: async (userId: string): Promise<ServiceProvider | null> => null,
        updateStatus: async (providerId: string, available: boolean): Promise<boolean> => true,
    },
    getProducts: async (): Promise<Product[]> => {
        return [
            { id: '1', vendorId: 'v1', name: 'Fresh Tomatoes', price: 2500, category: 'Food', status: 'APPROVED', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=200', stock: 10, rating: 4.5 },
            { id: '2', vendorId: 'v2', name: 'Original Levi Jeans', price: 15000, category: 'Fashion', status: 'APPROVED', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=200', stock: 5, rating: 4.8 }
        ] as any[];
    },
    getProviders: async (): Promise<ServiceProvider[]> => {
        return [
            { id: 's1', userId: 'u1', name: 'Bature Repairs', category: 'Plumbing', rate: 3000, rating: 4.9, reviews: 24, image: 'https://i.pravatar.cc/150?u=bature', available: true, isVerified: true }
        ] as any[];
    },
    getMockContext: async () => ({ products: [], providers: [] }),
    getDeliveries: async (userId?: string): Promise<DeliveryRequest[]> => [],
    requestDelivery: async (data: any): Promise<boolean> => true,
    deliveries: {
        getAvailableJobs: async (): Promise<DeliveryRequest[]> => {
            return [
                { id: 'dr1', userId: 'u2', pickup: 'Phase 1', dropoff: 'Phase 4', itemType: 'Document', status: 'PENDING', price: 1200, date: new Date().toISOString(), phoneNumber: '08000000001' },
                { id: 'dr2', userId: 'u3', pickup: 'Gwarinpa', dropoff: 'Phase 2', itemType: 'Food', status: 'PENDING', price: 1500, date: new Date().toISOString(), phoneNumber: '08000000002' }
            ];
        },
        acceptDelivery: async (jobId: string, riderId: string): Promise<boolean> => {
            console.log(`[API] Rider ${riderId} accepted job ${jobId}`);
            return true;
        },
        updateStatus: async (jobId: string, status: string): Promise<boolean> => {
            console.log(`[API] Job ${jobId} status updated to ${status}`);
            return true;
        }
    },
    payments: { fulfillIntent: async (userId, intent, ref) => true },
    admin: { 
        getAnnouncements: async () => [],
        getPendingEntities: async () => [],
        getPendingProducts: async () => [],
        updateUserStatus: async (userId: string, status: ApprovalStatus) => true,
        updateProductStatus: async (productId: string, status: ApprovalStatus) => true,
        toggleFeatureUser: async (userId: string, isFeatured: boolean) => true
    },
    reviews: { getByTarget: async (id) => [] }
};
