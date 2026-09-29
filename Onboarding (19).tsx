
import React, { useState } from 'react';
import { ShoppingBag, Wrench, Truck, ArrowRight, Check } from 'lucide-react';
import { Button } from './ui';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Kubwa Connect",
      desc: "The Super App for every resident of Kubwa. Everything you need, one tap away.",
      image: <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-6"><span className="text-4xl font-bold text-kubwa-green">KC</span></div>,
      color: "bg-white"
    },
    {
      title: "Shop Local",
      desc: "Order groceries, fashion, and essentials from your favorite Kubwa vendors. Delivered in minutes.",
      image: <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-6"><ShoppingBag size={48} className="text-kubwa-green" /></div>,
      color: "bg-green-50"
    },
    {
      title: "Hire Pros",
      desc: "Need a plumber, electrician, or cleaner? Find verified artisans in your neighborhood.",
      image: <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6"><Wrench size={48} className="text-kubwa-orange" /></div>,
      color: "bg-orange-50"
    },
    {
      title: "Move It",
      desc: "Book rides and deliveries instantly. Track your packages in real-time.",
      image: <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-6"><Truck size={48} className="text-blue-600" /></div>,
      color: "bg-blue-50"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors duration-500 ${steps[step].color}`}>
        <div className="animate-zoom-in flex flex-col items-center">
          {steps[step].image}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{steps[step].title}</h2>
          <p className="text-gray-500 leading-relaxed max-w-xs">{steps[step].desc}</p>
        </div>
      </div>

      <div className="p-6 bg-white w-full">
        <div className="flex gap-1 justify-center mb-6">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-kubwa-green' : 'w-2 bg-gray-200'}`} 
            />
          ))}
        </div>

        <Button onClick={handleNext} className="w-full py-3 text-lg flex items-center justify-center gap-2">
          {step === steps.length - 1 ? (
            <>Get Started <Check size={20} /></>
          ) : (
            <>Next <ArrowRight size={20} /></>
          )}
        </Button>
        
        {step < steps.length - 1 && (
          <button onClick={onComplete} className="w-full mt-4 text-sm text-gray-400 font-bold">
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
