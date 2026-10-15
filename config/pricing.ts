import type { PaymentIntent } from '../types';

/** Prices in naira for the paid upgrades. One place, used by the app and by the FAQ. */
export const TIER_PRICES: Record<PaymentIntent, number> = {
  VENDOR_VERIFIED: 2000,
  VENDOR_FEATURED: 3000,
  FIXIT_VERIFIED: 2000,
};
