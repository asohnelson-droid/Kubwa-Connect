/**
 * Search landing pages: "Plumbers in Kubwa", "Fashion in Abuja", "Sell online in Abuja".
 *
 * Each page has written copy (below) plus live listings from the database,
 * so it is useful to the person who lands on it. Area pages are hidden from
 * search engines until at least one matching artisan lists in that area,
 * so Google never sees a batch of empty look-alike pages.
 *
 * To add a page: add a service, area or category here. The build writes its
 * HTML file and sitemap entry; the app shows it at its address.
 */

export const LANDING_CITY = 'Abuja';

export interface ServiceDef {
  /** The FixIt category stored on each artisan. */
  category: string;
  slug: string;
  plural: string;
  singular: string;
  summary: string;
  jobs: string[];
  tips: string[];
  /** true = also gets a page per area. */
  areaPages: boolean;
}

export interface AreaDef {
  slug: string;
  name: string;
  /** Area council (LGA) the area sits in. */
  lga: string;
  /** Lower-case words that identify the area in an artisan's address. */
  match: string[];
  nearby: string[];
}

export interface MartCategoryDef {
  /** The product category stored on each listing. */
  id: string;
  slug: string;
  label: string;
  summary: string;
  examples: string[];
}

export type JoinRole = 'VENDOR' | 'PROVIDER' | 'RIDER';

export interface JoinDef {
  slug: string;
  role: JoinRole;
  title: string;
  description: string;
  h1: string;
  intro: string;
  benefits: string[];
  steps: string[];
  cta: string;
}

