import { AppSection } from '../types';
import { BRAND } from './brand';
import { FAQ_ITEMS } from './faq';
import { landingForPath, type LandingPage } from './landing';

/**
 * Search engine setup: one web address per page, with its own title and
 * description. Used in the browser (App.tsx keeps the URL and <head> in step)
 * and at build time (vite.config.ts writes a ready-made HTML file per page,
 * plus sitemap.xml, so crawlers and link previews see real content).
 *
 * Titles: under about 60 characters. Descriptions: under about 155.
 */
export const SITE_URL = `https://${BRAND.domain}`;
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface RouteMeta {
  section: AppSection;
  path: string;
  title: string;
  description: string;
  /** false = keep out of search results and the sitemap (private screens). */
  index: boolean;
  /** Shown to crawlers and before the app loads. */
  h1: string;
  intro: string;
  /** Higher = more important in the sitemap. */
  priority: number;
}

export const ROUTES: RouteMeta[] = [
  {
    section: AppSection.HOME, path: '/', index: true, priority: 1.0,
    title: 'Sell Am Here | Buy, sell and get it done near you',
    description: 'Shop from verified local sellers, hire trusted artisans and send packages across your city. Live in Abuja and opening across Nigeria. Join free.',
    h1: 'Buy, sell and get it done near you',
    intro: 'Sell Am Here is a local marketplace for Nigeria. Shop from verified sellers near you on Mart, hire plumbers, electricians and other trusted artisans on FixIt, and send packages across your city with Ride.',
  },
  {
    section: AppSection.MART, path: '/mart', index: true, priority: 0.9,
    title: 'Mart: shop from verified sellers near you | Sell Am Here',
    description: 'Groceries, fashion, gadgets and more from verified vendors in your area. Pay securely with Paystack or on delivery. Abuja and across Nigeria.',
    h1: 'Shop from verified sellers near you',
    intro: 'Browse products from local vendors who have been reviewed by our team. Pay online with Paystack or pay on delivery, and get same-city rider delivery where it is available.',
  },
  {
    section: AppSection.FIXIT, path: '/fixit', index: true, priority: 0.9,
    title: 'FixIt: hire trusted artisans near you | Sell Am Here',
    description: 'Find plumbers, electricians, AC and generator repairers, cleaners, tailors and more near you. Compare rates and reviews, then book in minutes.',
    h1: 'Hire trusted artisans near you',
    intro: 'Compare rates, reviews and Verified badges, then book a plumber, electrician, cleaner, mechanic or other artisan in your area. Agree the price before work starts and pay the artisan directly.',
  },
  {
    section: AppSection.RIDE, path: '/ride', index: true, priority: 0.8,
    title: 'Ride: send and track packages in your city | Sell Am Here',
    description: 'Book a rider to deliver a package across your city. See the delivery fee upfront and track it from pickup to drop-off. Live in Abuja.',
    h1: 'Send and track packages across your city',
    intro: 'Enter your pickup and drop-off, see the fee before you book, and follow your rider until the package arrives.',
  },
  {
    section: AppSection.HOW_IT_WORKS, path: '/how-it-works', index: true, priority: 0.7,
    title: 'How Sell Am Here works',
    description: 'How to shop on Mart, hire an artisan on FixIt, send a package with Ride, or join as a vendor, artisan or rider. Simple steps.',
    h1: `How ${BRAND.name} works`,
    intro: 'Sign up free and set your area. Then shop on Mart, hire artisans on FixIt or send packages with Ride. Vendors, artisans and riders apply once and go live after review.',
  },
  {
    section: AppSection.CITIES, path: '/cities', index: true, priority: 0.7,
    title: 'Cities we serve | Sell Am Here',
    description: 'Sell Am Here is live in Abuja and opening next in Lagos, Port Harcourt, Kano, Ibadan, Enugu, Kaduna, Benin City and Jos.',
    h1: 'Cities we serve',
    intro: 'We are live in Abuja and opening city by city across Nigeria. You can sign up from anywhere today; vendors, artisans and riders in upcoming cities go live the day their city opens.',
  },
  {
    section: AppSection.SAFETY, path: '/safety', index: true, priority: 0.5,
    title: 'Safety tips for buyers, sellers and artisans | Sell Am Here',
    description: 'Simple habits that keep every deal safe: paying through the app, checking reviews, inspecting items and spotting scams.',
    h1: 'Safety tips',
    intro: 'We review every vendor, artisan and rider before they go live, but a few simple habits keep every deal safe. We will never ask for your PIN, password or OTP.',
  },
  {
    section: AppSection.FAQ, path: '/faq', index: true, priority: 0.6,
    title: 'Frequently asked questions | Sell Am Here',
    description: 'Answers about selling, paying safely, delivery, live cities, cancellations, refunds and paying artisans on Sell Am Here.',
    h1: 'Frequently asked questions',
    intro: 'Quick answers about buying, selling, delivery and payments on Sell Am Here.',
  },
  {
    section: AppSection.ABOUT, path: '/about', index: true, priority: 0.5,
    title: 'About Sell Am Here',
    description: 'Sell Am Here connects local vendors, skilled artisans and delivery riders with the people near them. Started in Kubwa, Abuja.',
    h1: `About ${BRAND.name}`,
    intro: `${BRAND.name} is a super app for everyday life in Nigeria. It started in Kubwa, Abuja, and is opening city by city, connecting local vendors, artisans and riders with the people near them.`,
  },
  {
    section: AppSection.CONTACT, path: '/contact', index: true, priority: 0.4,
    title: 'Contact Sell Am Here',
    description: `Get in touch for support, partnerships or feedback: ${BRAND.supportEmail}.`,
    h1: 'Contact us',
    intro: `For support email ${BRAND.supportEmail}. For partnerships email ${BRAND.partnersEmail}.`,
  },
  {
    section: AppSection.TERMS, path: '/terms', index: true, priority: 0.3,
    title: 'Terms of Service | Sell Am Here',
    description: 'The terms for using the Sell Am Here marketplace, including orders, payments, refunds and responsibilities.',
    h1: 'Terms of Service',
    intro: 'The rules for buying, selling, hiring and delivering on Sell Am Here.',
  },
  {
    section: AppSection.PRIVACY, path: '/privacy', index: true, priority: 0.3,
    title: 'Privacy Policy | Sell Am Here',
    description: 'How Sell Am Here collects, uses and protects your personal data under the Nigeria Data Protection Act 2023.',
    h1: 'Privacy Policy',
    intro: 'How we collect, use and protect your personal data, and the rights you have.',
  },
  {
    section: AppSection.ACCOUNT, path: '/account', index: false, priority: 0,
    title: 'Your account | Sell Am Here',
    description: 'Sign in or create your free Sell Am Here account.',
    h1: 'Your account', intro: 'Sign in or create your free account.',
  },
  {
    section: AppSection.ADMIN, path: '/admin', index: false, priority: 0,
    title: 'Admin | Sell Am Here',
    description: 'Sell Am Here administration.',
    h1: 'Admin', intro: '',
  },
];

