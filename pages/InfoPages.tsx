

import React, { useEffect, useState } from 'react';
import { AppSection, User } from '../types';
import { ArrowLeft, Mail, MapPin, Phone, ChevronDown, ChevronUp, Globe, ShoppingBag, Wrench, Truck, Store, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/data';
import { City, NgState } from '../types';
import { BackButton } from '../components/ui';
import { BRAND } from '../config/brand';
import { LEGAL_LAST_UPDATED, LegalSection, privacySections, termsSections } from '../config/legal';
import { PaymentService } from '../services/payments';

const LegalDocument: React.FC<{ title: string; intro: string; sections: LegalSection[] }> = ({ title, intro, sections }) => (
  <div className="space-y-4 animate-fade-in">
    <h2 className="font-display text-2xl font-bold text-kubwa-primary">{title}</h2>
    <p className="text-xs font-bold text-gray-500">Last updated: {LEGAL_LAST_UPDATED}</p>
    <p className="text-sm text-gray-700 font-medium leading-relaxed">{intro}</p>
    <div className="space-y-6 pt-2">
      {sections.map((section, i) => (
        <section key={section.heading} className="text-sm text-gray-700 font-medium leading-relaxed">
          <h3 className="font-bold text-kubwa-ink text-base mb-2">{i + 1}. {section.heading}</h3>
          {section.paragraphs?.map((para, j) => <p key={j} className="mb-2">{para}</p>)}
          {section.bullets && (
            <ul className="list-disc pl-5 space-y-1.5 mb-2">
              {section.bullets.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          )}
          {section.after?.map((para, j) => <p key={j} className="mb-2">{para}</p>)}
        </section>
      ))}
    </div>
  </div>
);

const Steps: React.FC<{ icon: React.ElementType; title: string; tint: string; steps: string[] }> = ({ icon: Icon, title, tint, steps }) => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}><Icon size={18} /></div>
      <h3 className="font-bold text-kubwa-ink text-base">{title}</h3>
    </div>
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-gray-700 font-medium leading-relaxed">
          <span className="w-6 h-6 rounded-full bg-gray-100 text-kubwa-ink text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  </section>
);

