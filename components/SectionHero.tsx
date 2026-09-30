import React from 'react';
import { cn } from './cn';

type HeroVariant = 'mart' | 'fixit' | 'ride';

interface SectionHeroProps {
  variant: HeroVariant;
  className?: string;
}

const COPY: Record<HeroVariant, { eyebrow: string; title: string; text: string; chips: string[] }> = {
  mart: {
    eyebrow: 'Sell Am Here Mart',
    title: 'Shop from sellers near you',
    text: 'Groceries, fashion, electronics and more from verified local vendors. Pay securely and get it delivered in your city.',
    chips: ['Verified vendors', 'Secure payment', 'Same-city delivery'],
  },
  fixit: {
    eyebrow: 'FixIt Services',
    title: 'Hire trusted hands for any job',
    text: 'Plumbers, electricians, cleaners, mechanics and more. Compare rates and reviews, then book in a few taps.',
    chips: ['Reviewed artisans', 'Clear rates', 'Book in minutes'],
  },
  ride: {
    eyebrow: 'Ride Deliveries',
    title: 'Send packages across your city',
    text: 'Request a rider, see your price upfront and track your delivery from pickup to drop-off.',
    chips: ['Upfront pricing', 'Live tracking', 'Vetted riders'],
  },
};

const THEME: Record<HeroVariant, { bg: string; text: string; sub: string; chip: string }> = {
  mart: {
    bg: 'bg-gradient-to-br from-[#15803D] to-[#16A34A]',
    text: 'text-white',
    sub: 'text-white/85',
    chip: 'bg-white/15 text-white',
  },
  fixit: {
    bg: 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]',
    text: 'text-kubwa-ink',
    sub: 'text-kubwa-ink/80',
    chip: 'bg-kubwa-ink/10 text-kubwa-ink',
  },
  ride: {
    bg: 'bg-gradient-to-br from-[#1D4ED8] to-[#2563EB]',
    text: 'text-white',
    sub: 'text-white/85',
    chip: 'bg-white/15 text-white',
  },
};

const MartArt: React.FC = () => (
  <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
    <ellipse cx="160" cy="202" rx="130" ry="10" fill="#000" opacity="0.12" />
    {/* stall posts */}
    <rect x="60" y="60" width="8" height="136" rx="3" fill="#0F5F2C" />
    <rect x="252" y="60" width="8" height="136" rx="3" fill="#0F5F2C" />
    {/* awning */}
    {Array.from({ length: 7 }).map((_, i) => (
      <rect key={`s${i}`} x={48 + i * 32} y="50" width="32" height="32" fill={i % 2 ? '#FFE8A3' : '#FFFFFF'} />
    ))}
    {Array.from({ length: 7 }).map((_, i) => (
      <circle key={`c${i}`} cx={64 + i * 32} cy="82" r="16" fill={i % 2 ? '#FFE8A3' : '#FFFFFF'} />
    ))}
    <rect x="42" y="40" width="236" height="14" rx="7" fill="#161A2B" />
    {/* counter */}
    <rect x="56" y="150" width="208" height="48" rx="8" fill="#FFFFFF" />
    <rect x="56" y="150" width="208" height="10" rx="4" fill="#FFE8A3" />
    {/* crate of tomatoes */}
    <circle cx="90" cy="128" r="11" fill="#EF4444" />
    <circle cx="110" cy="124" r="11" fill="#DC2626" />
    <circle cx="130" cy="128" r="11" fill="#EF4444" />
    <path d="M86 118 q4 -5 8 0 M106 114 q4 -5 8 0 M126 118 q4 -5 8 0" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="76" y="130" width="70" height="22" rx="4" fill="#B45309" />
    <rect x="76" y="138" width="70" height="3" fill="#92400E" />
    {/* shopping bag */}
    <path d="M186 104 v-10 a16 16 0 0 1 32 0 v10" stroke="#161A2B" strokeWidth="5" fill="none" strokeLinecap="round" />
    <rect x="170" y="102" width="64" height="76" rx="9" fill="#FF5A36" />
    <rect x="170" y="102" width="64" height="12" rx="6" fill="#E2431F" />
    <circle cx="202" cy="142" r="12" fill="#FFFFFF" opacity="0.9" />
    <path d="M196 142 l4 4 l8 -9" stroke="#FF5A36" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* price tag */}
    <circle cx="252" cy="118" r="17" fill="#FFFFFF" />
    <text x="252" y="125" textAnchor="middle" fontSize="20" fontWeight="700" fill="#15803D" fontFamily="Space Grotesk, sans-serif">₦</text>
    {/* sparkles */}
    <circle cx="30" cy="30" r="4" fill="#FFFFFF" opacity="0.6" />
    <circle cx="296" cy="24" r="3" fill="#FFE8A3" />
    <circle cx="300" cy="170" r="5" fill="#FFFFFF" opacity="0.35" />
  </svg>
);

