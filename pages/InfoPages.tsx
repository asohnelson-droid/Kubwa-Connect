

import React, { useState } from 'react';
import { AppSection, User } from '../types';
import { ArrowLeft, Mail, MapPin, Phone, ChevronDown, ChevronUp, Globe } from 'lucide-react';
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