const TipList: React.FC<{ title: string; tips: string[] }> = ({ title, tips }) => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <h3 className="font-bold text-kubwa-ink text-base mb-3">{title}</h3>
    <ul className="space-y-2.5">
      {tips.map((tip, i) => (
        <li key={i} className="flex gap-3 text-sm text-gray-700 font-medium leading-relaxed">
          <CheckCircle2 size={18} className="text-kubwa-mart shrink-0 mt-0.5" />
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  </section>
);

/** Live cities and the ones opening next, straight from the cities table. */
const CitiesList: React.FC = () => {
  const [cities, setCities] = useState<City[] | null>(null);
  const [states, setStates] = useState<NgState[]>([]);
  useEffect(() => {
    api.locations.getCities().then(setCities).catch(() => setCities([]));
    api.locations.getStates().then(setStates).catch(() => setStates([]));
  }, []);
  const stateName = (id: number) => states.find(s => s.id === id)?.name ?? '';
  if (!cities) return <p className="text-sm text-gray-500 font-medium">Loading cities...</p>;
  const live = cities.filter(c => c.isLive);
  const soon = cities.filter(c => !c.isLive);
  const Row: React.FC<{ c: City; isLive: boolean }> = ({ c, isLive }) => (
    <li className="flex items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-100">
      <div className="flex items-center gap-3 min-w-0">
        <MapPin size={18} className={isLive ? 'text-kubwa-mart shrink-0' : 'text-gray-400 shrink-0'} />
        <div className="min-w-0">
          <p className="font-bold text-sm text-kubwa-ink truncate">{c.name}</p>
          {stateName(c.stateId) && <p className="text-xs text-gray-500 font-semibold">{stateName(c.stateId) === 'Federal Capital Territory' ? 'FCT' : `${stateName(c.stateId)} State`}</p>}
        </div>
      </div>
      {isLive
        ? <span className="px-3 py-1 rounded-full bg-kubwa-mart/10 text-kubwa-martText text-xs font-bold shrink-0">Live</span>
        : <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center gap-1 shrink-0"><Clock size={12} /> Coming soon</span>}
    </li>
  );
  return (
    <div className="space-y-6">
      {live.length > 0 && (
        <div>
          <h3 className="font-bold text-kubwa-ink text-base mb-3">Live now</h3>
          <ul className="space-y-2">{live.map(c => <Row key={c.id} c={c} isLive />)}</ul>
        </div>
      )}
      {soon.length > 0 && (
        <div>
          <h3 className="font-bold text-kubwa-ink text-base mb-3">Opening next</h3>
          <ul className="grid gap-2 sm:grid-cols-2">{soon.map(c => <Row key={c.id} c={c} isLive={false} />)}</ul>
        </div>
      )}
    </div>
  );
};

interface InfoPagesProps {
  section: AppSection;
  setSection: (section: AppSection) => void;
  goBack?: () => void;
  user?: User | null;
}

const InfoPages: React.FC<InfoPagesProps> = ({ section, setSection, goBack, user }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const renderContent = () => {
    switch (section) {
      case AppSection.ABOUT:
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-kubwa-primary">About {BRAND.name}</h2>
            <div className="bg-kubwa-mart/5 p-5 rounded-2xl border border-kubwa-mart/10">
              <p className="text-gray-700 leading-relaxed mb-4 text-sm font-medium">
                {BRAND.name} is a super app for everyday life in Nigeria. It started in Kubwa, Abuja, and is opening city by city.
                Our mission is to connect local vendors, skilled artisans and delivery riders with the people near them who need their services.
              </p>
              <p className="text-gray-700 leading-relaxed text-sm font-medium">
                Whether you need fresh groceries from the market, a reliable plumber to fix a leak, or a rider to deliver a package across town, 
                {BRAND.name} brings it all to your fingertips, from people in your own city.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center mt-6">
              <div className="p-4 bg-white shadow-sm rounded-2xl border border-gray-100">
                <h3 className="font-display font-bold text-base text-kubwa-martText">Mart</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Local vendors</p>
              </div>
              <div className="p-4 bg-white shadow-sm rounded-2xl border border-gray-100">
                <h3 className="font-display font-bold text-base text-kubwa-fixitText">FixIt</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Vetted artisans</p>
              </div>
              <div className="p-4 bg-white shadow-sm rounded-2xl border border-gray-100">
                <h3 className="font-display font-bold text-base text-kubwa-rideText">Ride</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">City delivery</p>
              </div>
            </div>
          </div>
        );

      case AppSection.CONTACT:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-kubwa-primary">Contact Us</h2>
            <p className="text-gray-600 text-sm font-medium">We'd love to hear from you. Reach out to us for support, partnerships, or feedback.</p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="bg-kubwa-ride/10 p-3 rounded-2xl text-kubwa-ride shrink-0">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-kubwa-ink text-sm">Visit us</h3>
                  <p className="text-gray-500 text-sm font-medium mt-0.5">Abuja, Nigeria</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="bg-kubwa-mart/10 p-3 rounded-2xl text-kubwa-mart shrink-0">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-kubwa-ink text-sm">Email us</h3>
                  <p className="text-gray-500 text-sm font-medium mt-0.5">{BRAND.supportEmail}</p>
                  <p className="text-gray-500 text-sm font-medium">{BRAND.partnersEmail}</p>
                </div>
              </div>

            </div>
          </div>
        );

      case AppSection.FAQ:
        const faqs = [
          { q: "How do I start selling?", a: `Sign up, choose Vendor, and complete your shop details. We review every new vendor before your shop goes live. The free plan lets you list up to 4 products; Vendor Featured (₦${PaymentService.getPrice('VENDOR_FEATURED').toLocaleString()} for 30 days) gives unlimited listings and a Featured badge.` },
          { q: "Is paying online safe?", a: "Yes. Online payments are handled by Paystack, and your card or bank details go straight to them; we never see or store them. You can also choose to pay on delivery or at pickup." },
          { q: "How does delivery work?", a: "Rider delivery is available when you and the vendor are in the same live city. You see the rider fee before ordering and pay it to the rider on delivery. If you're in a different city, you can pick up from the vendor or arrange delivery with them." },
          { q: "Which cities are live?", a: `We're opening city by city, starting with Abuja. You can sign up from anywhere in Nigeria and browse listings from every live city. Vendors, artisans and riders elsewhere can register now and go live when their city opens.` },
          { q: "Can I cancel an order?", a: `Yes, before the vendor dispatches it. Contact the vendor or email ${BRAND.supportEmail} with your order details.` },
          { q: "What if my order is wrong or doesn't arrive?", a: `Contact the vendor first. If it isn't resolved, email ${BRAND.supportEmail} within 7 days. For orders paid online, approved refunds go back to your original payment method through Paystack. See the Terms of Service for details.` },
          { q: "How do I pay an artisan?", a: "Artisan bookings on FixIt are paid directly to the artisan, not through the app. Agree the price and scope with them before work starts." },
          { q: "How do I delete my account or get a copy of my data?", a: `Email ${BRAND.privacyEmail} from the email address on your account. We reply within 30 days. See the Privacy Policy for your full rights.` }
        ];
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-kubwa-primary">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqs.map((item, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-4 text-left font-bold text-sm text-kubwa-ink hover:bg-gray-50"
                  >
                    {item.q}
                    {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openFaq === index && (
                    <div className="p-4 pt-0 text-sm text-gray-600 font-medium bg-gray-50 border-t border-gray-100">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case AppSection.HOW_IT_WORKS:
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-kubwa-primary">How {BRAND.name} works</h2>
            <p className="text-sm text-gray-700 font-medium leading-relaxed">One app to shop from local sellers, hire artisans and send packages. Here is how each part works.</p>
            <Steps icon={ShoppingBag} tint="bg-kubwa-mart/10 text-kubwa-mart" title="Shop on Mart" steps={[
              'Choose your location, then browse products from verified vendors in your city or across Nigeria.',
              'Add items to your cart and check out. Pay online securely with Paystack, or pay on delivery or at pickup where the vendor allows it.',
              'Choose rider delivery if you and the vendor are in the same live city, or arrange pickup with the vendor.',
            ]} />
            <Steps icon={Wrench} tint="bg-kubwa-fixit/10 text-kubwa-fixitText" title="Hire on FixIt" steps={[
              'Search for the service you need: plumbing, electrical, cleaning, repairs and more.',
              'Compare artisans by their rates, reviews and Verified badge, then send a booking request.',
              'Agree the price and scope with the artisan before work starts. You pay the artisan directly.',
            ]} />
            <Steps icon={Truck} tint="bg-kubwa-ride/10 text-kubwa-ride" title="Send with Ride" steps={[
              'Enter the pickup and drop-off addresses and tell us what you are sending.',
              'See the delivery fee upfront and send your request to riders nearby.',
              'Track the delivery until it arrives, and pay the rider on delivery.',
            ]} />
            <Steps icon={Store} tint="bg-kubwa-primary/10 text-kubwa-primary" title="Sell, work or ride with us" steps={[
              'Create an account and choose Vendor, Artisan or Rider.',
              'Add your details and location. Our team reviews every application before it goes live.',
              'Once approved, start listing products, taking bookings or accepting delivery jobs.',
            ]} />
          </div>
        );

      case AppSection.SAFETY:
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-kubwa-primary">Safety tips</h2>
            <p className="text-sm text-gray-700 font-medium leading-relaxed">We review every vendor, artisan and rider before they go live, but a few simple habits keep every deal safe.</p>
            <TipList title="When you buy" tips={[
              'Pay through the app with Paystack where you can. Your card details go straight to Paystack and are never shared with the seller.',
              'If you pay on delivery or at pickup, inspect the item before you hand over money.',
              'Meet in busy public places for pickups, and bring someone along for high-value items.',
              'Be wary of prices that look too good to be true, or sellers who push you to pay outside the app.',
            ]} />
            <TipList title="When you hire an artisan" tips={[
              'Check reviews and look for the Verified badge before you book.',
              'Agree the price, materials and timeline before any work starts.',
              'Avoid paying the full amount upfront for large jobs. Agree staged payments as work is completed.',
            ]} />
            <TipList title="When you sell or deliver" tips={[
              'Confirm the payment has landed before you release goods; a screenshot is not proof of payment.',
              'Keep conversations and agreements in writing so there is a record.',
              'Riders: confirm pickup and drop-off details with the customer before you set off.',
            ]} />
            <section className="bg-kubwa-ink text-white rounded-2xl p-5 flex gap-4 items-start">
              <ShieldCheck size={22} className="text-kubwa-amber shrink-0 mt-0.5" />
              <div className="text-sm font-medium leading-relaxed">
                <p className="font-bold mb-1">We will never ask for your PIN, password or OTP.</p>
                <p className="text-white/75">Report a suspicious listing, user or message to {BRAND.supportEmail} and we will look into it.</p>
              </div>
            </section>
          </div>
        );

      case AppSection.CITIES:
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-kubwa-primary">Cities we serve</h2>
            <p className="text-sm text-gray-700 font-medium leading-relaxed">
              You can sign up and shop from anywhere in Nigeria. Rider delivery and local listings open city by city. Vendors, artisans and riders in upcoming cities can register now and go live the day their city opens.
            </p>
            <CitiesList />
          </div>
        );

      case AppSection.PRIVACY:
        return (
          <LegalDocument
            title="Privacy Policy"
            intro={`This policy explains how ${BRAND.name} collects, uses and protects your personal data, and the rights you have under the Nigeria Data Protection Act 2023.`}
            sections={privacySections()}
          />
        );

      case AppSection.TERMS:
        return (
          <LegalDocument
            title="Terms of Service"
            intro={`Please read these terms before using ${BRAND.name}. They explain how the marketplace works and what we and you are each responsible for.`}
            sections={termsSections({
              vendorFeatured: PaymentService.getPrice('VENDOR_FEATURED'),
              fixitVerified: PaymentService.getPrice('FIXIT_VERIFIED'),
            })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-kubwa-surface md:max-w-3xl md:mx-auto md:px-0 md:pt-8 md:pb-0 md:min-h-0">
      {user && goBack ? (
        <BackButton onClick={goBack} />
      ) : (
        <button 
          onClick={() => setSection(AppSection.HOME)}
          className="flex items-center gap-2 text-gray-600 mb-6 hover:text-kubwa-primary transition-colors text-sm font-bold"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      )}

      {renderContent()}

      <div className="mt-12 pt-8 border-t border-gray-100 text-center text-gray-500 text-xs font-medium">
        <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
      </div>
    </div>
  );
};

export default InfoPages;
