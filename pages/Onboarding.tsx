import React, { useState } from 'react';
import { ShoppingBag, Wrench, Truck, ArrowRight, Check, MapPin } from 'lucide-react';
import { Button } from '../components/ui';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Kubwa Connect",
      desc: "The Super App for every resident of Kubwa. Shop, hire services, and book deliveries—all in one place.",
      icon: <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-zoom-in"><MapPin size={80} className="text-white drop-shadow-lg" /></div>,
      color: "bg-kubwa-green"
    },
    {
      title: "Shop Local",
      desc: "Order groceries, fashion, and daily essentials from trusted vendors in your neighborhood.",
      icon: <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-zoom-in"><ShoppingBag size={80} className="text-white drop-shadow-lg" /></div>,
      color: "bg-red-500"
    },
    {
      title: "Hire Artisans",
      desc: "Need a plumber, electrician, or cleaner? Connect with verified pros nearby instantly.",
      icon: <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-zoom-in"><Wrench size={80} className="text-white drop-shadow-lg" /></div>,
      color: "bg-orange-500"
    },
    {
      title: "Fast Delivery",
      desc: "Send packages or request a pickup. Reliable logistics powered by local riders.",
      icon: <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-zoom-in"><Truck size={80} className="text-white drop-shadow-lg" /></div>,
      color: "bg-blue-600"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };
  
  const finish = () => {
      // Set flag in localStorage to prevent showing again
      localStorage.setItem('kubwa_onboarding_seen', 'true');
      onComplete();
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col transition-colors duration-700 ${steps[step].color} text-white`}>
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={finish}
          className="text-white/80 font-bold text-sm hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all"
        >
          Skip
        </button>
      </div>

      {/* Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
         
         <div key={step} className="relative z-10 flex flex-col items-center">
            {steps[step].icon}
         </div>
      </div>

      {/* Bottom Card */}
      <div className="bg-white text-gray-900 rounded-t-3xl p-8 pb-12 shadow-2xl animate-slide-in-bottom">
         <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${i === step ? `w-8 ${steps[step].color.replace('bg-', 'bg-')}` : 'w-2 bg-gray-200'}`} 
              >
                 {i === step && <div className={`w-full h-full rounded-full opacity-100 ${steps[step].color}`}></div>}
              </div>
            ))}
         </div>

         <div key={step} className="text-center mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-3">{steps[step].title}</h2>
            <p className="text-gray-500 leading-relaxed text-sm h-10 px-4">{steps[step].desc}</p>
         </div>

         <Button 
           onClick={handleNext} 
           className={`w-full py-4 text-lg font-bold shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 ${steps[step].color} text-white hover:opacity-90 border-none`}
         >
           {step === steps.length - 1 ? (
             <>Get Started <Check size={24} /></>
           ) : (
             <>Next <ArrowRight size={24} /></>
           )}
         </Button>
      </div>
    </div>
  );
};

export default Onboarding;