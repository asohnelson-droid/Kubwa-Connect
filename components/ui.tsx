import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }> = ({ 
  children, variant = 'primary', className = '', ...props 
}) => {
  const baseStyle = "px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 select-none";
  
  const variants = {
    primary: "bg-kubwa-green text-white hover:brightness-110 hover:shadow-xl hover:shadow-kubwa-green/30 shadow-lg shadow-kubwa-green/10",
    secondary: "bg-kubwa-orange text-white hover:brightness-110 hover:shadow-xl hover:shadow-kubwa-orange/30 shadow-lg shadow-kubwa-orange/10",
    outline: "border-2 border-gray-200 bg-white text-gray-900 hover:border-kubwa-green hover:text-kubwa-green hover:shadow-md",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({ children, color = 'bg-gray-100 text-gray-600', className = '' }) => (
  <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent shadow-sm flex items-center gap-1.5 w-fit ${color} ${className}`}>
    {children}
  </span>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-kubwa-green/5 focus:border-kubwa-green transition-all placeholder:text-gray-300 font-bold text-gray-800 ${className}`}
    {...props}
  />
);

export const Sheet: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title?: string }> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-[3rem] overflow-hidden flex flex-col max-h-[94vh] shadow-2xl animate-slide-in-bottom">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-200 rounded-full z-10" />
        {title && (
          <div className="pt-10 px-8 pb-4">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{title}</h3>
          </div>
        )}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8 px-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Breadcrumbs: React.FC<{ items: { label: string; onClick?: () => void }[] }> = ({ items }) => (
  <nav className="flex text-[9px] font-black uppercase tracking-widest text-gray-400 mb-6 items-center flex-wrap gap-2">
    {items.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && <span className="text-gray-200">/</span>}
        <button
          onClick={item.onClick}
          className={`transition-colors ${item.onClick ? 'hover:text-kubwa-green cursor-pointer' : 'text-gray-900 pointer-events-none'}`}
          disabled={!item.onClick}
        >
          {item.label}
        </button>
      </React.Fragment>
    ))}
  </nav>
);