export const SERVICES: ServiceDef[] = [
  {
    category: 'Plumbing', slug: 'plumbers', plural: 'Plumbers', singular: 'plumber', areaPages: true,
    summary: 'Leaks, blocked drains, toilets, water heaters and tank connections.',
    jobs: ['Fixing leaking pipes and taps', 'Clearing blocked sinks, toilets and drains', 'Installing water heaters', 'Connecting overhead tanks and pumps', 'Fitting bathroom and kitchen fixtures'],
    tips: ['Describe or photograph the problem when you book, so they bring the right parts.', 'Agree who buys the fittings before work starts.', 'Ask them to run the water and check for leaks before they leave.'],
  },
  {
    category: 'Electrical Repairs', slug: 'electricians', plural: 'Electricians', singular: 'electrician', areaPages: true,
    summary: 'Wiring faults, sockets, lighting and power problems at home or in the office.',
    jobs: ['Fixing faulty sockets and switches', 'Fault tracing and rewiring', 'Installing lights, fans and fittings', 'Changeover and distribution board work', 'Inverter and solar wiring checks'],
    tips: ['Switch off power at the mains before work starts.', 'For rewiring, agree the cost of materials separately from labour.', 'Ask for a quick test of every point they worked on before you pay.'],
  },
  {
    category: 'AC Repairs', slug: 'ac-repair', plural: 'AC repairers', singular: 'AC repairer', areaPages: true,
    summary: 'ACs not cooling, leaking or noisy, plus servicing and installation.',
    jobs: ['AC servicing and cleaning', 'Gas refilling', 'Fixing leaks and noise', 'New AC installation', 'Moving AC units'],
    tips: ['Tell them the brand and horsepower of your unit when you book.', 'Ask which gas they will use for a refill.', 'Regular servicing keeps the unit cooling properly.'],
  },
  {
    category: 'Generator Repairs', slug: 'generator-repair', plural: 'Generator repairers', singular: 'generator repairer', areaPages: true,
    summary: 'Petrol and diesel generators that will not start, overheat or keep going off.',
    jobs: ['Servicing and oil changes', 'Fixing starting problems', 'Carburettor cleaning', 'AVR and wiring faults', 'Changeover connection'],
    tips: ['Tell them the brand and size (KVA) when you book.', 'Agree whether the repair happens at your place or at their workshop.', 'Ask for the old parts back when parts are replaced.'],
  },
  {
    category: 'Cleaning Services', slug: 'cleaners', plural: 'Cleaners', singular: 'cleaner', areaPages: true,
    summary: 'Home, office, post-construction and move-in cleaning.',
    jobs: ['Regular home cleaning', 'Deep cleaning', 'Post-construction cleaning', 'Move-in and move-out cleaning', 'Office cleaning'],
    tips: ['Agree the rooms and tasks before they start.', 'Confirm who brings the cleaning supplies.', 'Put away valuables and fragile items first.'],
  },
  {
    category: 'Painting', slug: 'painters', plural: 'Painters', singular: 'painter', areaPages: false,
    summary: 'Interior and exterior painting, screeding and touch-ups.',
    jobs: ['Interior walls and ceilings', 'Exterior painting', 'Screeding and wall preparation', 'Touch-ups before moving in', 'Office and shop repainting'],
    tips: ['Agree the paint brand and number of coats.', 'Ask for a small sample patch of the colour first.', 'Cover furniture and floors before work starts.'],
  },
  {
    category: 'Carpentry', slug: 'carpenters', plural: 'Carpenters', singular: 'carpenter', areaPages: false,
    summary: 'Furniture, doors, wardrobes, kitchen cabinets and roofing woodwork.',
    jobs: ['Furniture repairs', 'Doors and locks', 'Wardrobes and kitchen cabinets', 'Shelving and fittings', 'Roofing woodwork'],
    tips: ['Share measurements or a photo of what you want.', 'Agree the type of wood to be used.', 'For custom work, agree a timeline and pay in stages.'],
  },
  {
    category: 'Installations', slug: 'installation-services', plural: 'Installers', singular: 'installer', areaPages: false,
    summary: 'TV mounting, CCTV, solar, satellite and appliance installation.',
    jobs: ['TV wall mounting', 'CCTV and doorbell cameras', 'Solar panels and inverters', 'Satellite dishes and decoders', 'Appliance installation'],
    tips: ['Check the item manual for what installation needs.', 'Agree where cables will run before drilling starts.', 'Test everything together before they leave.'],
  },
  {
    category: 'Phone & Laptop Repairs', slug: 'phone-and-laptop-repair', plural: 'Phone and laptop repairers', singular: 'phone and laptop repairer', areaPages: false,
    summary: 'Cracked screens, charging faults, batteries, software and water damage.',
    jobs: ['Screen replacement', 'Charging port and battery replacement', 'Software, virus and data recovery', 'Keyboard and hinge repairs', 'Water damage checks'],
    tips: ['Back up your data before you hand over a device.', 'Ask whether replacement parts are original or compatible.', 'Test the device in front of them before you pay.'],
  },
  {
    category: 'Home Tutoring', slug: 'home-tutors', plural: 'Home tutors', singular: 'home tutor', areaPages: false,
    summary: 'Lessons at home for primary, secondary and exam preparation.',
    jobs: ['Primary school lessons', 'Secondary school subjects', 'WAEC, NECO and JAMB preparation', 'Common Entrance preparation', 'Adult and language lessons'],
    tips: ['Agree subjects, days and lesson length up front.', 'Ask about their experience with your child’s level.', 'Sit in on the first lesson.'],
  },
  {
    category: 'Beauty & Makeup', slug: 'makeup-artists', plural: 'Makeup artists', singular: 'makeup artist', areaPages: false,
    summary: 'Makeup, gele tying and beauty services at home or for events.',
    jobs: ['Event and bridal makeup', 'Gele tying', 'Home service makeup', 'Photoshoot makeup', 'Hair styling'],
    tips: ['Share photos of the look you want.', 'Confirm any home-service fee before the day.', 'Book early for weekend events.'],
  },
];

export const AREAS: AreaDef[] = [
  { slug: 'kubwa', name: 'Kubwa', lga: 'Bwari', match: ['kubwa'], nearby: ['Dutse', 'Dawaki', 'Byazhin', 'Arab Road', 'Deidei'] },
  { slug: 'gwarinpa', name: 'Gwarinpa', lga: 'Abuja Municipal (AMAC)', match: ['gwarinpa', 'gwarimpa'], nearby: ['Life Camp', 'Jahi', 'Katampe', 'Kado', 'Dawaki'] },
  { slug: 'wuse', name: 'Wuse', lga: 'Abuja Municipal (AMAC)', match: ['wuse'], nearby: ['Wuse 2', 'Maitama', 'Utako', 'Jabi', 'Garki'] },
  { slug: 'garki', name: 'Garki', lga: 'Abuja Municipal (AMAC)', match: ['garki'], nearby: ['Wuse', 'Asokoro', 'Durumi', 'Apo'] },
  { slug: 'maitama', name: 'Maitama', lga: 'Abuja Municipal (AMAC)', match: ['maitama'], nearby: ['Wuse 2', 'Asokoro', 'Katampe', 'Mabushi'] },
  { slug: 'lugbe', name: 'Lugbe', lga: 'Abuja Municipal (AMAC)', match: ['lugbe'], nearby: ['Galadimawa', 'Lokogoma', 'Kyami', 'Airport Road'] },
];

