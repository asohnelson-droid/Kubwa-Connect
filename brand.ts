/**
 * Single source of truth for the product's name and public contact details.
 * The national rebrand only needs these values changed (plus the logo files
 * in /public and the wordmark in index.html).
 */
export const BRAND = {
  name: 'Sell Am Here',
  domain: 'sellamhere.com',
  tagline: 'Buy, sell and get it done near you.',
  country: 'Nigeria',
  supportEmail: 'support@sellamhere.com',
  partnersEmail: 'partners@sellamhere.com',
  privacyEmail: 'privacy@sellamhere.com',
  /** Update to the exact CAC-registered name once registration is complete. */
  legalName: 'Sell Am Here',
  city: 'Abuja',
} as const;
