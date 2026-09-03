
export type UserRole = 'USER' | 'VENDOR' | 'PROVIDER' | 'RIDER' | 'ADMIN' | 'SUPER_ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type MonetisationTier = 'FREE' | 'VERIFIED' | 'FEATURED';
export type PaymentIntent = 'VENDOR_VERIFIED' | 'VENDOR_FEATURED' | 'FIXIT_VERIFIED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'EXPIRED' | 'PROCESSING';

// Order Management Lifecycle
export type OrderStatus = 'CREATED' | 'VENDOR_CONFIRMED' | 'RIDER_ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type DeliveryStatus = 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type ServiceOrderStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

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
  
  // Payment History
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
  images?: string[];
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

export interface MartOrder {
  id: string;
  userId: string;
  vendorId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
  deliveryOption: 'PICKUP' | 'DISPATCH';
  riderId?: string;
  deliveryAddress?: string;
  contactPhone?: string;
}

export type ActivityItem = any;
export type CartItem = Product & { quantity: number };
export interface Address { id: string; userId: string; title: string; details: string; }
export interface Announcement { id: string; title: string; message: string; type: 'INFO' | 'ALERT' | 'PROMO'; isActive: boolean; created_at: string; }
export interface AnalyticsData { dau: number; revenue: number; retention: number; conversion: number; revenueSplit: any; revenueByDay?: { name: string; rev: number }[]; userStats?: any; }
export interface SystemSettings { allowSignups: boolean; maintenanceMode: boolean; allowAdminPromotions: boolean; supportEmail: string; supportPhone: string; minVersion: string; }
export interface ServiceProvider { id: string; userId: string; name: string; category: string; rate: number; rating: number; reviews: number; image: string; available: boolean; isVerified: boolean; bio?: string; skills?: string[]; location?: string; }
export interface Review { id: string; userId: string; targetId: string; rating: number; comment: string; created_at: string; }
export interface DeliveryRequest { id: string; userId: string; riderId?: string; pickup: string; dropoff: string; itemType: string; status: DeliveryStatus; price: number; created_at: string; phoneNumber?: string; rider?: { name: string; phoneNumber?: string }; }
export interface ServiceOrder { id: string; userId: string; serviceId: string; amount: number; status: ServiceOrderStatus; created_at: string; providers?: { userId: string; name: string; image: string; category: string }; }
export interface PushNotification { title: string; body: string; }