const BY_SECTION = new Map(ROUTES.map(r => [r.section, r]));
const BY_PATH = new Map(ROUTES.map(r => [r.path, r]));

export function routeForSection(section: AppSection): RouteMeta {
  return BY_SECTION.get(section) ?? ROUTES[0];
}

export function landingRoute(lp: LandingPage): RouteMeta {
  return {
    section: AppSection.LANDING, path: lp.path, title: lp.title, description: lp.description,
    index: true, h1: lp.h1, intro: lp.intro, priority: lp.priority,
  };
}

/** Unknown paths fall back to the home page. */
export function routeForPath(pathname: string): RouteMeta {
  const clean = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const landing = landingForPath(clean);
  if (landing) return landingRoute(landing);
  return BY_PATH.get(clean) ?? ROUTES[0];
}

export function isKnownPath(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  return BY_PATH.has(clean) || !!landingForPath(clean);
}

export const canonicalUrl = (r: RouteMeta) => (r.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${r.path}`);

// ---------- Structured data (schema.org JSON-LD) ----------

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icon-512.png`,
    email: BRAND.supportEmail,
    areaServed: { '@type': 'Country', name: 'Nigeria' },
    address: { '@type': 'PostalAddress', addressLocality: BRAND.city, addressCountry: 'NG' },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.name,
    alternateName: ['SellAmHere', 'Kubwa Connect'],
    url: `${SITE_URL}/`,
    inLanguage: 'en-NG',
  };
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function breadcrumbJsonLd(r: RouteMeta) {
  const crumbs: { name: string; url: string }[] = [{ name: BRAND.name, url: `${SITE_URL}/` }];
  if (r.path !== '/abuja') crumbs.push({ name: 'Abuja', url: `${SITE_URL}/abuja` });
  crumbs.push({ name: r.h1, url: canonicalUrl(r) });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };
}

export function jsonLdFor(r: RouteMeta): object[] {
  if (r.section === AppSection.LANDING) return [breadcrumbJsonLd(r)];
  if (r.section === AppSection.HOME) return [organizationJsonLd(), websiteJsonLd()];
  if (r.section === AppSection.FAQ) return [faqJsonLd()];
  return [];
}