const FixItArt: React.FC = () => (
  <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
    <ellipse cx="160" cy="202" rx="120" ry="10" fill="#000" opacity="0.12" />
    {/* wrench */}
    <g transform="translate(118 22) rotate(-24)">
      <rect x="-7" y="18" width="14" height="112" rx="7" fill="#E5E7EB" />
      <circle cx="0" cy="12" r="20" fill="#E5E7EB" />
      <rect x="-7" y="-10" width="14" height="22" rx="3" fill="#F8B51A" />
    </g>
    {/* screwdriver */}
    <g transform="translate(206 16) rotate(20)">
      <rect x="-3" y="44" width="6" height="74" rx="2" fill="#CBD5E1" />
      <rect x="-11" y="0" width="22" height="50" rx="9" fill="#FF5A36" />
      <rect x="-11" y="14" width="22" height="5" fill="#E2431F" />
    </g>
    {/* hammer */}
    <g transform="translate(160 14) rotate(4)">
      <rect x="-5" y="12" width="10" height="100" rx="5" fill="#92400E" />
      <rect x="-24" y="0" width="48" height="18" rx="4" fill="#475569" />
    </g>
    {/* toolbox */}
    <path d="M128 110 v-16 h64 v16" stroke="#161A2B" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="66" y="120" width="188" height="76" rx="12" fill="#161A2B" />
    <rect x="60" y="106" width="200" height="26" rx="9" fill="#2A3050" />
    <rect x="148" y="122" width="24" height="16" rx="4" fill="#FBBF24" />
    <rect x="84" y="160" width="152" height="6" rx="3" fill="#2A3050" />
    {/* sparkles */}
    <path d="M268 60 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4z" fill="#FFFFFF" />
    <path d="M44 72 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z" fill="#FFFFFF" opacity="0.8" />
    <circle cx="290" cy="150" r="5" fill="#161A2B" opacity="0.15" />
  </svg>
);

const RideArt: React.FC = () => (
  <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
    {/* road */}
    <rect x="0" y="194" width="320" height="16" rx="8" fill="#1E3A8A" opacity="0.55" />
    <line x1="10" y1="202" x2="310" y2="202" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="16 12" opacity="0.7" />
    {/* location pin and route */}
    <path d="M58 94 Q 70 150 96 164" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="4 7" fill="none" strokeLinecap="round" opacity="0.8" />
    <path d="M58 22 a24 24 0 0 1 24 24 c0 18 -24 44 -24 44 s-24 -26 -24 -44 a24 24 0 0 1 24 -24z" fill="#FFFFFF" />
    <circle cx="58" cy="46" r="9" fill="#FF5A36" />
    {/* speed lines */}
    <line x1="22" y1="140" x2="56" y2="140" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
    <line x1="12" y1="156" x2="50" y2="156" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
    {/* delivery box */}
    <rect x="192" y="68" width="60" height="52" rx="7" fill="#FBBF24" />
    <rect x="218" y="68" width="8" height="52" fill="#F59E0B" />
    <rect x="192" y="68" width="60" height="10" rx="5" fill="#F59E0B" />
    {/* bike body */}
    <path d="M112 162 L146 122 L204 122 L228 162 Z" fill="#FF5A36" />
    <rect x="150" y="110" width="50" height="14" rx="7" fill="#161A2B" />
    <path d="M132 138 L118 96" stroke="#161A2B" strokeWidth="7" strokeLinecap="round" />
    <path d="M106 94 L130 94" stroke="#161A2B" strokeWidth="7" strokeLinecap="round" />
    <circle cx="112" cy="116" r="7" fill="#FBBF24" />
    {/* wheels */}
    <circle cx="106" cy="170" r="26" fill="#161A2B" />
    <circle cx="106" cy="170" r="10" fill="#E5E7EB" />
    <circle cx="232" cy="170" r="26" fill="#161A2B" />
    <circle cx="232" cy="170" r="10" fill="#E5E7EB" />
    {/* sparkles */}
    <circle cx="290" cy="34" r="5" fill="#FFFFFF" opacity="0.6" />
    <circle cx="276" cy="100" r="3" fill="#FBBF24" />
  </svg>
);

const ART: Record<HeroVariant, React.FC> = { mart: MartArt, fixit: FixItArt, ride: RideArt };

/**
 * Illustrated banner at the top of Mart, FixIt and Ride.
 * Shown from md (768px) up only; phones keep the compact header.
 */
const SectionHero: React.FC<SectionHeroProps> = ({ variant, className }) => {
  const copy = COPY[variant];
  const theme = THEME[variant];
  const Art = ART[variant];
  return (
    <section
      aria-label={copy.eyebrow}
      className={cn('hidden md:flex relative overflow-hidden rounded-[2rem] mb-6 px-8 lg:px-10 py-8 items-center gap-6', theme.bg, className)}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-40 -bottom-24 w-56 h-56 rounded-full bg-white/10" />
      <div className="relative flex-1 min-w-0">
        <p className={cn('text-xs font-bold uppercase tracking-widest mb-2', theme.sub)}>{copy.eyebrow}</p>
        <h1 className={cn('font-display text-3xl lg:text-4xl font-bold tracking-tight leading-tight', theme.text)}>{copy.title}</h1>
        <p className={cn('mt-3 text-sm lg:text-base font-medium max-w-md', theme.sub)}>{copy.text}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {copy.chips.map(chip => (
            <span key={chip} className={cn('px-3 py-1.5 rounded-full text-xs font-bold', theme.chip)}>{chip}</span>
          ))}
        </div>
      </div>
      <div className="relative shrink-0 w-56 lg:w-72 h-40 lg:h-48">
        <Art />
      </div>
    </section>
  );
};

export default SectionHero;
