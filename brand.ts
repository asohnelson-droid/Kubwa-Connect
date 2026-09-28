/**
 * Single source of truth for the product's name and public contact details.
 * The national rebrand only needs these values changed (plus the logo files
 * in /public and the wordmark in index.html).
 */
export const BRAND = {
  name: 'Kubwa Connect',
  tagline: 'Shop. Fix. Deliver.',
  country: 'Nigeria',
  supportEmail: 'support@kubwaconnect.com',
  partnersEmail: 'partners@kubwaconnect.com',
} as const;
