import { BRAND } from './brand';

/**
 * Terms of Service and Privacy Policy content.
 *
 * Written to match how the app actually works (data collected, who processes
 * it, how orders, delivery, refunds and plans behave). Have a Nigerian lawyer
 * review before public launch, and update LEGAL_LAST_UPDATED whenever the text
 * changes.
 */

export const LEGAL_LAST_UPDATED = '29 September 2026';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  after?: string[];
}

export interface PlanPrices {
  vendorFeatured: number;
  fixitVerified: number;
}

const naira = (n: number) => `₦${n.toLocaleString()}`;

export const privacySections = (): LegalSection[] => [
  {
    heading: 'Who we are',
    paragraphs: [
      `${BRAND.name} ("we", "us") runs the ${BRAND.name} app and website at ${BRAND.domain}, a marketplace that connects buyers with local vendors, artisans and delivery riders in Nigeria. ${BRAND.legalName}, based in ${BRAND.city}, Nigeria, is the data controller for the personal data described here.`,
      `In this policy, "NDPA" means the Nigeria Data Protection Act 2023. For any privacy question or request, email ${BRAND.privacyEmail}.`,
    ],
  },
  {
    heading: 'What we collect',
    bullets: [
      'Account details: your name, email address, password (stored only in scrambled form by our login provider) and whether you joined as a buyer, vendor, artisan or rider.',
      'Profile details you add: phone number, photo, short bio, shop name, and your state, local government area, neighbourhood and street address.',
      'Listings and services: products, prices, photos and descriptions that vendors add, and the services, rates and categories artisans add.',
      'Orders and deliveries: what you ordered, from whom, amounts, delivery or pickup choice, delivery address, contact phone, and pickup and drop-off details for delivery requests.',
      'Bookings and reviews: artisan bookings you make or receive, and ratings and comments you post.',
      'Payment records: the amount, status and Paystack reference of each payment. Your card or bank details go directly to Paystack and are never seen or stored by us.',
      'Device location, only when you tap "My location" on the delivery screen. We use it to fill in your pickup point and do not track your location in the background.',
      'Security records: when you sign in, the IP address and browser or device used, so we can detect suspicious access.',
      'Messages you send to our support addresses, and waitlist details if you join a waitlist.',
    ],
  },
  {
    heading: 'Why we use it, and our legal basis',
    bullets: [
      'To run your account and the marketplace: showing listings, placing and tracking orders, dispatching riders and handling bookings. Basis: performing our contract with you.',
      'To take payments and keep records of them, and to prevent fraud and misuse. Basis: our contract with you, our legal obligations, and our legitimate interest in keeping the platform safe.',
      'To send service emails, such as order placed, order confirmed and approvals. Basis: our contract with you.',
      'To vet vendors, artisans and riders before they go live. Basis: our legitimate interest in protecting buyers.',
      'To understand which cities to open next and improve the app, using grouped figures such as sign-ups per state. Basis: our legitimate interest.',
      'Marketing messages, only if you have agreed to receive them. You can withdraw that consent at any time. We do not currently send marketing messages.',
    ],
  },
  {
    heading: 'Who can see your information',
    paragraphs: ['Other members see only what they need:'],
    bullets: [
      'Everyone can see public shop and service details: shop or display name, photo, bio, city or local government area, listings, prices and reviews.',
      'A vendor sees the contact phone and delivery address for orders placed with them.',
      'A rider sees the pickup and drop-off details and contact phone for jobs in their city, and full details once assigned.',
      "A buyer sees the vendor's shop name and pickup address, and the assigned rider's name and phone number.",
      'Our administrators can see account details to approve applications, resolve disputes and keep the platform safe.',
    ],
    after: [
      'We never sell your personal data. We share it with the service providers that run the app for us, each only for its own task: Supabase (database and sign-in), Vercel (website hosting), Paystack (payments), Resend (service emails), ImprovMX (forwarding our support email) and Google Fonts (text fonts). We may also disclose information when the law requires it, or to protect people from fraud or harm.',
    ],
  },
  {
    heading: 'Transfers outside Nigeria',
    paragraphs: [
      "Some of these providers store or process data outside Nigeria. Our database is hosted in the European Union (Ireland), and our website hosting and email providers may process data in the European Union and the United States. We transfer data only as needed to provide the service you asked for, as permitted by the NDPA, and we rely on these providers' security and contractual data protection commitments.",
    ],
  },
  {
    heading: 'How long we keep it',
    bullets: [
      'Account and profile details: while your account is open. If you ask us to delete your account, we delete or anonymise them within 30 days.',
      'Order, payment and refund records: for up to 6 years, because financial and tax rules require us to keep transaction records.',
      'Security sign-in records: up to 12 months.',
      'Support emails: up to 2 years after the conversation ends.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: ['Under the NDPA you can:'],
    bullets: [
      'Ask for a copy of the personal data we hold about you.',
      'Correct inaccurate data. You can edit most profile details yourself in Account.',
      'Ask us to delete your data, subject to the records we must keep by law.',
      'Ask us to restrict or stop certain processing, and object to processing based on our legitimate interests.',
      'Receive your data in a common electronic format to take elsewhere.',
      'Withdraw any consent you have given, at any time.',
      'Complain to the Nigeria Data Protection Commission (ndpc.gov.ng) if you are unhappy with how we handle your data.',
    ],
    after: [
      `To use any of these rights, email ${BRAND.privacyEmail} from the email address on your account. We reply within 30 days and may ask you to confirm your identity first.`,
    ],
  },
  {
    heading: 'Security',
    paragraphs: [
      'Access to data is locked down by database rules, so each person can only see what their role needs. Connections are encrypted, and payments are handled entirely by Paystack. No system is perfectly secure. If a breach puts your rights at risk, we will notify the Nigeria Data Protection Commission within 72 hours and tell affected users without delay.',
    ],
  },
  {
    heading: 'Storage on your device',
    paragraphs: [
      'The app stores a few items in your browser so it works properly: your sign-in session, your cart, the area you chose to browse and whether you have seen the welcome screens. We do not use advertising cookies or third-party tracking.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      `${BRAND.name} is for people aged 18 and over. We do not knowingly collect data from children. If you believe a child has created an account, email ${BRAND.privacyEmail} and we will remove it.`,
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'We will update this page when our practices change, and tell you in the app or by email about significant changes.',
    ],
  },
];

export const termsSections = (prices: PlanPrices): LegalSection[] => [
  {
    heading: 'About these terms',
    paragraphs: [
      `These terms are an agreement between you and ${BRAND.legalName} ("${BRAND.name}", "we", "us") for using the ${BRAND.name} app and website. By creating an account or using the service, you accept them. If you do not agree, please do not use ${BRAND.name}.`,
      `You must be at least 18 years old and able to enter a binding contract under Nigerian law.`,
    ],
  },
  {
    heading: 'What we do, and what we do not do',
    paragraphs: [
      `${BRAND.name} is a marketplace. We connect buyers with independent vendors, artisans and delivery riders. We are not the seller of products listed by vendors, we do not employ artisans or riders, and we are not a party to the agreements you make with them.`,
      "When you buy a product, your contract of sale is with the vendor. When you book an artisan, your agreement is with the artisan. We review vendors, artisans, riders and listings before they go live, but we cannot guarantee every item, service or delivery.",
    ],
  },
  {
    heading: 'Your account',
    bullets: [
      'Give accurate details, including your real location, and keep them up to date.',
      'Keep your password private. You are responsible for activity on your account.',
      'Vendor, artisan and rider accounts need our approval, and we may ask for more information before approving.',
      'Tell us straight away at ' + BRAND.supportEmail + ' if you think someone else is using your account.',
    ],
  },
  {
    heading: 'Rules for vendors',
    bullets: [
      'List only items you own or are authorised to sell, with honest descriptions, photos and prices in naira.',
      'Keep stock levels accurate and confirm or decline orders promptly.',
      'New listings, and edits to a listing\'s name, price, description, category or photos, are reviewed by us before they appear.',
      'The free plan allows up to 4 listings. Paid plans are described below.',
      'You are responsible for the quality, safety and legality of what you sell, and for any taxes on your sales.',
    ],
  },
  {
    heading: 'Items you may not list',
    bullets: [
      'Anything illegal to sell in Nigeria, stolen, counterfeit or infringing someone else\'s rights.',
      'Weapons, ammunition and explosives.',
      'Illegal drugs, and prescription medicines without the required authorisation.',
      'Adult or sexually explicit material.',
      'Live animals, human remains or body parts.',
      'Anything we reasonably consider unsafe or harmful. We may remove any listing without notice.',
    ],
  },
  {
    heading: 'Orders and payment',
    bullets: [
      'Prices are in naira and set by the vendor. The total is shown before you confirm an order.',
      'You can pay online through Paystack, or pay the vendor on delivery or pickup. Paystack handles online payments under its own terms.',
      'An order is accepted when the vendor confirms it. Placing an order reserves stock; if an item runs out before your order is placed, the order will not go through.',
      'To cancel, contact the vendor or ' + BRAND.supportEmail + ' before the vendor dispatches your order. Cancelled orders return the items to stock.',
    ],
  },
  {
    heading: 'Delivery',
    bullets: [
      "Rider delivery is available only when you and the vendor are in the same live city. Otherwise you can pick up from the vendor or arrange delivery with them directly.",
      'The rider fee is shown before you order and is paid to the rider on delivery, not through the app.',
      'Riders are independent. They must hold any licences and papers required by law and follow traffic rules. They are responsible for items while in their care.',
      'Check your items when they arrive and report any problem the same day where possible.',
    ],
  },
  {
    heading: 'Problems with an order, and refunds',
    bullets: [
      'If your order does not arrive, or arrives damaged, wrong or significantly different from its listing, contact the vendor first. If it is not resolved, email ' + BRAND.supportEmail + ' within 7 days of the delivery or expected delivery date with your order details and photos where relevant.',
      'For orders paid online, we review the case with the vendor. If we approve a refund, we return the money to your original payment method through Paystack. We aim to start approved refunds within 5 business days; your bank may take longer to show it.',
      'For orders paid on delivery or pickup, refunds are settled between you and the vendor. We will help mediate, but we do not hold that money.',
      'Nothing in these terms removes rights you have under Nigerian consumer protection law.',
    ],
  },
  {
    heading: 'Artisan bookings (FixIt)',
    paragraphs: [
      'Bookings are an agreement between you and the artisan. The price shown is an estimate based on their hourly rate. Payment is made directly to the artisan, not through the app. If something goes wrong, contact the artisan first, then ' + BRAND.supportEmail + ' and we will help where we can.',
    ],
  },
  {
    heading: 'Paid plans',
    bullets: [
      `Vendor Featured: ${naira(prices.vendorFeatured)} for 30 days, with unlimited listings and a Featured badge.`,
      `FixIt Verified: ${naira(prices.fixitVerified)} for 30 days, with a Verified badge.`,
      'Plans do not renew automatically. When a plan ends, your account returns to the free plan unless you pay again.',
      'Plan fees are not refundable once the plan is active, except where we fail to provide what you paid for or the law requires a refund.',
    ],
  },
  {
    heading: 'Reviews and content you post',
    paragraphs: [
      'Reviews must be honest and based on a real experience. You keep ownership of photos and text you post, and give us permission to display them in the app and use them to promote your listing on ' + BRAND.name + '. We may remove content that breaks these terms.',
    ],
  },
  {
    heading: 'Things you must not do',
    bullets: [
      'Mislead, defraud or harass other members, or ask them to pay outside the agreed arrangement to avoid our rules.',
      'Post false reviews or create fake accounts.',
      'Collect other members\' personal data, or use it for anything other than completing a transaction.',
      'Interfere with, copy or attempt to break the security of the app.',
    ],
  },
  {
    heading: 'Suspension and closing your account',
    paragraphs: [
      `We may suspend or close accounts that break these terms or put others at risk, and we will tell you why unless the law or safety prevents it. You can close your account at any time by emailing ${BRAND.supportEmail}.`,
    ],
  },
  {
    heading: 'Our responsibility to you',
    paragraphs: [
      `We work to keep ${BRAND.name} available and safe, but we provide it "as is" and cannot promise it will always be uninterrupted or error-free. To the extent the law allows, we are not responsible for the acts of vendors, artisans or riders, or for indirect losses such as lost profits. Where we are responsible, our total liability to you is limited to the fees you paid us in the 3 months before the claim. Nothing in these terms limits liability that cannot be limited under Nigerian law.`,
    ],
  },
  {
    heading: 'Changes, disputes and governing law',
    paragraphs: [
      'We may update these terms and will tell you about significant changes in the app or by email. Continuing to use the service after that means you accept the updated terms.',
      `These terms are governed by the laws of the Federal Republic of Nigeria. If a dispute arises, please contact ${BRAND.supportEmail} first so we can try to resolve it. If we cannot, the courts of the Federal Capital Territory, Abuja will have jurisdiction.`,
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      `Support: ${BRAND.supportEmail}. Partnerships: ${BRAND.partnersEmail}. Privacy: ${BRAND.privacyEmail}.`,
    ],
  },
];
