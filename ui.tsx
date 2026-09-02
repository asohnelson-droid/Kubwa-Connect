import React, { useState } from 'react';
import { ArrowLeft, ImageOff, ChevronRight } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }> = ({
  children, variant = 'primary', className = '', ...props
}) => {
  const baseStyle = "px-6 py-4 rounded-2xl font-bold text-sm tracking-tight transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 select-none";

  const variants = {
    primary: "bg-kubwa-primary text-white hover:brightness-110 hover:shadow-xl hover:shadow-kubwa-primary/30 shadow-lg shadow-kubwa-primary/15",
    secondary: "bg-kubwa-fixit text-white hover:brightness-110 hover:shadow-xl hover:shadow-kubwa-fixit/30 shadow-lg shadow-kubwa-fixit/15",
    outline: "border-2 border-gray-200 bg-white text-kubwa-ink hover:border-kubwa-primary hover:text-kubwa-primary hover:shadow-md",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-kubwa-ink",
    danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-[1.75rem] shadow-sm shadow-black/[0.03] border border-gray-100 p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({ children, color = 'bg-gray-100 text-gray-600', className = '' }) => (
  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent flex items-center gap-1.5 w-fit ${color} ${className}`}>
    {children}
  </span>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-4 focus:ring-kubwa-primary/10 focus:border-kubwa-primary transition-all placeholder:text-gray-400 placeholder:font-medium font-semibold text-kubwa-ink ${className}`}
    {...props}
  />
);

export const Sheet: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title?: string }> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-fade-in">
      <div className="absolute inset-0 bg-kubwa-ink/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] overflow-hidden flex flex-col max-h-[94vh] shadow-2xl animate-slide-in-bottom">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full z-10" />
        {title && (
          <div className="pt-10 px-8 pb-3">
            <h3 className="font-display text-xl font-bold text-kubwa-ink tracking-tight">{title}</h3>
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
  <nav className="flex text-[11px] font-bold text-gray-400 mb-6 items-center flex-wrap gap-2">
    {items.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && <span className="text-gray-200">/</span>}
        <button
          onClick={item.onClick}
          className={`transition-colors ${item.onClick ? 'hover:text-kubwa-primary cursor-pointer' : 'text-kubwa-ink pointer-events-none'}`}
          disabled={!item.onClick}
        >
          {item.label}
        </button>
      </React.Fragment>
    ))}
  </nav>
);

export const BackButton: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = "Back" }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-gray-500 hover:text-kubwa-primary transition-colors mb-6 font-bold text-xs group w-fit"
  >
    <div className="p-2 rounded-full bg-gray-100 group-hover:bg-kubwa-primary/10 transition-colors">
        <ArrowLeft size={16} />
    </div>
    {label}
  </button>
);

/**
 * An <img> that falls back to a quiet placeholder instead of the browser's
 * broken-image icon when a source fails to load (or is missing entirely) --
 * the product grid used to show a literal broken-image glyph for any item
 * with a bad photo URL.
 */
export const SafeImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { fallbackIcon?: React.ReactNode }> = ({
  src, alt = '', className = '', fallbackIcon, ...props
}) => {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-300 ${className}`}>
        {fallbackIcon || <ImageOff size={22} strokeWidth={1.5} />}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setErrored(true)} {...props} />;
};

/**
 * Standard section heading used across Home and the category pages -- pairs
 * a short title with an optional one-line description of what the section
 * is, plus an optional "view all" style action on the right.
 */
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}> = ({ title, subtitle, icon, action, className = '' }) => (
  <div className={`flex items-end justify-between gap-4 mb-5 ${className}`}>
    <div className="flex items-center gap-2.5 min-w-0">
      {icon}
      <div className="min-w-0">
        <h3 className="font-display font-bold text-lg text-kubwa-ink tracking-tight leading-tight truncate">{title}</h3>
        {subtitle && <p className="text-xs font-semibold text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && (
      <button onClick={action.onClick} className="flex items-center gap-0.5 text-xs font-bold text-kubwa-primary shrink-0">
        {action.label} <ChevronRight size={14} />
      </button>
    )}
  </div>
);
