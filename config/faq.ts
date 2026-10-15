import { BRAND } from './brand';
import { TIER_PRICES } from './pricing';

export interface FaqItem { q: string; a: string }

/**
 * The FAQ shown on /faq. Kept here (not in the page) so the build can also
 * publish it as structured data for search engines.
 */
export const FAQ_ITEMS: FaqItem[] = [
  { q: 'How do I start selling?', a: `Sign up, choose Vendor, and complete your shop details. We review every new vendor before your shop goes live. The free plan lets you list up to 4 products; Vendor Featured (₦${TIER_PRICES.VENDOR_FEATURED.toLocaleString('en-NG')} for 30 days) gives unlimited listings and a Featured badge.` },
  { q: 'Is paying online safe?', a: 'Yes. Online payments are handled by Paystack, and your card or bank details go straight to them; we never see or store them. You can also choose to pay on delivery or at pickup.' },
  { q: 'How does delivery work?', a: "Rider delivery is available when you and the vendor are in the same live city. You see the rider fee before ordering and pay it to the rider on delivery. If you're in a different city, you can pick up from the vendor or arrange delivery with them." },
  { q: 'Which cities are live?', a: "We're opening city by city, starting with Abuja. You can sign up from anywhere in Nigeria and browse listings from every live city. Vendors, artisans and riders elsewhere can register now and go live when their city opens." },
  { q: 'Can I cancel an order?', a: `Yes, before the vendor dispatches it. Contact the vendor or email ${BRAND.supportEmail} with your order details.` },
  { q: "What if my order is wrong or doesn't arrive?", a: `Contact the vendor first. If it isn't resolved, email ${BRAND.supportEmail} within 7 days. For orders paid online, approved refunds go back to your original payment method through Paystack. See the Terms of Service for details.` },
  { q: 'How do I pay an artisan?', a: 'Artisan bookings on FixIt are paid directly to the artisan, not through the app. Agree the price and scope with them before work starts.' },
  { q: 'How do I delete my account or get a copy of my data?', a: `Email ${BRAND.privacyEmail} from the email address on your account. We reply within 30 days. See the Privacy Policy for your full rights.` },
];
