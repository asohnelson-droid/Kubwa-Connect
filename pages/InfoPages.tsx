
import React, { useState } from 'react';
import { AppSection } from '../types';
import { ArrowLeft, Mail, MapPin, Phone, ChevronDown, ChevronUp, Globe } from 'lucide-react';

interface InfoPagesProps {
  section: AppSection;
  setSection: (section: AppSection) => void;
}

const InfoPages: React.FC<InfoPagesProps> = ({ section, setSection }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const renderContent = () => {
    switch (section) {
      case AppSection.ABOUT:
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-kubwa-green">About Kubwa Connect</h2>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-gray-700 leading-relaxed mb-4">
                Kubwa Connect is the first community super app designed specifically for the residents of Kubwa, Abuja. 
                Our mission is to bridge the gap between local vendors, skilled artisans, logistics providers, and the everyday people who need their services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Whether you need fresh groceries from the market, a reliable plumber to fix a leak, or a rider to deliver a package across town, 
                Kubwa Connect brings it all to your fingertips. We are built for the community, by the community.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mt-6">
              <div className="p-3 bg-white shadow-sm rounded-lg border">
                <h3 className="font-bold text-xl text-kubwa-orange">500+</h3>
                <p className="text-xs text-gray-500">Vendors</p>
              </div>
              <div className="p-3 bg-white shadow-sm rounded-lg border">
                <h3 className="font-bold text-xl text-kubwa-green">1k+</h3>
                <p className="text-xs text-gray-500">Daily Users</p>
              </div>
              <div className="p-3 bg-white shadow-sm rounded-lg border">
                <h3 className="font-bold text-xl text-blue-600">24/7</h3>
                <p className="text-xs text-gray-500">Support</p>
              </div>
            </div>
          </div>
        );

      case AppSection.CONTACT:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-kubwa-green">Contact Us</h2>
            <p className="text-gray-600">We'd love to hear from you. Reach out to us for support, partnerships, or feedback.</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Visit Us</h3>
                  <p className="text-gray-600">FCDA Extension,<br/>Kubwa, Abuja, Nigeria</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border">
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Email Us</h3>
                  <p className="text-gray-600">support@kubwaconnect.com</p>
                  <p className="text-gray-600">partners@kubwaconnect.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border">
                <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Call Us</h3>
                  <p className="text-gray-600">+234 800 KUBWA HELP</p>
                  <p className="text-gray-600">+234 900 123 4567</p>
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
            <h2 className="text-2xl font-bold text-kubwa-green">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqs.map((item, index) => (
                <div key={index} className="bg-white border rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-4 text-left font-bold text-gray-700 hover:bg-gray-50"
                  >
                    {item.q}
                    {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openFaq === index && (
                    <div className="p-4 pt-0 text-sm text-gray-600 bg-gray-50 border-t">
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
            <h2 className="text-2xl font-bold text-kubwa-green">Privacy Policy</h2>
            <div className="prose prose-sm text-gray-600">
              <p className="font-bold">Last Updated: October 2023</p>
              <p>At Kubwa Connect, we prioritize your privacy. This policy outlines how we collect, use, and protect your personal information.</p>
              
              <h4 className="font-bold text-gray-800 mt-4">1. Information We Collect</h4>
              <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact support. This includes your name, email, phone number, and location data for deliveries.</p>

              <h4 className="font-bold text-gray-800 mt-4">2. How We Use Your Information</h4>
              <p>We use your data to facilitate orders, improve our app, and communicate with you. Your location data is shared with riders only during an active delivery.</p>

              <h4 className="font-bold text-gray-800 mt-4">3. Data Security</h4>
              <p>We implement industry-standard security measures to protect your data. Payment information is processed securely by third-party providers (Paystack/Flutterwave) and is not stored on our servers.</p>
            </div>
          </div>
        );

      case AppSection.TERMS:
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-kubwa-green">Terms of Service</h2>
            <div className="prose prose-sm text-gray-600">
              <p className="font-bold">Last Updated: October 2023</p>
              <p>By using Kubwa Connect, you agree to these terms. Please read them carefully.</p>
              
              <h4 className="font-bold text-gray-800 mt-4">1. Acceptable Use</h4>
              <p>You agree not to use the app for any illegal purposes. Vendors must ensure all listed products comply with local laws.</p>

              <h4 className="font-bold text-gray-800 mt-4">2. User Accounts</h4>
              <p>You are responsible for maintaining the confidentiality of your account password. Any activity under your account is your responsibility.</p>

              <h4 className="font-bold text-gray-800 mt-4">3. Limitation of Liability</h4>
              <p>Kubwa Connect acts as a platform connecting users. We are not liable for the quality of services provided by independent artisans or vendors, though we strive to vet all providers.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-gray-50">
      <button 
        onClick={() => setSection(AppSection.HOME)}
        className="flex items-center gap-2 text-gray-600 mb-6 hover:text-kubwa-green transition-colors"
      >
        <ArrowLeft size={20} /> Back to Home
      </button>

      {renderContent()}

      <div className="mt-12 pt-8 border-t text-center text-gray-400 text-xs">
        <p>&copy; {new Date().getFullYear()} Kubwa Connect. All rights reserved.</p>
      </div>
    </div>
  );
};

export default InfoPages;
