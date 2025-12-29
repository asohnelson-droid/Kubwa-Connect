
import { supabase } from './supabase';
import { User, UserRole, Product, ServiceProvider, ApprovalStatus, MonetisationTier, PaymentIntent, Transaction, Address, Review, DeliveryRequest } from '../types';

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
    
    // Ensure we have a valid role before calculating limits
    const role = meta.role || 'USER';
    // FREE Tier Vendors get a limit of 6 products as per community guidelines
    const calculatedLimit = meta.productLimit ?? (isPremiumTier ? 999 : (role === 'VENDOR' ? 6 : 999));

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
                console.error("Auth Session Fetch Failed:", e.message);
                return null;
            }
        },
        signUp: async (email, password, name, role) => {
            try {
                const rawUrl = process.env.VITE_SUPABASE_URL || '';
                const fallbackUrl = 'https://bzuwzvrmwketoyumiawi.supabase.co';
                const endpoint = (rawUrl && rawUrl !== 'undefined' && rawUrl !== '') ? rawUrl : fallbackUrl;

                if (!endpoint.startsWith('https://')) {
                  console.error("Auth Security Violation: Non-HTTPS Supabase endpoint detected.");
                  return { error: "Security Error: Authentication is only permitted over secure HTTPS connections." };
                }

                const redirectUrl = window.location.origin.replace(/\/$/, '') + '/';
                const initialStatus = (role === 'VENDOR' || role === 'PROVIDER' || role === 'RIDER') ? 'PENDING' : 'APPROVED';
                
                if (!email || !password || password.length < 6) {
                    return { error: "Invalid credentials. Ensure password is at least 6 characters." };
                }

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
                            productLimit: role === 'VENDOR' ? 6 : 999,
                            paymentStatus: 'UNPAID'
                        } 
                    } 
                });

                if (error) return { error: error.message };

                return { 
                    user: data?.user ? mapUserMetadata(data.user) : null, 
                    requiresVerification: !!data?.user && !data?.session 
                };
            } catch (e: any) {
                return { error: "Signup process failed. Please check your internet connection." };
            }
        },
        signIn: async (email, password) => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    const msg = error.message.toLowerCase();
                    if (msg.includes('email not confirmed')) {
                        return { error: "Please activate your account! Check your email for the verification link." };
                    }
                    return { error: error.message };
                }
                return { user: data?.user ? mapUserMetadata(data.user) : null };
            } catch (e: any) {
                return { error: "Login failed. Check your connection." };
            }
        },
        resetPassword: async (email: string) => {
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin.replace(/\/$/, '')}/`,
                });
                return { success: !error, error: error?.message };
            } catch (e) {
                return { success: false, error: "Unable to send reset link." };
            }
        },
        updatePassword: async (password: string) => {
            try {
                const { error } = await supabase.auth.updateUser({ password });
                return { success: !error, error: error?.message };
            } catch (e) {
                return { success: false, error: "Failed to update password." };
            }
        },
        resendVerification: async (email: string) => {
            try {
                const redirectUrl = window.location.origin.replace(/\/$/, '') + '/';
                const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectUrl } });
                return { success: !error, error: error?.message };
            } catch (e) {
                return { success: false, error: "Network error." };
            }
        },
        signOut: async () => { 
            await supabase.auth.signOut();
            localStorage.removeItem('kubwa_cart');
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
    deliveries: {
        getAvailableJobs: async (): Promise<DeliveryRequest[]> => [],
        acceptDelivery: async (jobId: string, riderId: string): Promise<boolean> => true,
        updateStatus: async (jobId: string, status: string): Promise<boolean> => true,
    },
    getProducts: async (): Promise<Product[]> => [],
    getProviders: async (): Promise<ServiceProvider[]> => [],
    getMockContext: async () => ({ products: [], providers: [] }),
    getDeliveries: async (userId?: string): Promise<DeliveryRequest[]> => [],
    requestDelivery: async (data: any): Promise<boolean> => true,
    payments: { fulfillIntent: async (userId, intent, ref) => true },
    admin: { 
        getAnnouncements: async () => [],
        getPendingEntities: async () => {
            return [
                { id: 'm1', name: 'John Doe', storeName: 'JD Electronics', role: 'VENDOR', status: 'PENDING', joinedAt: new Date().toISOString(), email: 'john@example.com' },
                { id: 'm2', name: 'Alice Smith', role: 'PROVIDER', status: 'PENDING', joinedAt: new Date().toISOString(), email: 'alice@fix.it' },
                { id: 'm3', name: 'Speedy Sam', role: 'RIDER', status: 'PENDING', joinedAt: new Date().toISOString(), email: 'sam@ride.com' }
            ] as any[];
        },
        getPendingProducts: async () => {
            return [
                { id: 'p1', vendorId: 'm1', name: 'iPhone 15 Pro', price: 1200000, category: 'Electronics', status: 'PENDING', image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=200' },
                { id: 'p2', vendorId: 'm1', name: 'Samsung S24', price: 950000, category: 'Electronics', status: 'PENDING', image: 'https://images.unsplash.com/photo-1707064843232-273523321589?auto=format&fit=crop&q=80&w=200' }
            ] as any[];
        },
        updateUserStatus: async (userId: string, status: ApprovalStatus) => {
            console.log(`[Admin] User ${userId} updated to ${status}`);
            return true;
        },
        updateProductStatus: async (productId: string, status: ApprovalStatus) => {
            console.log(`[Admin] Product ${productId} updated to ${status}`);
            return true;
        },
        toggleFeatureUser: async (userId: string, isFeatured: boolean) => {
            console.log(`[Admin] User ${userId} feature toggled to ${isFeatured}`);
            return true;
        }
    },
    reviews: { getByTarget: async (id) => [] }
};
