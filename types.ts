
export type UserRole = 'USER' | 'VENDOR' | 'PROVIDER' | 'RIDER' | 'ADMIN';

export type SubscriptionTier = 'STARTER' | 'BASIC' | 'PREMIUM' | 'ELITE';

export type PaymentGateway = 'FLUTTERWAVE' | 'PAYSTACK';

export interface PlanLimits {
  listings: number;
  photosPerListing: number;
  messagesPerDay: number;
  boostsPerMonth: number;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number; // Monthly
  annualPrice: number; // Yearly
  interval: string;
  features: string[];
  limits: PlanLimits;
  color: string;
  recommended?: boolean;
}

export interface FeaturedPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
}

export interface FeaturedRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  planId: string;
  amount: number;
  status: 'PENDING_PAYMENT' | 'PAID_AWAITING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'EXPIRED';
  requestDate: string;
  startDate?: string;
  endDate?: string;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  startDate: string;
  expiryDate: string | null; // null for lifetime or starter
  autoRenew: boolean;
  interval?: 'MONTHLY' | 'YEARLY';
}

export interface UserVerification {
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
  type: 'NIN' | 'BVN' | 'CAC';
  number: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string; // New: User bio
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  joinedAt?: string;
  subscription?: UserSubscription;
  phoneNumber?: string;
  isPhoneVerified?: boolean; // New
  isFlagged?: boolean; // New: for suspicious users
  isFeatured?: boolean; // New: Featured Vendor status
  featuredExpiresAt?: string; // New: ISO Date string for expiration
  wishlist?: string[]; // Array of Product IDs
  verification?: UserVerification;
  settings?: {
    notifications: boolean;
    pushToken?: string;
    twoFactorEnabled?: boolean; // New: 2FA
  };
  interests?: string[];
  isSetupComplete?: boolean;
  skills?: string[];
  responseRate?: number;
  responseTime?: string;
  lastSeen?: string;
  twoFactorEnabled?: boolean;
  // Vendor specific fields
  rating?: number;
  reviews?: number;
  storeName?: string;
  address?: string; // New: Business Address
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string; // 'mart', 'ride', 'fixit', 'system'
  timestamp: string;
  deepLink?: AppSection; // Where clicking takes the user
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'PROMO';
  isActive: boolean;
  date: string;
}

export interface SystemSettings {
  allowSignups: boolean;
  maintenanceMode: boolean;
  allowAdminPromotions: boolean;
  supportEmail: string;
  supportPhone: string;
  minVersion: string;
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string; // New: Reason for rejection
  images?: string[];
  description?: string; // New: Product description
  phoneNumber?: string;
  isPremium?: boolean; // Derived from vendor subscription
  
  // SECTION 2: Category Featured Fields
  isCategoryFeatured?: boolean; 
  featuredExpiresAt?: string; // ISO string
  
  location?: string; // New: Neighborhood/Area
  
  // NEW FIELDS FOR SORTING
  createdAt?: string; // ISO Date
  salesCount?: number; // For trending logic
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface WorkDay {
  day: DayOfWeek;
  start: string; // "09:00"
  end: string;   // "17:00"
  isOpen: boolean;
}

export interface ServiceProvider {
  id: string;
  userId?: string; // Links this profile to a registered User
  name: string;
  category: string; // e.g., Plumber, Electrician (Primary)
  rate: number;
  rating: number;
  reviews: number;
  image: string;
  available: boolean;
  earnings?: number;
  portfolio?: string[]; // URLs of past work
  bio?: string; // New
  skills?: string[]; // New: List of services offered
  whatsappNumber?: string; // New: For contact
  responseRate?: number; // New: percentage
  responseTime?: string; // New: e.g. "1 hr"
  lastSeen?: string; // New: ISO string
  isPremium?: boolean; // Derived from subscription
  isVerified?: boolean; // New: Verified status
  isFeatured?: boolean; // New: Admin Featured status
  location?: string; // New: Neighborhood/Area
  jobsCompleted?: number;
  experience?: string;
  schedule?: WorkDay[]; // New: Availability Calendar
}

export interface DeliveryRequest {
  id: string;
  userId: string;
  riderId?: string; // The rider who accepted the job
  pickup: string;
  dropoff: string;
  itemType: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  price: number;
  date: string;
  type: 'DELIVERY'; // Discriminator
  phoneNumber?: string;
}

export interface ServiceOrder {
  id: string;
  serviceId: string; // providerId
  userId: string;
  date: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  type: 'SERVICE';
  serviceType?: string;
}

export interface MartOrder {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  date: string;
  // UPDATED: More granular status for vendor flow
  status: 'PENDING' | 'ACCEPTED' | 'READY' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  type: 'MART';
  deliveryMethod: 'PICKUP' | 'DELIVERY';
  deliveryAddress?: string;
  deliveryFee: number;
  contactPhone?: string;
  // NEW: Assigned Rider Info (Vendor sees this, but cannot edit)
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  // NEW: Admin oversight
  isFlagged?: boolean;
  flagReason?: string;
}

export type ActivityItem = DeliveryRequest | ServiceOrder | MartOrder;

export interface CartItem extends Product {
  quantity: number;
}

export interface Address {
  id: string;
  userId: string;
  title: string; // e.g., Home, Work
  details: string; // e.g., Phase 4, Kubwa
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  name?: string;
  timestamp: string;
  orderId?: string;
}

export interface Review {
  id: string;
  userId: string;
  targetId: string; // Product ID or Provider ID
  rating: number;
  comment: string;
  date: string;
  userName?: string; // Optional for UI display
}

export enum AppSection {
  HOME = 'HOME',
  MART = 'MART',
  FIXIT = 'FIXIT',
  RIDE = 'RIDE',
  ACCOUNT = 'ACCOUNT',
  ADMIN = 'ADMIN',
  // Info Pages
  ABOUT = 'ABOUT',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',
  CONTACT = 'CONTACT',
  FAQ = 'FAQ'
}

export interface AdminLog {
  id: string;
  adminName: string;
  action: string; // "ASSIGN_RIDER", "CANCEL_ORDER"
  targetId: string;
  details: string;
  timestamp: string;
}

export interface AnalyticsData {
  dau: number;
  revenue: number;
  retention: number;
  conversion: number;
  revenueSplit: {
    subscriptions: number;
    commissions: number;
    deliveryFees: number;
  };
  userStats?: {
    total: number;
    active: number;
    inactive: number;
    newThisWeek: number;
  };
  activityLog?: any[];
  featureUsage?: { name: string; count: number; color: string }[];
  growthTrend?: { name: string; count: number }[];
  insights?: {
    peakDay: string;
    busiestTime: string;
    totalReviews: number;
    totalListings: number;
  };
}

export interface VendorAnalytics {
  totalRevenue: number;
  totalOrders: number;
  itemsSold: number;
  lowStockCount: number;
  salesData: { name: string; sales: number }[]; // For Chart
}

// Declare globals for Payment SDKs
declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
    PaystackPop: {
      setup: (config: any) => { openIframe: () => void };
    };
  }
}
