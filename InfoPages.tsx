

import React, { useState } from 'react';
import { AppSection, User } from '../types';
import { ArrowLeft, Mail, MapPin, Phone, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { BackButton } from '../components/ui';

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
            <h2 className="font-display text-2xl font-bold text-kubwa-primary">About Kubwa Connect</h2>
            <div className="bg-kubwa-mart/5 p-5 rounded-2xl border border-kubwa-mart/10">
              <p className="text-gray-700 leading-relaxed mb-4 text-sm font-medium">
                Kubwa Connect is the first community super app designed specifically for the residents of Kubwa, Abuja. 
                Our mission is to bridge the gap between local vendors, skilled artisans, logistics providers, and the everyday people who need their services.
              </p>
              <p className="text-gray-700 leading-relaxed text-sm font-medium">
                Whether you need fresh groceries from the market, a reliable plumber to fix a leak, or a rider to deliver a package across town, 
                Kubwa Connect brings it all to your fingertips. We are built for the community, by the community.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center mt-6">
              <div className="p-4 bg-white shadow-sm rounded-2xl border border-gray-100">
                <h3 className="font-display font-bold text-xl text-kubwa-fixit">500+</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Vendors</p>
              </div>
              <div className="p-4 bg-white shadow-sm rounded-2xl border border-gray-100">
                <h3 className="font-display font-bold text-xl text-kubwa-mart">1k+</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Daily users</p>
              </div>
              <div className="p-4 bg-white shadow-sm rounded-2xl border border-gray-100">
                <h3 className="font-display font-bold text-xl text-kubwa-ride">24/7</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Support</p>
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
                  <p className="text-gray-500 text-sm font-medium mt-0.5">FCDA Extension,<br/>Kubwa, Abuja, Nigeria</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="bg-kubwa-mart/10 p-3 rounded-2xl text-kubwa-mart shrink-0">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-kubwa-ink text-sm">Email us</h3>
                  <p className="text-gray-500 text-sm font-medium mt-0.5">support@kubwaconnect.com</p>
                  <p className="text-gray-500 text-sm font-medium">partners@kubwaconnect.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="bg-kubwa-fixit/10 p-3 rounded-2xl text-kubwa-fixit shrink-0">
                  <Phone size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-kubwa-ink text-sm">Call us</h3>
                  <p className="text-gray-500 text-sm font-medium mt-0.5">+234 800 KUBWA HELP</p>
                  <p className="text-gray-500 text-sm font-medium">+234 900 123 4567</p>
                </div>
              </div>
            </div>
          </div>
        );

      case AppSection.FAQ:
        const faqs = [
          { q: "How do I become a vendor?", a: "Simply sign up, select 'Vendor' as your role during registration, and upgrade to a Pro plan to start listing unlimited products." },
          { q: "Is payment secure?", a: "Yes, we use Flutterwave and Paystack, two of the most secure payment gateways in Africa, to process all transactions." },
          { q: "How does delivery work?", a: "When you book a ride or order an item, a nearby rider accepts your request and brings it directly to your saved address." },
          { q: "Can I cancel a service booking?", a: "Yes, you can cancel a booking up to 1 hour before the scheduled time for a full refund." },
          { q: "What is the Basic plan?", a: "The Basic plan is free and allows vendors to list up to 3 products. Regular users don't need a subscription." }
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
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-kubwa-primary">Privacy Policy</h2>
            <div className="prose prose-sm text-gray-600 text-sm font-medium leading-relaxed">
              <p className="font-bold text-kubwa-ink">Last updated: October 2023</p>
              <p>At Kubwa Connect, we prioritize your privacy. This policy outlines how we collect, use, and protect your personal information.</p>
              
              <h4 className="font-bold text-kubwa-ink mt-4">1. Information we collect</h4>
              <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact support. This includes your name, email, phone number, and location data for deliveries.</p>

              <h4 className="font-bold text-kubwa-ink mt-4">2. How we use your information</h4>
              <p>We use your data to facilitate orders, improve our app, and communicate with you. Your location data is shared with riders only during an active delivery.</p>

              <h4 className="font-bold text-kubwa-ink mt-4">3. Data security</h4>
              <p>We implement industry-standard security measures to protect your data. Payment information is processed securely by third-party providers (Paystack/Flutterwave) and is not stored on our servers.</p>
            </div>
          </div>
        );

      case AppSection.TERMS:
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-kubwa-primary">Terms of Service</h2>
            <div className="prose prose-sm text-gray-600 text-sm font-medium leading-relaxed">
              <p className="font-bold text-kubwa-ink">Last updated: October 2023</p>
              <p>By using Kubwa Connect, you agree to these terms. Please read them carefully.</p>
              
              <h4 className="font-bold text-kubwa-ink mt-4">1. Acceptable use</h4>
              <p>You agree not to use the app for any illegal purposes. Vendors must ensure all listed products comply with local laws.</p>

              <h4 className="font-bold text-kubwa-ink mt-4">2. User accounts</h4>
              <p>You are responsible for maintaining the confidentiality of your account password. Any activity under your account is your responsibility.</p>

              <h4 className="font-bold text-kubwa-ink mt-4">3. Limitation of liability</h4>
              <p>Kubwa Connect acts as a platform connecting users. We are not liable for the quality of services provided by independent artisans or vendors, though we strive to vet all providers.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-kubwa-surface">
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

      <div className="mt-12 pt-8 border-t border-gray-100 text-center text-gray-400 text-xs font-medium">
        <p>&copy; {new Date().getFullYear()} Kubwa Connect. All rights reserved.</p>
      </div>
    </div>
  );
};

export default InfoPages;