export const MART_CATEGORIES: MartCategoryDef[] = [
  { id: 'Food', slug: 'food-and-groceries', label: 'Food and groceries', summary: 'Foodstuff, provisions, drinks, snacks and home-cooked meals from sellers near you.', examples: ['Rice, beans and garri', 'Fresh produce', 'Drinks and snacks', 'Home-cooked meals and pastries'] },
  { id: 'Fashion', slug: 'fashion', label: 'Fashion and style', summary: 'Clothes, shoes, bags, fabrics and accessories from local sellers and designers.', examples: ['Ready-to-wear clothes', 'Ankara and lace fabrics', 'Shoes and bags', 'Jewellery and accessories'] },
  { id: 'Electronics', slug: 'phones-and-gadgets', label: 'Phones and gadgets', summary: 'Phones, laptops, accessories and home electronics from verified sellers.', examples: ['Phones and tablets', 'Laptops and accessories', 'Chargers, earpieces and power banks', 'Speakers and home electronics'] },
  { id: 'Home', slug: 'home-and-living', label: 'Home and living', summary: 'Furniture, kitchenware, decor and household items for your home.', examples: ['Furniture', 'Kitchenware', 'Bedding and decor', 'Household essentials'] },
];

export const JOIN_PAGES: JoinDef[] = [
  {
    slug: 'sell-online-in-abuja', role: 'VENDOR', cta: 'Open your free shop',
    title: 'Sell online in Abuja: open a free shop | Sell Am Here',
    description: 'Open a free online shop and reach buyers across Abuja. Secure payments, pay on delivery and same-city rider delivery. Got something to sell? Sell am here.',
    h1: 'Sell online in Abuja',
    intro: 'Got something to sell? Open a free shop on Sell Am Here and reach buyers in your area, with secure payments and delivery by local riders.',
    benefits: ['A free shop page with up to 4 products', 'Buyers near you find you by area', 'Payments through Paystack, or pay on delivery', 'Same-city delivery by riders on the app', 'Upgrade to Featured for unlimited listings and top placement'],
    steps: ['Sign up and choose Vendor', 'Add your shop name and location', 'Our team reviews and approves your shop', 'List your products and start selling'],
  },
  {
    slug: 'artisan-jobs-in-abuja', role: 'PROVIDER', cta: 'List your skills',
    title: 'Get artisan jobs in Abuja | Sell Am Here FixIt',
    description: 'Plumbers, electricians, cleaners, AC and generator repairers and more: list your skills free and get booked by customers near you in Abuja.',
    h1: 'Get more jobs as an artisan in Abuja',
    intro: 'List your skills on FixIt and get booked by people near you. You set your rate, customers book you in the app, and you are paid directly.',
    benefits: ['Free listing with your rate and photos', 'Customers in your area book you in the app', 'An email for every new booking', 'Reviews that help you win more work', 'A Verified badge for extra trust'],
    steps: ['Sign up and choose Artisan', 'Add your service, rate and location', 'Our team reviews and approves your listing', 'Accept bookings and get to work'],
  },
  {
    slug: 'delivery-rider-jobs-in-abuja', role: 'RIDER', cta: 'Become a rider',
    title: 'Delivery rider jobs in Abuja | Sell Am Here Ride',
    description: 'Deliver packages and orders across Abuja with your bike and earn. Sign up free, go online when you want, and accept jobs near you.',
    h1: 'Deliver in Abuja and earn',
    intro: 'Use your bike to deliver orders and packages across Abuja. Go online when you want to work and accept the delivery jobs that suit you.',
    benefits: ['Free to join', 'Go online and offline when you choose', 'Delivery jobs from shops and people near you', 'See pickup, drop-off and fee before you accept', 'Get paid for each delivery'],
    steps: ['Sign up and choose Rider', 'Add your details and area', 'Our team reviews and approves you', 'Go online and accept jobs'],
  },
];

// ---------- The page list ----------

export type LandingKind = 'service' | 'service-area' | 'mart' | 'join' | 'hub';

