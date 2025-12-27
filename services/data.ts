
import { supabase } from './supabase';
import { User, UserRole, Product, ServiceProvider, ApprovalStatus, MonetisationTier, PaymentIntent, Transaction, Address, Review } from '../types';

export const KUBWA_AREAS = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Gwarinpa', 'Dawaki', 'Dutse', 'Arab Road', 'Byazhin'];
export const FIXIT_SERVICES = ['Electrical Repairs', 'Plumbing', 'Generator Repairs', 'Phone & Laptop Repairs', 'Cleaning Services', 'Painting', 'AC Repairs', 'Carpentry', 'Installations', 'Home Tutoring', 'Beauty & Makeup'];

/**
 * Helper to map Supabase User metadata to our App User type consistently.
 */
const mapUserMetadata = (sessionUser: any): User => {
    if (!sessionUser) return null as any;
    const meta = sessionUser.user_metadata || {};
    
    // Logic: Vendors start with 4 products unless they upgrade.
    // Elite/Verified/Featured users get unlimited (999).
    const isPremiumTier = meta.tier === 'VERIFIED' || meta.tier === 'FEATURED' || meta.subscription?.tier === 'ELITE';
    const calculatedLimit = meta.productLimit ?? (isPremiumTier ? 999 : (meta.role === 'VENDOR' ? 4 : 999));

    return {
        id: sessionUser.id || '',
        email: sessionUser.email || '',
        name: meta.name || 'Kubwa Resident',
        role: meta.role || 'USER',
        joinedAt: sessionUser.created_at,
        tier: meta.tier || 'FREE',
        isFeatured: !!meta.isFeatured,
        productLimit: calculatedLimit,
        verificationStatus: meta.verificationStatus || 'NONE',
        paymentStatus: meta.paymentStatus || 'UNPAID',
        isSetupComplete: !!meta.isSetupComplete,
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
                const redirectUrl = window.location.origin.replace(/\/$/, ""); 
                const initialStatus = role === 'USER' ? 'APPROVED' : 'PENDING';
                
                if (!email || !password || password.length < 6) {
                    return { error: "Validation failed: Check email and password length." };
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
                            productLimit: role === 'VENDOR' ? 4 : 999,
                            paymentStatus: 'UNPAID'
                        } 
                    } 
                });

                if (error) {
                    const msg = error.message.toLowerCase();
                    if (msg.includes('already registered') || msg.includes('user_already_exists')) {
                        return { error: "This email is already registered. Try logging in instead." };
                    }
                    return { error: error.message || "An error occurred during signup." };
                }

                const newUser = data?.user;
                if (!newUser) {
                    return { error: "Signup successful, but session could not be established. Please log in." };
                }

                return { 
                    user: mapUserMetadata(newUser), 
                    requiresVerification: !!newUser && !data?.session 
                };
            } catch (e: any) {
                console.error("Signup Catch Block:", e);
                return { error: "Signup failed due to a network interruption." };
            }
        },
        signIn: async (email, password) => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    const msg = error.message.toLowerCase();
                    if (msg.includes('invalid login credentials')) return { error: "Incorrect email or password." };
                    if (msg.includes('email not confirmed')) return { error: "Please verify your email first." };
                    return { error: error.message || "Login failed." };
                }
                
                return { 
                    user: data?.user ? mapUserMetadata(data.user) : null
                };
            } catch (e: any) {
                return { error: "Login failed. Check your internet connection." };
            }
        },
        signOut: async () => { 
            try {
                await supabase.auth.signOut();
                localStorage.removeItem('kubwa_cart');
                const keys = Object.keys(localStorage);
                keys.forEach(k => {
                    if (k.includes('-auth-token')) localStorage.removeItem(k);
                });
            } catch (e) {
                console.error("Signout error", e);
            }
        },
        resetPassword: async (email: string) => {
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/#reset-password`,
                });
                return { error: error?.message };
            } catch (e) {
                return { error: "Unable to send reset link." };
            }
        },
        resendVerification: async (email: string) => {
            try {
                const { error } = await supabase.auth.resend({ type: 'signup', email });
                return { success: !error, error: error?.message };
            } catch (e) {
                return { success: false, error: "Network error." };
            }
        }
    },

    users: {
        completeSetup: async (userId: string, data: any) => {
            try {
                const { error } = await supabase.auth.updateUser({ 
                    data: { 
                        ...data, 
                        isSetupComplete: true 
                    } 
                });
                if (error) throw error;
                
                await supabase.auth.refreshSession();
                return true;
            } catch (e) {
                console.error("Setup Completion Failed:", e);
                return false;
            }
        },
        getFeaturedVendors: async () => [],
        getAddresses: async (userId: string) => [] as Address[]
    },

    getProducts: async () => {
        return [
            { id: '1', name: 'Fresh Tomatoes (Big Basket)', price: 4500, status: 'APPROVED', category: 'food', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', vendorId: 'v1', rating: 4.8, stock: 5, isPromoted: true, description: 'Directly from the farm. Very fresh and red.' },
            { id: '2', name: 'Parboiled Rice 50kg', price: 78000, status: 'APPROVED', category: 'food', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', vendorId: 'v2', rating: 4.5, stock: 12, isPromoted: false, description: 'Stone-free and easy to cook.' },
        ] as Product[];
    },
    
    getProviders: async () => {
        return [
            { id: 'p1', userId: 'u1', name: 'Musa Fixes', category: 'Plumbing', rate: 5000, rating: 4.9, reviews: 32, image: 'https://images.unsplash.com/photo-1581578731522-745d05cb9703?w=200', available: true, isVerified: true, location: 'Arab Road' },
            { id: 'p2', userId: 'u2', name: 'Janet Stitches', category: 'Tailoring', rate: 8000, rating: 4.7, reviews: 15, image: 'https://images.unsplash.com/photo-1520004481444-dcd3cca0913a?w=200', available: true, isVerified: false, location: 'Phase 3' }
        ] as ServiceProvider[];
    },

    providers: {
        getMyProfile: async (userId: string) => {
            const providers = await api.getProviders();
            return providers.find(p => p.userId === userId) || null;
        },
        updateStatus: async (providerId: string, available: boolean) => true
    },

    deliveries: {
        getAvailableJobs: async () => [
            { id: 'd1', userId: 'u1', pickup: 'Phase 2', dropoff: 'Arab Road', itemType: 'Small Package', status: 'PENDING', price: 1200, date: new Date().toISOString() }
        ],
        acceptDelivery: async (id, rid) => true,
        updateStatus: async (id, st) => true
    },
    
    getDeliveries: async (uid) => [],
    requestDelivery: async (d) => true,
    getMockContext: async () => ({ products: await api.getProducts(), providers: await api.getProviders() }),
    payments: { 
        fulfillIntent: async (userId: string, intent: PaymentIntent, reference: string) => {
            // Calculate new properties based on intent
            const isFeatured = intent === 'VENDOR_FEATURED';
            const tier: MonetisationTier = isFeatured ? 'FEATURED' : 'VERIFIED';
            const productLimit = 999; // Both Verified and Featured get unlimited
            
            const { error } = await supabase.auth.updateUser({
                data: {
                    tier,
                    productLimit,
                    paymentStatus: 'PAID',
                    verificationStatus: 'VERIFIED',
                    isFeatured
                }
            });
            
            if (!error) {
                await supabase.auth.refreshSession();
                return true;
            }
            return false;
        }, 
        getHistory: async () => [] 
    },
    admin: { getAnnouncements: async () => [] },
    reviews: { getByTarget: async (targetId: string) => [] as Review[] }
};

export const getParentCategory = (id) => 'food';
export const PRODUCT_CATEGORIES = [{id: 'food', label: 'Food & Groceries'}, {id: 'fashion', label: 'Fashion & Textiles'}, {id: 'electronics', label: 'Electronics'}];
