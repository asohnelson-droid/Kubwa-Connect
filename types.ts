
export type UserRole = 'USER' | 'VENDOR' | 'PROVIDER' | 'RIDER' | 'ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MonetisationTier = 'FREE' | 'VERIFIED' | 'FEATURED';
export type PaymentIntent = 'VENDOR_VERIFIED' | 'VENDOR_FEATURED' | 'FIXIT_VERIFIED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'EXPIRED' | 'PROCESSING';

export interface Transaction {
  id: string;
  userId: string;
  intent: PaymentIntent;
  amount: number;
  reference: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  provider: 'MOCK' | 'PAYSTACK' | 'FLUTTERWAVE';
  date: string;
  expiryDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  status: ApprovalStatus;
  rejectionReason?: string;
  joinedAt?: string;
  isSetupComplete?: boolean;
  phoneNumber?: string;
  storeName?: string;
  address?: string;
  
  // Monetisation & Payment State
  tier: MonetisationTier;
  tierExpiry?: string; 
  isFeatured?: boolean;
  featuredExpiresAt?: string;
  productLimit: number;
  verificationStatus: 'NONE' | 'PENDING' | 'VERIFIED';
  
  // Payment History (Simplified)
  paymentStatus: PaymentStatus;
  lastPaymentRef?: string;

  subscription?: {
    tier: string;
  };
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  rating: number;
  status: ApprovalStatus;
  rejectionReason?: string;
  description?: string;
  isPromoted?: boolean; 
}

export enum AppSection {
  HOME = 'HOME',
  MART = 'MART',
  FIXIT = 'FIXIT',
  RIDE = 'RIDE',
  ACCOUNT = 'ACCOUNT',
  ADMIN = 'ADMIN',
  ABOUT = 'ABOUT',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',
  CONTACT = 'CONTACT',
  FAQ = 'FAQ'
}

export type ActivityItem = any;
export type CartItem = Product & { quantity: number };
export interface Address { id: string; userId: string; title: string; details: string; }
export interface Announcement { id: string; title: string; message: string; type: 'INFO' | 'ALERT' | 'PROMO'; isActive: boolean; date: string; }
export interface AnalyticsData { dau: number; revenue: number; retention: number; conversion: number; revenueSplit: any; userStats?: any; }
export interface SystemSettings { allowSignups: boolean; maintenanceMode: boolean; allowAdminPromotions: boolean; supportEmail: string; supportPhone: string; minVersion: string; }
export interface ServiceProvider { id: string; userId: string; name: string; category: string; rate: number; rating: number; reviews: number; image: string; available: boolean; isVerified: boolean; bio?: string; skills?: string[]; location?: string; }
export interface Review { id: string; userId: string; targetId: string; rating: number; comment: string; date: string; }
export interface DeliveryRequest { id: string; userId: string; riderId?: string; pickup: string; dropoff: string; itemType: string; status: string; price: number; date: string; phoneNumber?: string; }
export interface MartOrder { id: string; userId: string; total: number; status: string; date: string; }
export interface PushNotification { title: string; body: string; }