export interface LandingPage {
  kind: LandingKind;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  priority: number;
  /** Area pages stay out of search until a matching artisan lists there. */
  hideFromSearchWhenEmpty: boolean;
  service?: ServiceDef;
  area?: AreaDef;
  martCategory?: MartCategoryDef;
  join?: JoinDef;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "a plumber", "an electrician", "an AC repairer". */
export const withArticle = (noun: string) => (/^(AC\b|[aeiou])/i.test(noun) ? `an ${noun}` : `a ${noun}`);

function servicePage(s: ServiceDef): LandingPage {
  return {
    kind: 'service', service: s, path: `/fixit/${s.slug}-in-abuja`, priority: 0.8, hideFromSearchWhenEmpty: false,
    title: `${s.plural} in Abuja | Sell Am Here`,
    description: `Find trusted ${lower(s.plural)} in Abuja. ${s.summary} Compare rates and reviews, then book.`,
    h1: `${s.plural} in Abuja`,
    intro: `Need ${withArticle(s.singular)} in Abuja? Compare ${lower(s.plural)} on Sell Am Here by rate, reviews and Verified badge, then book in minutes. ${s.summary}`,
  };
}

function serviceAreaPage(s: ServiceDef, a: AreaDef): LandingPage {
  return {
    kind: 'service-area', service: s, area: a, path: `/fixit/${s.slug}-in-${a.slug}`, priority: 0.6, hideFromSearchWhenEmpty: true,
    title: `${s.plural} in ${a.name}, Abuja | Sell Am Here`,
    description: `Need ${withArticle(s.singular)} in ${a.name}? Find ${lower(s.plural)} in and around ${a.name}, Abuja. Compare rates and reviews, then book on Sell Am Here.`,
    h1: `${s.plural} in ${a.name}`,
    intro: `Find ${lower(s.plural)} who work in ${a.name} and nearby areas of Abuja. Compare rates and reviews, then book in the app. ${s.summary}`,
  };
}

function martPage(c: MartCategoryDef): LandingPage {
  return {
    kind: 'mart', martCategory: c, path: `/mart/${c.slug}-in-abuja`, priority: 0.7, hideFromSearchWhenEmpty: false,
    title: `${c.label} in Abuja | Shop on Sell Am Here`,
    description: `Shop ${lower(c.label)} from verified sellers in Abuja. ${c.summary}`,
    h1: `${c.label} in Abuja`,
    intro: `${c.summary} Every seller is reviewed by our team. Pay with Paystack or on delivery, and get same-city rider delivery where it is available.`,
  };
}

function joinPage(j: JoinDef): LandingPage {
  return { kind: 'join', join: j, path: `/${j.slug}`, priority: 0.8, hideFromSearchWhenEmpty: false, title: j.title, description: j.description, h1: j.h1, intro: j.intro };
}

const HUB: LandingPage = {
  kind: 'hub', path: '/abuja', priority: 0.8, hideFromSearchWhenEmpty: false,
  title: 'Sell Am Here in Abuja: shop, hire artisans, send packages',
  description: 'Everything on Sell Am Here in Abuja: artisans by service and area, shopping by category, delivery, and how to sell, work or ride with us.',
  h1: 'Sell Am Here in Abuja',
  intro: 'Find artisans by service and area, shop from local sellers by category, or join as a vendor, artisan or rider in Abuja.',
};

export const LANDING_PAGES: LandingPage[] = [
  HUB,
  ...JOIN_PAGES.map(joinPage),
  ...SERVICES.map(servicePage),
  ...MART_CATEGORIES.map(martPage),
  ...SERVICES.filter(s => s.areaPages).flatMap(s => AREAS.map(a => serviceAreaPage(s, a))),
];

const BY_PATH = new Map(LANDING_PAGES.map(p => [p.path, p]));

export function landingForPath(pathname: string): LandingPage | null {
  const clean = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  return BY_PATH.get(clean) ?? null;
}

export const servicePagePath = (s: ServiceDef) => `/fixit/${s.slug}-in-abuja`;
export const serviceAreaPath = (s: ServiceDef, a: AreaDef) => `/fixit/${s.slug}-in-${a.slug}`;
export const martPagePath = (c: MartCategoryDef) => `/mart/${c.slug}-in-abuja`;
export const areaBySlugName = (name: string) => AREAS.find(a => a.name.toLowerCase() === name.toLowerCase());
